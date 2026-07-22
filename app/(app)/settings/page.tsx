export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-zinc-600">
          The MVP keeps settings intentionally small. We can expand from here
          once the core reminder loop is stable.
        </p>
      </section>
      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Planned settings</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>Reminder cadence defaults</li>
          <li>Email sender and reply-to preferences</li>
          <li>Business hours for follow-up sending</li>
          <li>Invoice status labels and follow-up templates</li>
        </ul>
      </section>
    </div>
  );
}
