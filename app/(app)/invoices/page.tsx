import Link from "next/link";
import { InvoiceActions } from "@/components/invoice-actions";
import { InvoiceDialog } from "@/components/invoice-dialog";
import type { ReminderHistoryItem } from "@/components/reminder-history-dialog";
import { requireUser } from "@/lib/auth";
import { formatInvoiceDate } from "@/lib/date";
import { prioritizeInvoices, remainingBalance, statusLabel } from "@/lib/invoice";
import { titleCaseWords } from "@/lib/labels";
import { ensureDefaultReminderTemplate, renderReminderContent } from "@/lib/reminders";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InvoicesPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();
  const [{ data: clients }, { data: invoices }, { data: reminders }, { data: loadedTemplates }] = await Promise.all([
    supabase.from("clients").select("id,name").order("name"),
    supabase
      .from("invoices")
      .select("*, clients(name), reminder_templates(name,subject,body)")
      .order("due_date", { ascending: true }),
    supabase
      .from("reminders")
      .select("id,invoice_id,sent_at,subject,delivery_status")
      .order("sent_at", { ascending: false }),
    supabase.from("reminder_templates").select("id,name,subject,body,is_default").order("created_at", { ascending: false }),
  ]);
  const templates =
    loadedTemplates && loadedTemplates.length
      ? loadedTemplates
      : [await ensureDefaultReminderTemplate(supabase, user.id)];

  const remindersByInvoice = (reminders ?? []).reduce<Record<string, ReminderHistoryItem[]>>((groups, reminder) => {
    const invoiceId = reminder.invoice_id;
    if (!invoiceId) {
      return groups;
    }

    if (!groups[invoiceId]) {
      groups[invoiceId] = [];
    }

    groups[invoiceId].push({
      id: reminder.id,
      sent_at: reminder.sent_at,
      subject: reminder.subject,
      delivery_status: reminder.delivery_status,
    });
    return groups;
  }, {});

  const prioritizedInvoices = prioritizeInvoices(invoices ?? []).map((invoice) => {
    const remaining = remainingBalance(invoice);
    const dueDate = formatInvoiceDate(invoice.due_date);
    const clientName = titleCaseWords(invoice.clients?.name ?? "there");
    const reminderPreview = renderReminderContent(invoice.reminder_templates, {
      clientName,
      invoiceTitle: invoice.title,
      amountDue: `$${remaining.toFixed(2)}`,
      dueDate,
      paymentLink: invoice.external_reference || null,
    });

    return {
      ...invoice,
      remaining,
      reminders: remindersByInvoice[invoice.id] ?? [],
      reminderPreview,
      previewMeta: {
        clientName,
        dueDate,
        amountDue: `$${remaining.toFixed(2)}`,
        paymentLink: invoice.external_reference || null,
      },
    };
  });

  const selectedFilter = params.status ?? "open";
  const filteredInvoices = prioritizedInvoices.filter((invoice) => {
    if (selectedFilter === "all") {
      return true;
    }

    if (selectedFilter === "paid") {
      return invoice.status === "paid";
    }

    if (selectedFilter === "closed") {
      return invoice.status === "closed";
    }

    return invoice.status !== "paid" && invoice.status !== "closed";
  });

  const filters = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "paid", label: "Paid" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Invoices</h1>
        <InvoiceDialog clients={clients ?? []} templates={templates ?? []} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Link
              key={filter.id}
              href={filter.id === "open" ? "/invoices" : `/invoices?status=${filter.id}`}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition",
                selectedFilter === filter.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-900 hover:text-zinc-900",
              ].join(" ")}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {filteredInvoices.length ? (
          <div className="grid gap-2.5 md:hidden">
            {filteredInvoices.map((invoice) => (
              <article key={invoice.id} className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-950">{invoice.title}</h3>
                    <p className="mt-0.5 text-sm text-zinc-600">{titleCaseWords(invoice.clients?.name ?? "Unknown")}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {statusLabel(invoice.status)}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-zinc-600">
                  <div>
                    <dt className="font-medium text-zinc-900">Due</dt>
                    <dd>{invoice.previewMeta.dueDate}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Remaining</dt>
                    <dd>{invoice.previewMeta.amountDue}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900">Reminders</dt>
                    <dd>{invoice.reminders.length}</dd>
                  </div>
                </dl>

                <div className="mt-3">
                  <InvoiceActions
                    invoiceId={invoice.id}
                    amountDue={invoice.amount_due}
                    initialStatus={invoice.status}
                    reminders={invoice.reminders}
                    reminderPreview={{
                      ...invoice.previewMeta,
                      subject: invoice.reminderPreview.subject,
                      body: invoice.reminderPreview.body,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
            {selectedFilter === "open"
              ? "No open invoices yet. Add one when you're ready."
              : `No ${selectedFilter} invoices right now.`}
          </div>
        )}

        {filteredInvoices.length ? (
          <div className="hidden rounded-md border border-zinc-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto rounded-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Remaining</th>
                    <th className="px-4 py-3">Reminders</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-zinc-200">
                      <td className="px-4 py-3">{titleCaseWords(invoice.clients?.name ?? "-")}</td>
                      <td className="px-4 py-3">{invoice.title}</td>
                      <td className="px-4 py-3">{invoice.previewMeta.dueDate}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {statusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{invoice.previewMeta.amountDue}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {invoice.reminders.length} reminder{invoice.reminders.length === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <InvoiceActions
                          invoiceId={invoice.id}
                          amountDue={invoice.amount_due}
                          initialStatus={invoice.status}
                          reminders={invoice.reminders}
                          reminderPreview={{
                            ...invoice.previewMeta,
                            subject: invoice.reminderPreview.subject,
                            body: invoice.reminderPreview.body,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
