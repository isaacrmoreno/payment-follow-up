# Payment Follow-Up MVP Spec

Lean web app for contractors and small operators who need to get paid faster without becoming a full invoicing platform.

## Product Goal

Help users recover overdue payments by making follow-up simple, timely, and low-friction.

This is not a replacement for Stripe, QuickBooks, or a full accounting suite. It works alongside existing tools and focuses on the narrow job of payment follow-up.

## What Reddit Says The Pain Is

The most common complaints show up in contractor, freelancer, and small-business discussions:

| Pain point | What people are saying | Product response |
| --- | --- | --- |
| Late payments are common and awkward to chase | People describe late payment follow-up as frustrating, universal, and often too polite to be effective. | Give them a structured follow-up sequence with firmer templates and reminders. |
| Invoices get stuck because of internal bureaucracy | Some invoices cannot move until a PO number, approval, or internal process clears. | Track invoice blockers and make the next follow-up action obvious. |
| Follow-up is manual and time-consuming | Users are already juggling email and manual reminders. | Reduce follow-up to a few clicks, not a custom workflow. |
| Partial payment and balance confusion | People need to know what was paid, what remains, and what to do next. | Show payment status clearly and keep a remaining-balance state. |
| Payment issues are really communication issues | A lot of money gets delayed because the client forgot, routed it wrong, or needs a nudge. | Send polite, direct, scheduled reminders by email. |
| Existing tools feel too broad | People do not want a giant invoicing app just to collect money they already earned. | Keep the product narrow and lightweight. |

Reddit sources used:

