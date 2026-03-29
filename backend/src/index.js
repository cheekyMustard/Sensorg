import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

const app = express();

app.use(cors());
app.use(express.json());

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
