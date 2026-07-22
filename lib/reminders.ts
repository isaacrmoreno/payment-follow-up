import type { SupabaseClient } from "@supabase/supabase-js";

export type ReminderTemplateKind = "soft" | "firm" | "final" | "custom";
export type ReminderPlanId = "soft_only" | "soft_firm" | "soft_firm_final";
export type ReminderCadenceOffsets = {
  soft: number;
  firm: number;
  final: number;
};
type ReminderCadenceValue = Partial<Record<keyof ReminderCadenceOffsets, number | string | null>>;
export const DEFAULT_REMINDER_SEND_TIME = "08:30";
export const REMINDER_SEND_TIME_MIN = "08:00";
export const REMINDER_SEND_TIME_MAX = "18:00";
export const REMINDER_DAY_OFFSET_MAX = 30;
type StarterReminderKind = Exclude<ReminderTemplateKind, "custom">;

type StarterTemplate = {
  kind: StarterReminderKind;
  name: string;
  subject: string;
  body: string;
  isDefault?: boolean;
};

type LoadedReminderTemplate = ReminderTemplateLike & {
  created_at?: string | null;
};

type ReminderPreferencesLike = {
  soft_reminder_days?: number | null;
  firm_reminder_days?: number | null;
  final_reminder_days?: number | null;
  reminder_send_time?: string | null;
};

type InvoiceReminderScheduleLike = {
  reminder_cadence?: ReminderCadenceValue | null;
  reminder_send_time?: string | null;
};

