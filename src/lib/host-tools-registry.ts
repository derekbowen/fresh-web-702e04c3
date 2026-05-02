// Static metadata about the 56 host tools used by the index UI and detail pages.
// The DB has the same data for SSR, but this registry powers icons and grouping.

export type ToolCategory =
  | "Calculator"
  | "Generator"
  | "Planner"
  | "Checklist"
  | "AI"
  | "Guide"
  | "Community";

export interface ToolMeta {
  slug: string;
  title: string;
  summary: string;
  category: ToolCategory;
  icon: string;
  external?: string; // if set, "Open" links here instead of /host-tools/$slug
}

export const TOOLS: ToolMeta[] = [
  { slug: "pool-rental-earnings-calculator", title: "Pool Rental Earnings Calculator", summary: "Advanced income estimator with amenities, location & charts", category: "Calculator", icon: "dollar" },
  { slug: "pool-earnings", title: "Pool Earnings Calculator", summary: "Quick estimate of pool rental income", category: "Calculator", icon: "dollar" },
  { slug: "pool-party-pricing", title: "Pool Party Pricing Calculator", summary: "Figure out the right price for pool parties", category: "Calculator", icon: "party" },
  { slug: "pool-insurance", title: "Pool Insurance Estimator", summary: "Estimate pool rental insurance costs", category: "Calculator", icon: "shield" },
  { slug: "pool-capacity", title: "Pool Capacity Calculator", summary: "How many guests fit in your pool", category: "Calculator", icon: "users" },
  { slug: "pool-break-even", title: "Pool Break-Even Calculator", summary: "When does your pool pay for itself?", category: "Calculator", icon: "target" },
  { slug: "pool-roi-calculator", title: "Pool ROI Calculator", summary: "Return on investment for pool ownership", category: "Calculator", icon: "trending" },
  { slug: "pool-cost-calculator", title: "How Much Does a Pool Cost?", summary: "Total pool cost calculator with installation, maintenance & ROI", category: "Calculator", icon: "dollar" },
  { slug: "private-pool-pricing-calculator", title: "Private Pool Pricing", summary: "Pricing for private & adult-only bookings", category: "Calculator", icon: "lock" },
  { slug: "pool-heating-cost", title: "Pool Heating Cost Calculator", summary: "Cost to heat your pool by heater type", category: "Calculator", icon: "flame" },
  { slug: "pool-maintenance-cost", title: "Pool Maintenance Cost Calculator", summary: "Monthly maintenance cost estimates", category: "Calculator", icon: "wrench" },
  { slug: "pool-chemical-cost", title: "Pool Chemical Cost Calculator", summary: "Monthly chemical cost breakdown", category: "Calculator", icon: "flask" },
  { slug: "pool-water-usage", title: "Pool Water Usage Calculator", summary: "Water volume and cost estimates", category: "Calculator", icon: "droplet" },
  { slug: "pool-pump-cost-calculator", title: "Pool Pump Energy Cost", summary: "Electricity cost to run your pool pump", category: "Calculator", icon: "zap" },
  { slug: "pool-fill-cost-calculator", title: "Pool Fill Cost Calculator", summary: "Cost and time to fill your pool", category: "Calculator", icon: "droplet" },
  { slug: "pool-heating-time-calculator", title: "Pool Heating Time Calculator", summary: "How long to heat your pool", category: "Calculator", icon: "flame" },
  { slug: "pool-evaporation-calculator", title: "Pool Evaporation Calculator", summary: "Water lost to evaporation and refill costs", category: "Calculator", icon: "droplet" },
  { slug: "pool-volume-calculator", title: "Pool Volume Calculator", summary: "Calculate gallons of water in your pool", category: "Calculator", icon: "droplet" },
  { slug: "pool-deck-size-calculator", title: "Pool Deck Size Calculator", summary: "Recommended deck area for your pool", category: "Calculator", icon: "ruler" },
  { slug: "pool-party-capacity", title: "Pool Party Capacity", summary: "Safe party size for your pool and deck", category: "Guide", icon: "users" },
  { slug: "pool-shade-calculator", title: "Pool Shade Calculator", summary: "How much shade coverage you need", category: "Calculator", icon: "umbrella" },
  { slug: "pool-chemical-dose-calculator", title: "Pool Chemical Dose Calculator", summary: "Right amount of chlorine, shock, or algaecide", category: "Calculator", icon: "flask" },
  { slug: "pool-water-chemistry", title: "Pool Water Chemistry Advisor", summary: "Enter test readings, get exact chemical doses & step-by-step instructions", category: "AI", icon: "flask" },
  { slug: "pool-liability-waiver", title: "Pool Liability Waiver Generator", summary: "Generate a printable liability waiver", category: "Generator", icon: "file" },
  { slug: "pool-rules", title: "Pool Rules Generator", summary: "Create printable pool rules signs", category: "Generator", icon: "file" },
  { slug: "pool-guest-agreement", title: "Pool Guest Agreement Builder", summary: "Comprehensive guest agreements", category: "Generator", icon: "file" },
  { slug: "pool-safety-checklist", title: "Pool Safety Checklist", summary: "Safety compliance checklist", category: "Checklist", icon: "check" },
  { slug: "pool-host-checklist", title: "Pool Host Checklist", summary: "Pre-booking preparation guide", category: "Checklist", icon: "check" },
  { slug: "pool-wifi-qr", title: "Pool WiFi QR Generator", summary: "QR code for guest WiFi access", category: "Generator", icon: "qr" },
  { slug: "pool-welcome-sign", title: "Pool Welcome Sign Generator", summary: "Printable welcome signs", category: "Generator", icon: "file" },
  { slug: "pool-cleaning-schedule", title: "Pool Cleaning Schedule", summary: "Maintenance schedule generator", category: "Planner", icon: "calendar" },
  { slug: "message-board", title: "Pool Host Message Board", summary: "Public board for hosts to share tips & connect", category: "Community", icon: "message" },
  { slug: "host-marketing-engine", title: "Host Marketing Engine", summary: "Generate flyers, social posts, DM scripts & campaigns instantly", category: "AI", icon: "sparkles" },
  { slug: "pool-listing-ai-writer", title: "Pool Listing AI Writer", summary: "Generate optimized listing titles, descriptions & photo tips", category: "AI", icon: "sparkles" },
  { slug: "social-media-calendar", title: "Social Media Content Calendar", summary: "30-day posting schedule with ready-to-use captions & hashtags", category: "Planner", icon: "calendar" },
  { slug: "review-response-generator", title: "Review Response Generator", summary: "Professional replies to guest reviews — positive or negative", category: "AI", icon: "sparkles" },
  { slug: "email-sms-campaigns", title: "Email & SMS Campaign Builder", summary: "Drip campaigns for repeat guests, seasonal promos & referrals", category: "AI", icon: "sparkles" },
  { slug: "pool-listing-score", title: "Pool Listing Score", summary: "Grade your pool listing quality", category: "Guide", icon: "star" },
  { slug: "pool-host-pricing-ai", title: "Pool Host Pricing AI", summary: "AI-driven pricing recommendations", category: "AI", icon: "sparkles" },
  { slug: "pool-rental-price-index", title: "Pool Rental Price Index", summary: "Local market pricing data", category: "Guide", icon: "chart" },
  { slug: "seasonality", title: "Seasonality Calculator", summary: "Best months to rent by region", category: "Calculator", icon: "calendar" },
  { slug: "backyard-income-calculator", title: "Backyard Income Calculator", summary: "Total backyard earning potential from pools, events & more", category: "Calculator", icon: "dollar" },
  { slug: "backyard-monetization", title: "Backyard Monetization Calculator", summary: "Full backyard earning potential", category: "Calculator", icon: "dollar" },
  { slug: "event-profit", title: "Event Profit Calculator", summary: "Party and event profitability", category: "Calculator", icon: "party" },
  { slug: "swim-lesson-pricing", title: "Swim Lesson Pricing Tool", summary: "Private lesson rate calculator", category: "Calculator", icon: "dollar" },
  { slug: "birthday-party-planner", title: "Birthday Party Planner", summary: "Budget and plan pool parties", category: "Planner", icon: "party" },
  { slug: "backyard-event-pricing", title: "Backyard Event Pricing", summary: "Price your backyard for events", category: "Calculator", icon: "dollar" },
  { slug: "pool-rental-profit", title: "Pool Rental Profit Calculator", summary: "Net profit from pool rentals", category: "Calculator", icon: "dollar" },
  { slug: "noise-distance", title: "Noise Distance Calculator", summary: "Check party noise compliance", category: "Calculator", icon: "volume" },
  { slug: "hoa-risk-checker", title: "HOA Risk Checker", summary: "Assess HOA compatibility", category: "Checklist", icon: "shield" },
  { slug: "hoa-pool-rental-defense-kit", title: "HOA Pool Rental Defense Kit", summary: "Legal templates & strategies to protect your right to rent your pool", category: "Guide", icon: "shield", external: "https://www.poolrentalnearme.com/p/hoa-pool-rental-defense-kit" },
  { slug: "amenity-revenue-guide", title: "Amenity & Upgrade Revenue Guide", summary: "Interactive ROI calculator for 249 pool amenities & upgrades", category: "Guide", icon: "star", external: "https://amenities.poolrentalnearme.com/" },
  { slug: "pool-host-academy", title: "Pool Host Academy", summary: "Free courses and guides to become a top-rated pool host", category: "Guide", icon: "book", external: "/academy" },
  { slug: "pool-host-community", title: "Pool Host Community", summary: "Connect with other pool hosts, share tips & grow together", category: "Community", icon: "users", external: "https://connect.poolrentalnearme.com/community" },
  { slug: "new-host-courses", title: "New Host Courses", summary: "Latest training courses for pool hosts", category: "Guide", icon: "book", external: "https://www.poolrentalnearme.com/p/learning-academy-new-courses" },
  { slug: "cursos-en-espanol", title: "Cursos en Español", summary: "Aprende a rentar tu piscina — Spanish hosting guides", category: "Guide", icon: "book", external: "https://www.poolrentalnearme.com/p/aprende-a-rentar-tu-piscina" },
];

