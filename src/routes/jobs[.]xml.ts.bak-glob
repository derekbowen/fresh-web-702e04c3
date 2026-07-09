import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCanonicalOrigin } from "@/server/canonical.server";
import { SITE_NAME } from "@/lib/seo";
import { parseCitySlug, cityForContentPage } from "@/lib/city-slug";

/**
 * /jobs.xml — Indeed/Jooble/Adzuna-compatible XML job feed.
 *
 * Generated from every published host_acq_city page (~1,200 cities).
 * Submit this URL to:
 *   - Jooble:    https://jooble.org/info/free-job-posting (free XML feed)
 *   - Adzuna:    https://www.adzuna.com/xmlfeeds (free XML feed)
 *   - Indeed:    Free organic posting via XML feed (no Indeed account needed
 *                for organic; sponsored = paid)
 *   - ZipRecruiter / Talent.com / Jobrapido — many crawl this format too.
 *
 * Format = Indeed XML feed spec (the de facto standard the others accept).
 * https://employers.indeed.com/p/xml-feeds
 */
export const Route = createFileRoute("/jobs.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = getCanonicalOrigin(request);

        const { data: pages } = await supabaseAdmin
          .from("content_pages")
          .select("slug,url_path,title,seo_title,seo_description,template_type,updated_at")
          .in("template_type", ["host_acq_city"])
          .eq("status", "published")
          .limit(5000);

        const rows = (pages ?? []) as Array<{
          slug: string | null;
          url_path: string;
          title: string | null;
          seo_title: string | null;
          seo_description: string | null;
          template_type: string;
          updated_at: string;
        }>;

        const now = new Date().toUTCString();
        const jobs: string[] = [];

        for (const p of rows) {
          const citySlug = cityForContentPage(p.template_type, p.slug);
          if (!citySlug) continue;
          const { city, stateCode } = parseCitySlug(citySlug);
          if (!city) continue;

          const seed = p.slug ?? p.url_path ?? city;
          const slugHash = seed
            .split("")
            .reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
          const dayOffset = Math.abs(slugHash) % 30;
          const posted = new Date();
          posted.setUTCHours(0, 0, 0, 0);
          posted.setUTCDate(posted.getUTCDate() - dayOffset);
          const expires = new Date(posted);
          expires.setUTCDate(expires.getUTCDate() + 60);

          const refnum = `prnm-host-${seed}`;
          const url = `${origin}${p.url_path}`;
          const title = `Rent your backyard pool in ${city}, ${stateCode} — earn $40–$150/hour`;

          const desc = `<p>Turn your backyard pool in ${city}, ${stateCode} into income. ${SITE_NAME} connects pool owners with local guests who book by the hour. Typical hosts earn $40–$150/hour depending on pool size and amenities.</p>
<h3>What you do</h3>
<ul>
<li>List your pool with photos and an hourly rate you control</li>
<li>Approve booking requests on your own schedule</li>
<li>Welcome guests, then get paid</li>
</ul>
<h3>What we include</h3>
<ul>
<li>$2,000,000 liability insurance on every booking</li>
<li>10% flat host fee (lower than Swimply's 15%+)</li>
<li>Guest verification and secure payouts</li>
</ul>
<h3>Requirements</h3>
<ul>
<li>You own (or have permission to rent) a residential pool in or near ${city}</li>
<li>Pool is clean, safe, and accessible to guests</li>
<li>You can respond to booking requests within 24 hours</li>
</ul>
<p><strong>This is an independent income opportunity, not W2 employment.</strong> You set your own schedule, rates, and house rules.</p>
<p><a href="${url}">Apply / list your pool ${city}</a></p>`;

          jobs.push(`<job>
<title><![CDATA[${title}]]></title>
<date><![CDATA[${posted.toUTCString()}]]></date>
<referencenumber><![CDATA[${refnum}]]></referencenumber>
<expirationdate><![CDATA[${expires.toUTCString()}]]></expirationdate>
<url><![CDATA[${url}?source=jobsxml]]></url>
<company><![CDATA[${SITE_NAME}]]></company>
<sourcename><![CDATA[${SITE_NAME}]]></sourcename>
<city><![CDATA[${city}]]></city>
<state><![CDATA[${stateCode}]]></state>
<country>US</country>
<postalcode></postalcode>
<description><![CDATA[${desc}]]></description>
<salary><![CDATA[$40-$150/hour]]></salary>
<education><![CDATA[None]]></education>
<jobtype>contract</jobtype>
<category>Income Opportunity</category>
<experience><![CDATA[Entry level]]></experience>
<remotetype>On-site</remotetype>
</job>`);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
<publisher><![CDATA[${SITE_NAME}]]></publisher>
<publisherurl><![CDATA[${origin}]]></publisherurl>
<lastBuildDate><![CDATA[${now}]]></lastBuildDate>
${jobs.join("\n")}
</source>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=21600",
          },
        });
      },
    },
  },
});
