import { groq } from "next-sanity";

import { sanityFetch } from "@/sanity/lib/fetch";

export type SanitySlug = {
  current: string;
};

export type SeoDocument = {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  robots?: string | null;
  index?: boolean | null;
  follow?: boolean | null;
  noindex?: boolean | null;
  nofollow?: boolean | null;
  openGraph?: {
    title?: string | null;
    description?: string | null;
    image?: {
      asset?: { _ref: string };
      alt?: string;
    } | null;
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    image?: {
      asset?: { _ref: string };
      alt?: string;
    } | null;
  } | null;
  alternates?: {
    canonical?: string | null;
    languages?: Record<string, string>;
  } | null;
};

export type Page = {
  _id: string;
  _type: "page";
  title: string;
  slug: SanitySlug;
  body?: unknown[];
  seo?: SeoDocument;
};

export type Post = {
  _id: string;
  _type: "post";
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  publishedAt?: string;
  seo?: SeoDocument;
};

export type SiteSettings = {
  _id: string;
  siteTitle?: string;
  siteDescription?: string;
  defaultSeo?: SeoDocument;
};

export type Product = {
  _id: string;
  title: string;
  slug: SanitySlug;
  price?: number;
  isPublished?: boolean;
  image?: {
    asset?: { _ref: string };
    alt?: string;
  };
};

export const settingsQuery = groq`*[_type == "settings"][0]{
  _id,
  siteTitle,
  siteDescription,
  defaultSeo
}`;

export const pageBySlugQuery = groq`*[_type == "page" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  slug,
  body,
  seo
}`;

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0]{
  _id,
  _type,
  title,
  slug,
  excerpt,
  publishedAt,
  seo
}`;

export const productsQuery = groq`*[_type == "product" && coalesce(isPublished, true) == true] | order(_updatedAt desc) {
  _id,
  title,
  slug,
  price,
  isPublished,
  image
}`;

export const seoBySlugQuery = groq`coalesce(
  *[_type == "page" && slug.current == $slug][0].seo,
  *[_type == "post" && slug.current == $slug][0].seo,
  *[_type == "settings"][0].defaultSeo
)`;

export async function getSettings(options?: {
  draftMode?: boolean;
  live?: boolean;
}) {
  return sanityFetch<SiteSettings | null>({
    query: settingsQuery,
    tags: ["settings"],
    revalidate: 300,
    draftMode: options?.draftMode,
    live: options?.live,
  });
}

export async function getPage(
  slug: string,
  options?: { draftMode?: boolean; live?: boolean },
) {
  return sanityFetch<Page | null>({
    query: pageBySlugQuery,
    params: { slug },
    tags: ["page", `page:${slug}`],
    revalidate: 120,
    draftMode: options?.draftMode,
    live: options?.live,
  });
}

export async function getPostBySlug(
  slug: string,
  options?: { draftMode?: boolean; live?: boolean },
) {
  return sanityFetch<Post | null>({
    query: postBySlugQuery,
    params: { slug },
    tags: ["post", `post:${slug}`],
    revalidate: 120,
    draftMode: options?.draftMode,
    live: options?.live,
  });
}

export async function getProducts(options?: {
  draftMode?: boolean;
  live?: boolean;
}) {
  return sanityFetch<Product[]>({
    query: productsQuery,
    tags: ["product", "products"],
    revalidate: 120,
    draftMode: options?.draftMode,
    live: options?.live,
  });
}

export async function getSeoData(
  slug: string,
  options?: { draftMode?: boolean; live?: boolean },
) {
  return sanityFetch<SeoDocument | null>({
    query: seoBySlugQuery,
    params: { slug },
    tags: ["seo", `seo:${slug}`],
    revalidate: 120,
    draftMode: options?.draftMode,
    live: options?.live,
  });
}