export const CATEGORIES: { name: ToolCategory | "All"; label: string }[] = [
  { name: "All", label: "All" },
  { name: "Calculator", label: "Calculator" },
  { name: "Generator", label: "Generator" },
  { name: "Planner", label: "Planner" },
  { name: "Checklist", label: "Checklist" },
  { name: "AI", label: "AI" },
];

export const SIDEBAR_GROUPS: { label: string; slugs: string[] }[] = [
  {
    label: "Traffic + Conversion",
    slugs: ["pool-listing-ai-writer", "pool-listing-score", "host-marketing-engine", "social-media-calendar", "review-response-generator", "email-sms-campaigns", "pool-rental-price-index", "pool-host-pricing-ai", "pool-rental-earnings-calculator"],
  },
  {
    label: "Cost Calculators",
    slugs: ["pool-cost-calculator", "pool-heating-cost", "pool-maintenance-cost", "pool-chemical-cost", "pool-pump-cost-calculator", "pool-fill-cost-calculator", "pool-water-usage", "pool-evaporation-calculator"],
  },
  {
    label: "Pool Sizing & Planning",
    slugs: ["pool-volume-calculator", "pool-capacity", "pool-deck-size-calculator", "pool-shade-calculator", "pool-heating-time-calculator", "pool-fill-cost-calculator"],
  },
  {
    label: "Host Setup",
    slugs: ["pool-liability-waiver", "pool-rules", "pool-guest-agreement", "pool-safety-checklist", "pool-host-checklist", "pool-wifi-qr"],
  },
  {
    label: "Guest Experience",
    slugs: ["pool-welcome-sign", "pool-cleaning-schedule", "birthday-party-planner", "pool-water-chemistry"],
  },
  {
    label: "Listing Optimization",
    slugs: ["pool-listing-ai-writer", "pool-listing-score", "pool-rental-price-index", "host-marketing-engine", "social-media-calendar", "review-response-generator", "email-sms-campaigns", "pool-host-pricing-ai", "pool-rental-earnings-calculator", "amenity-revenue-guide", "pool-host-academy", "new-host-courses"],
  },
  {
    label: "Market Intelligence",
    slugs: ["pool-rental-price-index", "seasonality"],
  },
  {
    label: "Revenue Expansion",
    slugs: ["backyard-income-calculator", "backyard-monetization", "event-profit", "swim-lesson-pricing", "backyard-event-pricing", "pool-rental-profit", "pool-party-pricing", "private-pool-pricing-calculator", "amenity-revenue-guide"],
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
