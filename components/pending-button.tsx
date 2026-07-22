"use client";

import { useFormStatus } from "react-dom";

type PendingButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
};

export function PendingButton({
  children,
  pendingLabel = "Working...",
  className = "",
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} aria-busy={pending}>
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : null}
        <span>{pending ? pendingLabel : children}</span>
      </span>
    </button>
  );
}
