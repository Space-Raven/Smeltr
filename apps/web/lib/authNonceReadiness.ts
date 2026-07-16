export type AuthNonceReadiness =
  | {
      ok: true;
      databaseUrlConfigured: boolean;
      sessionSecretConfigured: boolean;
      authNonceQueryOk: true;
    }
  | {
      ok: false;
      databaseUrlConfigured: boolean;
      sessionSecretConfigured: boolean;
      authNonceQueryOk: false;
      errorName: string;
      errorCode: string | null;
      errorMessage: string;
    };

export function isDatabaseUrlConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !!(
    env.DATABASE_URL?.trim() ||
    env.PRISMA_DATABASE_URL?.trim() ||
    env.POSTGRES_PRISMA_URL?.trim() ||
    env.POSTGRES_URL?.trim() ||
    env.POSTGRES_URL_NON_POOLING?.trim()
  );
}

export function isSessionSecretConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  return !!env.SESSION_JWT_SECRET?.trim();
}

export function summarizeAuthNonceError(err: unknown): {
  errorName: string;
  errorCode: string | null;
  errorMessage: string;
} {
  const shaped = err as { name?: unknown; code?: unknown; message?: unknown };
  return {
    errorName: typeof shaped?.name === "string" ? shaped.name : "Error",
    errorCode: typeof shaped?.code === "string" ? shaped.code : null,
    errorMessage:
      typeof shaped?.message === "string"
        ? shaped.message.slice(0, 300)
        : "Unknown auth nonce readiness error",
  };
}

export async function checkAuthNonceReadiness(args: {
  prisma: { authNonce: { count: (args?: unknown) => Promise<number> } };
  env?: Record<string, string | undefined>;
}): Promise<AuthNonceReadiness> {
  const env = args.env ?? process.env;
  const databaseUrlConfigured = isDatabaseUrlConfigured(env);
  const sessionSecretConfigured = isSessionSecretConfigured(env);

  try {
    await args.prisma.authNonce.count({ take: 1 });
    return {
      ok: true,
      databaseUrlConfigured,
      sessionSecretConfigured,
      authNonceQueryOk: true,
    };
  } catch (err) {
    return {
      ok: false,
      databaseUrlConfigured,
      sessionSecretConfigured,
      authNonceQueryOk: false,
      ...summarizeAuthNonceError(err),
    };
  }
}
