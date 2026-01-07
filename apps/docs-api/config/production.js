module.exports = {
  env: 'production',
  strapi: {
    baseUrl: process.env.STRAPI_URL || 'http://localhost:1337',
    apiToken: process.env.STRAPI_API_TOKEN || '',
  }
};
