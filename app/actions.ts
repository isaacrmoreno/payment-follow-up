"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  rescheduleOpenInvoicesForUser,
  sendDueRemindersForUser,
  sendInvoiceReminderById,
} from "@/lib/reminder-delivery";
import {
  DEFAULT_REMINDER_SEND_TIME,
  ensureStarterReminderTemplates,
  getInvoiceReminderCadence,
  getInvoiceReminderSendTime,
  REMINDER_DAY_OFFSET_MAX,
  getReminderCadence,
  getReminderSendTime,
  isAllowedReminderSendTime,
  nextReminderAt,
  parseReminderPlan,
} from "@/lib/reminders";

function toNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? Number(value) : null;
}

function assertDbError(error: { message: string } | null | undefined, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function sendMagicLinkAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  return { error: error?.message ?? null };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
}

export async function upsertClientAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  if (id) {
    const { error } = await supabase.from("clients").update(payload).eq("id", id);
    assertDbError(error, "Unable to update client");
  } else {
    const { error } = await supabase.from("clients").insert(payload);
    assertDbError(error, "Unable to create client");
  }

  revalidatePath("/");
  revalidatePath("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("client_id", id);

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);
  assertDbError(error, "Unable to delete client");
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function upsertInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();
  const clientId = String(formData.get("client_id") ?? "").trim();
  const reminderPlan = String(formData.get("reminder_plan") ?? "").trim() || "soft_firm_final";
  const starterTemplates = await ensureStarterReminderTemplates(supabase, user.id);
  const { data: preferences, error: preferencesError } = await supabase
    .from("user_preferences")
    .select("soft_reminder_days,firm_reminder_days,final_reminder_days,reminder_send_time")
    .eq("user_id", user.id)
    .maybeSingle();
  assertDbError(preferencesError, "Unable to load reminder cadence");
  const cadence = getReminderCadence(preferences);
  const sendTime = getReminderSendTime(preferences);
  let remindersSent = 0;
  const customCadence = {
    soft: Number(String(formData.get("soft_reminder_days") ?? cadence.soft)),
    firm: Number(String(formData.get("firm_reminder_days") ?? cadence.firm)),
    final: Number(String(formData.get("final_reminder_days") ?? cadence.final)),
  };
  const customSendTime = String(formData.get("reminder_send_time") ?? sendTime).trim() || sendTime;

  if (Object.values(customCadence).some((value) => Number.isNaN(value) || value < 0 || value > REMINDER_DAY_OFFSET_MAX)) {
    throw new Error(`Schedule days must be between 0 and ${REMINDER_DAY_OFFSET_MAX}.`);
  }

  if (!/^\d{2}:\d{2}$/.test(customSendTime) || !isAllowedReminderSendTime(customSendTime)) {
    throw new Error("Send time must be between 8:00 AM and 6:00 PM.");
  }

  let lockedCadence = customCadence;
  let lockedSendTime = customSendTime;

  if (id) {
    const [{ data: existingInvoice, error: existingInvoiceError }, { count, error: reminderCountError }] =
      await Promise.all([
        supabase
          .from("invoices")
          .select("reminder_cadence,reminder_send_time")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("reminders").select("id", { count: "exact", head: true }).eq("invoice_id", id),
      ]);
    assertDbError(existingInvoiceError, "Unable to load existing invoice");
    assertDbError(reminderCountError, "Unable to load reminder history");
    remindersSent = count ?? 0;

    lockedCadence = getInvoiceReminderCadence(
      {
        reminder_cadence: customCadence,
        reminder_send_time: customSendTime,
      },
      getInvoiceReminderCadence(existingInvoice, cadence),
    );
    lockedSendTime = getInvoiceReminderSendTime(
      {
        reminder_cadence: customCadence,
        reminder_send_time: customSendTime,
      },
      getInvoiceReminderSendTime(existingInvoice, sendTime),
    );
  }

  const softTemplate = starterTemplates.byKind.soft;
  if (!softTemplate?.id) {
    throw new Error("Unable to load starter reminder templates.");
  }
  const payload = {
    user_id: user.id,
    client_id: clientId,
    invoice_number: String(formData.get("invoice_number") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    amount_due: toNumber(formData, "amount_due") ?? 0,
    amount_paid: toNumber(formData, "amount_paid") ?? 0,
    currency: String(formData.get("currency") ?? "").trim() || "usd",
    due_date: String(formData.get("due_date") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    reminder_template_id: softTemplate.id,
    reminder_plan: reminderPlan,
    reminder_cadence: lockedCadence,
    reminder_send_time: lockedSendTime,
    blocker_reason: String(formData.get("blocker_reason") ?? "").trim() || null,
    external_reference: String(formData.get("external_reference") ?? "").trim() || null,
    next_follow_up_at: nextReminderAt(
      String(formData.get("due_date") ?? "").trim(),
      parseReminderPlan(reminderPlan),
      remindersSent,
      lockedCadence,
      lockedSendTime,
    ),
  };

  if (!clientId) {
    throw new Error("Client is required");
  }

  let savedInvoiceId = id;
  if (id) {
    const { data: updatedInvoice, error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();
    assertDbError(error, "Unable to update invoice");
    savedInvoiceId = updatedInvoice?.id ?? id;
  } else {
    const { data: createdInvoice, error } = await supabase
      .from("invoices")
      .insert(payload)
      .select("id")
      .single();
    assertDbError(error, "Unable to create invoice");
    savedInvoiceId = createdInvoice?.id ?? "";
  }

  let sentImmediately = false;
  let immediateSendError: string | null = null;
  const nextFollowUpAt = payload.next_follow_up_at;
  const shouldSendImmediately =
    Boolean(savedInvoiceId) &&
    nextFollowUpAt !== null &&
    !["paid", "closed"].includes(payload.status) &&
    new Date(nextFollowUpAt).getTime() <= Date.now();

  if (shouldSendImmediately && savedInvoiceId) {
    try {
      await sendInvoiceReminderById(supabase, user.id, savedInvoiceId);
      sentImmediately = true;
    } catch (error) {
      immediateSendError =
        error instanceof Error ? error.message : "The first reminder is due now, but it could not be sent.";
    }
  }

  revalidatePath("/");
  revalidatePath("/invoices");
  return { sentImmediately, immediateSendError };
}

export async function upsertReminderTemplateAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    user_id: user.id,
    name: String(formData.get("name") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
  };

  if (id) {
    const { error } = await supabase.from("reminder_templates").update(payload).eq("id", id);
    assertDbError(error, "Unable to update template");
  } else {
    const { error } = await supabase.from("reminder_templates").insert(payload);
    assertDbError(error, "Unable to create template");
  }

  revalidatePath("/reminders");
  revalidatePath("/invoices");
}

export async function deleteReminderTemplateAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Template not found");
  }

  const { data: template, error: templateError } = await supabase
    .from("reminder_templates")
    .select("id,is_default,kind")
    .eq("id", id)
    .single();
  assertDbError(templateError, "Unable to load template");

  if (template?.kind && template.kind !== "custom") {
    throw new Error("Starter templates cannot be deleted.");
  }

  const fallbackTemplate = (await ensureStarterReminderTemplates(supabase, user.id)).byKind.soft;
  if (!fallbackTemplate?.id) {
    throw new Error("Unable to load starter reminder templates.");
  }
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ reminder_template_id: fallbackTemplate.id })
    .eq("reminder_template_id", id);
  assertDbError(invoiceError, "Unable to move invoices to the default template");

  const { error } = await supabase.from("reminder_templates").delete().eq("id", id);
  assertDbError(error, "Unable to delete template");

  revalidatePath("/reminders");
  revalidatePath("/invoices");
}

