export default function BillingPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <h1 className="text-lg font-semibold">Billing</h1>
        <p className="text-sm text-zinc-600">
          This is where Pro access will live. The next step is Stripe Checkout
          plus a webhook that flips the user into a paid plan.
        </p>
      </section>
      <section className="rounded-lg border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">What we still need</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>Stripe product and price for Pro</li>
          <li>Checkout session route</li>
          <li>Webhook to mark the user as paid in Supabase</li>
          <li>Customer portal link for plan changes and cancelation</li>
        </ul>
      </section>
    </div>
  );
}
