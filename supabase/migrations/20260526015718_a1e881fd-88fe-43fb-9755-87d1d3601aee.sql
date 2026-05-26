
UPDATE public.content_pages
SET seo_title = 'Pool rental New York, NY: rent a backyard pool by the hour',
    seo_description = 'Find private backyard pools to rent by the hour in New York, NY. See prices, photos, and reviews. $2M liability insurance on every booking.',
    updated_at = now()
WHERE url_path = '/p/new-york-ny';

UPDATE public.content_pages
SET seo_title = 'Pool rental San Diego, CA: book a pool by the hour',
    seo_description = 'Rent a private backyard pool by the hour in San Diego, CA. Browse local pools, see hourly rates, and book instantly. $2M liability included.',
    updated_at = now()
WHERE url_path = '/p/san-diego-ca';
