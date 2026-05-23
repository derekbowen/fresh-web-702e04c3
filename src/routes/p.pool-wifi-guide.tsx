import { createFileRoute } from "@tanstack/react-router";
import {
  ToolPlaceholderPage,
  type ToolPlaceholderProps,
} from "@/components/templates/tool-placeholder";
import {
  buildMeta,
  breadcrumbJsonLd,
  ldJsonScript,
  SITE_URL,
} from "@/lib/seo";
import heroImage from "@/assets/host-pro-hero.jpg";

const PATH = "/p/pool-wifi-guide";
const PUBLISHED = "2026-05-23T00:00:00Z";
const MODIFIED = "2026-05-23T00:00:00Z";

const TITLE =
  "Pool wifi guide: setup, range, and guest access | Pool Rental Near Me";
const DESCRIPTION =
  "Free pool wifi guide for hosts. How to extend wifi to the pool, give guests safe limited access, hit 25+ Mbps poolside, and avoid the three setups that cause bad reviews.";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Do I really need to provide wifi at my pool rental?",
    a: "If you charge $60/hour or more, yes. Guests bring phones, speakers, work laptops, and kids' tablets. A weak signal at the pool shows up in reviews fast, especially from the 30 to 50 age bracket that books the most hours and tips the best.",
  },
  {
    q: "How far does my house wifi actually reach poolside?",
    a: "Most consumer routers lose 60 to 80 percent of their signal once they pass a wall, a sliding door, and 25 feet of open yard. If the router is centered in the house, expect 5 to 15 Mbps poolside on a good day and dead zones in the shade structures.",
  },
  {
    q: "What's the cheapest fix for weak pool wifi?",
    a: "A single mesh node placed by the back door, in line of sight to the pool. A two-pack TP-Link Deco or Eero costs under $150 and almost always solves it. Outdoor-rated extenders cost more and only beat mesh when there's a long open run with no power outlet at the midpoint.",
  },
  {
    q: "Should I give guests my main wifi password?",
    a: "No. Set up a guest network on your router (every modern router supports it) with its own SSID and password. Guests only see the internet, not your printer, smart TV, cameras, or NAS. Rotate the guest password monthly or after any problem booking.",
  },
  {
    q: "What internet speed do I need for a pool rental?",
    a: "Minimum 25 Mbps down and 5 Mbps up at the pool itself, not at the router. That covers 3 to 4 people streaming music, a video call, and the host's security cameras simultaneously. Below 15 Mbps poolside you'll start seeing wifi complaints in reviews.",
  },
  {
    q: "Can guests download huge files or run pirated streams on my connection?",
    a: "Technically yes, but the guest network on most routers lets you set a per-device bandwidth cap (typically 25 Mbps) and block torrent traffic. If your ISP sends a DMCA notice, it goes to you — so cap it.",
  },
  {
    q: "Do I need a separate router for the pool, or just better placement?",
    a: "Almost always just better placement plus one mesh node. A dedicated outdoor access point only makes sense if your pool is more than 75 feet from the house or fully fenced off behind a detached structure.",
  },
];

const WHY_EXISTS = {
  heading: "Why a pool wifi guide exists",
  paragraphs: [
    "Wifi is the number-three complaint in pool rental reviews, behind temperature and cleanliness, and ahead of parking. Hosts assume their home wifi reaches the backyard because their kids can scroll TikTok on the patio. They forget that the pool deck is another 30 feet past the patio, through a privacy fence, with three loungers full of metal frames bouncing the signal sideways.",
    "Most hosts only discover the problem the first time a guest leaves a 4-star review that says \"great spot, wifi was spotty at the deep end.\" That single line drops your conversion rate by 8 to 12 percent over the next dozen prospective bookings, and there's no way to remove it. The fix is a $120 mesh node and one afternoon. The cost of not fixing it is two seasons of mediocre reviews.",
    "This guide walks through the actual fix path used by hosts in the Pool Host Academy: how to measure what you actually have at the pool, the three setups that work, the two that don't, and how to wire guest access so visitors never see your security cameras, your work laptop, or your smart home.",
  ],
};

const WHO_USES = {
  heading: "Who this guide is for",
  paragraphs: [
    "Brand-new hosts in their first booking window get the most value. You can fix wifi before any guest sees it, and avoid baking the complaint into your earliest reviews — the ones that determine whether you ever break out of \"new host\" search position.",
    "Established hosts coming off a wifi-related review need this guide to triage fast. Most of you have a perfectly fine ISP plan and just have the router in the wrong room. A 20-minute mesh setup and a guest network reset usually closes the issue before the next booking.",
    "Hosts with detached pool houses, casitas, or cabanas need the dedicated outdoor access point section. A mesh node inside the house won't punch through stucco walls plus 40 feet of open yard. You need a hardwired outdoor unit, and the guide covers the two models that actually survive a wet summer in the sun.",
  ],
};

