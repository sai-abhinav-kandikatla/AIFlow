import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  DatabaseZap,
  FileText,
  Globe2,
  Layers3,
  MessageSquareText,
  Network,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const trustItems = [
  { icon: BrainCircuit, label: 'Built with GPT-5' },
  { icon: Globe2, label: 'Powered by Vercel' },
  { icon: ShieldCheck, label: 'Secure Authentication' },
  { icon: Zap, label: 'Fast Global Infrastructure' },
]

const bentoFeatures: { icon: LucideIcon; title: string; text: string; className?: string }[] = [
  {
    icon: Bot,
    title: 'AI Agents',
    text: 'Build task-specific agents with memory, tools, files, and reusable instructions.',
    className: 'md:col-span-2',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    text: 'Chain triggers, conditions, model calls, and outputs into repeatable AI systems.',
  },
  {
    icon: FileText,
    title: 'File Intelligence',
    text: 'Upload documents, PDFs, images, and project files for instant analysis.',
  },
  {
    icon: MessageSquareText,
    title: 'AI Chat',
    text: 'Collaborate with models in a focused workspace that remembers the job.',
  },
  {
    icon: Network,
    title: 'Multi-Model AI',
    text: 'Route work across GPT, Claude, Gemini, DeepSeek, Grok, and specialist models.',
    className: 'md:col-span-2',
  },
  {
    icon: Users2,
    title: 'Team Collaboration',
    text: 'Share workflows, prompts, files, and agent runs with your workspace.',
  },
  {
    icon: DatabaseZap,
    title: 'AI Memory',
    text: 'Persistent context keeps projects moving without repeated setup.',
  },
  {
    icon: Layers3,
    title: 'Real-Time Workspace',
    text: 'Track tasks, automations, model handoffs, and execution history in one place.',
    className: 'md:col-span-2',
  },
]

const workflowNodes = [
  ['Trigger', 'New brief uploaded', 'border-blue-400/40 bg-blue-500/10'],
  ['Agent', 'Research and synthesize', 'border-purple-400/40 bg-purple-500/10'],
  ['Condition', 'Route by priority', 'border-cyan-400/40 bg-cyan-500/10'],
  ['Output', 'Publish task plan', 'border-emerald-400/40 bg-emerald-500/10'],
]

const howItWorks = [
  ['Create', 'Start with a chat, file, agent, workflow, or blank workspace.'],
  ['Automate', 'Connect tools, models, instructions, and triggers into repeatable systems.'],
  ['Scale', 'Share templates, invite teams, track usage, and ship faster with AI.'],
]

const testimonials = [
  ['Maya Chen', 'Founder, Northstar Labs', 'AI Flow feels like the missing operating layer between our team, models, and workflows.'],
  ['Arjun Rao', 'Product Lead, StudioSignal', 'We stopped scattering context across chat tabs. Agents, files, and handoffs finally live together.'],
  ['Elena Torres', 'Automation Consultant', 'It has the polish of Linear and the utility of Zapier, but built for AI-native work.'],
]

const pricing: { name: string; price: string; subtitle: string; items: string[] }[] = [
  { name: 'Free', price: '$0', subtitle: 'Explore AI Flow', items: ['Basic AI chat', '5 workflow runs', 'Starter templates'] },
  { name: 'Pro', price: '$19', subtitle: 'For AI power users', items: ['Advanced models', 'Unlimited workflows', 'File intelligence'] },
  { name: 'Team', price: '$49', subtitle: 'For growing teams', items: ['Shared workspaces', 'Analytics', 'Team collaboration'] },
  { name: 'Enterprise', price: 'Custom', subtitle: 'For secure scale', items: ['Admin controls', 'API access', 'Custom deployment'] },
]

