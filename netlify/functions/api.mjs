// Wraps the Express app from server/index.js so every /api/* route
// works as a Netlify serverless function.
import serverless from 'serverless-http';
import { app } from '../../server/index.js';

const expressHandler = serverless(app);

export const handler = async (event, context) => {
  // Netlify rewrites /api/* -> /.netlify/functions/api/* — restore the
  // /api prefix so Express routes match as they do locally.
  if (event.path?.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '/api');
  }
  return expressHandler(event, context);
};
