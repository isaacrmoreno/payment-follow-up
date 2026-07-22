import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_REMINDER_TEMPLATE = {
  name: "Default reminder",
  subject: "Reminder: {{invoice_title}} is still open",
  body: [
    "Hi {{client_name}},",
    "",
    "This is a quick reminder that {{invoice_title}} is still open for {{amount_due}}.",
    "",
    "Due date: {{due_date}}",
    "{{payment_link_line}}",
    "",
    "Thanks.",
  ].join("\n"),
};

export const REMINDER_INSERT_FIELDS = [
  {
    label: "Client name",
    token: "{{client_name}}",
    description: "Filled in with the client's name.",
  },
  {
    label: "Invoice title",
    token: "{{invoice_title}}",
    description: "Filled in with the invoice title.",
  },
  {
    label: "Amount due",
    token: "{{amount_due}}",
    description: "Filled in with the remaining balance.",
  },
  {
    label: "Due date",
    token: "{{due_date}}",
    description: "Filled in with the invoice due date.",
  },
  {
    label: "Payment link",
    token: "{{payment_link}}",
    description: "Filled in with the payment link.",
  },
];

export type ReminderTemplateLike = {
  name?: string | null;
  subject?: string | null;
  body?: string | null;
};

export type ReminderTemplateVariables = {
  clientName: string;
  invoiceTitle: string;
  amountDue: string;
  dueDate: string;
  paymentLink?: string | null;
};

function replaceTokens(template: string, variables: ReminderTemplateVariables) {
  return template
    .replaceAll("{{client_name}}", variables.clientName)
    .replaceAll("{{invoice_title}}", variables.invoiceTitle)
    .replaceAll("{{amount_due}}", variables.amountDue)
    .replaceAll("{{due_date}}", variables.dueDate)
    .replaceAll("{{payment_link}}", variables.paymentLink ?? "")
    .replaceAll("{{payment_link_line}}", variables.paymentLink ? `Pay here: ${variables.paymentLink}` : "")
    .replaceAll(/\n{3,}/g, "\n\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getReminderTemplateSource(template?: ReminderTemplateLike | null) {
  return {
    name: template?.name?.trim() || DEFAULT_REMINDER_TEMPLATE.name,
    subject: template?.subject?.trim() || DEFAULT_REMINDER_TEMPLATE.subject,
    body: template?.body?.trim() || DEFAULT_REMINDER_TEMPLATE.body,
  };
}

export function renderReminderContent(
  template: ReminderTemplateLike | null | undefined,
  variables: ReminderTemplateVariables,
) {
  const source = getReminderTemplateSource(template);

  return {
    templateName: source.name,
    subject: replaceTokens(source.subject, variables).trim(),
    body: replaceTokens(source.body, variables).trim(),
  };
}

export function renderReminderEmailHtml(
  template: ReminderTemplateLike | null | undefined,
  variables: ReminderTemplateVariables,
) {
  const content = renderReminderContent(template, variables);
  const paragraphs = content.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      ${paragraphs}
    </div>
  `;
}

export async function ensureDefaultReminderTemplate(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("reminder_templates")
    .select("id,name,subject,body,created_at")
    .eq("user_id", userId)
    .eq("is_default", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load default template: ${error.message}`);
  }

  if (data?.length) {
    return data[0];
  }

  const { data: existingTemplates, error: existingError } = await supabase
    .from("reminder_templates")
    .select("id,name,subject,body,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (existingError) {
    throw new Error(`Unable to load existing templates: ${existingError.message}`);
  }

  const fallbackExistingTemplate =
    existingTemplates?.find((template) => template.name === DEFAULT_REMINDER_TEMPLATE.name) ??
    existingTemplates?.[0];

  if (fallbackExistingTemplate) {
    const { error: promoteError } = await supabase
      .from("reminder_templates")
      .update({ is_default: true })
      .eq("id", fallbackExistingTemplate.id);

    if (promoteError) {
      throw new Error(`Unable to promote default template: ${promoteError.message}`);
    }

    return {
      ...fallbackExistingTemplate,
      is_default: true,
    };
  }

  const { data: created, error: createError } = await supabase
    .from("reminder_templates")
    .insert({
      user_id: userId,
      name: DEFAULT_REMINDER_TEMPLATE.name,
      subject: DEFAULT_REMINDER_TEMPLATE.subject,
      body: DEFAULT_REMINDER_TEMPLATE.body,
      is_default: true,
    })
    .select("id,name,subject,body")
    .single();

  if (createError) {
    throw new Error(`Unable to create default template: ${createError.message}`);
  }

  return created;
}
