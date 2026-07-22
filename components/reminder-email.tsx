import * as React from "react";

type ReminderEmailProps = {
  clientName: string;
  invoiceTitle: string;
  amountDue: string;
  paymentLink?: string | null;
};

export function ReminderEmail({
  clientName,
  invoiceTitle,
  amountDue,
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
  paymentLink,
}: ReminderEmailProps) {
  const linkHtml = paymentLink
    ? `<p>Pay here: <a href="${paymentLink}">${paymentLink}</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1 style="font-size: 20px;">Payment reminder</h1>
      <p>Hi ${clientName},</p>
      <p>This is a quick reminder that <strong>${invoiceTitle}</strong> is still open for ${amountDue}.</p>
      ${linkHtml}
      <p>Thanks.</p>
    </div>
  `;
}
