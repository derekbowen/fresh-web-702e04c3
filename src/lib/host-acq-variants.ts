/**
 * A/B/C/D title-test variants for host_acq_city pages.
 *
 * Pages opt in by having a non-null `title_variant` column in content_pages
 * (one of 'A' | 'B' | 'C' | 'D'). Pages with title_variant = NULL render
 * exactly as before — no behavior change.
 *
 * Each variant emits a coordinated title + H1 + meta description + intro
 * paragraph so Google sees a consistent signal per variant. A hidden
 * <meta name="title_test_variant"> tag goes out only on variant pages.
 */
import { stateName as fullStateName } from "@/lib/states";

export type TitleVariant = "A" | "B" | "C" | "D";

export function normalizeTitleVariant(raw: unknown): TitleVariant | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toUpperCase();
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

export interface VariantCopy {
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
}

export function getVariantCopy(
  variant: TitleVariant,
  cityName: string,
  stateCode: string,
): VariantCopy {
  const ST = (stateCode || "").toUpperCase();
  const State = fullStateName(ST) || ST;

  switch (variant) {
    case "A":
      return {
        title: `Become a Pool Host in ${cityName}, ${State} | Pool Rental Near Me`,
        h1: `Become a Pool Host in ${cityName}, ${State}`,
        metaDescription: `Turn your ${cityName} pool into income. List on Pool Rental Near Me — 10% flat host fee, $2M liability included, full control of your schedule and rates.`,
        intro: `Becoming a pool host in ${cityName}, ${State} means your backyard works for you. Pool Rental Near Me connects you with neighbors and guests in ${cityName} who want to book by the hour. You set the price, you set the hours, you keep 90%. Full liability coverage included on every booking.`,
      };
    case "B":
      return {
        title: `Rent Out Your Pool in ${cityName}, ${ST} | List for Free`,
        h1: `Rent Out Your Pool in ${cityName}, ${ST}`,
        metaDescription: `Rent out your pool in ${cityName} by the hour. Free to list, 10% flat host fee, $2M liability per booking, payouts via Stripe. List your pool today.`,
        intro: `Renting out your pool in ${cityName}, ${State} is the fastest way to put it to work. List for free on Pool Rental Near Me, set your hourly rate, and start accepting bookings. You stay in control of your calendar, your rules, and your earnings. We handle payments and insurance.`,
      };
    case "C":
      return {
        title: `Make Money With Your Pool in ${cityName}, ${ST}`,
        h1: `Make Money With Your Pool in ${cityName}, ${ST}`,
        metaDescription: `Make money with your pool in ${cityName}. List on Pool Rental Near Me, set your hourly rate, and keep 90%. Free to list, $2M liability covered.`,
        intro: `Your ${cityName}, ${State} pool is an asset most homeowners leave idle. Make money with your pool by listing it on Pool Rental Near Me. Hourly bookings, transparent fees, full liability coverage. You decide who books and when.`,
      };
    case "D":
      return {
        title: `How to Rent Out Your Pool in ${cityName}, ${ST} Safely`,
        h1: `How to Rent Out Your Pool in ${cityName}, ${ST} Safely`,
        metaDescription: `How to rent out your pool safely in ${cityName}. Step-by-step guide to listing, pricing, and protecting your home with $2M liability included on every booking.`,
        intro: `If you've been wondering how to rent out your pool in ${cityName}, ${State} safely, this is the playbook. List on Pool Rental Near Me, set your rate, and book guests who agree to a digital waiver before access. Every booking is backed by $2M in liability coverage. Your pool, your rules, your protection.`,
      };
  }
}
