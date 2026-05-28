import { ArrowRight, Braces, GitBranch, ScanText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const onboardingSteps = [
  {
    icon: ScanText,
    title: 'Create',
    text: 'Start from a chat log, file export, shared link, manual brief, or blank AI workflow.',
  },
  {
    icon: GitBranch,
    title: 'Automate',
    text: 'AI Flow maps objectives, settled decisions, project state, next actions, and model-specific execution paths.',
  },
  {
    icon: Braces,
    title: 'Scale',
    text: 'Copy model handoffs, reuse the Flow, and move work across Claude, ChatGPT, DeepSeek, Gemini, and Grok.',
  },
]

export const FlowOnboardingEmptyState = ({ className }: { className?: string }) => (
  <section className={cn('overflow-hidden rounded-lg border bg-card/95', className)}>
    <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.4fr] lg:p-8">
      <div className="flex flex-col justify-between gap-6">
        <div>
          <div className="mb-4 inline-flex rounded-md border bg-muted px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
            Workspace setup
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Start your first AI workflow</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Build a reusable operating layer for agents, files, context, and model handoffs instead of restarting work in every AI tab.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/app/threads/new" className={buttonVariants()}>
            Capture Context
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/pricing" className={buttonVariants({ variant: 'outline' })}>
            View plans
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {onboardingSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="rounded-lg border bg-background/70 p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)
