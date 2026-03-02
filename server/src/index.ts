import express from 'express';
import cors from 'cors';
import filesRouter from './routes/files';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow all origins — the download website (different domain) needs to fetch encrypted blobs
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Health check — used by Render and for app warm-up pings
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/', filesRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
