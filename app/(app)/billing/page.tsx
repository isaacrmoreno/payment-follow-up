export default function BillingPage() {
  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 p-4">
      <h1 className="text-lg font-semibold">Billing</h1>
      <p className="text-sm text-zinc-600">
        Stripe billing for the SaaS plan will connect here next. For now the app
        is wired to support the profile plan field and can be extended with
        Checkout and webhooks.
      </p>
    </section>
  );
}

