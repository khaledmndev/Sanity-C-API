import createImageUrlBuilder from "@sanity/image-url";
import type { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { publicClient } from "@/sanity/lib/client";

const imageBuilder = createImageUrlBuilder(publicClient);

export function urlFor(source: SanityImageSource): ImageUrlBuilder {
  return imageBuilder.image(source);
}

export type ParsedSanityImage = {
  projectId: string;
  dataset: string;
  assetId: string;
  width: number;
  height: number;
  extension: string;
};

const SANITY_IMAGE_PATH_REGEX =
  /^\/images\/([^/]+)\/([^/]+)\/([a-zA-Z0-9_-]+)-(\d+)x(\d+)\.([a-zA-Z0-9]+)$/;

export function parseSanityImageUrl(url: string): ParsedSanityImage | null {
  try {
    const { pathname } = new URL(url);
    const matches = pathname.match(SANITY_IMAGE_PATH_REGEX);

    if (!matches) {
      return null;
    }

    const [, projectId, dataset, assetId, width, height, extension] = matches;

    return {
      projectId,
      dataset,
      assetId,
      width: Number(width),
      height: Number(height),
      extension,
    };
  } catch {
    return null;
  }
}

export function buildResponsiveImageUrls(source: SanityImageSource) {
  return {
    small: urlFor(source)
      .width(640)
      .fit("max")
      .quality(80)
      .auto("format")
      .url(),
    medium: urlFor(source)
      .width(1200)
      .fit("max")
      .quality(82)
      .auto("format")
      .url(),
    large: urlFor(source)
      .width(1920)
      .height(1080)
      .fit("crop")
      .quality(84)
      .auto("format")
      .url(),
  };
}
