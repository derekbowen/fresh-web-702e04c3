/** Pre-written coaching scripts an affiliate can send to a host they recruited. */
export type CoachingTemplate = {
  id: string;
  label: string;
  channel: "nextdoor" | "facebook" | "text" | "instagram";
  body: string;
};

export const COACHING_TEMPLATES: CoachingTemplate[] = [
  {
    id: "nextdoor-post",
    label: "Nextdoor post",
    channel: "nextdoor",
    body: `Hey neighbors — I just opened up my backyard pool for private hourly bookings on Pool Rental Near Me. $60/hour, fully insured, families only. If you're hunting for a way to cool off without the public-pool chaos, here's my listing: [paste your listing URL]`,
  },
  {
    id: "facebook-group",
    label: "Facebook group post",
    channel: "facebook",
    body: `Just got my pool listed for private hourly rentals through Pool Rental Near Me. It's like Airbnb but for pools — I keep 90% of every booking and the $2M liability insurance is included. Book your group, a kid's party, or a date night here: [paste your listing URL]`,
  },
  {
    id: "text-a-friend",
    label: "Text a friend",
    channel: "text",
    body: `Hey! Just opened my pool for private hourly bookings. $60/hr, two-hour minimum. If you know anyone with kids or want to do a pool party, send them my way: [paste your listing URL]`,
  },
  {
    id: "instagram-story",
    label: "Instagram story script",
    channel: "instagram",
    body: `Story 1: photo of pool + "My backyard is now bookable by the hour 👇" + swipe-up sticker. Story 2: "$60/hr, fully insured, book here ↓" with link sticker pointing to your listing URL.`,
  },
];
