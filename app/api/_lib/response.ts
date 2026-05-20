import { NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_dtos";

export function ok<T>(result: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    { status: "OK", result },
    { status },
  );
}

export function okEmpty(
  status = 200,
): NextResponse<ApiResponse<undefined>> {
  return NextResponse.json<ApiResponse<undefined>>(
    { status: "OK", result: undefined },
    { status },
  );
}
