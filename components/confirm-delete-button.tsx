"use client";

import { useFormStatus } from "react-dom";

type ConfirmDeleteButtonProps = {
  label: string;
  confirmMessage: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function ConfirmDeleteButton({
  label,
  confirmMessage,
  pendingLabel = "Deleting...",
  className = "",
  disabled = false,
}: ConfirmDeleteButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={(event) => {
        if (disabled || pending) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : null}
        <span>{pending ? pendingLabel : label}</span>
      </span>
    </button>
  );
}
