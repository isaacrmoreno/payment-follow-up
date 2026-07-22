"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getResendClient } from "@/lib/email";
import { renderReminderEmailHtml } from "@/components/reminder-email";
import { formatInvoiceDate } from "@/lib/date";
import { ensureDefaultReminderTemplate, renderReminderContent } from "@/lib/reminders";

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
  const reminderTemplateId =
    String(formData.get("reminder_template_id") ?? "").trim() ||
    (await ensureDefaultReminderTemplate(supabase, user.id)).id;
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
    reminder_template_id: reminderTemplateId,
    blocker_reason: String(formData.get("blocker_reason") ?? "").trim() || null,
    external_reference: String(formData.get("external_reference") ?? "").trim() || null,
    next_follow_up_at: String(formData.get("next_follow_up_at") ?? "").trim() || null,
  };

  if (!clientId) {
    throw new Error("Client is required");
  }

  if (id) {
    const { error } = await supabase.from("invoices").update(payload).eq("id", id);
    assertDbError(error, "Unable to update invoice");
  } else {
    const { error } = await supabase.from("invoices").insert(payload);
    assertDbError(error, "Unable to create invoice");
  }

  revalidatePath("/");
  revalidatePath("/invoices");
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

  revalidatePath("/templates");
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
    .select("id,is_default")
    .eq("id", id)
    .single();
  assertDbError(templateError, "Unable to load template");

  if (template?.is_default) {
    throw new Error("The default template cannot be deleted.");
  }

  const fallbackTemplate = await ensureDefaultReminderTemplate(supabase, user.id);
  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ reminder_template_id: fallbackTemplate.id })
    .eq("reminder_template_id", id);
  assertDbError(invoiceError, "Unable to move invoices to the default template");

  const { error } = await supabase.from("reminder_templates").delete().eq("id", id);
  assertDbError(error, "Unable to delete template");

  revalidatePath("/templates");
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

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name,email), reminder_templates(name,subject,body)")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (!invoice.clients?.email) {
    throw new Error("Client email is required to send a reminder");
  }

  const amountDue = Number(invoice.amount_due) - Number(invoice.amount_paid);
  const paymentLink = invoice.external_reference || null;
  const resend = getResendClient();
  const dueDate = formatInvoiceDate(invoice.due_date);
  const content = renderReminderContent(invoice.reminder_templates, {
    clientName: invoice.clients.name ?? "there",
    invoiceTitle: invoice.title,
    amountDue: `$${amountDue.toFixed(2)}`,
    dueDate,
    paymentLink,
  });
  const html = renderReminderEmailHtml({
    clientName: invoice.clients.name ?? "there",
    invoiceTitle: invoice.title,
    amountDue: `$${amountDue.toFixed(2)}`,
    dueDate,
    paymentLink,
    template: invoice.reminder_templates,
  });

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Payment Follow-Up <onboarding@resend.dev>",
    to: [invoice.clients.email],
    subject: content.subject,
    html,
  });

  if (emailError) {
    throw new Error(emailError.message);
  }

  await supabase.from("reminders").insert({
    user_id: user.id,
    invoice_id: invoice.id,
    channel: "email",
    template_name: content.templateName,
    subject: content.subject,
    body: content.body,
    sent_at: new Date().toISOString(),
    delivery_status: "sent",
  });

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({
      last_contacted_at: new Date().toISOString(),
      next_follow_up_at: null,
    })
    .eq("id", invoice.id);
  assertDbError(invoiceUpdateError, "Unable to update invoice after sending reminder");

  revalidatePath("/");
  revalidatePath("/invoices");
  return { ok: true };
}
