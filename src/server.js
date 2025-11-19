import app from './app.js';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';

dotenv.config();

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`OnlyVibes API listening on http://localhost:${PORT}`);
});




