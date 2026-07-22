import * as React from "react";
import {
  renderReminderEmailHtml as renderTemplateReminderEmailHtml,
  type ReminderTemplateLike,
  type ReminderTemplateVariables,
} from "@/lib/reminders";

type ReminderEmailProps = {
  clientName: string;
  invoiceTitle: string;
  amountDue: string;
  dueDate: string;
  paymentLink?: string | null;
  template?: ReminderTemplateLike | null;
};

export function ReminderEmail({
  clientName,
  invoiceTitle,
  amountDue,
  dueDate,
  paymentLink,
}: ReminderEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 20 }}>Payment reminder</h1>
      <p>Hi {clientName},</p>
      <p>
        This is a quick reminder that <strong>{invoiceTitle}</strong> is still
        open for {amountDue}.
      </p>
      <p>Due date: {dueDate}</p>
      {paymentLink ? (
        <p>
          Pay here: <a href={paymentLink}>{paymentLink}</a>
        </p>
      ) : null}
      <p>Thanks.</p>
    </div>
  );
}

export function renderReminderEmailHtml({
  clientName,
  invoiceTitle,
  amountDue,
  dueDate,
  paymentLink,
  template,
}: ReminderEmailProps) {
  const variables: ReminderTemplateVariables = {
    clientName,
    invoiceTitle,
    amountDue,
    dueDate,
    paymentLink,
  };

  return renderTemplateReminderEmailHtml(template, variables);
}
