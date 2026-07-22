"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getResendClient } from "@/lib/email";
import { ReminderEmail } from "@/components/reminder-email";

function toNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? Number(value) : null;
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
    await supabase.from("clients").update(payload).eq("id", id);
  } else {
    await supabase.from("clients").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function upsertInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    user_id: user.id,
    client_id: String(formData.get("client_id") ?? "").trim(),
    invoice_number: String(formData.get("invoice_number") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    amount_due: toNumber(formData, "amount_due") ?? 0,
    amount_paid: toNumber(formData, "amount_paid") ?? 0,
    currency: String(formData.get("currency") ?? "").trim() || "usd",
    due_date: String(formData.get("due_date") ?? "").trim(),
    status: String(formData.get("status") ?? "").trim(),
    blocker_reason: String(formData.get("blocker_reason") ?? "").trim() || null,
    external_reference: String(formData.get("external_reference") ?? "").trim() || null,
    next_follow_up_at: String(formData.get("next_follow_up_at") ?? "").trim() || null,
  };

  if (id) {
    await supabase.from("invoices").update(payload).eq("id", id);
  } else {
    await supabase.from("invoices").insert(payload);
  }

  revalidatePath("/");
  revalidatePath("/invoices");
}

export async function markInvoicePaidAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const amountDue = toNumber(formData, "amount_due") ?? 0;
  const supabase = await createSupabaseServerClient();
  const user = await requireUser();

  await supabase
    .from("invoices")
    .update({
      user_id: user.id,
      amount_paid: amountDue,
      status: "paid",
      next_follow_up_at: null,
    })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/invoices");
}

export async function sendReminderAction(formData: FormData) {
  const user = await requireUser();
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(name,email)")
    .eq("id", invoiceId)
    .single();

  if (!invoice) {
    return { error: "Invoice not found" };
  }

  if (!invoice.clients?.email) {
    return { error: "Client email is required to send a reminder" };
  }

  const amountDue = Number(invoice.amount_due) - Number(invoice.amount_paid);
  const paymentLink = invoice.external_reference || null;
  const resend = getResendClient();
  const subject = `Reminder: ${invoice.title} is still open`;
  const body = ReminderEmail({
    clientName: invoice.clients.name ?? "there",
    invoiceTitle: invoice.title,
    amountDue: amountDue.toFixed(2),
    paymentLink,
  });

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Payment Follow-Up <onboarding@resend.dev>",
    to: [invoice.clients.email],
    subject,
    react: body,
  });

  if (emailError) {
    return { error: emailError.message };
  }

  await supabase.from("reminders").insert({
    user_id: user.id,
    invoice_id: invoice.id,
    channel: "email",
    template_name: "manual",
    subject,
    body: `Reminder sent to ${invoice.clients.email}`,
    sent_at: new Date().toISOString(),
    delivery_status: "sent",
  });

  await supabase
    .from("invoices")
    .update({
      last_contacted_at: new Date().toISOString(),
      next_follow_up_at: null,
    })
    .eq("id", invoice.id);

  revalidatePath("/");
  revalidatePath("/invoices");

  return { error: null };
}
