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
          width: 560,
          maxWidth: '96%',
          background: '#fff',
          borderRadius: 10,
          padding: 20,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          color: '#0f172a'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>Nhập GEMINI API Key</h3>
        <p style={{ marginTop: 0, marginBottom: 12, color: '#475569', fontSize: 13 }}>
          Dán API Key (GEMINI) của bạn vào ô bên dưới để ứng dụng gọi API. Key sẽ được lưu vào <strong>localStorage</strong> của trình duyệt.
        </p>

        <textarea
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Nhập API Key ở đây (ví dụ: ya29.... hoặc sk-... tùy nhà cung cấp)..."
          style={{
            width: '100%',
            minHeight: 56,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #e6edf3',
            marginBottom: 12,
            fontSize: 13,
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            <strong>Lưu ý bảo mật:</strong> Key được lưu cục bộ trên trình duyệt của bạn. Không chia sẻ key công khai.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
                borderRadius: 8,
                border: '1px solid #e6edf3',
                cursor: 'pointer',
                color: '#374151',
                fontSize: 13
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
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Lưu
            </button>
          </div>
        </div>

        {saved && <div style={{ marginTop: 12, color: 'green', fontSize: 13 }}>Đã lưu API key vào trình duyệt.</div>}

        <hr style={{ margin: '16px 0', borderColor: '#eef2f7' }} />

        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.45 }}>
          <strong>Hướng dẫn nhanh: cách lấy GEMINI API key</strong>
          <ol style={{ marginTop: 8, paddingLeft: 18 }}>
            <li>Mở Google Cloud Console: <code>https://console.cloud.google.com/</code></li>
            <li>Tạo hoặc chọn một Project mới (bật billing nếu cần thiết).</li>
            <li>Vào phần API & Services → Library, tìm và kích hoạt dịch vụ <em>Generative AI</em> (hoặc "Vertex AI / Generative AI" tuỳ vùng).</li>
            <li>Sau khi kích hoạt, vào phần Credentials → Create credentials → chọn <em>API key</em> để tạo một key mới.</li>
            <li>Sao chép API key và dán vào ô trên, sau đó nhấn <strong>Lưu</strong>.</li>
          </ol>

          <div style={{ marginTop: 8, color: '#6b7280' }}>
            Nếu bạn gặp thông báo lỗi khi gọi API, kiểm tra:
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              <li>Project đã bật billing chưa.</li>
              <li>API key có quyền truy cập vào Generative AI/Vertex AI.</li>
              <li>Hạn mức và quota của project.</li>
            </ul>
          </div>

          <div style={{ marginTop: 10, fontSize: 12 }}>
            Tham khảo thêm: <a href="https://cloud.google.com/generative-ai" target="_blank" rel="noreferrer" style={{ color: '#0b5fff' }}>Tài liệu Generative AI (Google)</a>
          </div>
        </div>
      </div>
    </div>
  );
}
