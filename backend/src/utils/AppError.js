export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class AIProviderError extends AppError {
  constructor(message) {
    super(message, 502);
  }
}

export class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}
