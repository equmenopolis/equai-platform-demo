import { NextResponse } from "next/server";
import type { ApiResponse } from "@/app/_dtos";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorToResponse(err: unknown): NextResponse<ApiResponse> {
  if (err instanceof AppError) {
    return NextResponse.json<ApiResponse>(
      { status: "ERROR", errorMessage: err.message },
      { status: err.status },
    );
  }
  console.error("[api] unexpected error:", err);
  return NextResponse.json<ApiResponse>(
    { status: "ERROR", errorMessage: "Internal Server Error" },
    { status: 500 },
  );
}
