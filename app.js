// This file configures Express: middleware, API routes, and static files.
// Business rules are kept in lib/resort.js so routes stay short. (SERVICES layer)

const express = require('express');
const path = require('path');
const { createResortStore } = require('./lib/resort');

const ASSETS_ROOT = path.join(__dirname, 'public', 'static', 'assets');

function createApp(options) {
  const app = express();
  const resort = createResortStore(options);

  // Parse JSON request bodies and reject unexpectedly large requests early.
  app.use(express.json({ limit: '10kb' }));

  // Express safely serves only files inside these explicitly configured folders.
  // Map artwork is part of the public bundle and lives under public/static/assets.
  // Keep the /assets URL used by the frontend while serving from the real folder.
  app.use('/assets', express.static(ASSETS_ROOT));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (request, response) => {
    response.json({ ok: true });
  });

  app.get('/api/map', (request, response) => {
    response.json(resort.getMap());
  });

  app.post('/api/bookings', (request, response) => {
    const body = request.body || {};
    const result = resort.bookCabana({
      cabanaId: String(body.cabanaId || '').trim(),
      room: String(body.room || '').trim(),
      guestName: String(body.guestName || '').trim(),
    });
    response.status(result.status).json(result.body);
  });

  // express.json reports malformed JSON here instead of crashing the process.
  app.use((error, request, response, next) => {
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'The request is too large.' });
    if (error instanceof SyntaxError && error.status === 400) {
      return response.status(400).json({ error: 'The request body must contain valid JSON.' });
    }
    return next(error);
  });

  return app;
}

module.exports = { createApp };
