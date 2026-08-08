import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import { BANNER_SLIDE_INTERVAL_MS, MOUSE_THROTTLE_MS } from '../../constants';
import type { ParallaxOffset } from '../../types';
import { IconGroup } from './components/IconGroup';
import { ICON_GROUPS } from './icons.config';

const appearInitial = { opacity: 0, y: 16 };
const appearAnimate = { opacity: 1, y: 0 };
const appearExit = { opacity: 0, y: 16 };
const appearTransition = { duration: 0.3, ease: 'easeOut' as const };

export function Banner() {
  const { t } = useTranslation('auth');
  const [index, setIndex] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseUpdateRef = useRef(0);

  const slides = useMemo(() => {
    const slideData = t('banner.slides', { returnObjects: true });
    const messages = Array.isArray(slideData) ? (slideData as string[]) : [];

    return ICON_GROUPS.map((items, slideIndex) => ({
      items,
      message: messages[slideIndex] ?? '',
    }));
  }, [t]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastMouseUpdateRef.current < MOUSE_THROTTLE_MS) {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      throttleTimeoutRef.current = setTimeout(
        () => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          setParallaxOffset({
            x: event.clientX - rect.left - rect.width / 2,
            y: event.clientY - rect.top - rect.height / 2,
          });
          lastMouseUpdateRef.current = Date.now();
        },
        MOUSE_THROTTLE_MS - (now - lastMouseUpdateRef.current)
      );
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setParallaxOffset({
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
    lastMouseUpdateRef.current = now;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    setParallaxOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, BANNER_SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  const currentSlide = slides[index];
  if (!currentSlide) {
    return null;
  }

  const { items, message } = currentSlide;

  return (
    <div
      ref={containerRef}
      className="relative z-10 hidden h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 py-14 shadow-md lg:flex"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        initial={appearInitial}
        animate={appearAnimate}
        transition={appearTransition}
        className="absolute left-6 top-6 z-10 will-change-transform"
      >
        <p className="text-2xl font-bold text-primary-foreground">{t('banner.brand')}</p>
      </motion.div>

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="mx-auto flex w-full flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={appearInitial}
              animate={appearAnimate}
              exit={appearExit}
              transition={appearTransition}
              className="flex w-full flex-col items-center justify-center will-change-transform"
            >
              <IconGroup items={items} parallaxOffset={parallaxOffset} />
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex w-full max-w-[72%] items-center justify-center overflow-hidden px-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={appearInitial}
                animate={appearAnimate}
                exit={appearExit}
                transition={{ ...appearTransition, delay: 0.2 }}
                className="min-h-[72px] w-full whitespace-pre-line text-center text-xl font-semibold text-primary-foreground drop-shadow-sm will-change-transform"
              >
                {message}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
