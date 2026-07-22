import { createSupabaseServerReadClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { titleCaseWords } from "@/lib/labels";
import { formatPhoneNumber } from "@/lib/phone";
import { ClientActions } from "@/components/client-actions";
import { ClientDialog } from "@/components/client-dialog";

export default async function ClientsPage() {
  await requireUser();
  const supabase = await createSupabaseServerReadClient();
  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*, clients(name,email)")
      .order("due_date", { ascending: true }),
  ]);

  const invoiceCounts = (invoices ?? []).reduce<Record<string, number>>((counts, invoice) => {
    if (!invoice.client_id) {
      return counts;
    }

    counts[invoice.client_id] = (counts[invoice.client_id] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="space-y-8">
      <section
        id="tour-clients-header"
        className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <h1 className="text-lg font-semibold">Clients</h1>
        <div id="tour-add-client">
          <ClientDialog />
        </div>
      </section>

      <section id="tour-clients-list" className="space-y-3">
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm md:hidden">
          <div className="divide-y divide-zinc-200">
            {(clients ?? []).map((client) => (
              <article key={client.id} className="bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-zinc-950">{titleCaseWords(client.name)}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{client.email ?? "No email"}</p>
                  </div>
                  <ClientActions client={client} invoiceCount={invoiceCounts[client.id] ?? 0} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-zinc-600">
                  <div>
                    <dt className="font-medium text-zinc-900">Invoices</dt>
                    <dd>{invoiceCounts[client.id] ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Phone</dt>
                    <dd>{client.phone ? formatPhoneNumber(client.phone) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Notes</dt>
                    <dd className="line-clamp-3">{client.notes ?? "-"}</dd>
                  </div>
                </dl>
              </article>
            ))}
            {!clients?.length ? (
              <div className="p-4 text-sm text-zinc-500">
                No clients yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Invoices</th>
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
                  <td className="px-4 py-3">{invoiceCounts[client.id] ?? 0}</td>
                  <td className="px-4 py-3">{client.phone ? formatPhoneNumber(client.phone) : "-"}</td>
                  <td className="px-4 py-3">{client.notes ?? "-"}</td>
                  <td className="px-4 py-3">
                    <ClientActions client={client} invoiceCount={invoiceCounts[client.id] ?? 0} />
                  </td>
                </tr>
              ))}
              {!clients?.length ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
