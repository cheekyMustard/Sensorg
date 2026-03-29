import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import path from 'path';

import authRouter from './routes/auth.js';
import bikesRouter from './routes/bikes.js';
import requestsRouter from './routes/requests.js';
import shopsRouter from './routes/shops.js';
import pushRouter from './routes/push.js';
import adminRouter from './routes/admin.js';
import notesRouter from './routes/notes.js';
import tasksRouter from './routes/tasks.js';
import kbRouter    from './routes/kb.js';
import usersRouter     from './routes/users.js';
import excursionsRouter    from './routes/excursions.js';
import repairRequestsRouter from './routes/repair_requests.js';
import uploadsRouter        from './routes/uploads.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin in prod)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Body size limit
app.use(express.json({ limit: '50kb' }));


app.use('/api/auth', authRouter);
app.use('/api/bikes', bikesRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/push',  pushRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/kb',    kbRouter);
app.use('/api/users',      usersRouter);
app.use('/api/excursions',      excursionsRouter);
app.use('/api/repair-requests', repairRequestsRouter);
app.use('/api/uploads',         uploadsRouter);

// Serve uploaded files
const __uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../uploads');
app.use('/uploads', express.static(__uploadsDir));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve frontend in production
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '../../frontend-dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
