import { createClient } from "next-sanity";

import { sanityConfig } from "@/sanity/env";

type ServerClientOptions = {
  token?: string;
  perspective?: "published" | "drafts" | "raw";
  stega?: boolean;
  useCdn?: boolean;
};

export const publicClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  useCdn: true,
  perspective: "published",
  stega: {
    enabled: false,
    studioUrl: sanityConfig.studioUrl,
  },
});

export function getServerClient(options: ServerClientOptions = {}) {
  const {
    token,
    perspective = "published",
    stega = false,
    useCdn = perspective === "published" && !token,
  } = options;

  return createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn,
    perspective,
    token,
    stega: {
      enabled: stega,
      studioUrl: sanityConfig.studioUrl,
    },
  });
}
