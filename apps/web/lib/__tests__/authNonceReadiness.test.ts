import {
  checkAuthNonceReadiness,
  isDatabaseUrlConfigured,
  isSessionSecretConfigured,
  summarizeAuthNonceError,
} from "../authNonceReadiness";

describe("auth nonce readiness", () => {
  it("detects supported database env vars", () => {
    expect(isDatabaseUrlConfigured({})).toBe(false);
    expect(isDatabaseUrlConfigured({ DATABASE_URL: "postgresql://example" })).toBe(true);
    expect(isDatabaseUrlConfigured({ PRISMA_DATABASE_URL: "postgresql://example" })).toBe(true);
    expect(isDatabaseUrlConfigured({ POSTGRES_URL: "postgresql://example" })).toBe(true);
  });

  it("detects the session JWT secret", () => {
    expect(isSessionSecretConfigured({})).toBe(false);
    expect(isSessionSecretConfigured({ SESSION_JWT_SECRET: "secret" })).toBe(true);
    expect(isSessionSecretConfigured({ SESSION_JWT_SECRET: "   " })).toBe(false);
  });

  it("reports healthy AuthNonce DB access", async () => {
    const prisma = {
      authNonce: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    await expect(
      checkAuthNonceReadiness({
        prisma,
        env: {
          DATABASE_URL: "postgresql://example",
          SESSION_JWT_SECRET: "secret",
        },
      })
    ).resolves.toEqual({
      ok: true,
      databaseUrlConfigured: true,
      sessionSecretConfigured: true,
      authNonceQueryOk: true,
    });
    expect(prisma.authNonce.count).toHaveBeenCalledWith({ take: 1 });
  });

  it("summarizes Prisma-style failures without throwing", async () => {
    const err = Object.assign(new Error('relation "AuthNonce" does not exist'), {
      name: "PrismaClientKnownRequestError",
      code: "P2021",
    });
    const prisma = {
      authNonce: {
        count: jest.fn().mockRejectedValue(err),
      },
    };

    const result = await checkAuthNonceReadiness({
      prisma,
      env: { SESSION_JWT_SECRET: "secret" },
    });

    expect(result).toMatchObject({
      ok: false,
      databaseUrlConfigured: false,
      sessionSecretConfigured: true,
      authNonceQueryOk: false,
      errorName: "PrismaClientKnownRequestError",
      errorCode: "P2021",
    });
  });

  it("truncates long error messages", () => {
    const summary = summarizeAuthNonceError({
      name: "LongError",
      code: "P1001",
      message: "x".repeat(400),
    });
    expect(summary.errorName).toBe("LongError");
    expect(summary.errorCode).toBe("P1001");
    expect(summary.errorMessage).toHaveLength(300);
  });
});
