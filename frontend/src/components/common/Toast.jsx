import { useEffect } from 'react';

const Toast = ({ type = 'info', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
      <span>{icons[type] || icons.info}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
