"use client";

import { useRef } from "react";
import { formatDateTime } from "@/lib/date";

export type ReminderHistoryItem = {
  id: string;
  sent_at: string | null;
  subject: string | null;
  delivery_status: string | null;
};

export function ReminderHistoryDialog({
  reminders,
}: {
  reminders: ReminderHistoryItem[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
      >
        History
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,560px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">History</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>

          {reminders.length ? (
            <div className="max-h-[min(60vh,520px)] space-y-3 overflow-y-auto pr-1">
              {reminders.map((reminder) => (
                <article key={reminder.id} className="rounded-md border border-zinc-200 p-3">
                  <h3 className="truncate text-sm font-medium text-zinc-900">
                    {reminder.subject ?? "Reminder"}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDateTime(reminder.sent_at)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              No reminders sent yet.
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
