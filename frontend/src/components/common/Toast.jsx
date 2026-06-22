import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };

const Toast = ({ type = 'info', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const Icon = ICONS[type] || ICONS.info;

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
      <Icon size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Dismiss">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
