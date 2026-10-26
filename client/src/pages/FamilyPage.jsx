import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import { apiGet } from '../services/api.js';

export default function FamilyPage() {
  usePageTitle('Stories');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/family')
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Family stories</h1>
          <p className="page-sub">Videos, articles, and little moments worth keeping.</p>
        </div>
      </div>

      {error ? <p className="status-message error">{error}</p> : null}

      {entries === null && !error ? (
        <div className="story-list">
          <div className="story-card skeleton" />
          <div className="story-card skeleton" />
        </div>
      ) : null}

      {entries?.length ? (
        <div className="story-list">
          {entries.map((entry) => (
            <article key={entry.id} className="story-card">
              <p className="eyebrow">{entry.mediaType === 'video' ? 'Video' : 'Story'}</p>
              <h2>{entry.title}</h2>
              <p className="story-summary">{entry.summary}</p>
              {entry.content ? <p className="story-content">{entry.content}</p> : null}
              {entry.mediaUrl ? (
                <a className="btn btn-soft" href={entry.mediaUrl} target="_blank" rel="noreferrer">
                  {entry.mediaType === 'video' ? 'Watch the video' : 'Read the article'}
                  <Icon name="right" size={18} />
                </a>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {entries && !entries.length ? (
        <div className="empty-state">
          <p>No stories yet. Check back soon.</p>
        </div>
      ) : null}
    </div>
  );
}
