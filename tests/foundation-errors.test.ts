/**
 * Error mapping must survive duplicate module instances (Next.js dev
 * can load `errors.ts` in several route bundles, breaking bare
 * `instanceof`). These tests simulate foreign-bundle error objects —
 * same name/shape, different class identity — and pin the mapping.
 * Regression: live dev verification returned 500 INTERNAL instead of
 * 409/422 before the structural check existed.
 */

import { describe, expect, it } from "vitest";
import { ApiError, toApiError, VersionConflictError } from "@/server/foundation/errors";

class ForeignApiError extends Error {
  readonly code = "VALIDATION_FAILED" as const;
  readonly httpStatus = 422;
  readonly messageKey = "errors.validationFailed";
  readonly fieldErrors = { workspaceId: ["readOnly"] };
  constructor() {
    super("VALIDATION_FAILED");
    this.name = "ApiError";
  }
}

class ForeignVersionConflict extends Error {
  constructor() {
    super("Version conflict on customer c1");
    this.name = "VersionConflictError";
  }
}

describe("toApiError", () => {
  it("passes native ApiError through untouched", () => {
    const error = new ApiError("NOT_FOUND");
    expect(toApiError(error)).toBe(error);
  });

  it("reconstructs a foreign-bundle ApiError with its fields intact", () => {
    const mapped = toApiError(new ForeignApiError());
    expect(mapped).toBeInstanceOf(ApiError);
    expect(mapped.code).toBe("VALIDATION_FAILED");
    expect(mapped.httpStatus).toBe(422);
    expect(mapped.fieldErrors).toEqual({ workspaceId: ["readOnly"] });
  });

  it("maps native and foreign version conflicts to CONFLICT_VERSION", () => {
    expect(toApiError(new VersionConflictError("customer", "c1")).code).toBe("CONFLICT_VERSION");
    expect(toApiError(new ForeignVersionConflict()).code).toBe("CONFLICT_VERSION");
    expect(toApiError(new ForeignVersionConflict()).httpStatus).toBe(409);
  });

  it("maps anything else to INTERNAL without leaking details", () => {
    const mapped = toApiError(new Error("sensitive internals here"));
    expect(mapped.code).toBe("INTERNAL");
    expect(mapped.httpStatus).toBe(500);
    expect(mapped.message).toBe("INTERNAL");
  });

  it("does not trust arbitrary objects that merely look error-ish", () => {
    const mapped = toApiError({ name: "ApiError", code: "NOT_A_CODE", messageKey: "x" });
    expect(mapped.code).toBe("INTERNAL");
  });
});
