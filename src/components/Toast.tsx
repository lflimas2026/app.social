import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const Icon = {
          success: CheckCircle,
          warning: AlertTriangle,
          error: AlertCircle,
          info: Info,
        }[toast.type];

        const colors = {
          success: { bg: 'var(--bg-card)', border: '1px solid var(--color-success)', text: 'var(--color-success)' },
          warning: { bg: 'var(--bg-card)', border: '1px solid var(--color-warning)', text: 'var(--color-warning)' },
          error: { bg: 'var(--bg-card)', border: '1px solid var(--color-error)', text: 'var(--color-error)' },
          info: { bg: 'var(--bg-card)', border: '1px solid var(--color-primary)', text: 'var(--color-primary)' },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className="toast-item animate-toast"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: colors.bg,
              border: colors.border,
              boxShadow: 'var(--shadow-lg)',
              minWidth: '280px',
              maxWidth: '380px',
              pointerEvents: 'auto',
            }}
          >
            <Icon size={18} style={{ color: colors.text, flexShrink: 0 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', flexGrow: 1, margin: 0, whiteSpace: 'normal' }}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      <style>{`
        .toast-container {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          pointer-events: none;
        }
        .animate-toast {
          animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes toastIn {
          from {
            transform: translateY(-20px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
