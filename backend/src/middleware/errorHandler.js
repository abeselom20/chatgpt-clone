// Centralized error handler. Any error passed to next(err) lands here.
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong. Please try again.";

  res.status(statusCode).json({ success: false, message });
};
