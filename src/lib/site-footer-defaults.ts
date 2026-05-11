export type FooterLink = { label: string; href: string };
export type FooterMarket = { name: string; slug: string };
export type FooterSocial = { label: string; href: string; icon: string };

export type SiteFooterSettings = {
  contact_phone: string | null;
  contact_phone_label: string | null;
  contact_phone_hours: string | null;
  contact_email: string | null;
  bottom_text: string | null;
  explore_links: FooterLink[];
  host_links: FooterLink[];
  company_links: FooterLink[];
  popular_markets: FooterMarket[];
  socials: FooterSocial[];
};


export const DEFAULT_FOOTER: SiteFooterSettings = {
  contact_phone: "tel:18889404247",
  contact_phone_label: "Call us 888-940-4247",
  contact_phone_hours: "10am - 5pm PST",
  contact_email: "support@poolrentalnearme.com",
  bottom_text: "© 2026 PRNM CORP Riverside, Ca 92509",
  explore_links: [
    { label: "Search Listings", href: "/s" },
    { label: "Pool Pros Directory", href: "/p/pool-pros" },
    { label: "How It Works", href: "/p/how-it-works" },
    { label: "Neighbors", href: "/p/neighbors" },
    { label: "Start a Business", href: "/p/hosting" },
    { label: "Pool Rental Near Me vs Swimply", href: "/p/swimply-alternative-vs-pool-rental-near-me" },
    { label: "Pool Rental Near Me vs Peerspace", href: "/p/peerspace-vs-pool-rental-near-me" },
    { label: "Pool Rental Near Me vs Giggster", href: "/p/giggster-vs-pool-rental-near-me" },
    { label: "Liability Waivers", href: "https://rentalwaivers.com" },
    { label: "Browse All States", href: "/p/pool-rentals" },
  ],
  host_links: [
    { label: "List Your Pool for Free", href: "/l/draft/00000000-0000-0000-0000-000000000000/new/details" },
    { label: "How Hosting Works", href: "/p/hosting" },
    { label: "Find Locations Near You", href: "/p/all-locations" },
    { label: "Earnings Calculator", href: "/p/earnings-calculator" },
    { label: "Host Pro Tools", href: "/p/free-host-tools" },
    { label: "Host Connect", href: "https://connect.poolrentalnearme.com" },
    { label: "HOA Navigation Guide", href: "/p/elearning-academy-hoa-navigation-guide-pool-hosts" },
    { label: "Host Make More $$$", href: "/p/hosting" },
  ],
  company_links: [
    { label: "About", href: "/p/how-it-works" },
    { label: "Careers", href: "/p/careers" },
    { label: "Terms", href: "/p/terms-of-service" },
    { label: "Privacy", href: "/p/privacy-policy" },
    { label: "Video Chat Support", href: "https://meetn.com/poolrentalnearme" },
    { label: "Refer Pool Owners", href: "/referral" },
    { label: "Investors", href: "/p/investors" },
  ],
  // Slugs map to published `content_pages` (host_acq_city template) so each
  // link resolves through the /p/$slug dispatcher. The cities table has rows
  // for the short slugs (los-angeles-ca etc.) but the dispatcher only checks
  // content_pages — that mismatch was 404ing every link before this fix.
  popular_markets: [
    { name: "Los Angeles, CA", slug: "become-a-swimming-pool-host-los-angeles-ca" },
    { name: "San Diego, CA", slug: "become-a-swimming-pool-host-san-diego-ca" },
    { name: "Riverside, CA", slug: "become-a-swimming-pool-host-riverside-ca" },
    { name: "Sacramento, CA", slug: "become-a-swimming-pool-host-sacramento-ca" },
    { name: "Tampa, FL", slug: "become-a-swimming-pool-host-tampa-fl" },
    { name: "Scottsdale, AZ", slug: "become-a-swimming-pool-host-scottsdale-az" },
    { name: "Phoenix, AZ", slug: "become-a-swimming-pool-host-phoenix-az" },
    { name: "Katy, TX", slug: "become-a-swimming-pool-host-katy-tx" },
  ],
  socials: [
    { label: "Facebook", href: "https://www.facebook.com/poolrentalnearme", icon: "facebook" },
    { label: "X", href: "https://x.com/poolrentalnearme", icon: "x" },
    { label: "YouTube", href: "https://www.youtube.com/@poolrentalnearme", icon: "youtube" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/poolrentalnearme", icon: "linkedin" },
    { label: "Instagram", href: "https://www.instagram.com/poolrentalnearme", icon: "instagram" },
    { label: "TikTok", href: "https://www.tiktok.com/@poolrentalnearme", icon: "tiktok" },
    { label: "Pinterest", href: "https://www.pinterest.com/poolrentalnearme", icon: "pinterest" },
  ],
};