const HOW_IT_WORKS = {
  heading: "How to set up pool wifi the right way",
  steps: [
    {
      title: "Measure what you actually have at the pool",
      body: "Stand on the deck farthest from your house. Run a speedtest on your phone. Note both download and upload. Anything under 15 Mbps down at that spot means a guest's video call will stutter, period. Don't trust the dashboard your router shows — trust the speedtest at the chair where the guest will sit.",
    },
    {
      title: "Decide between mesh and outdoor AP",
      body: "Pool within 50 feet of the house, signal passes through one wall: a single mesh node by the back door fixes it. Pool more than 75 feet away or behind a detached structure: budget for a hardwired outdoor access point and a 50-foot run of outdoor-rated ethernet.",
    },
    {
      title: "Set up a guest network with its own SSID",
      body: "Every router made in the last six years supports this. Name it something obvious like \"PoolGuest\" so guests find it on arrival. Set a fresh password — not your main one — and toggle \"client isolation\" so guests on the network can't even see each other's devices, let alone yours.",
    },
    {
      title: "Cap bandwidth and block sketchy traffic",
      body: "Most routers let you cap the guest network's total bandwidth and block BitTorrent at the firewall. Cap it at 25 to 50 Mbps so a guest's 4K stream doesn't kill your own work-from-home call. Block torrents so the next DMCA notice from your ISP doesn't have your name on it.",
    },
    {
      title: "Print the wifi card and stage it poolside",
      body: "Laminated card with SSID, password, and a QR code that auto-connects. Tape it to the cabana wall, the fridge, and the inside of the bathroom door. Guests forget where it was 20 seconds after you tell them. Three copies, three locations, zero text messages asking for the password mid-booking.",
    },
    {
      title: "Re-test every 90 days",
      body: "ISPs throttle, mesh nodes lose their place, neighbors change channels and step on yours. Rerun the poolside speedtest seasonally. If you've dropped under 15 Mbps, the fix is almost always a reboot, a channel change, or repositioning the mesh node 4 feet higher up.",
    },
  ],
};

const SCENARIOS = {
  heading: "Common scenarios",
  items: [
    {
      title: "The suburban pool, 35 feet from a single-story house",
      body: "Single mesh node on a kitchen counter, line of sight to the patio door. 50 to 80 Mbps poolside, no dead spots, $120 total spend, 15-minute install. Most hosts in this profile don't need anything more.",
    },
    {
      title: "The two-story house with the pool tucked behind a privacy fence",
      body: "Wifi through two walls and an outdoor fence drops below usable. Mesh node by the back door plus a second node on the patio roof. Roughly $250 total. Solves it for the long-term.",
    },
    {
      title: "The detached pool house or casita",
      body: "Stucco walls and 60+ feet of open yard kill mesh. Run outdoor-rated Cat6 from your main router to a wall-mounted outdoor access point (Ubiquiti UniFi U6-Mesh is the safest pick). Roughly $200 in hardware plus 2 hours of cable running. Lasts 10 years.",
    },
    {
      title: "The host with security cameras and a smart home",
      body: "Don't even consider sharing the main network. Set the guest network on a separate VLAN if your router supports it. Guests can use wifi all day and never see, ping, or reach a single one of your IoT devices. Pair with the digital waiver so guests acknowledge the network terms in writing.",
    },
  ],
};

const PROPS: Omit<ToolPlaceholderProps, "breadcrumbItems"> = {
  eyebrow: "Free guide · Coming soon",
  h1: "Pool wifi guide: setup, range, and guest access",
  intro:
    "Most pool wifi complaints come from one missing $120 mesh node. This guide walks through what to actually measure, the three setups that work, and how to give guests internet access without exposing your cameras, work laptop, or smart home.",
  heroSrc: heroImage,
  heroAlt:
    "Poolside lounger with a phone showing a wifi speedtest result above 50 Mbps, mesh node visible through the back door",
  bullets: [
    "Measure real poolside speed (not the router dashboard)",
    "Pick mesh vs. outdoor access point in 60 seconds",
    "Set up a guest SSID guests can't escape from",
    "Cap bandwidth and block sketchy traffic at the router",
    "Print scannable QR wifi cards for the cabana",
    "Re-test every 90 days, fix drift before it becomes a review",
  ],
  whyExists: WHY_EXISTS,
  whoUses: WHO_USES,
  howItWorks: HOW_IT_WORKS,
  scenarios: SCENARIOS,
  faqs: FAQS,
  primaryCta: { label: "Notify me when it launches", href: "/p/hosting" },
  secondaryCta: { label: "See all free host tools", href: "/p/free-host-tools" },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Host Tools", path: "/p/free-host-tools" },
  { name: "Pool wifi guide", path: PATH },
];

export const Route = createFileRoute("/p/pool-wifi-guide")({
  head: () => {
    const meta = buildMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      type: "article",
      image: `${SITE_URL}${heroImage}`,
    });
    return {
      meta: [
        ...meta.meta,
        { property: "article:published_time", content: PUBLISHED },
        { property: "article:modified_time", content: MODIFIED },
        { property: "article:author", content: "Pool Rental Near Me" },
      ],
      links: meta.links,
      scripts: [
        ldJsonScript(breadcrumbJsonLd(BREADCRUMBS)),
        ldJsonScript({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      ],
    };
  },
  component: () => <ToolPlaceholderPage {...PROPS} breadcrumbItems={BREADCRUMBS} />,
});
