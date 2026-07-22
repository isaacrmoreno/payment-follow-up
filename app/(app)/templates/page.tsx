import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { TemplateList } from "@/components/template-list";
import { TemplateDialog } from "@/components/template-dialog";
import { ensureDefaultReminderTemplate } from "@/lib/reminders";

export default async function TemplatesPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const defaultTemplate = await ensureDefaultReminderTemplate(supabase, user.id);
  const { data: loadedTemplates } = await supabase
    .from("reminder_templates")
    .select("id,name,subject,body,is_default,created_at")
    .order("created_at", { ascending: false });
  const templates =
    loadedTemplates && loadedTemplates.length
      ? loadedTemplates.map((template) => ({
          ...template,
          is_default: template.id === defaultTemplate.id || template.is_default,
        }))
      : [defaultTemplate];

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Templates</h1>
        <TemplateDialog />
      </section>

      {templates?.length ? (
        <TemplateList templates={templates} />
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
          No templates yet.
        </div>
      )}
    </div>
  );
}
