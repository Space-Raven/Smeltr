export class AuthenticationError extends Error {
  constructor(message: string = "Not authenticated") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  constructor(public issues: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network request failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public simulationError?: unknown,
    public signature?: string
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
