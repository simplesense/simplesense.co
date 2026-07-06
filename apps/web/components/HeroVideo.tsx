'use client'
import { useEffect, useRef } from 'react'

const FADE = 0.5 // seconds of fade-in at the start and fade-out before the end

/**
 * Ambient hero background video with a seamless fade-in/fade-out manual loop (per the Aethera
 * pattern): requestAnimationFrame drives opacity from currentTime/duration, and on `ended` we
 * reset to 0 and replay after a beat — so the loop point never hard-cuts. Decorative + muted, and
 * honors prefers-reduced-motion (holds the first frame, no playback) for accessibility.
 */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let raf = 0

    const loop = (): void => {
      const d = v.duration
      if (d && Number.isFinite(d)) {
        const t = v.currentTime
        const o = t < FADE ? t / FADE : t > d - FADE ? Math.max(0, (d - t) / FADE) : 1
        v.style.opacity = String(o)
      }
      raf = requestAnimationFrame(loop)
    }
    const onEnded = (): void => {
      v.style.opacity = '0'
      window.setTimeout(() => {
        v.currentTime = 0
        void v.play().catch(() => {})
      }, 100)
    }

    v.addEventListener('ended', onEnded)
    if (reduced) {
      v.style.opacity = '1'
    } else {
      void v.play().catch(() => {})
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <video
      ref={ref}
      className="hero-video-el"
      src={src}
      poster={poster}
      muted
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
    />
  )
}
