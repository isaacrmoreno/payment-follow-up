import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { deleteClientAction, upsertClientAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";

export default async function ClientsPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form action={upsertClientAction} className="space-y-4 rounded-lg border border-zinc-200 p-4">
        <h1 className="text-lg font-semibold">Add client</h1>
        <input name="id" type="hidden" />
        <label className="block space-y-2">
          <span className="text-sm">Name</span>
          <input name="name" required className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Email</span>
          <input name="email" type="email" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Phone</span>
          <input name="phone" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm">Notes</span>
          <textarea name="notes" className="min-h-28 w-full rounded-md border border-zinc-300 px-3 py-2" />
        </label>
        <PendingButton
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          pendingLabel="Saving client..."
        >
          Save client
        </PendingButton>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200">
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
                <td className="px-4 py-3">{client.name}</td>
                <td className="px-4 py-3">{client.email ?? "-"}</td>
                <td className="px-4 py-3">{client.phone ?? "-"}</td>
                <td className="px-4 py-3">{client.notes ?? "-"}</td>
                <td className="px-4 py-3">
                  <form action={deleteClientAction}>
                    <input name="id" type="hidden" value={client.id} />
                    <PendingButton
                      className="text-sm underline disabled:opacity-50"
                      pendingLabel="Deleting..."
                    >
                      Delete
                    </PendingButton>
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
  );
}
