import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatServer, validMessages } from './chat.mjs';

const messages = [{ role: 'user', text: 'Bonjour' }];

test('vérifie la forme et limite la taille des messages', () => {
  assert.equal(validMessages(messages), true);
  assert.equal(validMessages([{ role: 'model', text: 'Bonjour' }]), false);
  assert.equal(validMessages([{ role: 'user', text: 'a'.repeat(4001) }]), false);
  assert.equal(validMessages([{ ...messages[0], tool: 'settings' }]), false);
});

test('protège Gemini, valide ses réponses et limite les appels', async t => {
  const token = 'a'.repeat(40);
  let calls = 0;
  const server = chatServer({ token, key: 'server-key', model: 'gemini-example',
    request: async (_url, options) => {
      assert.equal(options.headers['x-goog-api-key'], 'server-key');
      return Response.json(calls++ === 0
        ? { candidates: [{ content: { parts: [{ text: 'Salut' }] } }] }
        : { candidates: [] });
    },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const send = (authorization, body = { messages }) => fetch(
    `http://127.0.0.1:${server.address().port}/chat`, {
      method: 'POST',
      headers: { authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  assert.equal((await send('Bearer invalid')).status, 401);
  assert.equal((await send('Bearer ' + token, {})).status, 400);
  assert.deepEqual(await (await send('Bearer ' + token)).json(), { reply: 'Salut' });
  for (let count = 0; count < 10; count++) assert.equal((await send('Bearer ' + token)).status, 502);
  assert.equal((await send('Bearer ' + token)).status, 429);
});
