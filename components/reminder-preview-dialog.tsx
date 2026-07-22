"use client";

import { useRef } from "react";
import { ReminderTemplatePreview } from "@/components/reminder-template-preview";

type ReminderPreviewDialogProps = {
  clientName: string;
  dueDate: string;
  amountDue: string;
  paymentLink: string | null;
  subject: string;
  body: string;
};

export function ReminderPreviewDialog({
  clientName,
  dueDate,
  amountDue,
  paymentLink,
  subject,
  body,
}: ReminderPreviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
      >
        Preview reminder
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,560px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Preview reminder</h2>
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

          <ReminderTemplatePreview subject={subject} body={body} />
        </div>
      </dialog>
    </>
  );
}
