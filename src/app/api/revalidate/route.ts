import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { assertServerEnv } from "@/sanity/env";

type RevalidateBody = {
  tags?: string[];
  paths?: string[];
};

function uniqueStrings(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

export async function POST(request: Request) {
  const expectedSecret = assertServerEnv(
    "SANITY_REVALIDATE_SECRET",
    process.env.SANITY_REVALIDATE_SECRET,
  );

  const requestUrl = new URL(request.url);
  const providedSecret =
    requestUrl.searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { message: "Invalid revalidate secret" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RevalidateBody;

  const tags = uniqueStrings(body.tags);
  const paths = uniqueStrings(body.paths);

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      {
        message:
          "No tags or paths supplied. Send { tags?: string[], paths?: string[] }.",
      },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    tags,
    paths,
  });
}
