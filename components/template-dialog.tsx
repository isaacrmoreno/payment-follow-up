"use client";

import { useRef, useState } from "react";
import { deleteReminderTemplateAction, upsertReminderTemplateAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { ReminderTemplatePreview } from "@/components/reminder-template-preview";
import { useToast } from "@/components/toast";
import {
  DEFAULT_REMINDER_TEMPLATE,
  REMINDER_INSERT_FIELDS,
  renderReminderContent,
} from "@/lib/reminders";

const previewVariables = {
  clientName: "Jordan Lee",
  invoiceTitle: "Website Redesign",
  amountDue: "$1,250.00",
  dueDate: "Jul 22, 2026",
  paymentLink: "https://pay.example.com/invoice/123",
};

type TemplateDialogProps = {
  template?: {
    id: string;
    name: string;
    subject: string;
    body: string;
    is_default?: boolean;
    kind?: string;
  };
  triggerLabel?: string;
  triggerClassName?: string;
  title?: string;
};

export function TemplateDialog({
  template,
  triggerLabel,
  triggerClassName,
  title,
}: TemplateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? DEFAULT_REMINDER_TEMPLATE.subject);
  const [body, setBody] = useState(template?.body ?? DEFAULT_REMINDER_TEMPLATE.body);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const { toast } = useToast();

  const preview = renderReminderContent(
    {
      name: name || template?.name || DEFAULT_REMINDER_TEMPLATE.name,
      subject,
      body,
    },
    previewVariables,
  );

  function resetForm() {
    setName(template?.name ?? "");
    setSubject(template?.subject ?? DEFAULT_REMINDER_TEMPLATE.subject);
    setBody(template?.body ?? DEFAULT_REMINDER_TEMPLATE.body);
  }

  function closeDialog() {
    dialogRef.current?.close();
    deleteDialogRef.current?.close();
    setOpen(false);
    resetForm();
  }

  function insertField(token: string, target: "subject" | "body") {
    if (target === "subject") {
      const input = subjectRef.current;
      if (!input) {
        return;
      }

      input.focus();
      input.setRangeText(token, input.selectionStart ?? subject.length, input.selectionEnd ?? subject.length, "end");
      setSubject(input.value);
      requestAnimationFrame(() => {
        input?.focus();
      });
      return;
    }

    const textarea = bodyRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setRangeText(token, textarea.selectionStart ?? body.length, textarea.selectionEnd ?? body.length, "end");
    setBody(textarea.value);
    requestAnimationFrame(() => {
      textarea?.focus();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => dialogRef.current?.showModal());
        }}
        className={
          triggerClassName ??
          "inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        }
      >
        {triggerLabel ?? "Add template"}
      </button>

      {open ? (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 m-auto w-[min(100vw-2rem,620px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        >
          <form
            action={async (formData) => {
              try {
                await upsertReminderTemplateAction(formData);
                closeDialog();
                toast(template ? "Template updated." : "Template saved.", "success");
              } catch (error) {
                toast(error instanceof Error ? error.message : "Unable to save template.", "error");
              }
            }}
            className="space-y-4 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{title ?? (template ? "Edit template" : "Add template")}</h2>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Close
              </button>
            </div>

            <input name="id" type="hidden" value={template?.id ?? ""} />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Name</span>
              <input
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Soft reminder"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Subject</span>
              <input
                ref={subjectRef}
                name="subject"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                onFocus={() => setActiveField("subject")}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Body</span>
              <textarea
                ref={bodyRef}
                name="body"
                required
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onFocus={() => setActiveField("body")}
                className="min-h-36 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>

            <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <div>
                <p className="font-medium text-zinc-900">Add invoice details</p>
                <p className="text-xs text-zinc-600">
                  These fill in automatically for each invoice. Click one to insert it into the{" "}
                  {activeField === "subject" ? "subject" : "body"}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {REMINDER_INSERT_FIELDS.map((field) => (
                  <button
                    key={field.token}
                    type="button"
                    onClick={() => insertField(field.token, activeField)}
                    className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
                    title={field.description}
                  >
                    {field.label}
                  </button>
                ))}
              </div>
            </div>

            <ReminderTemplatePreview subject={preview.subject} body={preview.body} />

            <div className="flex items-center justify-between gap-3">
              {template && template.kind === "custom" ? (
                <button
                  type="button"
                  onClick={() => deleteDialogRef.current?.showModal()}
                  className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
                >
                  Delete template
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
                >
                  Cancel
                </button>
                <PendingButton
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  pendingLabel={template ? "Saving template..." : "Creating template..."}
                >
                  {template ? "Save changes" : "Save template"}
                </PendingButton>
              </div>
            </div>
          </form>
        </dialog>
      ) : null}

      {open && template && template.kind === "custom" ? (
        <dialog
          ref={deleteDialogRef}
          className="fixed inset-0 m-auto w-[min(100vw-2rem,420px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
        >
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Delete template</h3>
              <button
                type="button"
                onClick={() => deleteDialogRef.current?.close()}
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-zinc-600">
              Delete this template? Invoices using it will move to the default reminder.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => deleteDialogRef.current?.close()}
                className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const formData = new FormData();
                    formData.set("id", template.id);
                    await deleteReminderTemplateAction(formData);
                    closeDialog();
                    toast("Template deleted.", "success");
                  } catch (error) {
                    toast(error instanceof Error ? error.message : "Unable to delete template.", "error");
                  }
                }}
                className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                Delete template
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
