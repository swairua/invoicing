import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeroSlide } from '@/hooks/useHeroSlides';

export const AUTO_ADVANCE_MS = 5000;

interface HeroSliderProps {
  slides: HeroSlide[];
}

/**
 * Rotating hero slider for the public homepage.
 * Auto-advances every 5s, pauses on hover/touch, clickable
 * dots + prev/next arrows. Admin edits the slides via Web Manager.
 */
export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => {
      if (paused) return;
      setCurrent((c) => (c + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [slides.length, paused]);

  const goTo = (i: number) => {
    if (slides.length === 0) return;
    const next = ((i % slides.length) + slides.length) % slides.length;
    setCurrent(next);
  };

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section
      className="relative h-[380px] sm:h-[460px] md:h-[560px] w-full overflow-hidden bg-slate-900"
      aria-label="Hero slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <img
          key={s.id}
          src={s.image_url || '/placeholder.svg'}
          alt={s.title || `Hero image ${i + 1}`}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}

      {/* Gradient overlays for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Slide text */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-5 sm:px-10 text-white">
        {slide.title && (
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight drop-shadow-lg">
            {slide.title}
          </h1>
        )}
        {slide.subtitle && (
          <p className="mt-3 max-w-2xl text-base sm:text-lg md:text-xl text-white/90 drop-shadow-sm">
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* Prev / Next buttons */}
      {slides.length > 1 && (
        <div className="absolute inset-0 z-10 flex items-center justify-between px-3 sm:px-10 pointer-events-none">
          <button
            onClick={() => goTo(current - 1)}
            className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            aria-label="Previous slide"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            aria-label="Next slide"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              'h-2.5 rounded-full transition-all',
              i === current ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
            )}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current}
          />
        ))}
      </div>
    </section>
  );
}
