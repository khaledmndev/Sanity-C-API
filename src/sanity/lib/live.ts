import "server-only";

import { defineLive } from "next-sanity/live";

import { assertServerEnv } from "@/sanity/env";
import { getServerClient } from "@/sanity/lib/client";

const serverToken = assertServerEnv(
  "SANITY_API_READ_TOKEN",
  process.env.SANITY_API_READ_TOKEN,
);

const client = getServerClient({
  token: serverToken,
  perspective: "published",
  useCdn: true,
});

export const { sanityFetch: liveSanityFetch, SanityLive } = defineLive({
  client,
  serverToken,
  // Browser token is only used during visual editing and draft previews.
  // Use a least-privilege viewer token.
  browserToken: serverToken,
  strict: true,
});
