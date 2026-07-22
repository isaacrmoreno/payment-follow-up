import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { deleteClientAction, upsertClientAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";
import { PhoneInput } from "@/components/phone-input";
import { titleCaseWords } from "@/lib/format";

export default async function ClientsPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false }),
    supabase.from("invoices").select("client_id"),
  ]);
  const invoiceCounts = (invoices ?? []).reduce<Record<string, number>>((counts, invoice) => {
    if (!invoice.client_id) {
      return counts;
    }
    counts[invoice.client_id] = (counts[invoice.client_id] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form action={upsertClientAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Add client</h1>
        <input name="id" type="hidden" />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Name</span>
          <input name="name" required autoComplete="name" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input name="email" type="email" autoComplete="email" inputMode="email" placeholder="name@company.com" className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Phone</span>
          <PhoneInput
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(555) 123-4567"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-zinc-700">Notes</span>
          <textarea name="notes" className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900" />
        </label>
        <PendingButton
          className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          pendingLabel="Saving client..."
        >
          Save client
        </PendingButton>
      </form>

      <div className="space-y-4">
        <div className="grid gap-3 md:hidden">
          {(clients ?? []).map((client) => (
            <article key={client.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-zinc-950">{titleCaseWords(client.name)}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{client.email ?? "No email"}</p>
                </div>
                <form action={deleteClientAction}>
                  <input name="id" type="hidden" value={client.id} />
                  <PendingButton
                    disabled={(invoiceCounts[client.id] ?? 0) > 0}
                    className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                    pendingLabel="Deleting..."
                  >
                    {(invoiceCounts[client.id] ?? 0) > 0 ? "Invoices Attached" : "Delete"}
                  </PendingButton>
                </form>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-zinc-600">
                <div>
                  <dt className="font-medium text-zinc-900">Phone</dt>
                  <dd>{client.phone ?? "-"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-900">Notes</dt>
                  <dd className="line-clamp-3">{client.notes ?? "-"}</dd>
                </div>
                {(invoiceCounts[client.id] ?? 0) > 0 ? (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {invoiceCounts[client.id]} invoice{invoiceCounts[client.id] === 1 ? "" : "s"} attached. Delete invoices first.
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
          {!clients?.length ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 shadow-sm">
              No clients yet.
            </div>
          ) : null}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map((client) => (
              <tr key={client.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">{titleCaseWords(client.name)}</td>
                <td className="px-4 py-3">{client.email ?? "-"}</td>
                <td className="px-4 py-3">{client.phone ?? "-"}</td>
                <td className="px-4 py-3">{client.notes ?? "-"}</td>
                <td className="px-4 py-3">
                  <form action={deleteClientAction}>
                    <input name="id" type="hidden" value={client.id} />
                  <div className="space-y-2">
                    <PendingButton
                      disabled={(invoiceCounts[client.id] ?? 0) > 0}
                      className="text-sm underline disabled:cursor-not-allowed disabled:opacity-50"
                      pendingLabel="Deleting..."
                    >
                      {(invoiceCounts[client.id] ?? 0) > 0 ? "Invoices Attached" : "Delete"}
                    </PendingButton>
                    {(invoiceCounts[client.id] ?? 0) > 0 ? (
                      <p className="text-xs text-amber-700">
                        Delete invoices first.
                      </p>
                    ) : null}
                  </div>
                </form>
              </td>
            </tr>
            ))}
            {!clients?.length ? (
              <tr>
                <td className="px-4 py-4 text-zinc-500" colSpan={5}>
                  No clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
