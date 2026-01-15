import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeyModal({ open, onClose }: Props) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem('GEMINI_API_KEY') || '';
      setKey(stored);
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: '95%',
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Nhập API Key</h3>
        <p style={{ marginTop: 0, marginBottom: 12, color: '#555' }}>
          Dán API Key ở đây để ứng dụng gọi API. Dữ liệu sẽ được lưu trong localStorage của trình duyệt.
        </p>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-xxxx..."
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #ddd',
            marginBottom: 12,
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              localStorage.removeItem('GEMINI_API_KEY');
              setKey('');
              setSaved(false);
              onClose();
            }}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              borderRadius: 6,
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
          >
            Xóa
          </button>
          <button
            onClick={() => {
              localStorage.setItem('GEMINI_API_KEY', key);
              setSaved(true);
              onClose();
            }}
            style={{
              padding: '8px 12px',
              background: '#0b5fff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Lưu
          </button>
        </div>
        {saved && <div style={{ marginTop: 12, color: 'green' }}>Đã lưu.</div>}
      </div>
    </div>
  );
}
