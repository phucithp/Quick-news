import React from 'react';

export default function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Settings"
      title="Settings"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#374151'
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.26-.46 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.4 2.6l.06.06c.5.5 1.2.68 1.82.33.46-.27 1-.42 1.51-.42H12a2 2 0 0 1 4 0h.09c.7 0 1.26.46 1.51 1 .27.46.42 1 .42 1.51V9c0 .55.22 1.08.61 1.47.39.39.92.61 1.47.61h.91a1.65 1.65 0 0 0 1.51-1z" />
      </svg>
    </button>
  );
}
