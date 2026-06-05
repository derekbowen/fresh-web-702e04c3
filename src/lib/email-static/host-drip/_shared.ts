// Shared metadata for the 7-touch host drip sequence.
// Each step has a static HTML file (in this folder) with {{first_name}} and
// {{unsubscribe_url}} placeholders, plus a subject line.

export type HostStep = {
  step: number;
  /** kind = filename stem under host-drip/, e.g. "01-lower-fees" */
  kind: string;
  subject: string;
  /** Days from baseAt when this email should send. */
  day: number;
};

export const HOST_SEQUENCE: HostStep[] = [
  {
    step: 0,
    kind: "01-lower-fees",
    subject: "Reminder: you're keeping 90% on every Pool Rental Near Me booking",
    day: 0,
  },
  {
    step: 1,
    kind: "02-spanish-pages",
    subject: "Your pool, en español: we just launched Spanish pages",
    day: 7,
  },
  {
    step: 2,
    kind: "03-elearning",
    subject: "Free Pool Host Academy: the playbook top hosts use",
    day: 14,
  },
  {
    step: 3,
    kind: "04-help",
    subject: "Stuck on bookings? I'll help you personally",
    day: 21,
  },
  {
    step: 4,
    kind: "05-share-link",
    subject: "Got customers asking? Share your booking link, keep 90%",
    day: 28,
  },
  {
    step: 5,
    kind: "06-listing-tuneup",
    subject: "Want me to tune up your pool listing? Free, takes 10 min",
    day: 35,
  },
  {
    step: 6,
    kind: "07-public-pools",
    subject: "Public pool network: free traffic into your listing",
    day: 42,
  },
];
