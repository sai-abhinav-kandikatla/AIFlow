export const MOTION_EASE = [0.16, 1, 0.3, 1] as const

export const motionDuration = {
  fast: 0.25,
  base: 0.35,
  slow: 0.55,
} as const

export const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: motionDuration.base, ease: MOTION_EASE },
}

export const fadeSlideUpInView = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: motionDuration.base, ease: MOTION_EASE },
}

export const fadeSlideLeftInView = {
  initial: { opacity: 0, x: -12 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: motionDuration.base, ease: MOTION_EASE },
}

export const scaleInView = {
  initial: { opacity: 0, scale: 0.97 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: motionDuration.base, ease: MOTION_EASE },
}

export const staggerDelay = (index: number, step = 0.06, base = 0) => base + index * step
