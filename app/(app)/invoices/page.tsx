import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  markInvoicePaidAction,
  sendReminderAction,
  upsertInvoiceAction,
} from "@/app/actions";
import { PendingButton } from "@/components/pending-button";

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
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form action={upsertInvoiceAction} className="space-y-4 rounded-lg border border-zinc-200 p-4">
        <h1 className="text-lg font-semibold">Add invoice</h1>
        <input name="id" type="hidden" />
        <label className="block space-y-2">
          <span className="text-sm">Client</span>
          <select name="client_id" required className="w-full rounded-md border border-zinc-300 px-3 py-2">
            <option value="">Select client</option>
            {(clients ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Title</span>
          <input name="title" required className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Invoice number</span>
          <input
            name="invoice_number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1001"
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm">Amount due</span>
            <input name="amount_due" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm">Amount paid</span>
            <input name="amount_paid" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm">Due date</span>
            <input name="due_date" type="date" required className="w-full rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm">Status</span>
            <select name="status" defaultValue="overdue" className="w-full rounded-md border border-zinc-300 px-3 py-2">
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="viewed">viewed</option>
              <option value="due">due</option>
              <option value="overdue">overdue</option>
              <option value="partial">partial</option>
              <option value="promise_to_pay">promise_to_pay</option>
              <option value="blocked">blocked</option>
              <option value="paid">paid</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm">External payment link</span>
          <input name="external_reference" placeholder="https://..." className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Blocker reason</span>
          <input name="blocker_reason" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Next follow-up</span>
          <input name="next_follow_up_at" type="datetime-local" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <PendingButton
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          pendingLabel="Saving invoice..."
        >
          Save invoice
        </PendingButton>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((invoice) => (
              <tr key={invoice.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">{invoice.clients?.name ?? "-"}</td>
                <td className="px-4 py-3">{invoice.title}</td>
                <td className="px-4 py-3">{invoice.due_date}</td>
                <td className="px-4 py-3">{invoice.status}</td>
                <td className="px-4 py-3">
                  {invoice.external_reference ? (
                    <a className="underline" href={invoice.external_reference}>
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={markInvoicePaidAction}>
                    <input name="id" type="hidden" value={invoice.id} />
                    <input name="amount_due" type="hidden" value={invoice.amount_due} />
                    <PendingButton
                      className="text-sm underline disabled:opacity-50"
                      pendingLabel="Saving..."
                    >
                      Mark paid
                    </PendingButton>
                  </form>
                  <form action={sendReminderAction} className="mt-2">
                    <input name="invoice_id" type="hidden" value={invoice.id} />
                    <PendingButton
                      className="text-sm underline disabled:opacity-50"
                      pendingLabel="Sending..."
                    >
                      Send reminder
                    </PendingButton>
                  </form>
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
  );
}
