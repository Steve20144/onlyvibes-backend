import express from 'express';
import accountRoutes from './routes/accountRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

const app = express();
app.use(express.json());

app.use('/accounts', accountRoutes);
app.use('/events', eventRoutes);
