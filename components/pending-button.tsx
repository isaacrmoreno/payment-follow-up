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
    <button className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
