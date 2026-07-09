import { z } from "zod";
const slugSchema = z.string().min(1).max(140).regex(/^[a-z0-9-]+$/);
const tierSchema = z.enum(["tier-1", "tier-2", "tier-3"]);
const listSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(48).default(12),
  category: z.string().min(1).max(48).regex(/^[a-z0-9-]+$/).optional(),
  language: z.enum(["en", "es"]).optional(),
  search: z.string().min(1).max(80).optional(),
  tier: tierSchema.optional()
});
const COURSE_FIELDS = "slug, title, subtitle, excerpt, cover_image_url, category, language, level, duration_minutes, is_featured, published_at, tier";
export {
  COURSE_FIELDS as C,
  listSchema as l,
  slugSchema as s
};
