import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/init.js';
import { authRouter } from './routes/auth.js';
import { videoRouter } from './routes/videos.js';
import { subscriptionRouter } from './routes/subscriptions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/auth', authRouter);
app.use('/api/videos', videoRouter);
app.use('/api/subscriptions', subscriptionRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Content Repurposer API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
