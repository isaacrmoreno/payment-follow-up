import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: clients }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*, clients(name,email)")
      .order("due_date", { ascending: true }),
  ]);

  const overdue = (invoices ?? []).filter((invoice) => {
    const amountLeft = Number(invoice.amount_due) - Number(invoice.amount_paid);
    return amountLeft > 0 && new Date(invoice.due_date) < new Date();
  });

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Active clients</p>
          <p className="mt-2 text-3xl font-semibold">{clients?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Invoices</p>
          <p className="mt-2 text-3xl font-semibold">{invoices?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Overdue</p>
          <p className="mt-2 text-3xl font-semibold">{overdue.length}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Next follow-ups</h2>
          <Link className="text-sm underline" href="/invoices">
            Manage invoices
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment link</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((invoice) => (
                <tr key={invoice.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3">{invoice.clients?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3">{invoice.title}</td>
                  <td className="px-4 py-3">{invoice.due_date}</td>
                  <td className="px-4 py-3">{invoice.status}</td>
                  <td className="px-4 py-3">
                    {invoice.external_reference ? (
                      <a className="underline" href={invoice.external_reference}>
                        Open
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </td>
                </tr>
              ))}
              {!invoices?.length ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={5}>
                    Add your first client and invoice to get started.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">Current user</h2>
        <p className="mt-2 text-sm text-zinc-600">{user.email}</p>
      </section>
    </div>
  );
}