export async function markInvoicePaidAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const amountDue = toNumber(formData, "amount_due") ?? 0;
  const supabase = await createSupabaseServerClient();
  const user = await requireUser();

  const { error } = await supabase
    .from("invoices")
    .update({
      user_id: user.id,
      amount_paid: amountDue,
      status: "paid",
      next_follow_up_at: null,
    })
    .eq("id", id);
  assertDbError(error, "Unable to mark invoice paid");

  revalidatePath("/");
  revalidatePath("/invoices");
  return { ok: true };
}

export async function closeInvoiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const user = await requireUser();

  const { error } = await supabase
    .from("invoices")
    .update({
      user_id: user.id,
      status: "closed",
      next_follow_up_at: null,
    })
    .eq("id", id);
  assertDbError(error, "Unable to close invoice");

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/clients");
  return { ok: true };
}

export async function archiveInvoiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .single();
  assertDbError(invoiceError, "Unable to load invoice");

  if (!invoice || !["paid", "closed"].includes(invoice.status ?? "")) {
    throw new Error("Close or pay the invoice before archiving it.");
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);
  assertDbError(error, "Unable to archive invoice");

  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/clients");
  return { ok: true };
}

export async function sendReminderAction(formData: FormData) {
  const user = await requireUser();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  await sendInvoiceReminderById(supabase, user.id, invoiceId);

  revalidatePath("/");
  revalidatePath("/invoices");
  return { ok: true };
}

