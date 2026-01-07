module.exports = {
  port: 3002,
  env: 'development',
  dashboard: {
    caller: 'mlive',
    apikey: '70f1b6f1234567890abcdef',
  },
  strapi: {
    baseUrl: 'http://127.0.0.1:1337',
    apiToken: 'your-strapi-api-token',
  },
  corsOrigins: ['http://localhost:5173', 'http://localhost:8082'],
};
