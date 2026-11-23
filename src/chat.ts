export interface Message {
  role: 'user' | 'model';
  text: string;
}

export function chatEndpoint(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
    (url.pathname !== '/' && url.pathname !== '/chat')) {
    throw new Error('Indique l’adresse HTTPS du serveur NAËLKA.');
  }
  url.pathname = '/chat';
  return url.toString();
}

export async function askGemini(endpoint: string, token: string, messages: Message[], signal: AbortSignal) {
  const response = await fetch(chatEndpoint(endpoint), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.slice(-11) }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]),
    credentials: 'omit',
    redirect: 'error',
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Code d’accès incorrect.');
    if (response.status === 429) throw new Error('Trop de demandes. Réessaie dans une minute.');
    throw new Error('Le serveur Gemini n’a pas pu répondre.');
  }
  const data = await response.json();
  if (typeof data?.reply !== 'string' || !data.reply.trim() || data.reply.length > 4000) {
    throw new Error('Réponse du serveur invalide.');
  }
  return data.reply as string;
}