const LEGACY_DEFAULT_TEMPLATE = {
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

export const STARTER_REMINDER_TEMPLATES: StarterTemplate[] = [
  {
    kind: "soft",
    name: "Soft reminder",
    subject: "Friendly reminder: {{invoice_title}} is due {{due_date}}",
    body: [
      "Hi {{client_name}},",
      "",
      "Just a friendly reminder about {{invoice_title}} for {{amount_due}}.",
      "It is due on {{due_date}}.",
      "{{payment_link_line}}",
      "",
      "Thanks.",
    ].join("\n"),
    isDefault: true,
  },
  {
    kind: "firm",
    name: "Firm reminder",
    subject: "Follow-up: {{invoice_title}} is still unpaid",
    body: [
      "Hi {{client_name}},",
      "",
      "Following up on {{invoice_title}} for {{amount_due}}.",
      "This payment is still outstanding after the {{due_date}} due date.",
      "{{payment_link_line}}",
      "",
      "Please send payment when you can.",
    ].join("\n"),
  },
  {
    kind: "final",
    name: "Final reminder",
    subject: "Final reminder: {{invoice_title}} needs attention",
    body: [
      "Hi {{client_name}},",
      "",
      "This is a final reminder for {{invoice_title}} for {{amount_due}}.",
      "The payment due date was {{due_date}}.",
      "{{payment_link_line}}",
      "",
      "Please reply if anything is blocking payment.",
    ].join("\n"),
  },
];

export const DEFAULT_REMINDER_TEMPLATE = {
  name: STARTER_REMINDER_TEMPLATES[0].name,
  subject: STARTER_REMINDER_TEMPLATES[0].subject,
  body: STARTER_REMINDER_TEMPLATES[0].body,
};

export const REMINDER_INSERT_FIELDS = [
  { label: "Client name", token: "{{client_name}}", description: "Filled in with the client's name." },
  { label: "Invoice title", token: "{{invoice_title}}", description: "Filled in with the invoice title." },
  { label: "Amount due", token: "{{amount_due}}", description: "Filled in with the remaining balance." },
  { label: "Due date", token: "{{due_date}}", description: "Filled in with the invoice due date." },
  { label: "Payment link", token: "{{payment_link}}", description: "Filled in with the payment link." },
];

export const REMINDER_PLAN_OPTIONS: { id: ReminderPlanId; label: string }[] = [
  { id: "soft_only", label: "Soft only" },
  { id: "soft_firm", label: "Soft + Firm" },
  { id: "soft_firm_final", label: "Soft + Firm + Final" },
];

const REMINDER_PLAN_SEQUENCE: Record<ReminderPlanId, StarterReminderKind[]> = {
  soft_only: ["soft"],
  soft_firm: ["soft", "firm"],
  soft_firm_final: ["soft", "firm", "final"],
};

const REMINDER_DAY_OFFSETS: Record<ReminderTemplateKind, number> = {
  soft: 0,
  firm: 7,
  final: 14,
  custom: 0,
};

export const DEFAULT_REMINDER_CADENCE: ReminderCadenceOffsets = {
  soft: REMINDER_DAY_OFFSETS.soft,
  firm: REMINDER_DAY_OFFSETS.firm,
  final: REMINDER_DAY_OFFSETS.final,
};

export type ReminderTemplateLike = {
  id?: string;
  name?: string | null;
  subject?: string | null;
  body?: string | null;
  kind?: string | null;
  is_default?: boolean | null;
};

export type ReminderTemplateVariables = {
  clientName: string;
  invoiceTitle: string;
  amountDue: string;
  dueDate: string;
  paymentLink?: string | null;
};

export type ReminderScheduleItem = {
  kind: StarterReminderKind;
  label: string;
  date: string;
  iso: string;
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeReminderSendTime(value?: string | null) {
  if (!value) {
    return DEFAULT_REMINDER_SEND_TIME;
  }

  const trimmed = value.trim();
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    return DEFAULT_REMINDER_SEND_TIME;
  }

  return trimmed;
}

function toMinutes(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function dueDateToDate(dueDate: string, sendTime = DEFAULT_REMINDER_SEND_TIME) {
  return new Date(`${dueDate}T${normalizeReminderSendTime(sendTime)}:00`);
}

function isLegacyDefaultTemplate(template: ReminderTemplateLike) {
  return (
    template.name === LEGACY_DEFAULT_TEMPLATE.name &&
    template.subject === LEGACY_DEFAULT_TEMPLATE.subject &&
    template.body === LEGACY_DEFAULT_TEMPLATE.body
  );
}

export function getReminderPlanLabel(plan: string | null | undefined) {
  return REMINDER_PLAN_OPTIONS.find((option) => option.id === plan)?.label ?? "Soft + Firm + Final";
}

export function getReminderCadence(preferences?: ReminderPreferencesLike | null): ReminderCadenceOffsets {
  return {
    soft: preferences?.soft_reminder_days ?? DEFAULT_REMINDER_CADENCE.soft,
    firm: preferences?.firm_reminder_days ?? DEFAULT_REMINDER_CADENCE.firm,
    final: preferences?.final_reminder_days ?? DEFAULT_REMINDER_CADENCE.final,
  };
}

export function getReminderSendTime(preferences?: ReminderPreferencesLike | null) {
  return normalizeReminderSendTime(preferences?.reminder_send_time);
}

function toReminderOffset(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, REMINDER_DAY_OFFSET_MAX);
}

export function getStoredReminderCadence(
  storedCadence?: ReminderCadenceValue | null,
  fallback: ReminderCadenceOffsets = DEFAULT_REMINDER_CADENCE,
): ReminderCadenceOffsets {
  return {
    soft: toReminderOffset(storedCadence?.soft, fallback.soft),
    firm: toReminderOffset(storedCadence?.firm, fallback.firm),
    final: toReminderOffset(storedCadence?.final, fallback.final),
  };
}

export function getStoredReminderSendTime(
  storedSendTime?: string | null,
  fallback = DEFAULT_REMINDER_SEND_TIME,
) {
  return normalizeReminderSendTime(storedSendTime ?? fallback);
}

export function getInvoiceReminderCadence(
  invoice?: InvoiceReminderScheduleLike | null,
  fallback: ReminderCadenceOffsets = DEFAULT_REMINDER_CADENCE,
) {
  return getStoredReminderCadence(invoice?.reminder_cadence, fallback);
}

export function getInvoiceReminderSendTime(
  invoice?: InvoiceReminderScheduleLike | null,
  fallback = DEFAULT_REMINDER_SEND_TIME,
) {
  return getStoredReminderSendTime(invoice?.reminder_send_time, fallback);
}

export function isAllowedReminderSendTime(value: string) {
  const minutes = toMinutes(normalizeReminderSendTime(value));
  const minMinutes = toMinutes(REMINDER_SEND_TIME_MIN);
  const maxMinutes = toMinutes(REMINDER_SEND_TIME_MAX);

  if (minutes === null || minMinutes === null || maxMinutes === null) {
    return false;
  }

  return minutes >= minMinutes && minutes <= maxMinutes;
}

export function parseReminderPlan(plan: string | null | undefined): ReminderPlanId {
  return REMINDER_PLAN_OPTIONS.some((option) => option.id === plan)
    ? (plan as ReminderPlanId)
    : "soft_firm_final";
}

export function getReminderKindLabel(kind: ReminderTemplateKind) {
  return STARTER_REMINDER_TEMPLATES.find((template) => template.kind === kind)?.name ?? "Reminder";
}

export function getReminderPlanKinds(plan: ReminderPlanId): StarterReminderKind[] {
  return REMINDER_PLAN_SEQUENCE[plan] ?? REMINDER_PLAN_SEQUENCE.soft_firm_final;
}

export function getNextReminderKind(
  plan: string | null | undefined,
  remindersSent: number,
): StarterReminderKind | null {
  const kinds = getReminderPlanKinds(parseReminderPlan(plan));
  return kinds[remindersSent] ?? null;
}

export function scheduleReminderPlan(
  dueDate: string,
  plan: ReminderPlanId,
  cadence: ReminderCadenceOffsets = DEFAULT_REMINDER_CADENCE,
  sendTime = DEFAULT_REMINDER_SEND_TIME,
): ReminderScheduleItem[] {
  const base = dueDateToDate(dueDate, sendTime);
  return getReminderPlanKinds(plan).map((kind) => {
    const scheduled = addDays(base, cadence[kind]);
    return {
      kind,
      label: getReminderKindLabel(kind),
      date: scheduled.toISOString().slice(0, 10),
      iso: scheduled.toISOString(),
    };
  });
}

export function nextReminderAt(
  dueDate: string,
  plan: ReminderPlanId,
  remindersSent = 0,
  cadence: ReminderCadenceOffsets = DEFAULT_REMINDER_CADENCE,
  sendTime = DEFAULT_REMINDER_SEND_TIME,
) {
  const nextScheduledReminder = scheduleReminderPlan(dueDate, plan, cadence, sendTime)[remindersSent];
  if (!nextScheduledReminder) {
    return null;
  }

  const scheduledTime = new Date(nextScheduledReminder.iso);
  const now = new Date();

  if (Number.isNaN(scheduledTime.getTime())) {
    return nextScheduledReminder.iso;
  }

  return scheduledTime <= now ? now.toISOString() : nextScheduledReminder.iso;
}

export function getReminderTemplateSource(template?: ReminderTemplateLike | null) {
  const softTemplate = STARTER_REMINDER_TEMPLATES[0];
  return {
    name: template?.name?.trim() || softTemplate.name,
    subject: template?.subject?.trim() || softTemplate.subject,
    body: template?.body?.trim() || softTemplate.body,
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

export async function ensureStarterReminderTemplates(supabase: SupabaseClient, userId: string) {
  const { data: loadedTemplates, error: loadError } = await supabase
    .from("reminder_templates")
    .select("id,name,subject,body,kind,is_default,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (loadError) {
    throw new Error(`Unable to load templates: ${loadError.message}`);
  }

  const templates = [...(loadedTemplates ?? [])];
  const byKind = new Map<ReminderTemplateKind, ReminderTemplateLike>();
  for (const template of templates) {
    const kind = (template.kind as ReminderTemplateKind) || "custom";
    if (!byKind.has(kind)) {
      byKind.set(kind, template);
    }
  }

  for (const starter of STARTER_REMINDER_TEMPLATES) {
    let existing = byKind.get(starter.kind);

    if (!existing && starter.kind === "soft") {
      existing =
        templates.find((template) => Boolean(template.is_default)) ??
        templates.find((template) => template.name === LEGACY_DEFAULT_TEMPLATE.name) ??
        templates[0];

      if (existing) {
        const shouldUpdateCopy = isLegacyDefaultTemplate(existing);
        const payload = {
          kind: "soft",
          is_default: true,
          ...(shouldUpdateCopy
            ? {
                name: starter.name,
                subject: starter.subject,
                body: starter.body,
              }
            : {}),
        };
        const { error: promoteError } = await supabase.from("reminder_templates").update(payload).eq("id", existing.id);
        if (promoteError) {
          throw new Error(`Unable to promote starter template: ${promoteError.message}`);
        }
        existing = { ...existing, ...payload };
      }
    }

    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from("reminder_templates")
        .insert({
          user_id: userId,
          kind: starter.kind,
          is_default: Boolean(starter.isDefault),
          name: starter.name,
          subject: starter.subject,
          body: starter.body,
        })
        .select("id,name,subject,body,kind,is_default,created_at")
        .single();

      if (createError) {
        throw new Error(`Unable to create starter template: ${createError.message}`);
      }
      existing = created;
      templates.push(created);
    }

    byKind.set(starter.kind, existing);
  }

  const softTemplate = byKind.get("soft");
  if (softTemplate && !softTemplate.is_default) {
    const { error } = await supabase
      .from("reminder_templates")
      .update({ is_default: true })
      .eq("id", softTemplate.id as string);
    if (error) {
      throw new Error(`Unable to mark soft template as default: ${error.message}`);
    }
    softTemplate.is_default = true;
  }

  const normalized = templates.map((template) => {
    const kind = (template.kind as ReminderTemplateKind) || "custom";
    const starter = STARTER_REMINDER_TEMPLATES.find((item) => item.kind === kind);
    return {
      ...template,
      kind,
      is_default: starter?.kind === "soft" ? template.id === softTemplate?.id : Boolean(template.is_default),
    };
  });

  return {
    templates: normalized,
    byKind: {
      soft: byKind.get("soft"),
      firm: byKind.get("firm"),
      final: byKind.get("final"),
    },
  };
}

export function getStarterReminderTemplates(
  loadedTemplates: LoadedReminderTemplate[] | null | undefined,
) {
  const templates = [...(loadedTemplates ?? [])];
  const byKind = new Map<ReminderTemplateKind, ReminderTemplateLike>();

  for (const template of templates) {
    const kind = (template.kind as ReminderTemplateKind) || "custom";
    if (!byKind.has(kind)) {
      byKind.set(kind, template);
    }
  }

  for (const starter of STARTER_REMINDER_TEMPLATES) {
    let existing = byKind.get(starter.kind);

    if (!existing && starter.kind === "soft") {
      existing =
        templates.find((template) => Boolean(template.is_default)) ??
        templates.find((template) => template.name === LEGACY_DEFAULT_TEMPLATE.name) ??
        templates[0];

      if (existing) {
        existing = {
          ...existing,
          kind: "soft",
          is_default: true,
          ...(isLegacyDefaultTemplate(existing)
            ? {
                name: starter.name,
                subject: starter.subject,
                body: starter.body,
              }
            : {}),
        };
      }
    }

    if (!existing) {
      existing = {
        id: `starter-${starter.kind}`,
        kind: starter.kind,
        is_default: Boolean(starter.isDefault),
        name: starter.name,
        subject: starter.subject,
        body: starter.body,
      };
    }

    byKind.set(starter.kind, existing);
  }

  const softTemplate = byKind.get("soft");

  const normalized = templates.length
    ? templates.map((template) => {
        const kind = (template.kind as ReminderTemplateKind) || "custom";
        return {
          ...template,
          kind,
          is_default: kind === "soft" ? template.id === softTemplate?.id : Boolean(template.is_default),
        };
      })
    : STARTER_REMINDER_TEMPLATES.map((starter) => ({
        id: `starter-${starter.kind}`,
        kind: starter.kind,
        is_default: Boolean(starter.isDefault),
        name: starter.name,
        subject: starter.subject,
        body: starter.body,
      }));

  const order = ["soft", "firm", "final", "custom"];
  const sorted = [...normalized].sort(
    (a, b) => order.indexOf((a.kind as string) ?? "custom") - order.indexOf((b.kind as string) ?? "custom"),
  );

  return {
    templates: sorted,
    byKind: {
      soft: byKind.get("soft"),
      firm: byKind.get("firm"),
      final: byKind.get("final"),
    },
  };
}
