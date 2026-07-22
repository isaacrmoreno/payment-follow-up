"use client";

import { useEffect, useRef, useState } from "react";
import { upsertInvoiceAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { CurrencyInput } from "@/components/currency-input";
import { TitleInput } from "@/components/title-input";
import { useToast } from "@/components/toast";
import { formatInvoiceDate } from "@/lib/date";
import { titleCaseWords } from "@/lib/labels";
import {
  type ReminderCadenceOffsets,
  REMINDER_PLAN_OPTIONS,
  parseReminderPlan,
  scheduleReminderPlan,
} from "@/lib/reminders";

type ClientOption = {
  id: string;
  name: string;
};

type InvoiceDialogInvoice = {
  id: string;
  client_id: string;
  title: string;
  due_date: string;
  amount_due: string | number;
  amount_paid?: string | number | null;
  status?: string | null;
  reminder_plan?: string | null;
  external_reference?: string | null;
};

export function InvoiceDialog({
  clients,
  cadence,
  sendTime,
  invoice,
  title,
  triggerLabel,
  triggerClassName,
  hideTrigger = false,
  openOnMount = false,
  onOpen,
  onClose,
}: {
  clients: ClientOption[];
  cadence: ReminderCadenceOffsets;
  sendTime: string;
  invoice?: InvoiceDialogInvoice;
  title?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  hideTrigger?: boolean;
  openOnMount?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [clientId, setClientId] = useState(invoice?.client_id ?? "");
  const [invoiceTitle, setInvoiceTitle] = useState(invoice?.title ?? "");
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? "");
  const [amountDue, setAmountDue] = useState(String(invoice?.amount_due ?? "0"));
  const [paymentLink, setPaymentLink] = useState(invoice?.external_reference ?? "");
  const [reminderPlan, setReminderPlan] = useState(invoice?.reminder_plan ?? "soft_firm_final");

  const scheduledReminders = dueDate
    ? scheduleReminderPlan(dueDate, parseReminderPlan(reminderPlan), cadence, sendTime)
    : [];

  function resetForm() {
    setClientId(invoice?.client_id ?? "");
    setInvoiceTitle(invoice?.title ?? "");
    setDueDate(invoice?.due_date ?? "");
    setAmountDue(String(invoice?.amount_due ?? "0"));
    setPaymentLink(invoice?.external_reference ?? "");
    setReminderPlan(invoice?.reminder_plan ?? "soft_firm_final");
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!openOnMount || !dialog || dialog.open) {
      return;
    }

    dialog.showModal();
  }, [openOnMount]);

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => {
            onOpen?.();
            dialogRef.current?.showModal();
          }}
          className={
            triggerClassName ??
            "inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          }
        >
          {triggerLabel ?? "Add invoice"}
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => {
          resetForm();
          onClose?.();
        }}
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
            <h2 className="text-lg font-semibold">{title ?? (invoice ? "Edit invoice" : "Add invoice")}</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>

          <input name="id" type="hidden" value={invoice?.id ?? ""} />

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
              value={invoiceTitle}
              onInput={(event) => setInvoiceTitle(event.currentTarget.value)}
              placeholder="Project invoice"
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

          <input name="amount_paid" type="hidden" value={String(invoice?.amount_paid ?? "0")} />
          <input name="status" type="hidden" value={invoice?.status ?? "due"} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Reminder Plan</span>
            <select
              name="reminder_plan"
              required
              value={reminderPlan}
              onChange={(event) => setReminderPlan(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            >
              {REMINDER_PLAN_OPTIONS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.label}
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

          {scheduledReminders.length ? (
            <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-700">
              <p className="font-medium text-zinc-900">Scheduled reminders</p>
              <div className="mt-2 space-y-1.5">
                {scheduledReminders.map((step) => (
                  <div key={`${step.kind}-${step.date}`} className="flex items-center justify-between gap-3">
                    <span>{step.label}</span>
                    <span className="text-zinc-500">{formatInvoiceDate(step.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
              {invoice ? "Save changes" : "Save invoice"}
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
