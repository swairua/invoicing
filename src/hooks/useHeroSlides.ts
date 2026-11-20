import { useEffect, useState } from 'react';
import { apiClient } from '@/integrations/api';

export interface HeroSlide {
  id: string;
  image_url: string;
  title?: string | null;
  subtitle?: string | null;
  display_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches active hero slides via the unauthenticated public_read endpoint.
 * The admin edits the slides in Web Manager; public reads need no token.
 */
export const useHeroSlides = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .select<HeroSlide[]>('hero_slides', { is_active: true }, true)
      .then((result) => {
        if (cancelled) return;
        setSlides(Array.isArray(result.data) ? result.data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load hero slides');
        setSlides([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { slides, loading, error };
};
