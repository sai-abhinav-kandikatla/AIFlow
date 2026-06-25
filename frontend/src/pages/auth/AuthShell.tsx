import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'


export const AuthShell = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) => {
  const navigate = useNavigate()
  return (
  <div className="grid min-h-svh bg-background lg:grid-cols-[1fr_560px]">

    <section className="hero-scene hidden min-h-svh p-8 lg:flex lg:flex-col lg:justify-between">
      <Link to="/" className="flex items-center gap-3 font-semibold">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        AI Flow
      </Link>
      <div className="max-w-xl">
        <h1 className="text-5xl font-semibold leading-tight">Move AI conversations without losing context</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Capture a prior chat, let AIFlow map the important state, and continue the same work in another model.
        </p>
      </div>
      <div className="grid gap-3">
        {['Share links', 'Chat exports', 'Context mapping', 'Model handoffs', 'Saved Flows'].map((model) => (
          <div key={model} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-3">
            <span className="text-sm">{model}</span>
            <span className="h-2 w-20 rounded bg-accent/70" />
          </div>
        ))}
      </div>
    </section>
    <section className="flex min-h-svh items-center justify-center p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Flow
          </Link>
        </div>
        <Card className="animate-fade-slide-up p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </Card>
      </div>
    </section>
  </div>
  )
}

