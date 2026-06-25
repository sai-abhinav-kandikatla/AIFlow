import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import { threadApi } from '@/lib/api'
import type { Thread } from '@/lib/types'
import { ThreadCard } from '@/components/thread/ThreadCard'
import { PromptTabs } from '@/components/thread/PromptTabs'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export const SharedThreadPage = () => {
  const { token } = useParams()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    threadApi
      .getShared(token)
      .then((response) => {
        setThread(response.thread)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load shared Flow')
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex items-center justify-center rounded-2xl border bg-card p-10 text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading Shared Flow...
        </div>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <Card className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
          <h2 className="text-xl font-bold tracking-tight text-destructive">Shared Flow Not Found</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {error || 'This shared Flow does not exist or has been unshared by its owner.'}
          </p>
          <div className="mt-6">
            <Link to="/" className={buttonVariants({ className: 'rounded-xl w-full justify-center' })}>
              Go to Homepage
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header bar */}
      <header className="border-b border-border/50 bg-background/85 px-4 py-3 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">AI Flow Bridge</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Shared</span>
          </div>
          <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'rounded-xl' })}>
            Create Your Own
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{thread.title}</h1>
          <p className="text-sm text-muted-foreground">
            A read-only shared AI model handoff. Copy the continuation prompts below to resume work in another model.
          </p>
        </div>

        <ThreadCard thread={thread} />
        <PromptTabs thread={thread} prompts={thread.prompts} />
      </main>
    </div>
  )
}
