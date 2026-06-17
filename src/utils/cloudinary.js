/**
 * Uploads a file to Cloudinary using the REST API with a client-side generated signature.
 * Note: Generating the signature on the client exposes the API_SECRET.
 * This is acceptable for a prototype, but in production, use Unsigned Upload Presets
 * or generate the signature on a secure backend server.
 * 
 * @param {File} file The file to upload.
 * @param {string} resourceType 'image' or 'video' or 'auto'.
 * @returns {Promise<string>} The secure URL of the uploaded asset.
 */
export const uploadToCloudinary = async (file, resourceType = 'auto') => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are missing in the .env file.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // The signature string must be alphabetically sorted parameters. 
  // We only have timestamp here.
  const strToSign = `timestamp=${timestamp}${apiSecret}`;

  // Generate SHA-1 hash for the signature using crypto.subtle (available in modern browsers)
  const encoder = new TextEncoder();
  const data = encoder.encode(strToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary Upload Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url; // Return the secure HTTPS URL from Cloudinary
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
