import { getAPIBaseURL } from '@/utils/environment-detection';
import { toast } from 'sonner';

export const PRODUCTS_BUCKET = 'product-images';

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadProductImage = async (
  file: File,
  variantName: string
): Promise<UploadImageResult> => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file',
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Generate unique file path
    const timestamp = Date.now();
    const slug = variantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const extension = file.type.split('/')[1] || 'jpg';
    const filename = `${slug}-${timestamp}.${extension}`;

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    formData.append('bucket', PRODUCTS_BUCKET);
    formData.append('action', 'upload');

    // Get auth token if available
    const token = localStorage.getItem('med_api_token');

    // Upload via API endpoint
    const apiUrl = getAPIBaseURL();
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'Failed to upload image',
      };
    }

    const result = await response.json();

    if (result.status === 'error') {
      return {
        success: false,
        error: result.message || 'Upload failed',
      };
    }

    // Return the URL from the response
    const publicUrl = result.url || `/uploads/${filename}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    console.error('Upload error:', error);
    return {
      success: false,
      error: message,
    };
  }
};

export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      console.warn('Could not parse image URL:', imageUrl);
      return false;
    }

    const apiUrl = getAPIBaseURL();
    const token = localStorage.getItem('med_api_token');

    // Call delete via API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'delete_image',
        filename: filename,
      }),
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
