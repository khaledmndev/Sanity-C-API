# Sanity Toolkit Usage Guide (Next.js App Router + TypeScript)

This guide explains how to use your production-ready Sanity toolkit for:

- A single page type (example: `page`)
- A collection type (example: `product`)
- SEO and metadata generation
- Draft mode preview
- Live published updates
- Visual editing + Presentation Tool
- Webhook revalidation

It is designed to work with the toolkit files already created in this project.

## 1. What You Already Have

Core toolkit files:

- `src/sanity/env.ts`
- `src/sanity/lib/client.ts`
- `src/sanity/lib/fetch.ts`
- `src/sanity/lib/live.ts`
- `src/sanity/lib/image.ts`
- `src/sanity/lib/seo.ts`
- `src/sanity/lib/queries.ts`
- `src/app/api/draft-mode/enable/route.ts`
- `src/app/api/draft-mode/disable/route.ts`
- `src/app/api/revalidate/route.ts`
- `src/app/layout.tsx`
- `sanity.config.ts`

These provide a secure baseline for server-side content fetching, live updates, visual editing, and revalidation.

## 2. Environment Setup

Copy `.env.local.example` to `.env.local` and fill real values.

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID="your_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2026-03-01"
NEXT_PUBLIC_SANITY_STUDIO_URL="http://localhost:3333"

SANITY_API_READ_TOKEN="your_viewer_or_read_token"
SANITY_API_WRITE_TOKEN="your_write_token"
SANITY_PREVIEW_SECRET="your_preview_secret"
SANITY_REVALIDATE_SECRET="your_revalidate_secret"
```

### Public vs private env variables

Safe in browser:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`

Must stay server-only:

- `SANITY_API_READ_TOKEN`
- `SANITY_API_WRITE_TOKEN`
- `SANITY_PREVIEW_SECRET`
- `SANITY_REVALIDATE_SECRET`

Never import private tokens in client components. If a token enters client bundle code, it can leak to any browser user.

## 3. Example Content Model: Page Type

Use this for top-level content like Home/About/Contact.

### Example schema

```ts
// Example only: put in your Studio schema folder (e.g. schemaTypes/page.ts)
import { defineField, defineType } from "sanity";

export const pageType = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "title", type: "string" }),
        defineField({ name: "description", type: "text" }),
        defineField({ name: "canonical", type: "url" }),
        defineField({ name: "index", type: "boolean", initialValue: true }),
        defineField({ name: "follow", type: "boolean", initialValue: true }),
      ],
    }),
  ],
});
```

### Query and helper usage

The toolkit already includes:

- `pageBySlugQuery`
- `getPage(slug)`
- `getSeoData(slug)`

You can fetch page content in a server component like this:

```tsx
import { notFound } from "next/navigation";
import { getPage } from "@/sanity/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug, { live: true });

  if (!page) {
    notFound();
  }

  return (
    <main>
      <h1>{page.title}</h1>
      {/* render body blocks with your preferred renderer */}
    </main>
  );
}
```

### Metadata from Sanity SEO

```tsx
import type { Metadata } from "next";
import { getSeoData, getSettings } from "@/sanity/lib/queries";
import { toMetadata } from "@/sanity/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [seo, settings] = await Promise.all([getSeoData(slug), getSettings()]);

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  return toMetadata(seo, {
    siteName: settings?.siteTitle ?? "My Site",
    baseUrl,
    fallbackTitle: settings?.siteTitle ?? "My Site",
    fallbackDescription:
      settings?.siteDescription ?? "Website powered by Sanity",
    fallbackOgImage: settings?.defaultSeo?.openGraph?.image ?? null,
  });
}
```

## 4. Example Content Model: Collection Type

Use this for repeatable items like products, posts, articles, case studies.

### Example schema for `product`

```ts
// Example only: put in your Studio schema folder (e.g. schemaTypes/product.ts)
import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "price", title: "Price", type: "number" }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "title", type: "string" }),
        defineField({ name: "description", type: "text" }),
      ],
    }),
  ],
});
```

### Collection query pattern

Your toolkit already uses a safe optional-boolean pattern:

```groq
*[_type == "product" && coalesce(isPublished, true) == true] | order(_updatedAt desc)
```

This avoids null-comparison pitfalls and keeps behavior consistent.

### Example collection page

