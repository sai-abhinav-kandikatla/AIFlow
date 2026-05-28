import { Clipboard, WandSparkles } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { GeneratedPrompt, Thread } from '@/lib/types'

const modelNotes: Record<GeneratedPrompt['model_name'], string> = {
  ChatGPT: 'Structured handoff prompt for broad reasoning and fast task continuation.',
  Claude: 'Context-rich handoff prompt for careful analysis and nuanced writing.',
  Gemini: 'Synthesis-first handoff prompt with explicit assumptions and next moves.',
  DeepSeek: 'Execution-focused handoff prompt for technical problem solving.',
  Grok: 'Concise handoff prompt with direct framing and assumption checks.',
}

export const PromptTabs = ({
  thread,
  prompts,
  onRegenerate,
  regenerating,
}: {
  thread: Thread
  prompts: GeneratedPrompt[]
  onRegenerate?: () => void
  regenerating?: boolean
}) => {
  const first = prompts[0]?.model_name ?? 'ChatGPT'

  const copyThread = async (prompt: GeneratedPrompt) => {
    const text = [
      `AIFlow bridge for ${prompt.model_name}`,
      '',
      `Title: ${thread.title}`,
      `Current Strategic Objective: ${thread.goal}`,
      '',
      'Flow Context:',
      thread.context,
      '',
      'Settled Decisions:',
      ...(thread.key_decisions.length ? thread.key_decisions.map((decision) => `- ${decision}`) : ['- No explicit decisions were detected.']),
      '',
      `Current State: ${thread.last_point}`,
      `Next Milestone: ${thread.next_step}`,
      '',
      thread.tags.length ? `Context Signals: ${thread.tags.join(', ')}` : 'Context Signals: none',
      '',
      `${prompt.model_name} Model Handoff:`,
      prompt.prompt_text,
    ].join('\n')

    await navigator.clipboard.writeText(text)
    toast.success(`${prompt.model_name} handoff prompt copied`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Model Handoffs</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a destination model and copy a custom instruction set designed for that model's response style.
          </p>
        </div>
        {onRegenerate ? (
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={regenerating}
            title="Refine Flow Configuration"
            aria-label="Refine Flow Configuration"
          >
            <WandSparkles className={regenerating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refine Flow
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={first}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            {prompts.map((prompt) => (
              <TabsTrigger key={prompt.model_name} value={prompt.model_name}>
                {prompt.model_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {prompts.map((prompt) => (
            <TabsContent key={prompt.model_name} value={prompt.model_name}>
              <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">{modelNotes[prompt.model_name]}</p>
                <Button
                  onClick={() => copyThread(prompt)}
                  title={`Copy a ${prompt.model_name} handoff prompt with custom instructions designed for that model's architecture.`}
                  aria-label={`Copy ${prompt.model_name} Handoff Prompt`}
                >
                  <Clipboard className="h-4 w-4" />
                  Copy Handoff Prompt
                </Button>
              </div>
              <pre className="max-h-[440px] overflow-auto rounded-lg border bg-background p-4 text-sm leading-6 whitespace-pre-wrap text-foreground">
                {prompt.prompt_text}
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
