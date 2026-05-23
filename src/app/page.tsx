import type { Metadata } from "next";

import { toMetadata } from "@/sanity/lib/seo";
import {
  getPage,
  getProducts,
  getSeoData,
  getSettings,
} from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";

const HOME_SLUG = "home";

const appOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([
    getSettings(),
    getSeoData(HOME_SLUG),
  ]);

  return toMetadata(seo, {
    siteName: settings?.siteTitle ?? "My Site",
    baseUrl: appOrigin,
    fallbackTitle: settings?.siteTitle ?? "My Site",
    fallbackDescription:
      settings?.siteDescription ??
      "A modern website powered by Sanity and Next.js",
    fallbackOgImage: settings?.defaultSeo?.openGraph?.image ?? null,
  });
}

export default async function HomePage() {
  const [page, products] = await Promise.all([
    getPage(HOME_SLUG, { live: true }),
    getProducts({ live: true }),
  ]);

  return (
    <main style={{ padding: "2rem", display: "grid", gap: "1.5rem" }}>
      <section>
        <h1>{page?.title ?? "Welcome"}</h1>
        <p>
          Live published content is enabled through SanityLive + defineLive().
        </p>
      </section>

      <section>
        <h2>Products</h2>
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {products.map((product) => {
            const imageUrl = product.image
              ? urlFor(product.image)
                  .width(600)
                  .height(400)
                  .fit("crop")
                  .quality(82)
                  .auto("format")
                  .url()
              : null;

            return (
              <li
                key={product._id}
                style={{
                  listStyle: "none",
                  border: "1px solid #ddd",
                  padding: "1rem",
                }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={product.image?.alt ?? product.title}
                    width={300}
                    height={200}
                    style={{
                      width: "100%",
                      height: "auto",
                      marginBottom: "0.75rem",
                    }}
                  />
                ) : null}
                <h3 style={{ margin: 0 }}>{product.title}</h3>
                <p style={{ marginBottom: 0 }}>
                  {typeof product.price === "number"
                    ? `$${product.price}`
                    : "Price on request"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
