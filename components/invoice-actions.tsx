"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  archiveInvoiceAction,
  closeInvoiceAction,
  markInvoicePaidAction,
  sendReminderAction,
} from "@/app/actions";
import {
  ReminderHistoryDialog,
  type ReminderHistoryItem,
} from "@/components/reminder-history-dialog";
import { useToast } from "@/components/toast";

type InvoiceActionsProps = {
  invoiceId: string;
  amountDue: string | number;
  initialStatus: string | null;
  reminders: ReminderHistoryItem[];
};

export function InvoiceActions({
  invoiceId,
  amountDue,
  initialStatus,
  reminders,
}: InvoiceActionsProps) {
  const { toast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isSending, setIsSending] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [status, setStatus] = useState(initialStatus ?? "due");
  const [archived, setArchived] = useState(false);

  const paid = status === "paid";
  const closed = status === "closed";
  const canArchive = paid || closed;

  function updateMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const viewportWidth = window.innerWidth;
    const left = Math.max(12, Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 12));
    const top = rect.bottom + 8;

    setMenuPosition({ top, left });
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleViewportChange() {
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  function sendReminder() {
    setIsSending(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("invoice_id", invoiceId);
        await sendReminderAction(formData);
        setReminderSent(true);
        closeMenu();
        toast("Reminder sent.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Unable to send reminder.", "error");
      } finally {
        setIsSending(false);
      }
    });
  }

  function markPaid() {
    setIsMarkingPaid(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", invoiceId);
        formData.set("amount_due", String(amountDue));
        await markInvoicePaidAction(formData);
        setStatus("paid");
        closeMenu();
        toast("Invoice marked paid.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Unable to mark invoice paid.", "error");
      } finally {
        setIsMarkingPaid(false);
      }
    });
  }

  function closeInvoice() {
    setIsClosing(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", invoiceId);
        await closeInvoiceAction(formData);
        setStatus("closed");
        closeMenu();
        toast("Invoice closed.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Unable to close invoice.", "error");
      } finally {
        setIsClosing(false);
      }
    });
  }

  function archiveInvoice() {
    setIsArchiving(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", invoiceId);
        await archiveInvoiceAction(formData);
        setArchived(true);
        closeMenu();
        toast("Invoice archived.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Unable to archive invoice.", "error");
      } finally {
        setIsArchiving(false);
      }
    });
  }

  if (archived) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        Archived
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          updateMenuPosition();
          setIsOpen(true);
        }}
        className="inline-flex cursor-pointer list-none items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
      >
        Select
      </button>

      {typeof document !== "undefined" && isOpen
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[100] min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {!paid && !closed ? (
                <button
                  type="button"
                  onClick={sendReminder}
                  disabled={isSending}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{reminderSent ? "Reminder sent" : "Send reminder"}</span>
                  {isSending ? (
                    <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : null}
                </button>
              ) : null}

              {!paid && !closed ? (
                <button
                  type="button"
                  onClick={markPaid}
                  disabled={isMarkingPaid}
                  title="Use this when the money has been received."
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Mark paid</span>
                  {isMarkingPaid ? (
                    <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : null}
                </button>
              ) : null}

              {!paid && !closed ? (
                <button
                  type="button"
                  onClick={closeInvoice}
                  disabled={isClosing}
                  title="Use this when the invoice is canceled or you no longer need to collect it."
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Close invoice</span>
                  {isClosing ? (
                    <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : null}
                </button>
              ) : null}

              {canArchive ? (
                <button
                  type="button"
                  onClick={archiveInvoice}
                  disabled={isArchiving}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Archive</span>
                  {isArchiving ? (
                    <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : null}
                  </button>
                ) : null}

              <div className="border-t border-zinc-100 pt-1">
                <ReminderHistoryDialog reminders={reminders} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
