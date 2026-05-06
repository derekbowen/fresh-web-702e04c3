// Maps cover_image_url like "academy/bachelorette.jpg" to a bundled asset URL.
import bachelorette from "@/assets/academy/bachelorette.webp";
import quinceanera from "@/assets/academy/quinceanera.webp";
import photoshoot from "@/assets/academy/photoshoot.webp";
import familyReunion from "@/assets/academy/family-reunion.webp";
import sweet16 from "@/assets/academy/sweet-16.webp";
import babyShower from "@/assets/academy/baby-shower.webp";
import bachelor from "@/assets/academy/bachelor.webp";
import dogPool from "@/assets/academy/dog-pool.webp";
import swimTraining from "@/assets/academy/swim-training.webp";
import production from "@/assets/academy/production.webp";
import aquaFitness from "@/assets/academy/aqua-fitness.webp";
import migrate from "@/assets/academy/migrate.webp";
import multiPlatform from "@/assets/academy/multi-platform.webp";
import income from "@/assets/academy/income.webp";
import holiday from "@/assets/academy/holiday.webp";
import taxes from "@/assets/academy/taxes.webp";
import difficultGuests from "@/assets/academy/difficult-guests.webp";
import hoa from "@/assets/academy/hoa.webp";
import neighborComplaints from "@/assets/academy/neighbor-complaints.webp";

export const ACADEMY_HERO_MAP: Record<string, string> = {
  "academy/bachelorette.jpg": bachelorette,
  "academy/quinceanera.jpg": quinceanera,
  "academy/photoshoot.jpg": photoshoot,
  "academy/family-reunion.jpg": familyReunion,
  "academy/sweet-16.jpg": sweet16,
  "academy/baby-shower.jpg": babyShower,
  "academy/bachelor.jpg": bachelor,
  "academy/dog-pool.jpg": dogPool,
  "academy/swim-training.jpg": swimTraining,
  "academy/production.jpg": production,
  "academy/aqua-fitness.jpg": aquaFitness,
  "academy/migrate.jpg": migrate,
  "academy/multi-platform.jpg": multiPlatform,
  "academy/income.jpg": income,
  "academy/holiday.jpg": holiday,
  "academy/taxes.jpg": taxes,
  "academy/difficult-guests.jpg": difficultGuests,
  "academy/hoa.jpg": hoa,
  "academy/neighbor-complaints.jpg": neighborComplaints,
};

/** Resolve a stored cover_image_url to a usable URL. */
export function resolveAcademyHero(coverUrl: string | null | undefined): string | null {
  if (!coverUrl) return null;
  if (coverUrl.startsWith("http") || coverUrl.startsWith("/")) return coverUrl;
  return ACADEMY_HERO_MAP[coverUrl] ?? null;
}
