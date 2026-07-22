"use client";

import { useMemo, useRef, useState } from "react";
import { formatDateTime, formatInvoiceDate, formatTimeLabel } from "@/lib/date";
import type { ReminderCadenceOffsets, ReminderScheduleItem } from "@/lib/reminders";
import { ReminderTemplatePreview } from "@/components/reminder-template-preview";
import type { ReminderHistoryItem } from "@/components/reminder-history-dialog";

type ReminderPreviewItem = {
  kind: string;
  label: string;
  subject: string;
  body: string;
};

type ReminderPreviewDialogProps = {
  clientName: string;
  dueDate: string;
  amountDue: string;
  paymentLink: string | null;
  sendTime: string;
  cadence: ReminderCadenceOffsets;
  nextScheduledReminder: ReminderScheduleItem | null;
  previews: ReminderPreviewItem[];
  schedule: ReminderScheduleItem[];
  reminders: ReminderHistoryItem[];
};

export function ReminderPreviewDialog({
  clientName,
  dueDate,
  amountDue,
  paymentLink,
  sendTime,
  cadence,
  nextScheduledReminder,
  previews,
  schedule,
  reminders,
}: ReminderPreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedKind, setSelectedKind] = useState(previews[0]?.kind ?? "soft");
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "sent">("upcoming");
  const activePreview = useMemo(
    () => previews.find((preview) => preview.kind === selectedKind) ?? previews[0],
    [previews, selectedKind],
  );
  const sortedReminders = useMemo(() => {
    const reminderOrder = ["soft", "firm", "final"];

    function getReminderRank(templateName: string | null | undefined) {
      const normalizedTemplate = (templateName ?? "").toLowerCase();
      const matchedIndex = reminderOrder.findIndex((kind) => normalizedTemplate.includes(kind));
      return matchedIndex === -1 ? reminderOrder.length : matchedIndex;
    }

    return [...reminders].sort((left, right) => {
      const rankDifference =
        getReminderRank(left.template_name) - getReminderRank(right.template_name);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      const leftTime = left.sent_at ? new Date(left.sent_at).getTime() : 0;
      const rightTime = right.sent_at ? new Date(right.sent_at).getTime() : 0;
      return leftTime - rightTime;
    });
  }, [reminders]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
      >
        Preview
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,560px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-3 text-sm text-zinc-600">
            <div>
              <dt className="font-medium text-zinc-900">Client</dt>
              <dd>{clientName}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Due</dt>
              <dd>{dueDate}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Amount due</dt>
              <dd>{amountDue}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Payment link</dt>
              <dd className="truncate">
                {paymentLink ? (
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer text-zinc-900 underline underline-offset-2 transition hover:text-zinc-600"
                  >
                    {paymentLink}
                  </a>
                ) : (
                  "Not set"
                )}
              </dd>
            </div>
          </dl>

          <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-zinc-900">Automation</p>
                <p className="mt-1 text-zinc-600">
                  {nextScheduledReminder
                    ? `Next send: ${nextScheduledReminder.label} on ${formatInvoiceDate(nextScheduledReminder.date)} at ${formatTimeLabel(sendTime)}`
                    : "No more reminders are scheduled for this invoice."}
                </p>
              </div>
              <div className="text-xs text-zinc-500">
                Soft {cadence.soft}d · Firm {cadence.firm}d · Final {cadence.final}d
              </div>
            </div>
          </div>

          {previews.length > 1 ? (
            <div className="grid gap-2 md:grid-cols-3">
              {previews.map((preview) => (
                <button
                  key={preview.kind}
                  type="button"
                  onClick={() => setSelectedKind(preview.kind)}
                  className={[
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition",
                    activePreview?.kind === preview.kind
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900 hover:text-zinc-900",
                  ].join(" ")}
                >
                  {preview.label}
                </button>
              ))}
            </div>
          ) : null}

          {activePreview ? (
            <ReminderTemplatePreview subject={activePreview.subject} body={activePreview.body} />
          ) : null}

          <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-700">
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
              <button
                type="button"
                onClick={() => setSelectedTab("upcoming")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm transition",
                  selectedTab === "upcoming"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("sent")}
                className={[
                  "rounded-md px-3 py-1.5 text-sm transition",
                  selectedTab === "sent"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")}
              >
                Sent
              </button>
            </div>

            {selectedTab === "upcoming" ? (
              schedule.length ? (
                <div className="mt-3 space-y-1.5">
                  {schedule.map((step) => (
                    <div key={`${step.kind}-${step.date}`} className="flex items-center justify-between gap-3">
                      <span>{step.label}</span>
                      <span className="text-zinc-500">{formatInvoiceDate(step.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-zinc-500">No reminders are scheduled yet.</p>
              )
            ) : sortedReminders.length ? (
              <div className="mt-3 max-h-[min(32vh,240px)] space-y-1.5 overflow-y-auto pr-1">
                {sortedReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between gap-3">
                    <span>{reminder.template_name ?? "Reminder"}</span>
                    <span className="text-zinc-500">{formatDateTime(reminder.sent_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-zinc-500">We haven&apos;t sent any reminders yet.</p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
