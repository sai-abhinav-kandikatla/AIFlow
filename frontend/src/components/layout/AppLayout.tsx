import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Bot,
  Command,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users2,
  Workflow,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', href: '/app', icon: Home, end: true },
  { label: 'AI Chat', href: '/app/threads/new', icon: MessageSquareText },
  { label: 'Agents', href: '/app/threads', icon: Bot },
  { label: 'Workflows', href: '/app/threads', icon: Workflow },
  { label: 'Files', href: '/app/threads/new', icon: FileText },
  { label: 'Analytics', href: '/app', icon: BarChart3, end: true },
  { label: 'Team', href: '/app/settings', icon: Users2 },
  { label: 'Billing', href: '/pricing', icon: CreditCard },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export const AppLayout = () => {
  const [open, setOpen] = useState(false)
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = profile?.name?.trim() || profile?.email || 'AI Flow user'
  const displayEmail = profile?.email ?? 'Profile not loaded'
  const initial = displayName.slice(0, 1).toUpperCase()

  useEffect(() => {
    if (profile && !profile.name?.trim()) {
      navigate('/app/onboarding', { replace: true })
    }
  }, [navigate, profile])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r bg-card/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background shadow-sm shadow-primary/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">AI Flow</div>
          <div className="text-xs text-muted-foreground">AI Workflow OS</div>
        </div>
      </div>
      <div className="border-b p-3">
        <Link
          to="/app/threads/new"
          onClick={() => setOpen(false)}
          className="flex items-center justify-between rounded-lg border bg-primary/10 px-3 py-3 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/15"
        >
          New AI workflow
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
                  isActive && 'border-primary/20 bg-primary/10 text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="space-y-3 border-t p-3">
        <Link
          to="/app/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg border bg-background/70 p-3 transition hover:border-primary/35 hover:bg-muted/60"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-md object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{displayName}</div>
            <div className="truncate text-xs text-muted-foreground">{displayEmail}</div>
          </div>
        </Link>
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="workspace-shell min-h-svh">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-background/80" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-muted-foreground">Enterprise context workspace</div>
              <div className="text-lg font-semibold">AI Workflow Operating System</div>
            </div>
          </div>
          <div className="mx-3 hidden min-w-0 flex-1 md:block">
            <div className="mx-auto flex h-10 max-w-xl items-center gap-3 rounded-md border bg-card/80 px-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span className="truncate">Search agents, workflows, files, or tasks...</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs">
                <Command className="h-3 w-3" /> K
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border bg-card/80 px-3 py-2 text-sm font-medium md:flex">
              <Zap className="h-4 w-4 text-primary" />
              2.4k credits
            </div>
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-md border px-3 py-2 md:flex">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initial}
                </div>
              )}
              <div className="max-w-40 truncate text-sm">{displayName}</div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/90 p-2 backdrop-blur lg:hidden">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.label} to={item.href} end={item.end} className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs text-muted-foreground">
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
