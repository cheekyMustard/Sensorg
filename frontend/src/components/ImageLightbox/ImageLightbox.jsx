import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Lightbox overlay — renders a full-screen image.
 * Props: src, alt, onClose
 */
export default function ImageLightbox({ src, alt, onClose }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
}
