import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { updatePreferencesAction, updateProfileAction } from "@/app/actions";
import { PendingButton } from "@/components/pending-button";

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan")
    .eq("id", user.id)
    .single();
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-zinc-600">
          Keep your business identity and reminder defaults in one place.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={updateProfileAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Business Profile</h2>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Display Name</span>
            <input
              name="full_name"
              defaultValue={profile?.full_name ?? ""}
              placeholder="Payoof"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Account Email</span>
            <input
              value={profile?.email ?? user.email ?? ""}
              disabled
              className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-zinc-500 shadow-sm"
            />
          </label>
          <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
            Your plan is <span className="font-medium text-zinc-900">{profile?.plan ?? "free"}</span>.
          </div>
          <PendingButton
            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            pendingLabel="Saving..."
          >
            Save profile
          </PendingButton>
        </form>

        <form action={updatePreferencesAction} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Reminder Preferences</h2>
            <p className="text-sm text-zinc-500">
              These defaults shape how reminders and invoices are framed.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Business Name</span>
            <input
              name="business_name"
              defaultValue={preferences?.business_name ?? profile?.full_name ?? ""}
              placeholder="Payoof"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Reply-To Email</span>
            <input
              name="reply_to_email"
              type="email"
              defaultValue={preferences?.reply_to_email ?? ""}
              placeholder="hello@contact.payoof.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Timezone</span>
              <input
                name="timezone"
                defaultValue={preferences?.timezone ?? "America/Los_Angeles"}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-700">Follow-Up Interval Days</span>
              <input
                name="follow_up_interval_days"
                type="number"
                min="1"
                max="30"
                step="1"
                defaultValue={preferences?.follow_up_interval_days ?? 3}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Reminder Cadence</span>
            <select
              name="reminder_cadence"
              defaultValue={preferences?.reminder_cadence ?? "manual"}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            >
              <option value="manual">Manual only</option>
              <option value="friendly">Friendly</option>
              <option value="firm">Firm</option>
              <option value="final">Final notice</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700">Invoice Footer</span>
            <textarea
              name="invoice_footer"
              defaultValue={preferences?.invoice_footer ?? ""}
              placeholder="Thanks for your business."
              className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900"
            />
          </label>
          <PendingButton
            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            pendingLabel="Saving preferences..."
          >
            Save preferences
          </PendingButton>
        </form>
      </section>
    </div>
  );
}
