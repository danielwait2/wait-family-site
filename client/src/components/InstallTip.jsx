import { useState } from 'react';
import { readJson, writeJson } from '../lib/storage.js';
import Icon from './Icon.jsx';

const DISMISS_KEY = 'installTipDismissed';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isAndroid = () => /android/i.test(navigator.userAgent);

export default function InstallTip() {
  const [dismissed, setDismissed] = useState(() => readJson(DISMISS_KEY, false));
  if (dismissed || isStandalone() || !(isIos() || isAndroid())) return null;

  const dismiss = () => {
    writeJson(DISMISS_KEY, true);
    setDismissed(true);
  };

  return (
    <aside className="install-tip">
      <img src="/icon-192.png" alt="" width="44" height="44" />
      <p>
        <strong>Keep the cookbook on your phone.</strong>{' '}
        {isIos() ? (
          <>
            Tap <Icon name="share" size={16} /> <em>Share</em>, then <em>Add to Home Screen</em>.
          </>
        ) : (
          <>
            Tap the <em>⋮</em> menu, then <em>Add to Home screen</em>.
          </>
        )}
      </p>
      <button type="button" className="icon-btn" onClick={dismiss} aria-label="Dismiss tip">
        <Icon name="x" size={18} />
      </button>
    </aside>
  );
}
