type PublicSanityEnv = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: string;
  NEXT_PUBLIC_SANITY_DATASET: string;
  NEXT_PUBLIC_SANITY_API_VERSION: string;
  NEXT_PUBLIC_SANITY_STUDIO_URL: string;
};

const requiredPublicEnv: Array<keyof PublicSanityEnv> = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION",
  "NEXT_PUBLIC_SANITY_STUDIO_URL",
];

function requiredEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[sanity/env] Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const rawPublicEnv: PublicSanityEnv = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: requiredEnv(
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  ),
  NEXT_PUBLIC_SANITY_DATASET: requiredEnv(
    "NEXT_PUBLIC_SANITY_DATASET",
    process.env.NEXT_PUBLIC_SANITY_DATASET,
  ),
  NEXT_PUBLIC_SANITY_API_VERSION: requiredEnv(
    "NEXT_PUBLIC_SANITY_API_VERSION",
    process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  ),
  NEXT_PUBLIC_SANITY_STUDIO_URL: requiredEnv(
    "NEXT_PUBLIC_SANITY_STUDIO_URL",
    process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  ),
};

for (const key of requiredPublicEnv) {
  if (!rawPublicEnv[key]) {
    throw new Error(
      `[sanity/env] Missing required environment variable: ${key}`,
    );
  }
}

export const publicSanityEnv = {
  ...rawPublicEnv,
  NEXT_PUBLIC_SANITY_STUDIO_URL: normalizeUrl(
    rawPublicEnv.NEXT_PUBLIC_SANITY_STUDIO_URL,
  ),
} as const;

export const sanityConfig = {
  projectId: publicSanityEnv.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: publicSanityEnv.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: publicSanityEnv.NEXT_PUBLIC_SANITY_API_VERSION,
  studioUrl: publicSanityEnv.NEXT_PUBLIC_SANITY_STUDIO_URL,
} as const;

export function assertServerEnv(
  name: string,
  value: string | undefined,
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[sanity/env] Missing required server environment variable: ${name}`,
    );
  }

  return value;
}
