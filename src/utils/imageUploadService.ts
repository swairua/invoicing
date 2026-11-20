/**
 * Image upload for website content (categories, variants, galleries).
 *
 * Talks to the real api.php endpoints:
 *   POST ?action=upload_file   (admin token required)
 *   POST ?action=delete_file   (admin token required)
 *
 * Replaces the previous implementation which posted to non-existent
 * actions `upload` / `delete_image` and silently failed.
 */

import { getClientApiUrl, getUploadBaseUrl } from './getApiUrl';
import { toast } from 'sonner';

/** Kept for backwards compatibility with existing imports. */
export const PRODUCTS_BUCKET = 'product-images';

export interface UploadImageResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/** Derive the filename the server will store (it appends its own timestamp). */
function buildFilename(file: File, variantName: string): string {
  const slug = (variantName || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
  const extension = (file.type.split('/')[1] || 'jpg').toLowerCase();
  return `${slug}.${extension}`;
}

function getToken(): string {
  return localStorage.getItem('med_api_token') || '';
}

/**
 * Upload an image for a website item. Returns the public URL to store
 * on the record (`image_path` on web_categories / web_variants).
 */
export const uploadProductImage = async (
  file: File,
  variantName: string
): Promise<UploadImageResult> => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      return { success: false, error: 'Please select a valid image file' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    const token = getToken();
    if (!token) {
      return { success: false, error: 'You must be signed in to upload images' };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', buildFilename(file, variantName));

    const apiUrl = getClientApiUrl();
    const response = await fetch(`${apiUrl}?action=upload_file`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.status === 'error') {
      return {
        success: false,
        error: result.message || `Upload failed with status ${response.status}`,
      };
    }

    const url =
      result.url ||
      (result.path ? `${getUploadBaseUrl()}${result.path}` : undefined);

    if (!url) {
      return { success: false, error: 'Server did not return an image URL' };
    }

    return { success: true, url, path: result.path };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    console.error('Upload error:', error);
    return { success: false, error: message };
  }
};

/**
 * Delete a previously uploaded image by its public URL.
 * Best-effort: a missing file is treated as already deleted.
 */
export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl) return true;

    const token = getToken();
    if (!token) {
      toast.error('You must be signed in to delete images');
      return false;
    }

    // The server only accepts a filename inside /uploads, so strip any
    // absolute URL down to the bare path it returned on upload.
    const pathname = (() => {
      try {
        return new URL(imageUrl, window.location.origin).pathname;
      } catch {
        return imageUrl;
      }
    })();

    const apiUrl = getClientApiUrl();
    const response = await fetch(`${apiUrl}?action=delete_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ path: pathname }),
    });

    if (!response.ok) {
      console.error('Delete error: HTTP', response.status);
      return false;
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};
