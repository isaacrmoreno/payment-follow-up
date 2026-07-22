"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { deleteClientAction } from "@/app/actions";
import { ClientDialog } from "@/components/client-dialog";
import { useToast } from "@/components/toast";

type ClientActionsProps = {
  client: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
  invoiceCount: number;
};

export function ClientActions({ client, invoiceCount }: ClientActionsProps) {
  const { toast } = useToast();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

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

  function removeClient() {
    if (invoiceCount > 0) {
      toast("Delete the client's invoices first.", "error");
      closeMenu();
      return;
    }

    setIsDeleting(true);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", client.id);
        await deleteClientAction(formData);
        setDeleted(true);
        closeMenu();
        toast("Client deleted.", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Unable to delete client.", "error");
      } finally {
        setIsDeleting(false);
      }
    });
  }

  if (deleted) {
    return null;
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
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setEditOpen(true);
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={removeClient}
                disabled={isDeleting}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Delete</span>
                {isDeleting ? (
                  <span aria-hidden="true" className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                ) : null}
              </button>
            </div>,
            document.body,
          )
        : null}

      <ClientDialog
        client={client}
        title="Edit client"
        hideTrigger
        openOnMount={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
