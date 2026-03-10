import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export async function validateContract<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data?: T; errorResponse?: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        errorResponse: NextResponse.json(
          {
            error: "CONTRACT_VALIDATION_FAILED",
            message:
              "The provided request body does not match the strict API contract.",
            details: error.errors,
          },
          { status: 400 },
        ),
      };
    }

    return {
      errorResponse: NextResponse.json(
        { error: "MALFORMED_JSON", message: "Failed to parse request JSON." },
        { status: 400 },
      ),
    };
  }
}
