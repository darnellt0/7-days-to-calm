import express from 'express';
import { memoryStore } from './store/memoryStore.js';
import { setChallengeDayHandler } from './tools/setChallengeDay.js';
import { trackEventHandler } from './tools/trackEvent.js';
import { setReminderHandler } from './tools/setReminder.js';
import { decideRoute } from './routes/sessionRouter.js';
import { convaiRouter } from './routes/convai.js';

const app = express();
app.use(express.json());

// Simple user resolver for the stub
function resolveUserId(req: express.Request): string {
  return (req.header('x-user-id') || 'demo-user').toString();
}

app.get('/api/route', (req, res) => {
  const utterance = (req.query.utterance as string) || '';
  const challenge_day = req.query.challenge_day ? Number(req.query.challenge_day) : undefined;
  const route = decideRoute({ utterance, challenge_day });
  res.json(route);
});

app.post('/api/tools/setChallengeDay', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const result = await setChallengeDayHandler(memoryStore, userId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/tools/trackEvent', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const result = await trackEventHandler(memoryStore, userId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/api/tools/setReminder', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const result = await setReminderHandler(memoryStore, userId, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/api/user', async (req, res) => {
  const userId = resolveUserId(req);
  const user = await memoryStore.getUser(userId);
  res.json(user);
});

app.use('/convai', convaiRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`[shria] server listening on http://localhost:${port}`);
});
