"use client";

import { useRef, useState } from "react";
import { upsertReminderCadenceAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { useToast } from "@/components/toast";
import { REMINDER_SEND_TIME_MAX, REMINDER_SEND_TIME_MIN } from "@/lib/reminders";

type ReminderCadenceDialogProps = {
  cadence: {
    soft: number;
    firm: number;
    final: number;
  };
  sendTime: string;
  hideSummary?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
};

export function ReminderCadenceDialog({
  cadence,
  sendTime,
  hideSummary = false,
  triggerLabel = "Edit cadence",
  triggerClassName,
}: ReminderCadenceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [softDays, setSoftDays] = useState(String(cadence.soft));
  const [firmDays, setFirmDays] = useState(String(cadence.firm));
  const [finalDays, setFinalDays] = useState(String(cadence.final));
  const [sendAt, setSendAt] = useState(sendTime);

  function resetForm() {
    setSoftDays(String(cadence.soft));
    setFirmDays(String(cadence.firm));
    setFinalDays(String(cadence.final));
    setSendAt(sendTime);
  }

  function closeDialog() {
    dialogRef.current?.close();
    resetForm();
  }

  function formatTimeLabel(value: string) {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return value;
    }

    const period = hour >= 12 ? "PM" : "AM";
    const normalizedHour = hour % 12 || 12;
    return `${normalizedHour}:${String(minute).padStart(2, "0")} ${period}`;
  }

  return (
    <>
      {hideSummary ? (
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className={
            triggerClassName ??
            "inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
          }
        >
          {triggerLabel}
        </button>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-950">Cadence</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                <span>Soft: {cadence.soft}d</span>
                <span>Firm: {cadence.firm}d</span>
                <span>Final: {cadence.final}d</span>
                <span>Send at: {formatTimeLabel(sendTime)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              {triggerLabel}
            </button>
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,520px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <form
          action={async (formData) => {
            try {
              await upsertReminderCadenceAction(formData);
              closeDialog();
              toast("Cadence saved.", "success");
            } catch (error) {
              toast(error instanceof Error ? error.message : "Unable to save cadence.", "error");
            }
          }}
          className="space-y-4 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Edit cadence</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>

          <p className="text-sm text-zinc-600">Set how many days after the due date each reminder should send.</p>

          <div className="grid gap-3 sm:grid-cols-3">
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
            <p className="text-xs text-zinc-500">Business hours only: 8:00 AM to 6:00 PM.</p>
          </label>

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
              pendingLabel="Saving cadence..."
            >
              Save cadence
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
