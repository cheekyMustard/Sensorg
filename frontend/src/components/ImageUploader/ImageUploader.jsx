import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, ImagePlus, X, Crop, Upload, Trash2 } from 'lucide-react';
import { resolveUploadUrl } from '../../utils/resolveUploadUrl.js';
import { getToken } from '../../api/client.js';

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Upload a canvas blob to /api/uploads and return the URL */
async function uploadBlob(blob, token) {
  const fd = new FormData();
  fd.append('image', blob, `upload-${Date.now()}.jpg`);

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }
  return (await res.json()).url;
}

/**
 * ImageUploader
 *
 * Props:
 *   value      — current image URL (string | null)
 *   onChange   — called with new URL string after upload, or null when removed
 *   label      — optional field label
 */
export default function ImageUploader({ value, onChange, label = 'Image' }) {
  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);
  const imgRef         = useRef(null);

  const [srcImg,    setSrcImg]    = useState(null);   // data URL of chosen file
  const [crop,      setCrop]      = useState(null);
  const [showCrop,  setShowCrop]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  function loadFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5 MB limit');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = e => {
      setSrcImg(e.target.result);
      setCrop(null);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  }

  function onImageLoad(e) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h));
  }

  async function confirmCrop() {
    if (!imgRef.current || !crop) return;
    const canvas = document.createElement('canvas');
    const img    = imgRef.current;
    const scaleX = img.naturalWidth  / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Convert % crop to pixels
    const pixelCrop = {
      x:      (crop.x / 100)      * img.naturalWidth,
      y:      (crop.y / 100)      * img.naturalHeight,
      width:  (crop.width / 100)  * img.naturalWidth,
      height: (crop.height / 100) * img.naturalHeight,
    };

    canvas.width  = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      img,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );

    setUploading(true);
    setShowCrop(false);
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      const url  = await uploadBlob(blob, getToken());
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setSrcImg(null);
    }
  }

  function cancelCrop() {
    setShowCrop(false);
    setSrcImg(null);
    setCrop(null);
  }

  function removeImage() {
    onChange(null);
  }

  const thumbUrl = resolveUploadUrl(value);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>
        {label} <span className="font-normal text-stone-400">(optional · max 5 MB)</span>
      </label>

      {/* Current image preview */}
      {thumbUrl && (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ maxHeight: 180 }}>
          <img src={thumbUrl} alt="preview" className="w-full object-cover" style={{ maxHeight: 180 }} />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 rounded-full p-1 bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Upload buttons */}
      {!thumbUrl && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)' }}
          >
            <ImagePlus size={16} />
            Pick photo
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
            style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)' }}
            aria-label="Take photo"
          >
            <Camera size={16} />
          </button>
        </div>
      )}

      {/* Replace button when image exists */}
      {thumbUrl && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-stone-50 disabled:opacity-50"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--charcoal)' }}
        >
          <ImagePlus size={14} /> Replace image
        </button>
      )}

      {uploading && (
        <p className="text-xs text-stone-400 text-center">Uploading…</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
      />

      {/* Crop modal */}
      {showCrop && srcImg && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm" style={{ color: 'var(--charcoal)' }}>Crop image</span>
              <button type="button" onClick={cancelCrop} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-stone-100" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                aspect={undefined}
              >
                <img
                  ref={imgRef}
                  src={srcImg}
                  alt="crop preview"
                  onLoad={onImageLoad}
                  style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }}
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t">
              <button
                type="button"
                onClick={confirmCrop}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ background: 'var(--brand)' }}
              >
                <Upload size={15} /> Upload cropped
              </button>
              <button
                type="button"
                onClick={cancelCrop}
                className="rounded-xl border px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
                style={{ borderColor: '#D1D5DB' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
