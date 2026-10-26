import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatch } from '../services/api.js';

export default function MadeThisModeration() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    apiGet('/api/admin/made-this')
      .then(setNotes)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const act = async (request) => {
    try {
      await request;
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pending = notes.filter((note) => note.status === 'pending');
  const approved = notes.filter((note) => note.status === 'approved');

  const renderNote = (note, actions) => (
    <div key={note.id} className="table-item">
      <div>
        <strong>{note.name || 'Anonymous'}</strong> on <em>{note.recipeTitle}</em>
        {note.note ? <p className="muted">{note.note}</p> : null}
      </div>
      <div className="table-item-actions">{actions}</div>
    </div>
  );

  return (
    <div className="list-card" style={{ marginBottom: '2rem' }}>
      <div className="pill">{pending.length} waiting</div>
      <h3>&ldquo;I made this&rdquo; notes</h3>
      {error ? <p className="status-message error">{error}</p> : null}
      <div className="table-list">
        {pending.map((note) =>
          renderNote(note, (
            <>
              <button type="button" onClick={() => act(apiPatch(`/api/admin/made-this/${note.id}`, { status: 'approved' }))}>
                Approve
              </button>
              <button type="button" className="secondary" onClick={() => act(apiPatch(`/api/admin/made-this/${note.id}`, { status: 'rejected' }))}>
                Reject
              </button>
            </>
          ))
        )}
        {!pending.length ? <p className="muted">Nothing waiting for approval.</p> : null}
      </div>
      {approved.length ? (
        <details style={{ marginTop: '1.5rem' }}>
          <summary>Published notes ({approved.length})</summary>
          <div className="table-list">
            {approved.map((note) =>
              renderNote(note, (
                <button type="button" className="secondary" onClick={() => act(apiDelete(`/api/admin/made-this/${note.id}`))}>
                  Delete
                </button>
              ))
            )}
          </div>
        </details>
      ) : null}
    </div>
  );
}
