import "server-only";

import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { assertServerEnv } from "@/sanity/env";

function getSafeRedirectPath(input: string | null): string {
  if (!input) {
    return "/";
  }

  if (!input.startsWith("/")) {
    return "/";
  }

  if (input.startsWith("//")) {
    return "/";
  }

  return input;
}

export async function GET(request: Request) {
  const secret = assertServerEnv(
    "SANITY_PREVIEW_SECRET",
    process.env.SANITY_PREVIEW_SECRET,
  );
  const requestUrl = new URL(request.url);
  const providedSecret = requestUrl.searchParams.get("secret");

  if (!providedSecret || providedSecret !== secret) {
    return NextResponse.json(
      { message: "Invalid preview secret" },
      { status: 401 },
    );
  }

  const slug = requestUrl.searchParams.get("slug");
  const redirectTo = getSafeRedirectPath(slug);

  const draft = await draftMode();
  draft.disable();

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
