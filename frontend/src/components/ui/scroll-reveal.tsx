import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { MOTION_EASE, motionDuration } from '@/lib/motion'
import { cn } from '@/lib/utils'

type ScrollRevealProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  delay?: number
  y?: number
  x?: number
  scale?: number
}

export const ScrollReveal = ({
  children,
  className,
  delay = 0,
  y = 12,
  x = 0,
  scale = 1,
  ...props
}: ScrollRevealProps) => {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y, x, scale: scale === 1 ? undefined : scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: motionDuration.base, delay, ease: MOTION_EASE }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
