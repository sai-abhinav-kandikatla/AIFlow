import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastStatus = 'success' | 'error' | 'warning' | 'info'

type ToastAction =
  | (() => void | Promise<void>)
  | {
      label: string
      onClick: () => void | Promise<void>
    }

type ToastInput =
  | string
  | {
      title: string
      message?: string
      recovery?: string
      action?: ToastAction
      duration?: number
      persistent?: boolean
    }

type ToastRecord = {
  id: string
  status: ToastStatus
  title: string
  message?: string
  recovery?: string
  action?: {
    label: string
    onClick: () => void | Promise<void>
  }
  duration: number
  persistent: boolean
}

type ToastListener = (toast: ToastRecord) => void
type DismissListener = (id?: string) => void

const toastListeners = new Set<ToastListener>()
const dismissListeners = new Set<DismissListener>()
const queuedToasts: ToastRecord[] = []

const statusDefaults: Record<ToastStatus, Pick<ToastRecord, 'title' | 'duration' | 'persistent'>> = {
  success: { title: 'Done', duration: 4200, persistent: false },
  info: { title: 'Heads up', duration: 5200, persistent: false },
  warning: { title: 'Check this', duration: 6500, persistent: false },
  error: { title: 'Something went wrong', duration: 0, persistent: true },
}

const recoveryDefaults: Record<ToastStatus, string | undefined> = {
  success: undefined,
  info: undefined,
  warning: 'Review the message and continue when ready.',
  error: 'Check the details, then retry the action or restart the connection.',
}

const normalizeAction = (action?: ToastAction) => {
  if (!action) return undefined
  if (typeof action === 'function') {
    return {
      label: 'Retry',
      onClick: action,
    }
  }
  return action
}

const normalizeToast = (status: ToastStatus, input: ToastInput): ToastRecord => {
  const defaults = statusDefaults[status]
  const body = typeof input === 'string' ? { title: defaults.title, message: input } : input
  const action = normalizeAction(body.action)
  const persistent = body.persistent ?? (status === 'error' ? Boolean(action) || defaults.persistent : defaults.persistent)

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    status,
    title: body.title || defaults.title,
    message: body.message,
    recovery: body.recovery ?? recoveryDefaults[status],
    action,
    duration: persistent ? 0 : (body.duration ?? defaults.duration),
    persistent,
  }
}

const emitToast = (status: ToastStatus, input: ToastInput) => {
  const record = normalizeToast(status, input)
  if (toastListeners.size === 0) {
    queuedToasts.push(record)
    return record.id
  }
  toastListeners.forEach((listener) => listener(record))
  return record.id
}

export const toast = {
  success: (input: ToastInput) => emitToast('success', input),
  info: (input: ToastInput) => emitToast('info', input),
  warning: (input: ToastInput) => emitToast('warning', input),
  error: (input: ToastInput) => emitToast('error', input),
  dismiss: (id?: string) => dismissListeners.forEach((listener) => listener(id)),
}

const statusStyles: Record<ToastStatus, { icon: typeof CheckCircle2; accent: string; glow: string; bar: string }> = {
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-300 dark:bg-emerald-400/10 dark:border-emerald-300/25',
    glow: 'border-emerald-500/25 shadow-emerald-500/10',
    bar: 'bg-emerald-500 dark:bg-emerald-300',
  },
  error: {
    icon: AlertTriangle,
    accent: 'text-red-600 bg-red-500/10 border-red-500/25 dark:text-red-300 dark:bg-red-400/10 dark:border-red-300/25',
    glow: 'border-red-500/25 shadow-red-500/15',
    bar: 'bg-red-500 dark:bg-red-300',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'text-amber-600 bg-amber-500/10 border-amber-500/25 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-300/25',
    glow: 'border-amber-500/25 shadow-amber-500/10',
    bar: 'bg-amber-500 dark:bg-amber-300',
  },
  info: {
    icon: Info,
    accent: 'text-primary bg-primary/10 border-primary/25',
    glow: 'border-primary/25 shadow-primary/10',
    bar: 'bg-primary',
  },
}

const ToastItem = ({ item, onDismiss }: { item: ToastRecord; onDismiss: (id: string) => void }) => {
  const [runningAction, setRunningAction] = useState(false)
  const style = statusStyles[item.status]
  const Icon = style.icon

  useEffect(() => {
    if (item.persistent || item.duration <= 0) return undefined
    const timeout = window.setTimeout(() => onDismiss(item.id), item.duration)
    return () => window.clearTimeout(timeout)
  }, [item.duration, item.id, item.persistent, onDismiss])

  const runAction = async () => {
    if (!item.action) return
    setRunningAction(true)
    try {
      await item.action.onClick()
      onDismiss(item.id)
    } finally {
      setRunningAction(false)
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-card/95 p-4 text-foreground shadow-2xl backdrop-blur-xl animate-fade-slide-up',
        style.glow,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md border', style.accent)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">{item.title}</div>
              {item.message ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {item.recovery ? (
            <div className="mt-3 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">Recovery: </span>
              {item.recovery}
            </div>
          ) : null}
          {item.action ? (
            <button
              type="button"
              onClick={runAction}
              disabled={runningAction}
              className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-border bg-muted px-3 text-sm font-medium transition hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {runningAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {item.action.label}
            </button>
          ) : null}
        </div>
      </div>
      {!item.persistent && item.duration > 0 ? (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
          <div className={cn('h-full origin-left toast-countdown', style.bar)} style={{ animationDuration: `${item.duration}ms` }} />
        </div>
      ) : null}
    </div>
  )
}

export const ToastProvider = () => {
  const [items, setItems] = useState<ToastRecord[]>([])

  const dismiss = useMemo(
    () => (id?: string) => {
      setItems((current) => (id ? current.filter((item) => item.id !== id) : []))
    },
    [],
  )

  useEffect(() => {
    const add: ToastListener = (next) => {
      setItems((current) => [next, ...current].slice(0, 5))
    }
    toastListeners.add(add)
    dismissListeners.add(dismiss)
    queuedToasts.splice(0).forEach(add)
    return () => {
      toastListeners.delete(add)
      dismissListeners.delete(dismiss)
    }
  }, [dismiss])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] grid w-[min(calc(100vw-2rem),420px)] gap-3">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastItem item={item} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
