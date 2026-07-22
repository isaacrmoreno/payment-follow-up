"use client";

import { useRef } from "react";
import { upsertClientAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { PhoneInput } from "@/components/phone-input";
import { useToast } from "@/components/toast";

export function ClientDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
      >
        Add client
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,540px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <form
          action={async (formData) => {
            try {
              await upsertClientAction(formData);
              dialogRef.current?.close();
              toast("Client saved.", "success");
            } catch (error) {
              toast(error instanceof Error ? error.message : "Unable to save client.", "error");
            }
          }}
          className="space-y-4 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Add client</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>
          <input name="id" type="hidden" />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Name</span>
            <input name="name" required autoComplete="name" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input name="email" type="email" autoComplete="email" inputMode="email" placeholder="name@company.com" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Phone</span>
            <PhoneInput
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 123-4567"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Notes</span>
            <textarea name="notes" className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              Cancel
            </button>
            <PendingButton
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              pendingLabel="Saving client..."
            >
              Save client
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
