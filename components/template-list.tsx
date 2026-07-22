"use client";

import { TemplateDialog } from "@/components/template-dialog";

type TemplateListProps = {
  templates: {
    id: string;
    name: string;
    subject: string;
    body: string;
    is_default?: boolean;
  }[];
};

export function TemplateList({ templates }: TemplateListProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="divide-y divide-zinc-200">
        {templates.map((template) => (
          <TemplateDialog
            key={template.id}
            template={template}
            triggerLabel={template.name}
            title="Template"
            triggerClassName="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
          />
        ))}
      </div>
    </div>
  );
}
