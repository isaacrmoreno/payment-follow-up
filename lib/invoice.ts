import { formatLabel, titleCaseWords } from "@/lib/labels";

export type InvoiceLike = {
  amount_due: string | number | null;
  amount_paid: string | number | null;
  due_date: string | null;
  status: string | null;
  next_follow_up_at?: string | null;
  blocker_reason?: string | null;
};

const statusPriority: Record<string, number> = {
  overdue: 0,
  blocked: 1,
  partial: 2,
  promise_to_pay: 3,
  due: 4,
  sent: 5,
  viewed: 6,
  draft: 7,
  closed: 8,
  paid: 9,
};

export function remainingBalance(invoice: InvoiceLike) {
  return Math.max(0, Number(invoice.amount_due ?? 0) - Number(invoice.amount_paid ?? 0));
}

export function isPastDue(invoice: InvoiceLike) {
  return Boolean(invoice.due_date) && new Date(invoice.due_date as string) < new Date();
}

export function nextActionLabel(invoice: InvoiceLike) {
  if (remainingBalance(invoice) <= 0) {
    return "Close out and archive";
  }

  if ((invoice.status ?? "") === "blocked") {
    return invoice.blocker_reason ? `Follow up on ${invoice.blocker_reason}` : "Clear the blocker";
  }

  if ((invoice.status ?? "") === "partial") {
    return "Chase the remaining balance";
  }

  if ((invoice.status ?? "") === "promise_to_pay") {
    return "Check in on the promised date";
  }

  if (isPastDue(invoice)) {
    return "Send an overdue reminder";
  }

  return "Send the next scheduled reminder";
}

export function prioritizeInvoices<T extends InvoiceLike>(invoices: T[]) {
  return [...invoices].sort((a, b) => {
    const statusDelta = (statusPriority[a.status ?? ""] ?? 99) - (statusPriority[b.status ?? ""] ?? 99);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const followUpA = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Number.POSITIVE_INFINITY;
    const followUpB = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Number.POSITIVE_INFINITY;
    if (followUpA !== followUpB) {
      return followUpA - followUpB;
    }

    return new Date(a.due_date ?? 0).getTime() - new Date(b.due_date ?? 0).getTime();
  });
}

export function statusLabel(status: string | null | undefined) {
  return titleCaseWords(formatLabel(status));
}
