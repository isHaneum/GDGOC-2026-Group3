import { NextResponse } from "next/server";
import { ApiError } from "../../../server/services/apiHandlers";

export function jsonResponse<T>(payload: T) {
  return NextResponse.json(payload);
}

export function jsonError(error: unknown) {
  console.error(error);
  const status = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Unknown server error";
  return NextResponse.json({ error: message }, { status });
}
