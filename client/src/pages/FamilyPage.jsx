import { useEffect, useState } from 'react';
import { apiGet } from '../services/api.js';

export default function FamilyPage() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/family')
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="section-card">
      <div className="hero">
        <div>
          <p className="badge">Stories &amp; media</p>
          <h2>The Wait family timeline, in videos, articles, and little moments.</h2>
          <p>
            Admins curate highlights so everyone stays close to the memories—whether it is a grainy home video from the
            lakehouse or a new article about a milestone.
          </p>
        </div>
      </div>

      {error ? <p className="status-message error">{error}</p> : null}

      {entries.length ? (
        <div className="grid" style={{ marginTop: '2rem' }}>
          {entries.map((entry) => (
            <article key={entry.id} className="family-card">
              <p className="pill">{entry.mediaType === 'video' ? 'Video drop' : 'Story spotlight'}</p>
              <h3>{entry.title}</h3>
              <p className="muted">{entry.summary}</p>
              {entry.content ? <p style={{ marginTop: '0.75rem' }}>{entry.content}</p> : null}
              {entry.mediaUrl ? (
                <a
                  className="ghost-btn"
                  style={{ marginTop: '1rem', display: 'inline-flex' }}
                  href={entry.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {entry.mediaType === 'video' ? 'Watch video ↗' : 'Read article ↗'}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem 1rem' }}>
          <p className="muted" style={{ fontSize: '1.0625rem' }}>
            No stories yet. Admins can add them from the dashboard.
          </p>
        </div>
      )}
    </section>
  );
}
