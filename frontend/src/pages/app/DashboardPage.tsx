import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  Clock3,
  Layers3,
  Loader2,
  Mail,
  PlayCircle,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlowOnboardingEmptyState } from '@/components/flow/FlowOnboardingEmptyState'
import { UsageBanner } from '@/components/thread/UsageBanner'
import { useAuth } from '@/contexts/AuthContext'
import { threadApi } from '@/lib/api'
import type { Thread } from '@/lib/types'
import { currentMonthCount, formatDate, monthlyThreadLimit } from '@/lib/utils'

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: LucideIcon }) => (
  <Card className="lift">
    <CardContent className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
)

const workspaceModules = [
  ['AI Chat', 'Ask, draft, analyze, and route context to the right model.', Bot],
  ['Agent Builder', 'Create focused agents with tools, memory, and instructions.', Sparkles],
  ['Workflow Canvas', 'Connect triggers, conditions, model calls, and outputs.', Workflow],
] as const

const workflowSteps = [
  ['Trigger', 'New client brief uploaded'],
  ['Agent', 'Research and summarize requirements'],
  ['Condition', 'Route technical tasks to developer agent'],
  ['Output', 'Create launch checklist and handoff'],
]

const ProfileSection = ({
  name,
  email,
  avatarUrl,
  plan,
}: {
  name: string
  email: string
  avatarUrl?: string | null
  plan: string
}) => (
  <Card className="overflow-hidden">
    <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-lg border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-primary/10 text-xl font-semibold text-primary">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold">Profile</h2>
            <span className="rounded-md border bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">{plan} workspace</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{name}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {email}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Private Flow workspace
            </span>
          </div>
        </div>
      </div>
      <Link to="/app/settings" className={buttonVariants({ variant: 'outline', className: 'w-full lg:w-auto' })}>
        <UserRound className="h-4 w-4" />
        Manage Profile
      </Link>
    </CardContent>
  </Card>
)

export const DashboardPage = () => {
  const { token, profile } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    threadApi
      .list(token)
      .then((response) => setThreads(response.threads))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load Flows'))
      .finally(() => setLoading(false))
  }, [token])

  const monthlyUsage = currentMonthCount(threads)
  const monthlyLimit = monthlyThreadLimit(profile?.plan)
  const recent = threads.slice(0, 5)
  const displayName = profile?.name?.trim() || profile?.email || 'AI Flow user'
  const displayEmail = profile?.email ?? 'Profile not loaded'
  const plan = profile?.plan ?? 'free'

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <section className="overflow-hidden rounded-lg border bg-card/95">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-accent" />
              AI Workflow Operating System
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold md:text-4xl">Build agents, automate workflows, and manage AI work in one workspace.</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Launch AI chat, files, workflow automation, memory, model handoffs, and execution history from a single operating layer.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link to="/app/threads/new" className={buttonVariants({ size: 'lg' })}>
              <Plus className="h-4 w-4" />
              Start AI Workflow
            </Link>
            <Link to="/app/threads" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Open Flow Studio
            </Link>
          </div>
        </div>
      </section>

      {monthlyLimit !== null && monthlyUsage >= monthlyLimit ? <UsageBanner count={monthlyUsage} limit={monthlyLimit} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total AI Flows created" value={threads.length} icon={Layers3} />
        <StatCard title="Flows mapped this month" value={monthlyUsage} icon={TrendingUp} />
        <StatCard title="Model handoffs available" value="5" icon={Braces} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {workspaceModules.map(([title, text, Icon]) => (
                <Link key={title} to={title === 'Workflow Canvas' ? '/app/threads' : '/app/threads/new'} className="rounded-lg border bg-background/70 p-4 transition hover:border-primary/35 hover:bg-muted/50">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Workflow canvas</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">A visual automation chain for agentic work.</p>
              </div>
              <Link to="/app/threads/new" className={buttonVariants({ variant: 'outline' })}>
                <PlayCircle className="h-4 w-4" />
                Run preview
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 lg:grid-cols-4">
                {workflowSteps.map(([label, text], index) => (
                  <div key={label} className="relative rounded-lg border bg-background/80 p-4">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{label}</span>
                      <span className="text-xs text-muted-foreground">0{index + 1}</span>
                    </div>
                    <div className="text-sm font-medium">{text}</div>
                    {index < workflowSteps.length - 1 ? <ArrowRight className="absolute -right-5 top-1/2 hidden h-4 w-4 text-muted-foreground lg:block" /> : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {loading || recent.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Recent Flows</CardTitle>
                <Link to="/app/threads" className={buttonVariants({ variant: 'outline', className: 'hidden md:inline-flex' })}>
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Flows
                  </div>
                ) : (
                  <div className="divide-y">
                    {recent.map((thread) => (
                      <Link key={thread.id} to={`/app/threads/${thread.id}`} className="flex items-center gap-4 py-4 transition hover:bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{thread.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{formatDate(thread.created_at)}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <FlowOnboardingEmptyState />
          )}
        </div>

        <aside className="space-y-4">
          <ProfileSection name={displayName} email={displayEmail} avatarUrl={profile?.avatar_url} plan={plan} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                AI settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['GPT-5', 'Claude Sonnet', 'Gemini Flash', 'DeepSeek'].map((model, index) => (
                <div key={model} className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-sm">
                  {model}
                  <span className={index === 0 ? 'h-2 w-2 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-muted-foreground/30'} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Execution queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Analyze uploaded brief', 'Draft launch assets', 'Sync model handoff'].map((task) => (
                <div key={task} className="flex items-center gap-3 rounded-md border bg-background/70 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span className="flex-1">{task}</span>
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
