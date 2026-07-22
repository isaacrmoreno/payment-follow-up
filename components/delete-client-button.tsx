"use client";

import { useFormStatus } from "react-dom";
import { useToast } from "@/components/toast";

type DeleteClientButtonProps = {
  disabled: boolean;
};

export function DeleteClientButton({ disabled }: DeleteClientButtonProps) {
  const { pending } = useFormStatus();
  const { toast } = useToast();
  const blockedMessage = "Delete the client's invoices first.";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={disabled || pending}
      aria-busy={pending}
      title={disabled ? blockedMessage : "Delete client"}
      className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={(event) => {
        if (!disabled) {
          return;
        }

        event.preventDefault();
        toast(blockedMessage, "error");
      }}
    >
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : null}
        <span>{pending ? "Deleting..." : "Delete"}</span>
      </span>
    </button>
  );
}
