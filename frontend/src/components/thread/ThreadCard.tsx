import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Thread } from '@/lib/types'

const Section = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={`min-w-0 break-words border-l-2 border-primary/25 pl-4 [overflow-wrap:anywhere] ${className ?? ''}`}>
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
    <div className="text-sm leading-relaxed text-foreground">{children}</div>
  </div>
)

export const ThreadCard = ({ thread }: { thread: Thread }) => (
  <Card className="animate-scale-in overflow-hidden rounded-2xl">
    <CardHeader className="pb-4">
      {thread.tags.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <CardTitle className="break-words text-2xl leading-tight tracking-tight [overflow-wrap:anywhere]">{thread.title}</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-6 pt-0 lg:grid-cols-2">
      <Section label="Current Objective" className="animate-fade-slide-up stagger-1">
        {thread.goal}
      </Section>
      <Section label="Current State" className="animate-fade-slide-up stagger-2">
        {thread.last_point}
      </Section>
      <Section label="Settled Decisions" className="animate-fade-slide-up stagger-3">
        <ul className="space-y-2">
          {thread.key_decisions.length > 0 ? (
            thread.key_decisions.map((decision) => (
              <li key={decision} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{decision}</span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No explicit decisions were detected.</li>
          )}
        </ul>
      </Section>
      <Section label="Next Milestone" className="animate-fade-slide-up stagger-4">
        {thread.next_step}
      </Section>
      <Section label="Flow Context" className="animate-fade-slide-up stagger-5 lg:col-span-2">
        <p className="break-words text-muted-foreground [overflow-wrap:anywhere]">{thread.context}</p>
      </Section>
    </CardContent>
  </Card>
)
