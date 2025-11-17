import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
