/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ success: false, error: err.message });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON in request body.' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
