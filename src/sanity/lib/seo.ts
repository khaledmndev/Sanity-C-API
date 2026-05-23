import type { Metadata } from "next";

import { urlFor } from "@/sanity/lib/image";

type SanitySeoImage = {
  asset?: {
    _ref?: string;
    _type?: "reference";
  };
  alt?: string;
};

export type SanitySeoInput = {
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
    image?: SanitySeoImage | null;
    type?: "website" | "article";
  } | null;
  twitter?: {
    title?: string | null;
    description?: string | null;
    image?: SanitySeoImage | null;
    card?: "summary" | "summary_large_image";
  } | null;
  alternates?: {
    canonical?: string | null;
    languages?: Record<string, string>;
  } | null;
};

type MetadataDefaults = {
  siteName: string;
  baseUrl: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackOgImage?: SanitySeoImage | null;
};

export function normalizeRobots(
  input: Pick<
    SanitySeoInput,
    "robots" | "index" | "follow" | "noindex" | "nofollow"
  >,
) {
  const index = input.noindex === true ? false : (input.index ?? true);
  const follow = input.nofollow === true ? false : (input.follow ?? true);

  return {
    index,
    follow,
    // If an explicit robots string exists in Sanity, preserve it for crawlers that use raw directives.
    ...(input.robots ? { googleBot: input.robots } : {}),
  };
}

function resolveCanonical(
  canonical: string | null | undefined,
  baseUrl: string,
): string {
  if (!canonical) {
    return baseUrl;
  }

  try {
    return new URL(canonical, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function resolveOgImage(
  seoImage: SanitySeoImage | null | undefined,
  fallbackImage: SanitySeoImage | null | undefined,
): { url: string; alt: string } | null {
  const image = seoImage ?? fallbackImage;
  if (!image) {
    return null;
  }

  try {
    return {
      url: urlFor(image)
        .width(1200)
        .height(630)
        .fit("crop")
        .quality(85)
        .auto("format")
        .url(),
      alt: image.alt ?? "Open Graph image",
    };
  } catch {
    return null;
  }
}

export function toMetadata(
  seo: SanitySeoInput | null | undefined,
  defaults: MetadataDefaults,
): Metadata {
  const title = seo?.title ?? defaults.fallbackTitle;
  const description = seo?.description ?? defaults.fallbackDescription;
  const canonical = resolveCanonical(
    seo?.canonical ?? seo?.alternates?.canonical,
    defaults.baseUrl,
  );
  const robots = normalizeRobots({
    robots: seo?.robots,
    index: seo?.index,
    follow: seo?.follow,
    noindex: seo?.noindex,
    nofollow: seo?.nofollow,
  });

  const ogImage = resolveOgImage(
    seo?.openGraph?.image,
    defaults.fallbackOgImage,
  );
  const twitterImage = resolveOgImage(
    seo?.twitter?.image ?? seo?.openGraph?.image,
    defaults.fallbackOgImage,
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(seo?.alternates?.languages
        ? { languages: seo.alternates.languages }
        : {}),
    },
    robots,
    openGraph: {
      title: seo?.openGraph?.title ?? title,
      description: seo?.openGraph?.description ?? description,
      siteName: defaults.siteName,
      type: seo?.openGraph?.type ?? "website",
      ...(ogImage ? { images: [ogImage] } : {}),
      url: canonical,
    },
    twitter: {
      card: seo?.twitter?.card ?? "summary_large_image",
      title: seo?.twitter?.title ?? title,
      description: seo?.twitter?.description ?? description,
      ...(twitterImage ? { images: [twitterImage.url] } : {}),
    },
  };
}
