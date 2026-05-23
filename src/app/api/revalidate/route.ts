import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { assertServerEnv } from "@/sanity/env";

type RevalidateBody = {
  tags?: string[];
  paths?: string[];
};

type RevalidateInput = {
  tags: string[];
  paths: string[];
};

const DEFAULT_REVALIDATE_TAGS = [
  "settings",
  "page",
  "post",
  "product",
  "products",
  "seo",
];

function uniqueStrings(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function splitCsv(input: string | null): string[] {
  if (!input) {
    return [];
  }

  return uniqueStrings(input.split(","));
}

function validateSecret(request: NextRequest): NextResponse | null {
  const expectedSecret = assertServerEnv(
    "SANITY_REVALIDATE_SECRET",
    process.env.SANITY_REVALIDATE_SECRET,
  );

  const providedSecret =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, message: "Invalid revalidate secret" },
      { status: 401 },
    );
  }

  return null;
}

async function runRevalidation(input: RevalidateInput) {
  for (const tag of input.tags) {
    revalidateTag(tag);
  }

  for (const path of input.paths) {
    revalidatePath(path);
  }
}

function jsonSuccess(input: RevalidateInput) {
  return NextResponse.json(
    {
      success: true,
      message: "Revalidated successfully",
      revalidated: {
        tags: input.tags,
        paths: input.paths,
      },
    },
    { status: 200 },
  );
}

function jsonFailure(message: string, error?: unknown) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  return NextResponse.json(
    {
      success: false,
      message,
      ...(error ? { error: errorMessage } : {}),
    },
    { status: error ? 500 : 400 },
  );
}

function normalizeInput(tags: string[], paths: string[]): RevalidateInput {
  if (tags.length === 0 && paths.length === 0) {
    return {
      tags: DEFAULT_REVALIDATE_TAGS,
      paths: [],
    };
  }

  return { tags, paths };
}

export async function GET(request: NextRequest) {
  const authError = validateSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const tags = splitCsv(request.nextUrl.searchParams.get("tags"));
    const paths = splitCsv(request.nextUrl.searchParams.get("paths"));
    const input = normalizeInput(tags, paths);

    await runRevalidation(input);

    return jsonSuccess(input);
  } catch (error: unknown) {
    return jsonFailure("Failed to revalidate.", error);
  }
}

export async function POST(request: NextRequest) {
  const authError = validateSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as RevalidateBody;

    const tags = uniqueStrings(body.tags);
    const paths = uniqueStrings(body.paths);

    const input = normalizeInput(tags, paths);

    await runRevalidation(input);

    return jsonSuccess(input);
  } catch (error: unknown) {
    return jsonFailure("Failed to revalidate.", error);
  }
}
