import type { Lang } from "@/lib/academy";

/**
 * EN/ES pill switcher for academy and course pages. The active language is
 * shown filled; the alternate is a link to its equivalent URL.
 *
 * When `alternateHref` is null, the alternate option is rendered disabled —
 * useful on course pages where no translated equivalent exists.
 */
export function LanguageSwitcher({
  current,
  alternateHref,
}: {
  current: Lang;
  alternateHref: string | null;
}) {
  const isEn = current === "en";
  const altLang: Lang = isEn ? "es" : "en";
  const altLabel = isEn ? "Español" : "English";
  const currentLabel = isEn ? "English" : "Español";

  return (
    <div
      role="group"
      aria-label={isEn ? "Language" : "Idioma"}
      className="inline-flex items-center rounded-full border border-border bg-card p-1 text-xs font-semibold"
    >
      <span
        aria-current="true"
        className="rounded-full bg-primary px-3 py-1 text-primary-foreground"
      >
        {currentLabel}
      </span>
      {alternateHref ? (
        <a
          href={alternateHref}
          hrefLang={altLang}
          lang={altLang}
          className="rounded-full px-3 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {altLabel}
        </a>
      ) : (
        <span
          aria-disabled="true"
          title={isEn ? "Not available in Spanish" : "No disponible en inglés"}
          className="rounded-full px-3 py-1 text-muted-foreground/60"
        >
          {altLabel}
        </span>
      )}
    </div>
  );
}
