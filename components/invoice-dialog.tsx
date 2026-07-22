"use client";

import { useEffect, useRef, useState } from "react";
import { upsertInvoiceAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { CurrencyInput } from "@/components/currency-input";
import { TitleInput } from "@/components/title-input";
import { useToast } from "@/components/toast";
import { formatInvoiceDate, formatTimeLabel } from "@/lib/date";
import { titleCaseWords } from "@/lib/labels";
import {
  type ReminderCadenceOffsets,
  getInvoiceReminderCadence,
  getInvoiceReminderSendTime,
  isAllowedReminderSendTime,
  REMINDER_PLAN_OPTIONS,
  REMINDER_SEND_TIME_MAX,
  REMINDER_SEND_TIME_MIN,
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
  reminder_cadence?: {
    soft?: number | string | null;
    firm?: number | string | null;
    final?: number | string | null;
  } | null;
  reminder_send_time?: string | null;
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
  const effectiveCadence = getInvoiceReminderCadence(invoice, cadence);
  const effectiveSendTime = getInvoiceReminderSendTime(invoice, sendTime);
  const [softDays, setSoftDays] = useState(String(effectiveCadence.soft));
  const [firmDays, setFirmDays] = useState(String(effectiveCadence.firm));
  const [finalDays, setFinalDays] = useState(String(effectiveCadence.final));
  const [sendAt, setSendAt] = useState(effectiveSendTime);

  const scheduledReminders = dueDate
    ? scheduleReminderPlan(dueDate, parseReminderPlan(reminderPlan), {
        soft: Number(softDays || 0),
        firm: Number(firmDays || 0),
        final: Number(finalDays || 0),
      }, sendAt)
    : [];

  function resetForm() {
    setClientId(invoice?.client_id ?? "");
    setInvoiceTitle(invoice?.title ?? "");
    setDueDate(invoice?.due_date ?? "");
    setAmountDue(String(invoice?.amount_due ?? "0"));
    setPaymentLink(invoice?.external_reference ?? "");
    setReminderPlan(invoice?.reminder_plan ?? "soft_firm_final");
    setSoftDays(String(effectiveCadence.soft));
    setFirmDays(String(effectiveCadence.firm));
    setFinalDays(String(effectiveCadence.final));
    setSendAt(effectiveSendTime);
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
              const cadenceValues = [softDays, firmDays, finalDays].map((value) => Number(value));
              if (cadenceValues.some((value) => Number.isNaN(value) || value < 0)) {
                throw new Error("Schedule days must be zero or more.");
              }

              if (!/^\d{2}:\d{2}$/.test(sendAt) || !isAllowedReminderSendTime(sendAt)) {
                throw new Error("Send time must be between 8:00 AM and 6:00 PM.");
              }

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

          {invoice ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
              This invoice uses a locked reminder schedule. Updating your global cadence will not change these reminder dates.
            </div>
          ) : null}

          <div className="space-y-3 rounded-md border border-zinc-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-900">Schedule timing</p>
                <p className="text-sm text-zinc-600">
                  Set the timing this invoice should follow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSoftDays(String(cadence.soft));
                  setFirmDays(String(cadence.firm));
                  setFinalDays(String(cadence.final));
                  setSendAt(sendTime);
                }}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
              >
                Use defaults
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700">Soft</span>
                <input
                  name="soft_reminder_days"
                  type="number"
                  min="0"
                  required
                  value={softDays}
                  onChange={(event) => setSoftDays(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700">Firm</span>
                <input
                  name="firm_reminder_days"
                  type="number"
                  min="0"
                  required
                  value={firmDays}
                  onChange={(event) => setFirmDays(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700">Final</span>
                <input
                  name="final_reminder_days"
                  type="number"
                  min="0"
                  required
                  value={finalDays}
                  onChange={(event) => setFinalDays(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Send time</span>
              <input
                name="reminder_send_time"
                type="time"
                required
                min={REMINDER_SEND_TIME_MIN}
                max={REMINDER_SEND_TIME_MAX}
                value={sendAt}
                onChange={(event) => setSendAt(event.target.value)}
                className="block w-full min-w-0 appearance-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
              <p className="text-xs text-zinc-500">Current send time: {formatTimeLabel(sendAt)}</p>
            </label>
          </div>

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
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium text-zinc-900">Scheduled reminders</p>
                <p className="text-xs text-zinc-500">Sends at {formatTimeLabel(sendAt)}</p>
              </div>
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
