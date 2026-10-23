const fs = require('fs');
require('dotenv').config();

const caPath = process.env.AIVEN_DB_CA_PATH || process.env.DB_CA_PATH;
const ca = process.env.AIVEN_DB_CA
  ? process.env.AIVEN_DB_CA.replace(/\\n/g, '\n')
  : caPath && fs.existsSync(caPath)
    ? fs.readFileSync(caPath, 'utf8')
    : undefined;

const sharedDefine = {
  underscored: true,
  paranoid: false,
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'church_ministry',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    define: sharedDefine,
    migrationStorageTableName: 'sequelize_meta',
  },
  production: {
    dialect: 'mysql',
    host: process.env.AIVEN_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.AIVEN_DB_PORT || process.env.DB_PORT, 10) || 3306,
    database: process.env.AIVEN_DB_NAME || process.env.DB_NAME,
    username: process.env.AIVEN_DB_USER || process.env.DB_USER,
    password: process.env.AIVEN_DB_PASS || process.env.DB_PASS,
    define: sharedDefine,
    migrationStorageTableName: 'sequelize_meta',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions:
      process.env.AIVEN_DB_SSL_MODE === 'REQUIRED'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: true,
              ...(ca ? { ca } : {}),
            },
          }
        : undefined,
  },
};
