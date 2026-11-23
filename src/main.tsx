import { createRoot } from 'react-dom/client';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useState } from 'react';
import './style.css';

interface DeviceSettings {
  openSettings(): Promise<void>;
}

const deviceSettings = registerPlugin<DeviceSettings>('NaelkaBridge');

function App() {
  const [error, setError] = useState('');
  const android = Capacitor.getPlatform() === 'android';

  async function openSettings() {
    setError('');
    try {
      await deviceSettings.openSettings();
    } catch {
      setError('Impossible d’ouvrir les paramètres Android.');
    }
  }

  return (
    <main>
      <div className="orb" aria-hidden="true" />
      <h1>NAËLKA AI</h1>
      <p>Assistant personnel Android</p>
      {android && <button onClick={openSettings}>Ouvrir les paramètres Android</button>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
