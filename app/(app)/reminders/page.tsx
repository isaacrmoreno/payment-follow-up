import { createSupabaseServerReadClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ReminderCadenceDialog } from "@/components/reminder-cadence-dialog";
import { TemplateList } from "@/components/template-list";
import {
  getReminderCadence,
  getReminderSendTime,
  getStarterReminderTemplates,
} from "@/lib/reminders";

export default async function RemindersPage() {
  await requireUser();
  const supabase = await createSupabaseServerReadClient();
  const [{ data: loadedTemplates }, { data: preferences }] = await Promise.all([
    supabase
      .from("reminder_templates")
      .select("id,name,subject,body,kind,is_default,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_preferences")
      .select("soft_reminder_days,firm_reminder_days,final_reminder_days,reminder_send_time")
      .maybeSingle(),
  ]);
  const { templates } = getStarterReminderTemplates(loadedTemplates);
  const starterTemplates = templates
    .filter((template) => template.kind && template.kind !== "custom")
    .map((template) => ({
      id: template.id ?? `starter-${template.kind ?? "custom"}`,
      name: template.name ?? "Reminder",
      subject: template.subject ?? "",
      body: template.body ?? "",
      is_default: template.is_default ?? false,
      kind: template.kind ?? "custom",
    }));
  const cadence = getReminderCadence(preferences);
  const sendTime = getReminderSendTime(preferences);

  return (
    <div className="space-y-8">
      <section
        id="tour-reminders-header"
        className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <h1 className="text-lg font-semibold">Reminders</h1>
        <div id="tour-edit-cadence">
          <ReminderCadenceDialog
            cadence={cadence}
            sendTime={sendTime}
            hideSummary
            triggerLabel="Edit cadence"
            triggerClassName="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          />
        </div>
      </section>

      {starterTemplates.length ? (
        <div id="tour-template-list">
          <TemplateList templates={starterTemplates} />
        </div>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
          No templates yet.
        </div>
      )}
    </div>
  );
}
