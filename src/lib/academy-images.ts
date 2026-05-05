// Maps cover_image_url like "academy/bachelorette.jpg" to a bundled asset URL.
import bachelorette from "@/assets/academy/bachelorette.jpg";
import quinceanera from "@/assets/academy/quinceanera.jpg";
import photoshoot from "@/assets/academy/photoshoot.jpg";
import familyReunion from "@/assets/academy/family-reunion.jpg";
import sweet16 from "@/assets/academy/sweet-16.jpg";
import babyShower from "@/assets/academy/baby-shower.jpg";
import bachelor from "@/assets/academy/bachelor.jpg";
import dogPool from "@/assets/academy/dog-pool.jpg";
import swimTraining from "@/assets/academy/swim-training.jpg";
import production from "@/assets/academy/production.jpg";
import aquaFitness from "@/assets/academy/aqua-fitness.jpg";
import migrate from "@/assets/academy/migrate.jpg";
import multiPlatform from "@/assets/academy/multi-platform.jpg";
import income from "@/assets/academy/income.jpg";
import holiday from "@/assets/academy/holiday.jpg";
import taxes from "@/assets/academy/taxes.jpg";
import difficultGuests from "@/assets/academy/difficult-guests.jpg";
import hoa from "@/assets/academy/hoa.jpg";
import neighborComplaints from "@/assets/academy/neighbor-complaints.jpg";

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
