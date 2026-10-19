class AppError extends Error {
  constructor(message, statusCode, { expose = false } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

module.exports = AppError;
