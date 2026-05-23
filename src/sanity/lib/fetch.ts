import "server-only";

import type { ClientPerspective, QueryParams } from "next-sanity";
import { draftMode } from "next/headers";

import { assertServerEnv } from "@/sanity/env";
import { getServerClient } from "@/sanity/lib/client";
import { liveSanityFetch } from "@/sanity/lib/live";

export type SanityFetchOptions<Params extends QueryParams = QueryParams> = {
  query: string;
  params?: Params;
  tags?: string[];
  revalidate?: number | false;
  draftMode?: boolean;
  live?: boolean;
  token?: string;
  perspective?: ClientPerspective;
  stega?: boolean;
};

function getNextCacheOptions(options: {
  tags?: string[];
  revalidate?: number | false;
  disableCache?: boolean;
}) {
  const { tags, revalidate, disableCache } = options;

  if (disableCache) {
    return { cache: "no-store" as const };
  }

  return {
    next: {
      ...(typeof revalidate === "number" ? { revalidate } : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
    },
  };
}

export async function sanityFetch<T, Params extends QueryParams = QueryParams>(
  options: SanityFetchOptions<Params>,
): Promise<T> {
  const {
    query,
    params,
    tags,
    revalidate = 60,
    draftMode: draftModeOverride,
    live = false,
    token,
    perspective,
    stega,
  } = options;

  const { isEnabled: draftEnabledInRequest } = await draftMode();
  const isDraftMode = draftModeOverride ?? draftEnabledInRequest;

  const readToken = token ?? process.env.SANITY_API_READ_TOKEN;
  const resolvedToken = isDraftMode
    ? assertServerEnv("SANITY_API_READ_TOKEN", readToken)
    : readToken;

  if (live) {
    const result = await liveSanityFetch<T, Params>({
      query,
      params,
      perspective: perspective ?? (isDraftMode ? "drafts" : "published"),
      stega: stega ?? isDraftMode,
      lastLiveEventId: null,
      ...(tags && tags.length > 0 ? { tags } : {}),
    });

    return result.data;
  }

  const resolvedPerspective =
    perspective ?? (isDraftMode ? "drafts" : "published");
  const client = getServerClient({
    token: resolvedToken,
    perspective: resolvedPerspective,
    stega: stega ?? isDraftMode,
    useCdn: !isDraftMode && !resolvedToken,
  });

  const cacheOptions = getNextCacheOptions({
    tags,
    revalidate,
    disableCache: isDraftMode,
  });

  return client.fetch<T, Params>(query, params ?? ({} as Params), cacheOptions);
}
