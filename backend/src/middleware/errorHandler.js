export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);


  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      msg: "A record with this information already exists",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      msg: "Record not found",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }


  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      msg: "Invalid token"
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      msg: "Token expired"
    });
  }


  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      msg: "Validation failed",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }


  res.status(err.status || 500).json({
    success: false,
    msg: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};


export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    msg: `Route ${req.originalUrl} not found`
  });
};
