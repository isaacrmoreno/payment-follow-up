"use client";

import { useRef, useState } from "react";
import { upsertInvoiceAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { CurrencyInput } from "@/components/currency-input";
import { ReminderTemplatePreview } from "@/components/reminder-template-preview";
import { TitleInput } from "@/components/title-input";
import { useToast } from "@/components/toast";
import { formatInvoiceDate } from "@/lib/date";
import { titleCaseWords } from "@/lib/labels";
import { renderReminderContent } from "@/lib/reminders";

type ClientOption = {
  id: string;
  name: string;
};

type TemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_default?: boolean;
};

export function InvoiceDialog({
  clients,
  templates,
}: {
  clients: ClientOption[];
  templates: TemplateOption[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amountDue, setAmountDue] = useState("0");
  const [paymentLink, setPaymentLink] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const selectedTemplate = templates.find((template) => template.id === templateId) ?? null;
  const preview = renderReminderContent(selectedTemplate, {
    clientName: titleCaseWords(selectedClient?.name ?? "there"),
    invoiceTitle: title || "Website Redesign",
    amountDue: amountDue && amountDue !== "0" ? `$${amountDue}` : "$0.00",
    dueDate: formatInvoiceDate(dueDate || "2026-07-22"),
    paymentLink: paymentLink || null,
  });

  function resetForm() {
    setClientId("");
    setTitle("");
    setDueDate("");
    setAmountDue("0");
    setPaymentLink("");
    setTemplateId(templates[0]?.id ?? "");
  }

  function closeDialog() {
    dialogRef.current?.close();
    resetForm();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
      >
        Add invoice
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,620px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <form
          action={async (formData) => {
            try {
              await upsertInvoiceAction(formData);
              closeDialog();
              toast("Invoice saved.", "success");
            } catch (error) {
              toast(error instanceof Error ? error.message : "Unable to save invoice.", "error");
            }
          }}
          className="space-y-4 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Add invoice</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>

          <input name="id" type="hidden" />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Client</span>
            <select
              name="client_id"
              required
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {titleCaseWords(client.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Invoice title</span>
            <TitleInput
              name="title"
              required
              value={title}
              onInput={(event) => setTitle(event.currentTarget.value)}
              placeholder="July design retainer"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Due Date</span>
              <input
                name="due_date"
                type="date"
                required
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Amount due</span>
              <CurrencyInput
                name="amount_due"
                required
                value={amountDue}
                placeholder="0.00"
                onInput={(event) => setAmountDue(event.currentTarget.value)}
              />
            </label>
          </div>

          <input name="amount_paid" type="hidden" value="0" />
          <input name="status" type="hidden" value="due" />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Email Template</span>
            <select
              name="reminder_template_id"
              required
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">External Payment Link</span>
            <input
              name="external_reference"
              type="url"
              required
              value={paymentLink}
              onChange={(event) => setPaymentLink(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>

          <input name="invoice_number" type="hidden" value="" />
          <input name="blocker_reason" type="hidden" value="" />
          <input name="next_follow_up_at" type="hidden" value="" />

          <ReminderTemplatePreview subject={preview.subject} body={preview.body} />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              Cancel
            </button>
            <PendingButton
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              pendingLabel="Saving invoice..."
            >
              Save invoice
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
