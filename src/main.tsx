import { createRoot } from 'react-dom/client';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useRef, useState, type FormEvent } from 'react';
import { askGemini, chatEndpoint, type Message } from './chat';
import './style.css';

interface NaelkaBridge {
  openSettings(): Promise<void>;
  dictate(): Promise<{ text: string }>;
  speak(options: { text: string }): Promise<void>;
  stopSpeech(): Promise<void>;
}

const bridge = registerPlugin<NaelkaBridge>('NaelkaBridge');
const android = Capacitor.getPlatform() === 'android';

function App() {
  const [endpoint, setEndpoint] = useState('');
  const [token, setToken] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [dictating, setDictating] = useState(false);
  const request = useRef<AbortController | null>(null);

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || request.current) return;
    setError('');
    try {
      chatEndpoint(endpoint);
    } catch {
      setError('Indique l’adresse HTTPS du serveur NAËLKA.');
      return;
    }
    if (!token.trim()) {
      setError('Renseigne le code d’accès du serveur.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    const next: Message[] = [...messages, { role: 'user', text }];
    try {
      const reply = await askGemini(endpoint, token.trim(), next, controller.signal);
      if (!controller.signal.aborted) {
        const answer: Message = { role: 'model', text: reply };
        setMessages([...next, answer].slice(-12));
        setDraft('');
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof TypeError ? 'Impossible de joindre le serveur NAËLKA.' :
          cause instanceof Error ? cause.message : 'Impossible de récupérer une réponse.');
      }
    } finally {
      request.current = null;
      setPending(false);
    }
  }

  async function dictate() {
    setDictating(true);
    setError('');
    try {
      const result = await bridge.dictate();
      setDraft(result.text.slice(0, 4000));
    } catch (cause) {
      if (!(cause instanceof Error && cause.message === 'DICTATION_CANCELLED')) {
        setError('Dictée indisponible. Vérifie le microphone et le service vocal Android.');
      }
    } finally {
      setDictating(false);
    }
  }

  async function nativeAction(action: () => Promise<void>, failure: string) {
    setError('');
    try {
      await action();
    } catch {
      setError(failure);
    }
  }

  return (
    <main>
      <header>
        <div className="orb" aria-hidden="true" />
        <h1>NAËLKA AI</h1>
      </header>
      <details open>
        <summary>Connexion Gemini</summary>
        <label>Adresse HTTPS du serveur<input type="url" value={endpoint} disabled={pending}
          onChange={event => { setEndpoint(event.target.value); setMessages([]); }} /></label>
        <label>Code d’accès<input type="password" autoComplete="off" value={token} disabled={pending}
          onChange={event => { setToken(event.target.value); setMessages([]); }} /></label>
        <p>Les messages envoyés et les derniers échanges sont transmis à Gemini. Le code et l’historique sont conservés pendant la session.</p>
      </details>
      <section aria-label="Conversation" aria-live="polite">
        {messages.map((message, index) => (
          <article key={index} className={message.role}>
            <strong>{message.role === 'user' ? 'Toi' : 'NAËLKA'}</strong>
            <p>{message.text}</p>
            {android && message.role === 'model' && <button onClick={() => nativeAction(
              () => bridge.speak({ text: message.text }), 'Installe ou configure une voix française dans Android.')}>Lire</button>}
          </article>
        ))}
      </section>
      <form onSubmit={send}>
        <label>Message<textarea rows={3} value={draft} maxLength={4000} disabled={pending || dictating}
          onChange={event => setDraft(event.target.value)} /></label>
        <div className="actions">
          {android && <button type="button" disabled={pending || dictating} onClick={dictate}>Dicter en français</button>}
          <button type="submit" disabled={!draft.trim() || pending || dictating}>Envoyer</button>
          {pending && <button type="button" onClick={() => request.current?.abort()}>Annuler</button>}
        </div>
        {pending && <p role="status">Gemini répond…</p>}
      </form>
      <div className="actions">
        <button disabled={pending || dictating} onClick={() => { setMessages([]); setDraft(''); }}>Effacer la conversation</button>
        {android && <button onClick={() => nativeAction(() => bridge.stopSpeech(), 'Impossible d’interrompre la lecture.')}>Arrêter la lecture</button>}
        {android && <button onClick={() => nativeAction(() => bridge.openSettings(), 'Impossible d’ouvrir les paramètres Android.')}>Paramètres Android</button>}
      </div>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