export async function upsertReminderCadenceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const payload = {
    user_id: user.id,
    soft_reminder_days: Number(String(formData.get("soft_reminder_days") ?? "0")),
    firm_reminder_days: Number(String(formData.get("firm_reminder_days") ?? "7")),
    final_reminder_days: Number(String(formData.get("final_reminder_days") ?? "14")),
    reminder_send_time:
      String(formData.get("reminder_send_time") ?? "").trim() || DEFAULT_REMINDER_SEND_TIME,
  };

  if (
    [payload.soft_reminder_days, payload.firm_reminder_days, payload.final_reminder_days].some(
      (value) => Number.isNaN(value) || value < 0 || value > REMINDER_DAY_OFFSET_MAX,
    )
  ) {
    throw new Error(`Cadence values must be between 0 and ${REMINDER_DAY_OFFSET_MAX}.`);
  }

  if (!/^\d{2}:\d{2}$/.test(payload.reminder_send_time)) {
    throw new Error("Send time must be in HH:MM format.");
  }

  if (!isAllowedReminderSendTime(payload.reminder_send_time)) {
    throw new Error("Send time must be between 8:00 AM and 6:00 PM.");
  }

  const { error } = await supabase.from("user_preferences").upsert(payload, { onConflict: "user_id" });
  if (error?.message.includes("Could not find the table 'public.user_preferences'")) {
    throw new Error("Run the user preferences SQL first, then try saving cadence again.");
  }
  if (error?.message.includes("permission denied")) {
    throw new Error("Run the user preferences SQL again so the authenticated grants are applied.");
  }
  assertDbError(error, "Unable to save cadence");

  await rescheduleOpenInvoicesForUser(supabase, user.id);

  revalidatePath("/reminders");
  revalidatePath("/invoices");
}

export async function runDueRemindersAction() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const result = await sendDueRemindersForUser(supabase, user.id);

  revalidatePath("/");
  revalidatePath("/invoices");
  return result;
}

export async function queueInvoiceReminderNowAction(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test reminder queueing is only available in development.");
  }

  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();

  if (!invoiceId) {
    throw new Error("Invoice not found.");
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,status,user_id")
    .eq("id", invoiceId)
    .single();
  assertDbError(invoiceError, "Unable to load invoice");

  if (!invoice || invoice.user_id !== user.id) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status === "paid" || invoice.status === "closed") {
    throw new Error("This invoice no longer needs reminders.");
  }

  const { error } = await supabase
    .from("invoices")
    .update({ next_follow_up_at: new Date().toISOString() })
    .eq("id", invoiceId);
  assertDbError(error, "Unable to queue test reminder");

  revalidatePath("/");
  revalidatePath("/invoices");
  return { ok: true };
}
