
/** Thrown when a requested resource does not exist (maps to HTTP 404). */
export class NotFoundError extends Error {
  readonly status = 404;
  constructor(resource: string, id: number | string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

/** General-purpose HTTP error with an explicit status code. */
export class AppError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}
