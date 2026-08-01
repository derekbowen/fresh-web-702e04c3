// Shared metadata for the host WELCOME drip — new-signups-only, first 30 days.
// (Trimmed from the old 14-touch weekly sequence: the weekly cadence to ALL
// hosts is now the "Learn with Derek" academy. This drip is a short onboarding
// welcome for brand-new signups only, and it INCLUDES the academy-promo touch
// as the enrollment funnel. A host in this drip is excluded from the academy
// that week — see academy-weekly dedupe — so nobody gets drip + academy together.)
//
// Each step has a static HTML file (in this folder) with {{first_name}} and
// {{unsubscribe_url}} placeholders, plus a subject line.

export type HostStep = {
  step: number;
  /** kind = filename stem under host-drip/, e.g. "01-lower-fees" */
  kind: string;
  subject: string;
  /** Days from baseAt (signup) when this email should send. */
  day: number;
};

export const HOST_SEQUENCE: HostStep[] = [
  {
    step: 0,
    kind: "01-lower-fees",
    subject: "Welcome - you're keeping 90% on every Pool Rental Near Me booking",
    day: 0,
  },
  {
    step: 1,
    kind: "04-help",
    subject: "Stuck getting started? I'll help you personally",
    day: 3,
  },
  {
    step: 2,
    kind: "03-elearning",
    subject: "Free Pool Host Academy: the playbook top hosts use",
    day: 7,
  },
  {
    step: 3,
    kind: "06-listing-tuneup",
    subject: "Want me to tune up your pool listing? Free, takes 10 min",
    day: 14,
  },
  {
    step: 4,
    kind: "05-share-link",
    subject: "Got customers asking? Share your booking link, keep 90%",
    day: 30,
  },
  {
    // One-off broadcast (not part of the welcome cadence). Day is unused
    // because rows are scheduled manually from the admin broadcast button.
    step: 99,
    kind: "15-share-link-profits",
    subject: "Keep more of your profits \ud83c\udf0a Share your link with returning guests",
    day: 0,
  },
];
