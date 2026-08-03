export interface AppErrorDetail {
  path?: string;
  message: string;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: AppErrorDetail[];

  constructor(status: number, code: string, message: string, details?: AppErrorDetail[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(code: string, message: string, details?: AppErrorDetail[]): AppError {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED"): AppError {
    return new AppError(401, code, message);
  }
  static forbidden(message = "You do not have access to this resource", code = "FORBIDDEN"): AppError {
    return new AppError(403, code, message);
  }
  static notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
    return new AppError(404, code, message);
  }
  static conflict(code: string, message: string): AppError {
    return new AppError(409, code, message);
  }
}