```tsx
import Link from "next/link";
import { getProducts } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";

export default async function ProductsPage() {
  const products = await getProducts({ live: true });

  return (
    <main>
      <h1>Products</h1>
      <ul>
        {products.map((product) => {
          const imageUrl = product.image
            ? urlFor(product.image)
                .width(800)
                .height(600)
                .fit("crop")
                .quality(82)
                .auto("format")
                .url()
            : null;

          return (
            <li key={product._id}>
              <Link href={`/products/${product.slug.current}`}>
                {product.title}
              </Link>
              {imageUrl ? (
                <img src={imageUrl} alt={product.image?.alt ?? product.title} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

## 5. Image Utilities Quick Reference

Use `urlFor()` from `src/sanity/lib/image.ts`.

```ts
urlFor(image).width(1200).url();
urlFor(image).height(630).url();
urlFor(image).width(1200).height(630).fit("crop").url();
urlFor(image).quality(85).auto("format").url();
```

Also available:

- `parseSanityImageUrl(url)` to parse projectId/dataset/assetId/dimensions
- `buildResponsiveImageUrls(source)` for small/medium/large presets

## 6. Draft Mode Flow

Enable draft mode:

`GET /api/draft-mode/enable?secret=SANITY_PREVIEW_SECRET&slug=/target-path`

Disable draft mode:

`GET /api/draft-mode/disable?secret=SANITY_PREVIEW_SECRET&slug=/`

Both routes:

- validate secret
- sanitize redirect path to prevent open redirect issues
- toggle Next draft mode cookie safely

## 7. Live Published Updates

Live wiring is already in place:

- `defineLive()` setup in `src/sanity/lib/live.ts`
- `<SanityLive />` mounted in `src/app/layout.tsx`

To opt-in per query:

```ts
await getPage("home", { live: true });
await getProducts({ live: true });
```

Use live for published content updates in frontend sessions.

## 8. Visual Editing + Presentation Tool

Already integrated:

- `<VisualEditing />` renders when draft mode is enabled
- Presentation Tool config in `sanity.config.ts`
- Draft mode endpoint wired from Studio preview config

Important notes:

- `SANITY_API_READ_TOKEN` should be viewer/read scope, not write scope
- Keep preview secrets long and random
- Ensure frontend origin in `sanity.config.ts` is correct for production

## 9. Webhook Revalidation

Endpoint:

`GET or POST /api/revalidate?secret=SANITY_REVALIDATE_SECRET`

Your route supports two production-safe modes.

### Option A: Simple mode (recommended to start)

Call without `tags` or `paths` and let the route use its default tags.

```http
GET /api/revalidate?secret=SANITY_REVALIDATE_SECRET
```

or

```http
POST /api/revalidate?secret=SANITY_REVALIDATE_SECRET
Content-Type: application/json

{}
```

Default tags currently used by the route:

- `settings`
- `page`
- `post`
- `product`
- `products`
- `seo`

Use this mode when:

- you want the easiest setup
- your project is small to medium
- you are okay with broader cache invalidation

### Option B: Granular mode (recommended as project grows)

Send explicit tags and/or paths from the webhook payload.

JSON payload shape:

```json
{
  "tags": ["page", "page:home", "product"],
  "paths": ["/", "/products"]
}
```

Use this mode when:

- traffic is higher
- you want tighter cache control
- you only want to invalidate affected pages

### Sanity webhook setup

In Sanity Manage -> API -> Webhooks:

1. URL: `https://your-domain.com/api/revalidate`
2. Method: `POST`
3. Header: `x-revalidate-secret: SANITY_REVALIDATE_SECRET`
4. Trigger on: create, update, delete
5. Filter to relevant types (for example: `page`, `post`, `product`, `settings`)

### Suggested webhook payload templates

Page update:

```json
{
  "tags": ["page", "seo", "page:home"],
  "paths": ["/"]
}
```

Post update:

```json
{
  "tags": ["post", "seo", "post:my-post-slug"],
  "paths": ["/blog", "/blog/my-post-slug"]
}
```

Product update:

```json
{
  "tags": ["product", "products", "seo"],
  "paths": ["/products", "/products/my-product-slug"]
}
```

Settings update:

```json
{
  "tags": ["settings", "seo"],
  "paths": ["/"]
}
```

Use tags in your queries via `sanityFetch({ tags: [...] })` and keep webhook tags aligned with query tags.

## 10. Adding a New Type (Reusable Pattern)

When adding any new document type, follow this checklist:

1. Add schema in Studio.
2. Add GROQ query in `src/sanity/lib/queries.ts`.
3. Add TypeScript type in `src/sanity/lib/queries.ts`.
4. Add helper function that wraps `sanityFetch<T>()`.
5. Add tags and revalidate settings.
6. Add route/page component usage.
7. Add `generateMetadata` support if SEO-enabled.
8. Add webhook tag mapping for cache invalidation.

## 11. Recommended Production Conventions

- Use `live: true` only where UI benefits from live published updates.
- Use short `revalidate` for high-change data, longer for stable pages.
- Keep draft flows authenticated and secret-validated.
- Prefer slim projections in GROQ to reduce payload size.
- Use `coalesce()` for optional booleans (`isPublished`, `index`, `follow`).
- Never query everything (`*[]`) without constraints in production.

## 12. Documentation to Read Next

Official docs worth bookmarking:

1. Next.js + Sanity overview: https://www.sanity.io/docs/nextjs/introduction
2. Configure Sanity client in Next.js: https://www.sanity.io/docs/nextjs/configure-sanity-client-nextjs
3. Visual Editing with App Router: https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
4. Presentation Tool concepts: https://www.sanity.io/docs/visual-editing/presentation-tool
5. Caching and revalidation: https://www.sanity.io/docs/nextjs/caching-and-revalidation-in-nextjs
6. next-sanity API reference: https://reference.sanity.io/next-sanity/
7. GROQ language reference: https://www.sanity.io/docs/groq

## 13. Team Onboarding Summary

If a new developer joins, they should learn this order:

1. Env and security boundaries (`NEXT_PUBLIC_*` vs server-only secrets)
2. `sanityFetch<T>()` usage and cache strategy
3. Query helper conventions in `src/sanity/lib/queries.ts`
4. Metadata pipeline via `toMetadata()`
5. Draft mode and visual editing workflow
6. Webhook-based revalidation strategy

This sequence keeps implementation fast and prevents common security mistakes.
