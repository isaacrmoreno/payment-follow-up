"use client";

import { TemplateDialog } from "@/components/template-dialog";

type TemplateListProps = {
  templates: {
    id: string;
    name: string;
    subject: string;
    body: string;
    is_default?: boolean;
    kind?: string;
  }[];
};

export function TemplateList({ templates }: TemplateListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="md:grid md:grid-cols-3">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={[
              "border-zinc-200",
              index > 0 ? "border-t md:border-t-0" : "",
              index < templates.length - 1 ? "md:border-r" : "",
            ].join(" ")}
          >
            <TemplateDialog
              template={template}
              triggerLabel={template.name}
              title="Template"
              triggerClassName="flex w-full items-center justify-between bg-white px-4 py-3 text-left text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