- [Late payments are frustrating and the number 1 pain point for creators](https://www.reddit.com/r/influencermarketing/comments/1ug8j88/late_payments_are_frustrating_and_the_number_1/)
- [I spent 3 hours on email last Tuesday & developers sys not built anything for emails](https://www.reddit.com/r/SaaS/comments/1u2uj2t/i_spent_3_hours_on_email_last_tuesday_developers/)
- [Do I continue working without PO number / pay?](https://old.reddit.com/user/Unique_Anything_6617/)
- [Held hostage by a high performer](https://www.reddit.com/r/smallbusiness/comments/1srcglq/held_hostage_by_a_high_performer/)

## Positioning

### One-line pitch

Get paid faster with dead-simple payment follow-up for contractors.

### Core promise

- Track who owes you money.
- Know exactly when to follow up.
- Send the right message at the right time.
- Keep the workflow fast and boring.

### Not in scope

- Full invoicing platform
- Accounting
- Tax prep
- Mobile app
- Marketplace
- Complex CRM
- Custom automation builder

## MVP User Flow

1. User signs in with magic email link.
2. User connects Stripe for billing the product.
3. User adds clients and overdue invoices manually or by CSV.
4. User selects a follow-up cadence.
5. App sends reminders and shows status.
6. User marks an invoice as paid, partially paid, disputed, or blocked.
7. App stops reminders when the invoice is resolved.

## Product Rules

- Web only.
- Minimal UI.
- Fast first load.
- Fewer clicks than email.
- Default to plain language and direct actions.
- Focus on getting paid, not on managing the entire job.

## Free Plan

The free plan should feel useful, but limited enough to create a natural upgrade path.

Suggested free plan:

- Up to 3 active invoices
- Manual reminder templates
- Basic payment status tracking
- Magic email login
- Single workspace
- Basic dashboard

## Pro Plan

Pro should unlock the features that save time and improve collection rates.

Suggested pro plan:

- Unlimited active invoices
- Automated reminder sequences
- Custom reminder cadence
- Partial payment tracking
- Blocker tags like `PO missing`, `approval pending`, `wrong recipient`, `promise to pay`
- Reminder history and delivery log
- CSV import
- Saved templates
- Stripe-connected billing for the SaaS product

## Why These Features Belong In Pro

These are the features that create recurring value and reduce manual follow-up time:

- Automation
- Unlimited volume
- Partial payment handling
- Import tools
- History and logging
- More advanced statuses

## Minimal UI

Keep the app to a small number of screens:

| Screen | Purpose |
| --- | --- |
| Sign in | Magic link authentication only |
| Dashboard | Show overdue invoices and next follow-up actions |
| Clients | Basic client list |
| Invoices | Create, edit, update status |
| Invoice detail | Timeline, reminders, payment notes, blocker tags |
| Billing | Manage free vs pro plan |
| Settings | Email templates, follow-up cadence, profile |

## Recommended Follow-Up States

Use a small state machine:

- `draft`
- `sent`
- `viewed`
- `due`
- `overdue`
- `partial`
- `promise_to_pay`
- `blocked`
- `paid`
- `closed`

## Recommended Reminder Cadence

Keep this simple:

- Day 0: friendly reminder
- Day 3: short nudge
- Day 7: firmer follow-up
- Day 14: final notice

Users can override the cadence in Pro.

## Supabase Data Model

Use the fewest tables possible while still supporting billing, auth, follow-up, and status tracking.

### 1. `profiles`

Stores the user account record linked to Supabase auth.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, matches `auth.users.id` |
| `email` | text | Cached for display |
| `full_name` | text | Optional |
| `stripe_customer_id` | text | Needed for SaaS billing |
| `plan` | text | `free` or `pro` |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

### 2. `clients`

Stores the people or companies who owe money.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner, references `profiles.id` |
| `name` | text | Client or company name |
| `email` | text | Primary reminder destination |
| `phone` | text | Optional |
| `notes` | text | Internal notes |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

### 3. `invoices`

Tracks the payment due.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner, references `profiles.id` |
| `client_id` | uuid | References `clients.id` |
| `invoice_number` | text | Human-friendly identifier |
| `title` | text | Short job or project name |
| `amount_due` | numeric(12,2) | Original amount |
| `amount_paid` | numeric(12,2) | Defaults to 0 |
| `currency` | text | Default `usd` |
| `due_date` | date | When payment was due |
| `status` | text | One of the follow-up states |
| `blocker_reason` | text | Optional explanation |
| `last_contacted_at` | timestamptz | Most recent reminder |
| `next_follow_up_at` | timestamptz | What the UI should surface |
| `external_reference` | text | Optional link to QuickBooks, Stripe invoice, or other system |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

### 4. `reminders`

Logs reminder attempts and outcomes.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner, references `profiles.id` |
| `invoice_id` | uuid | References `invoices.id` |
| `channel` | text | `email` only for MVP |
| `template_name` | text | Example: `friendly`, `firm`, `final` |
| `subject` | text | Rendered subject line |
| `body` | text | Rendered message body |
| `sent_at` | timestamptz | When it was sent |
| `delivery_status` | text | `queued`, `sent`, `failed` |
| `provider_message_id` | text | Optional email provider id |
| `error_message` | text | Optional failure text |

### 5. `payment_events`

Tracks payments and partial payments.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner, references `profiles.id` |
| `invoice_id` | uuid | References `invoices.id` |
| `event_type` | text | `partial_payment`, `full_payment`, `refund`, `adjustment` |
| `amount` | numeric(12,2) | Amount involved |
| `currency` | text | Default `usd` |
| `event_date` | timestamptz | When it happened |
| `note` | text | Optional note |
| `source` | text | `manual`, `stripe`, `external` |

### 6. `billing_subscriptions`

Tracks the app subscription for the user.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner, references `profiles.id` |
| `stripe_subscription_id` | text | Stripe subscription identifier |
| `stripe_price_id` | text | Which plan was purchased |
| `status` | text | `trialing`, `active`, `past_due`, `canceled` |
| `current_period_end` | timestamptz | Billing period end |
| `cancel_at_period_end` | boolean | Default false |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Default now |

## Optional Later Tables

Only add these if the product proves demand:

- `invoice_attachments`
- `client_contacts`
- `webhook_events`
- `template_versions`
- `team_members`

## Stripe Setup

Use Stripe for billing only:

- Checkout for subscription purchase
- Customer portal for plan changes
- Webhooks to update `billing_subscriptions`

Do not build payments processing into the product unless it is directly needed for follow-up status.

## Authentication

Use Supabase auth with magic email links only.

Benefits:

- No passwords
- Lower friction
- Better fit for contractors who just want to get in and get paid

## Performance Principles

- Server-render the dashboard by default.
- Keep client-side JavaScript small.
- Avoid heavy animation.
- Avoid giant dependency chains.
- Cache aggressively where safe.
- Use simple tables and straightforward queries.
- Prefer predictable UI over fancy UI.

## Implementation Notes

- Use Next.js for the frontend and server actions/API routes only where needed.
- Use Supabase for auth, database, and row-level security.
- Use Stripe for SaaS billing.
- Deploy on Vercel.
- Keep everything browser-first.

## Success Metric

The app succeeds if a user can:

- Sign in in under a minute
- Add an overdue invoice in under 30 seconds
- Send a follow-up in one click
- See what still needs chasing without digging through email
- Get paid faster than they would by doing it manually