const faqs = [
  ['Is AI Flow only for developers?', 'No. It is built for creators, students, founders, agencies, and developers who want one workspace for AI work.'],
  ['Can I use multiple AI models?', 'Yes. AI Flow is designed for multi-model work across GPT, Claude, Gemini, DeepSeek, Grok, and more.'],
  ['Does this replace my current chat tools?', 'It works as the operating layer around them: agents, workflows, files, memory, and handoffs in one place.'],
  ['Can teams collaborate?', 'Yes. Team workspaces, shared workflows, analytics, and billing are designed into the product model.'],
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

const ProductPreview = () => (
  <motion.div
    initial={{ opacity: 0, y: 28, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="relative"
  >
    <div className="absolute inset-0 translate-y-6 rounded-lg bg-primary/20 blur-3xl" />
    <div className="relative overflow-hidden rounded-lg border border-white/12 bg-zinc-950/85 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
          <Search className="h-3.5 w-3.5" />
          Command K
        </div>
      </div>
      <div className="grid min-h-[460px] lg:grid-cols-[180px_1fr_220px]">
        <aside className="hidden border-r border-white/10 p-4 text-sm text-zinc-400 lg:block">
          {['Dashboard', 'AI Chat', 'Agents', 'Workflows', 'Files', 'Analytics'].map((item, index) => (
            <div key={item} className={cn('mb-2 rounded-md px-3 py-2', index === 3 && 'bg-white/10 text-white')}>
              {item}
            </div>
          ))}
        </aside>
        <div className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-zinc-500">Live workflow</div>
              <div className="text-lg font-semibold text-white">Launch assistant pipeline</div>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Running</div>
          </div>
          <div className="relative grid gap-4">
            <div className="absolute left-6 top-10 hidden h-[260px] w-px bg-gradient-to-b from-blue-400 via-purple-400 to-emerald-300 md:block" />
            {workflowNodes.map(([label, text, style], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.12 }}
                className={cn('relative rounded-lg border p-4', style)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs text-white">{index + 1}</span>
                  <div>
                    <div className="text-xs uppercase text-zinc-400">{label}</div>
                    <div className="font-medium text-white">{text}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <aside className="border-t border-white/10 p-4 lg:border-l lg:border-t-0">
          <div className="mb-3 text-xs uppercase text-zinc-500">AI Copilot</div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-zinc-300">
            I found 4 launch blockers, created 3 agent tasks, and drafted the automation sequence.
          </div>
          <div className="mt-4 space-y-2">
            {['Claude Sonnet', 'GPT-5', 'Gemini Flash'].map((model) => (
              <div key={model} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">
                {model}
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  </motion.div>
)

export const LandingPage = () => (
  <div className="min-h-svh overflow-hidden bg-[#090b10] text-white">
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#090b10]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-zinc-950">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">AI Flow</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#demo" className="hover:text-white">Demo</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className={buttonVariants({ variant: 'ghost', className: 'text-white hover:bg-white/10' })}>
            Login
          </Link>
          <Link to="/signup" className={buttonVariants({ className: 'hidden bg-white text-zinc-950 hover:bg-zinc-200 sm:inline-flex' })}>
            Start Free
          </Link>
        </div>
      </div>
    </header>

    <section className="relative px-4 pb-20 pt-32 md:px-8 md:pt-40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20" />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(135deg,rgba(49,87,255,0.28),rgba(124,58,237,0.16),transparent_62%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.7 }}>
          <Badge className="border-white/15 bg-white/10 text-white">The AI Workflow Operating System</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">
            The AI Workflow Operating System
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Build AI agents, automate workflows, and collaborate with powerful AI tools in one intelligent workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className={buttonVariants({ size: 'lg', className: 'bg-white text-zinc-950 hover:bg-zinc-200' })}>
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#demo" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'border-white/15 bg-white/5 text-white hover:bg-white/10' })}>
              <Play className="h-4 w-4" />
              Watch Demo
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-400">
            {['Agents', 'Automation', 'Memory', 'Multi-model AI'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{item}</span>
            ))}
          </div>
        </motion.div>
        <ProductPreview />
      </div>
    </section>

    <main className="relative bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-card/80 p-4">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-primary">Operating layer</p>
          <h2 className="mt-2 text-4xl font-semibold">Everything AI-native teams need to ship faster.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            AI Flow combines agents, workflows, chat, memory, files, and collaboration into one fast workspace.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {bentoFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className={cn('lift overflow-hidden', feature.className)}>
                <CardContent className="p-5">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Interactive workspace</p>
            <h2 className="mt-2 text-4xl font-semibold">Design automations like products, not scripts.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Create workflow chains, route tasks to the right model, analyze files, and keep execution history visible.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Drag AI nodes', 'Connect tools', 'Run agents', 'Review outputs'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Workflow Builder</span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">Live preview</span>
            </div>
            <div className="grid gap-3">
              {workflowNodes.map(([label, text], index) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border bg-background/70 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">{label}</div>
                    <div className="font-medium">{text}</div>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map(([title, text], index) => (
            <Card key={title} className="lift">
              <CardContent className="p-6">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">0{index + 1}</div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Loved by builders</p>
            <h2 className="mt-2 text-4xl font-semibold">Built for launch-speed teams.</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map(([name, role, quote]) => (
            <Card key={name} className="lift">
              <CardContent className="p-6">
                <p className="text-sm leading-6 text-muted-foreground">"{quote}"</p>
                <div className="mt-5 font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">{role}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-primary">Pricing</p>
          <h2 className="mt-2 text-4xl font-semibold">Start free. Scale into a full AI workspace.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {pricing.map(({ name, price, subtitle, items }) => (
            <Card key={name} className={cn('lift', name === 'Pro' && 'border-primary')}>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground">{name}</div>
                <div className="mt-3 text-3xl font-semibold">{price}<span className="text-base text-muted-foreground">{price === 'Custom' ? '' : '/month'}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
                <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-primary">FAQ</p>
          <h2 className="mt-2 text-4xl font-semibold">Questions before you build?</h2>
        </div>
        <div className="grid gap-3">
          {faqs.map(([question, answer]) => (
            <Card key={question}>
              <CardContent className="p-5">
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="overflow-hidden rounded-lg border bg-[#090b10] p-8 text-white md:p-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold md:text-5xl">Start Building With AI</h2>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Launch your first AI workspace, create agents, and automate the work that slows your team down.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className={buttonVariants({ size: 'lg', className: 'bg-white text-zinc-950 hover:bg-zinc-200' })}>
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'border-white/15 bg-white/5 text-white hover:bg-white/10' })}>
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
)
