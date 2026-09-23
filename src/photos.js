// Photo preparation. Phone photos are 3–8 MB, which is wasteful to upload and
// far too big to put in a Firestore document, so everything is downscaled in
// the browser before it goes anywhere.

const FALLBACK_MAX_EDGE = 320;   // thumbnail that fits inside a Firestore doc
const UPLOAD_MAX_EDGE = 1600;    // full-ish quality for Cloud Storage

/** Reads a file into an <img>, via an object URL that is always revoked. */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This image could not be read'));
    };
    img.src = url;
  });
}

function fit(width, height, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function draw(img, maxEdge) {
  const size = fit(img.naturalWidth || img.width, img.naturalHeight || img.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size.width, size.height);
  return canvas;
}

const toBlob = (canvas, quality) => new Promise((resolve) => {
  canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
});

/**
 * Returns both forms of the photo: a blob to upload when Cloud Storage is
 * available, and a small data URL that can live in the note document when it
 * is not.
 */
export async function prepare(file) {
  const img = await loadImage(file);
  const upload = await toBlob(draw(img, UPLOAD_MAX_EDGE), 0.82);
  const thumbnail = draw(img, FALLBACK_MAX_EDGE).toDataURL('image/jpeg', 0.6);
  return { upload, thumbnail };
}

/**
 * What a data URL costs inside a Firestore document. The limit applies to the
 * stored string, so the base64 length is the figure that matters — not the
 * decoded size, which is a quarter smaller and would flatter the budget.
 */
export function storedLength(dataUrl) {
  const text = String(dataUrl ?? '');
  return text.startsWith('data:') ? text.length : 0;
}
