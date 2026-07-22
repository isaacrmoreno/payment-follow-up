import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/email";
import { formatInvoiceDate } from "@/lib/date";
import {
  ensureStarterReminderTemplates,
  getNextReminderKind,
  getInvoiceReminderCadence,
  getInvoiceReminderSendTime,
  getReminderCadence,
  getReminderSendTime,
  nextReminderAt,
  parseReminderPlan,
  renderReminderContent,
  renderReminderEmailHtml,
} from "@/lib/reminders";

type SupabaseLike = SupabaseClient;

function assertDbError(error: { message: string } | null | undefined, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function sendInvoiceReminderById(
  supabase: SupabaseLike,
  userId: string,
  invoiceId: string,
) {
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*, clients(name,email)")
    .eq("id", invoiceId)
    .single();
  assertDbError(invoiceError, "Unable to load invoice");

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "paid" || invoice.status === "closed") {
    throw new Error("This invoice no longer needs reminders.");
  }

  if (!invoice.clients?.email) {
    throw new Error("Client email is required to send a reminder");
  }

  const [{ count, error: countError }, { data: preferences, error: preferencesError }] = await Promise.all([
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("invoice_id", invoiceId),
    supabase
      .from("user_preferences")
      .select("soft_reminder_days,firm_reminder_days,final_reminder_days,reminder_send_time")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  assertDbError(countError, "Unable to load reminder history");
  assertDbError(preferencesError, "Unable to load reminder cadence");

  const nextKind = getNextReminderKind(invoice.reminder_plan, count ?? 0);
  if (!nextKind) {
    throw new Error("All scheduled reminders for this invoice have already been sent.");
  }

  const cadence = getInvoiceReminderCadence(invoice, getReminderCadence(preferences));
  const sendTime = getInvoiceReminderSendTime(invoice, getReminderSendTime(preferences));
  const starterTemplates = await ensureStarterReminderTemplates(supabase, userId);
  const template = starterTemplates.byKind[nextKind];
  if (!template) {
    throw new Error("Unable to load the next reminder template.");
  }

  const amountDue = Number(invoice.amount_due) - Number(invoice.amount_paid);
  const paymentLink = invoice.external_reference || null;
  const dueDate = formatInvoiceDate(invoice.due_date);
  const content = renderReminderContent(template, {
    clientName: invoice.clients.name ?? "there",
    invoiceTitle: invoice.title,
    amountDue: `$${amountDue.toFixed(2)}`,
    dueDate,
    paymentLink,
  });
  const html = renderReminderEmailHtml(template, {
    clientName: invoice.clients.name ?? "there",
    invoiceTitle: invoice.title,
    amountDue: `$${amountDue.toFixed(2)}`,
    dueDate,
    paymentLink,
  });

  const resend = getResendClient();
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Payment Follow-Up <onboarding@resend.dev>",
    to: [invoice.clients.email],
    subject: content.subject,
    html,
  });

  if (emailError) {
    throw new Error(emailError.message);
  }

  const sentAt = new Date().toISOString();

  const { error: reminderError } = await supabase.from("reminders").insert({
    user_id: userId,
    invoice_id: invoice.id,
    channel: "email",
    template_name: content.templateName,
    subject: content.subject,
    body: content.body,
    sent_at: sentAt,
    delivery_status: "sent",
  });
  assertDbError(reminderError, "Unable to log reminder");

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      last_contacted_at: sentAt,
      next_follow_up_at: nextReminderAt(
        invoice.due_date,
        parseReminderPlan(invoice.reminder_plan),
        (count ?? 0) + 1,
        cadence,
        sendTime,
      ),
    })
    .eq("id", invoice.id);
  assertDbError(updateError, "Unable to update invoice after sending reminder");

  return {
    invoiceId: invoice.id,
    templateName: content.templateName,
    subject: content.subject,
  };
}

export async function sendDueRemindersForUser(supabase: SupabaseLike, userId: string) {
  const now = new Date().toISOString();
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("user_id", userId)
    .not("status", "in", '("paid","closed")')
    .not("next_follow_up_at", "is", null)
    .lte("next_follow_up_at", now)
    .order("next_follow_up_at", { ascending: true });
  assertDbError(error, "Unable to load due reminders");

  let sent = 0;
  const failures: string[] = [];

  for (const invoice of invoices ?? []) {
    try {
      await sendInvoiceReminderById(supabase, userId, invoice.id);
      sent += 1;
    } catch (sendError) {
      failures.push(sendError instanceof Error ? sendError.message : `Unable to send reminder for ${invoice.id}`);
    }
  }

  return { sent, failures };
}

export async function sendDueRemindersForAllUsers(supabase: SupabaseLike) {
  const now = new Date().toISOString();
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id,user_id")
    .not("status", "in", '("paid","closed")')
    .not("next_follow_up_at", "is", null)
    .lte("next_follow_up_at", now)
    .order("next_follow_up_at", { ascending: true });
  assertDbError(error, "Unable to load due reminders");

  let sent = 0;
  const failures: string[] = [];

  for (const invoice of invoices ?? []) {
    try {
      await sendInvoiceReminderById(supabase, invoice.user_id, invoice.id);
      sent += 1;
    } catch (sendError) {
      failures.push(sendError instanceof Error ? sendError.message : `Unable to send reminder for ${invoice.id}`);
    }
  }

  return { sent, failures };
}

export async function rescheduleOpenInvoicesForUser(supabase: SupabaseLike, userId: string) {
  const [{ data: invoices, error: invoicesError }, { data: preferences, error: preferencesError }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id,due_date,reminder_plan,status,reminder_cadence,reminder_send_time")
        .eq("user_id", userId)
        .not("status", "in", '("paid","closed")'),
      supabase
        .from("user_preferences")
        .select("soft_reminder_days,firm_reminder_days,final_reminder_days,reminder_send_time")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  assertDbError(invoicesError, "Unable to load invoices for rescheduling");
  assertDbError(preferencesError, "Unable to load reminder cadence");

  const cadence = getReminderCadence(preferences);
  const sendTime = getReminderSendTime(preferences);

  for (const invoice of invoices ?? []) {
    const { count, error: remindersError } = await supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", invoice.id);
    assertDbError(remindersError, "Unable to load reminder history");

    const lockedCadence = getInvoiceReminderCadence(invoice, cadence);
    const lockedSendTime = getInvoiceReminderSendTime(invoice, sendTime);
    const nextFollowUpAt = nextReminderAt(
      invoice.due_date,
      parseReminderPlan(invoice.reminder_plan),
      count ?? 0,
      lockedCadence,
      lockedSendTime,
    );

    const { error: updateError } = await supabase
      .from("invoices")
      .update({ next_follow_up_at: nextFollowUpAt })
      .eq("id", invoice.id);
    assertDbError(updateError, "Unable to reschedule invoice reminders");
  }
}
