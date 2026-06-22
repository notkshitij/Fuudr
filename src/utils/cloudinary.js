/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * This is safe for client-side use — no API secret required.
 *
 * To set up: Cloudinary Dashboard → Settings → Upload → Upload Presets → Add unsigned preset
 * Then set VITE_CLOUDINARY_UPLOAD_PRESET in your .env and Vercel env vars.
 */
export const uploadToCloudinary = async (file, resourceType = 'auto') => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials are missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary Upload Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.secure_url;
};
