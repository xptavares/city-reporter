import { useEffect, useState } from 'react';

type Health = { db: string; cache: string };

export function App() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ db: 'unreachable', cache: 'unreachable' }));
  }, []);

  return (
    <main>
      <h1>City Reporter</h1>
      <p>
        API health: {health ? `db ${health.db}, cache ${health.cache}` : 'checking…'}
      </p>
    </main>
  );
}
