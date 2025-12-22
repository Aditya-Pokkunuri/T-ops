import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal ${sizeClasses[size]}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>

            <style>{`
        .modal.max-w-sm { max-width: 400px; }
        .modal.max-w-md { max-width: 600px; }
        .modal.max-w-lg { max-width: 800px; }
        .modal.max-w-xl { max-width: 1000px; }
        .modal.max-w-full { max-width: calc(100vw - 40px); }
      `}</style>
        </div>
    );
};

export default Modal;
