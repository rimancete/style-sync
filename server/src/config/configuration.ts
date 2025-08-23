export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'dev-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  health: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true' || true,
    databaseTimeout: parseInt(
      process.env.HEALTH_CHECK_DATABASE_TIMEOUT || '5000',
      10,
    ),
  },

  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true' || true,
    title: process.env.SWAGGER_TITLE || 'StyleSync API',
    description:
      process.env.SWAGGER_DESCRIPTION ||
      'Multi-location barbershop booking system API',
    version: process.env.SWAGGER_VERSION || '1.0',
  },
});
