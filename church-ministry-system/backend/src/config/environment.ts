import * as path from 'path';

export default () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'church_ministry',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  tenant: {
    resolution: process.env.TENANT_RESOLUTION || 'header',
  },
  upload: {
    dir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
});
