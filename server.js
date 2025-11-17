import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { logger } from './middleware/logger.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    logger.info(`OnlyVibes API running on port ${PORT}`);
  });
};

startServer();
