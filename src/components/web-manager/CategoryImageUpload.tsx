import { useEffect, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadProductImage, deleteProductImage } from '@/utils/imageUploadService';

interface CategoryImageUploadProps {
  value: string;
  onChange: (path: string) => void;
  label?: string;
}

/**
 * Admin-only category image upload.
 * Posts through api.php ?action=upload_file (admin token enforced server-side).
 */
export const CategoryImageUpload = ({
  value,
  onChange,
  label = 'Category Image (admin only)',
}: CategoryImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadProductImage(file, 'category');
      if (result.success && result.url) {
        setPreview(result.url);
        onChange(result.url);
        toast.success('Image uploaded. Save the category to apply.');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
    e.target.value = ''; // allow re-selecting the same file later
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      if (preview) {
        await deleteProductImage(preview);
      }
      setPreview(null);
      onChange('');
      toast.success('Image removed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <label
          className="flex-1 cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-gray-300 px-4 py-3 hover:border-primary transition-colors"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading || busy}
          />
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            {uploading ? (
              <>
                <Upload className="h-4 w-4 animate-pulse" />
                Uploading…
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Choose image (PNG/JPG/WebP, ≤5MB)
              </>
            )}
          </div>
        </label>

        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Category preview"
              className="h-12 w-12 rounded-md object-cover border border-gray-200"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute -top-1.5 -right-1 h-5 w-5 rounded-full border border-gray-200 p-0"
              onClick={handleRemove}
              disabled={busy}
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {value && !preview && (
        <p className="text-xs text-gray-500 break-all">
          Current: <span className="font-mono">{value}</span>
        </p>
      )}
      <p className="text-xs text-gray-400">
        Uploaded via the admin image API; only admins can save categories.
      </p>
    </div>
  );
};
