import express from 'express';
import accountRoutes from './routes/accountRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

const app = express();
app.use(express.json());

app.use('/accounts', accountRoutes);
app.use('/events', eventRoutes);
// server.js


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`OnlyVibes API listening on http://localhost:${PORT}`);
});
