require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'segredo',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
