import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Braces, Layers3, Loader2, Mail, Plus, ShieldCheck, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'
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
  const displayName = profile?.name?.trim() || profile?.email || 'AIFlow user'
  const displayEmail = profile?.email ?? 'Profile not loaded'
  const plan = profile?.plan ?? 'free'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="max-w-3xl text-3xl font-semibold">Move Your AI Conversations Seamlessly Between Models.</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Capture complete chat context and generate optimized handoff blueprints for Claude, ChatGPT, DeepSeek, Gemini, and Grok.
          </p>
        </div>
        <Link to="/app/threads/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Capture Context
        </Link>
      </div>

      {monthlyLimit !== null && monthlyUsage >= monthlyLimit ? <UsageBanner count={monthlyUsage} limit={monthlyLimit} /> : null}

      <ProfileSection name={displayName} email={displayEmail} avatarUrl={profile?.avatar_url} plan={plan} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total AI Flows created" value={threads.length} icon={Layers3} />
        <StatCard title="Flows mapped this month" value={monthlyUsage} icon={TrendingUp} />
        <StatCard title="Model handoffs available" value="5" icon={Braces} />
      </div>

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
  )
}
