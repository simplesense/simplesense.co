'use client'
import { useEffect, useRef } from 'react'

const FADE = 0.5 // seconds of fade-in at the start and fade-out before the end
const SESSION_KEY = 'ss_hero_v'

export interface HeroSource {
  src: string
  poster?: string
}

/** Pick a source once per browser session — stable across navigations, varies between visitors. */
function pickIndex(count: number): number {
  if (count <= 1) return 0
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    if (stored !== null) {
      const i = Number(stored)
      if (Number.isInteger(i) && i >= 0 && i < count) return i
    }
    const i = Math.floor(Math.random() * count)
    window.sessionStorage.setItem(SESSION_KEY, String(i))
    return i
  } catch {
    return Math.floor(Math.random() * count)
  }
}

/**
 * Ambient hero background video with a seamless fade-in/fade-out manual loop (Aethera pattern):
 * requestAnimationFrame drives opacity from currentTime/duration, and on `ended` it resets to 0
 * and replays after a beat. A random one of `sources` is chosen PER SESSION (so different visitors
 * see different clips, stable within a visit). The chosen src/poster are set via ref after mount,
 * so the server renders a source-less element — no hydration mismatch, no flash. Decorative + muted,
 * and honors prefers-reduced-motion (holds the first frame, no playback).
 */
export function HeroVideo({ sources }: { sources: HeroSource[] }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v || sources.length === 0) return
    const choice = sources[pickIndex(sources.length)]
    if (!choice) return
    if (choice.poster) v.poster = choice.poster
    v.src = choice.src
    v.load()

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
  }, [sources])

  return (
    <video
      ref={ref}
      className="hero-video-el"
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  )
}
