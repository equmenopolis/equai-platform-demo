import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { AppError } from "./app-error";

export async function validateBody<T>(
  req: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
      "VALIDATION_ERROR",
      400,
    );
  }
  return parsed.data;
}
