import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-nordic-charcoal/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidth} bg-nordic-surface dark:bg-nordic-dark-surface rounded-2xl border border-nordic-border dark:border-nordic-dark-border p-6 shadow-xl z-10 transition-all`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-nordic-border dark:border-nordic-dark-border">
          <h3 id="modal-title" className="text-lg font-bold text-nordic-charcoal dark:text-nordic-dark-text">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text hover:bg-nordic-mist/50 dark:hover:bg-nordic-dark-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}
