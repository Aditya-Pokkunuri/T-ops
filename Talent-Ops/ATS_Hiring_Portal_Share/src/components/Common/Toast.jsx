import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const success = (message) => addToast(message, 'success');
    const error = (message) => addToast(message, 'error');
    const warning = (message) => addToast(message, 'warning');
    const info = (message) => addToast(message, 'info');

    return (
        <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, onRemove }) => {
    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info
    };

    return (
        <div className="toast-container">
            {toasts.map(toast => {
                const Icon = icons[toast.type];
                return (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <Icon size={20} />
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => onRemove(toast.id)}>
                            <X size={16} />
                        </button>
                    </div>
                );
            })}

            <style>{`
        .toast-message {
          flex: 1;
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .toast-close {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .toast-close:hover {
          background: var(--bg-glass-hover);
          color: var(--text-primary);
        }

        .toast.success svg:first-child { color: var(--status-success); }
        .toast.error svg:first-child { color: var(--status-error); }
        .toast.warning svg:first-child { color: var(--status-warning); }
        .toast.info svg:first-child { color: var(--status-info); }
      `}</style>
        </div>
    );
};

export default ToastProvider;
