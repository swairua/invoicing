import { useCallback, useEffect, useState } from 'react';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDown, ArrowUp, Edit2, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadProductImage } from '@/utils/imageUploadService';

interface SlideForm {
  image_url: string;
  title: string;
  subtitle: string;
  display_order: number;
  is_active: boolean;
}

interface HeroSlideRow {
  id: string;
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  display_order: number;
  is_active?: boolean;
}

const emptyForm = (): SlideForm => ({
  image_url: '',
  title: '',
  subtitle: '',
  display_order: 0,
  is_active: true,
});

/**
 * Admin editing of the rotating homepage hero slides.
 * Slides are read from / written to the `hero_slides` table and are
 * visible to the public homepage via the unauthenticated public_read
 * endpoint. Image uploads go through api.php ?action=upload_file.
 */
export const HeroSlidesTab = () => {
  const [slides, setSlides] = useState<HeroSlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlideForm>(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSlides = useCallback(async () => {
    const db = getDatabase();
    const result = await db.selectBy('hero_slides', {});
    if (result.error) {
      toast.error(`Failed to load slides: ${result.error.message}`);
      setLoading(false);
      return;
    }
    setSlides((result.data || []) as HeroSlideRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const resetForm = () => {
    setForm(emptyForm());
    setFile(null);
    setPreview(null);
    setEditingId(null);
  };

  const startEdit = (slide: HeroSlideRow) => {
    setEditingId(slide.id);
    setForm({
      image_url: slide.image_url || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      display_order: slide.display_order || 0,
      is_active: slide.is_active !== false,
    });
    setFile(null);
    setPreview(slide.image_url || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!form.image_url && !file) {
        toast.error('Choose an image before saving the slide.');
        return;
      }
      if (!form.image_url && file) {
        setUploading(true);
        const up = await uploadProductImage(file, 'hero-slide');
        setUploading(false);
        if (!up.success || !up.url) {
          toast.error(up.error || 'Image upload failed');
          return;
        }
        form.image_url = up.url;
        setPreview(up.url);
      }

      const db = getDatabase();
      const payload = {
        image_url: form.image_url,
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        display_order: form.display_order,
        is_active: form.is_active,
      };

      if (editingId) {
        const result = await db.update('hero_slides', editingId, payload);
        if (result.error) throw result.error;
        toast.success('Slide updated');
      } else {
        const result = await db.insert('hero_slides', payload);
        if (result.error) throw result.error;
        toast.success('Slide added');
      }

      resetForm();
      await loadSlides();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const db = getDatabase();
    const result = await db.delete('hero_slides', id);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success('Slide deleted');
    if (editingId === id) resetForm();
    await loadSlides();
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...slides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(index - 1, 0, moved);
    // Write back display_order by position
    const db = getDatabase();
    for (let i = 0; i < reordered.length; i++) {
      const s = reordered[i];
      if (s.display_order !== i) {
        await db.update('hero_slides', s.id, { display_order: i });
      }
    }
    toast.success('Slide moved');
    await loadSlides();
  };

  const handleToggleActive = async (slide: HeroSlideRow, isActive: boolean) => {
    const db = getDatabase();
    const result = await db.update('hero_slides', slide.id, { is_active: isActive });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(isActive ? 'Slide activated' : 'Slide deactivated');
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, is_active: isActive } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hero Slides</h3>
          <p className="text-sm text-muted-foreground">
            The rotating images on the public homepage. Slide text and order is admin-editable.
          </p>
        </div>
      </div>

      {/* Slide form */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h4 className="font-semibold">{editingId ? 'Edit Slide' : 'Add New Slide'}</h4>

          <div className="flex items-start gap-3">
            <div className="w-32 h-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt={form.title || 'slide preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id="hero-slide-file"
              onChange={handleFileChange}
            />
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="hero-slide-file">Upload slide image (PNG/JPG/WebP, ≤5MB)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer" htmlFor="hero-slide-file">
                    {uploading ? 'Uploading…' : file ? 'File chosen' : 'Choose image'}
                  </label>
                </Button>
                {file && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {file.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {preview && !form.image_url && file ? 'New image will be uploaded on save.' : ''}
                {form.image_url ? `Current image: ${form.image_url}` : ''}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="slide-title">Title</Label>
              <Input
                id="slide-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Headline shown on the slide"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slide-subtitle">Subtitle</Label>
              <Input
                id="slide-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Supporting text shown below the title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slide-order">Display order</Label>
              <Input
                id="slide-order"
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  id="slide-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label htmlFor="slide-active">Active</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || uploading || (!form.image_url && !file)}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Update Slide' : 'Add Slide'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            {!form.image_url && !file && !editingId && (
              <span className="text-xs text-muted-foreground">Pick an image to add the first slide.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slides list */}
      <Card>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subtitle</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : slides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hero slides yet. Add the first slide above.
                  </TableCell>
                </TableRow>
              ) : (
                slides.map((slide, index) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <img
                        src={slide.image_url}
                        alt={slide.title || 'slide'}
                        className="h-12 w-20 rounded-md object-cover border border-slate-200"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{slide.title || '(untitled)'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs">{slide.subtitle || '—'}</TableCell>
                    <TableCell>{slide.display_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={slide.is_active !== false}
                        onCheckedChange={(v) => handleToggleActive(slide, v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Move up" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                          <ArrowUp size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => startEdit(slide)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete" onClick={() => handleDelete(slide.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
