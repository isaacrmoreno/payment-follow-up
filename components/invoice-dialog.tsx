"use client";

import { useRef } from "react";
import { upsertInvoiceAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { titleCaseWords } from "@/lib/labels";
import { useToast } from "@/components/toast";
import { TitleInput } from "@/components/title-input";
import { CurrencyInput } from "@/components/currency-input";

type ClientOption = {
  id: string;
  name: string;
};

export function InvoiceDialog({ clients }: { clients: ClientOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();

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
              dialogRef.current?.close();
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
              onClick={() => dialogRef.current?.close()}
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
              placeholder="Website redesign"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Due Date</span>
              <input name="due_date" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Amount due</span>
              <CurrencyInput
                name="amount_due"
                required
                defaultValue="0"
                placeholder="0.00"
              />
            </label>
          </div>
          <input name="amount_paid" type="hidden" value="0" />
          <input name="status" type="hidden" value="due" />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">External Payment Link</span>
            <input name="external_reference" type="url" required placeholder="https://..." className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <input name="invoice_number" type="hidden" value="" />
          <input name="blocker_reason" type="hidden" value="" />
          <input name="next_follow_up_at" type="hidden" value="" />
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
