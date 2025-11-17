const express = require('express');
const cors = require('cors');

const accountRoutes = require('./routes/accountRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'OnlyVibes API', status: 'ok' });
});

app.use(accountRoutes);
app.use(eventRoutes);
app.use(reviewRoutes);

app.use((req, res, next) => {
  if (res.headersSent) {
    return next();
  }

  return res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const payload = { message: err.message || 'Internal server error' };
  if (err.details) {
    payload.details = err.details;
  }

  return res.status(status).json(payload);
});

module.exports = app;
