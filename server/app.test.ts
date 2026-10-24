import request from 'supertest';
import { createApp } from './app';
const body = { sessionId: 'c67bf59d-b40b-411a-bf37-7b0001472f12', action: 'summary' };
test('AI endpoint streams actual provider deltas and validated completion', async () => {
  const app = createApp(async (_m, emit) => {
    emit('Four ');
    emit('items');
    return { text: 'Four items', priorities: [], sources: [] };
  }, 100);
  const r = await request(app).post('/api/ai').send(body);
  expect(r.status).toBe(200);
  expect(r.headers['content-type']).toContain('text/event-stream');
  expect(r.text).toContain('"type":"delta"');
  expect(r.text).toContain('"fallback":false');
});
test('a stalled provider returns fallback, not raw 500', async () => {
  const r = await request(createApp(() => new Promise(() => {}), 15))
    .post('/api/ai')
    .send(body);
  expect(r.status).toBe(200);
  expect(r.text).toContain('"reason":"timeout"');
  expect(r.text).toContain('"fallback":true');
});
test('provider failure after partial text resets with fallback', async () => {
  const r = await request(
    createApp(async (_m, emit) => {
      emit('Partial');
      throw Error('secret key detail');
    }, 100),
  )
    .post('/api/ai')
    .send(body);
  expect(r.text).toContain('"fallback":true');
  expect(r.text).not.toContain('secret key detail');
});
test('bad request returns 400 before calling provider', async () => {
  const mock = jest.fn();
  const r = await request(createApp(mock)).post('/api/ai').send({ action: 'hack' });
  expect(r.status).toBe(400);
  expect(mock).not.toHaveBeenCalled();
});
test('rate limit blocks session after 12 calls', async () => {
  const app = createApp(async () => ({ text: 'Hi', priorities: [], sources: [] }), 100);
  for (let i = 0; i < 12; i++)
    expect((await request(app).post('/api/ai').send(body)).status).toBe(200);
  expect((await request(app).post('/api/ai').send(body)).status).toBe(429);
});

test('provider billing failures stream an actionable explanation without leaking secrets', async () => {
  const r = await request(
    createApp(async () => {
      throw Object.assign(new Error('sk-private-secret'), {
        status: 429,
        code: 'insufficient_quota',
      });
    }, 100),
  )
    .post('/api/ai')
    .send(body);
  expect(r.status).toBe(200);
  expect(r.text).toContain('quota_exceeded');
  expect(r.text).not.toContain('sk-private-secret');
});
