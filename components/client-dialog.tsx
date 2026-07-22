"use client";

import { useEffect, useRef, useState } from "react";
import { upsertClientAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { PhoneInput } from "@/components/phone-input";
import { useToast } from "@/components/toast";

type ClientDialogProps = {
  client?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
  title?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  onOpen?: () => void;
  onClose?: () => void;
  hideTrigger?: boolean;
  openOnMount?: boolean;
};

export function ClientDialog({
  client,
  title,
  triggerLabel,
  triggerClassName,
  onOpen,
  onClose,
  hideTrigger = false,
  openOnMount = false,
}: ClientDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  function resetForm() {
    setName(client?.name ?? "");
    setEmail(client?.email ?? "");
    setPhone(client?.phone ?? "");
    setNotes(client?.notes ?? "");
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
          {triggerLabel ?? "Add client"}
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => {
          resetForm();
          onClose?.();
        }}
        className="fixed inset-0 m-auto w-[min(100vw-2rem,540px)] rounded-md border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <form
          action={async (formData) => {
            try {
              await upsertClientAction(formData);
              closeDialog();
              toast(client ? "Client updated." : "Client saved.", "success");
            } catch (error) {
              toast(error instanceof Error ? error.message : "Unable to save client.", "error");
            }
          }}
          className="space-y-4 p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{title ?? (client ? "Edit client" : "Add client")}</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Close
            </button>
          </div>
          <input name="id" type="hidden" value={client?.id ?? ""} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Phone</span>
            <PhoneInput
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onInput={(event) => setPhone(event.currentTarget.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Notes</span>
            <textarea
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
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
              pendingLabel={client ? "Saving client..." : "Saving client..."}
            >
              {client ? "Save changes" : "Save client"}
            </PendingButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
