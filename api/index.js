// Vercel Serverless Function entry point
require('dotenv').config();
const app = require('../server/src/app');

module.exports = (req, res) => {
  return app(req, res);
};
