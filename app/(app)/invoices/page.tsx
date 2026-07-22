import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  markInvoicePaidAction,
  sendReminderAction,
  upsertInvoiceAction,
} from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { DigitsInput } from "@/components/digits-input";
import { titleCaseWords } from "@/lib/format";

export default async function InvoicesPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("id,name").order("name"),
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .order("due_date", { ascending: true }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <form action={upsertInvoiceAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Add invoice</h1>
          <p className="text-sm text-zinc-500">Keep invoice details tight and ready for follow-up.</p>
        </div>
        <input name="id" type="hidden" />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Client</span>
          <select name="client_id" required className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900">
            <option value="">Select client</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {titleCaseWords(client.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <input name="title" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Invoice Number</span>
          <DigitsInput
            name="invoice_number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1001"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Amount Due</span>
            <input name="amount_due" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Amount Paid</span>
            <input name="amount_paid" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Due Date</span>
            <input name="due_date" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Status</span>
            <select name="status" defaultValue="overdue" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="promise_to_pay">Promise to pay</option>
              <option value="blocked">Blocked</option>
              <option value="paid">Paid</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">External Payment Link</span>
          <input name="external_reference" placeholder="https://..." className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Blocker Reason</span>
          <input name="blocker_reason" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Next Follow Up</span>
          <input
            name="next_follow_up_at"
            type="datetime-local"
            step="900"
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
          />
          <p className="text-xs text-zinc-500">Pick the next reminder date and time. 15-minute increments feel easier to scan.</p>
        </label>
        <PendingButton
          className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          pendingLabel="Saving invoice..."
        >
          Save invoice
        </PendingButton>
      </form>

      <div className="space-y-4">
        <div className="grid gap-3 md:hidden">
          {(invoices ?? []).map((invoice) => (
            <article key={invoice.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-zinc-950">{invoice.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{titleCaseWords(invoice.clients?.name ?? "Unknown")}</p>
                </div>
                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {invoice.status.replaceAll("_", " ")}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-600">
                <div>
                  <dt className="font-medium text-zinc-900">Due</dt>
                  <dd>{invoice.due_date}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-900">Link</dt>
                  <dd>
                    {invoice.external_reference ? (
                      <a className="inline-flex items-center rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950" href={invoice.external_reference}>
                        Open
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid gap-2">
                <form action={markInvoicePaidAction}>
                  <input name="id" type="hidden" value={invoice.id} />
                  <input name="amount_due" type="hidden" value={invoice.amount_due} />
                  <PendingButton
                    className="inline-flex w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                    pendingLabel="Saving..."
                  >
                    Mark paid
                  </PendingButton>
                </form>
                <form action={sendReminderAction}>
                  <input name="invoice_id" type="hidden" value={invoice.id} />
                  <PendingButton
                    className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    pendingLabel="Sending..."
                  >
                    Send reminder
                  </PendingButton>
                </form>
              </div>
            </article>
          ))}
          {!invoices?.length ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm">
              No invoices yet.
            </div>
          ) : null}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
              <tbody>
                {(invoices ?? []).map((invoice) => (
                  <tr key={invoice.id} className="border-t border-zinc-200">
                    <td className="px-4 py-3">{titleCaseWords(invoice.clients?.name ?? "-")}</td>
                    <td className="px-4 py-3">{invoice.title}</td>
                    <td className="px-4 py-3">{invoice.due_date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {invoice.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.external_reference ? (
                        <a className="inline-flex items-center rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950" href={invoice.external_reference}>
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <form action={markInvoicePaidAction}>
                          <input name="id" type="hidden" value={invoice.id} />
                          <input name="amount_due" type="hidden" value={invoice.amount_due} />
                          <PendingButton
                            className="inline-flex w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                            pendingLabel="Saving..."
                          >
                            Mark paid
                          </PendingButton>
                        </form>
                        <form action={sendReminderAction}>
                          <input name="invoice_id" type="hidden" value={invoice.id} />
                          <PendingButton
                            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                            pendingLabel="Sending..."
                          >
                            Send reminder
                          </PendingButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {!invoices?.length ? (
                  <tr>
                    <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                      No invoices yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
