import { expect, it } from 'vitest';
import { chatEndpoint } from './chat';

it('normalise l’adresse du serveur vers le point d’entrée de conversation', () => {
  expect(chatEndpoint(' https://naelka.example ')).toBe('https://naelka.example/chat');
});

it('refuse la connexion sans TLS et les URL avec identifiants intégrés', () => {
  expect(() => chatEndpoint('http://naelka.example')).toThrow();
  expect(() => chatEndpoint('https://user:secret@naelka.example')).toThrow();
});
