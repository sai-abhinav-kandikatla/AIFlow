import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileJson, FileText, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { threadApi } from '@/lib/api'
import type { Thread } from '@/lib/types'

export const ExportPage = () => {
  const { token } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string>('')
  const [format, setFormat] = useState<'json' | 'markdown'>('json')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    threadApi
      .list(token, { limit: 100 }) // Load up to 100 threads for export selection
      .then((response) => {
        setThreads(response.threads)
        if (response.threads.length > 0) {
          setSelectedThreadId(response.threads[0].id)
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load Flows'))
      .finally(() => setLoading(false))
  }, [token])

  const selectedThread = threads.find((t) => t.id === selectedThreadId)

  const getExportData = () => {
    if (!selectedThread) return ''

    if (format === 'json') {
      return JSON.stringify(
        {
          id: selectedThread.id,
          title: selectedThread.title,
          goal: selectedThread.goal,
          context: selectedThread.context,
          key_decisions: selectedThread.key_decisions,
          last_point: selectedThread.last_point,
          next_step: selectedThread.next_step,
          tags: selectedThread.tags,
          created_at: selectedThread.created_at,
          prompts: selectedThread.prompts.map((p) => ({
            model_name: p.model_name,
            prompt_text: p.prompt_text,
          })),
        },
        null,
        2
      )
    }

    // Markdown format
    return [
      `# ${selectedThread.title}`,
      '',
      `**Created at:** ${new Date(selectedThread.created_at).toLocaleString()}`,
      `**Tags:** ${selectedThread.tags.join(', ') || 'none'}`,
      '',
      '## Current Objective',
      selectedThread.goal,
      '',
      '## Flow Context',
      selectedThread.context,
      '',
      '## Settled Decisions',
      selectedThread.key_decisions.length
        ? selectedThread.key_decisions.map((d) => `- ${d}`).join('\n')
        : '- No explicit decisions were detected.',
      '',
      '## Current State',
      selectedThread.last_point,
      '',
      '## Next Milestone',
      selectedThread.next_step,
      '',
      '## Destination Handoff Prompts',
      ...selectedThread.prompts.flatMap((p) => [
        '',
        `### Handoff for ${p.model_name}`,
        '```text',
        p.prompt_text,
        '```',
      ]),
    ].join('\n')
  }

  const handleDownload = () => {
    if (!selectedThread) return
    const content = getExportData()
    const filename = `${selectedThread.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.${
      format === 'json' ? 'json' : 'md'
    }`
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('File downloaded successfully')
  }

  return (
    <div className="animate-fade-slide-up space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Export Flows</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Download your conversation bridges as structured JSON or readable Markdown files.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border bg-card p-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading Flows
        </div>
      ) : threads.length === 0 ? (
        <Card className="rounded-2xl p-6 text-center">
          <p className="text-muted-foreground">You don't have any Flows to export yet.</p>
          <Link to="/app/threads/new" className="mt-4 inline-block text-primary hover:underline">
            Capture your first context
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Options side */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Export Options</CardTitle>
                <CardDescription>Select the Flow and format.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="flow-select">Select Flow</Label>
                  <select
                    id="flow-select"
                    value={selectedThreadId}
                    onChange={(e) => setSelectedThreadId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {threads.map((thread) => (
                      <option key={thread.id} value={thread.id}>
                        {thread.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('json')}
                      className={`flex h-20 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                        format === 'json'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <FileJson className="h-5 w-5 mb-1" />
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('markdown')}
                      className={`flex h-20 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                        format === 'markdown'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <FileText className="h-5 w-5 mb-1" />
                      Markdown
                    </button>
                  </div>
                </div>

                <Button onClick={handleDownload} className="w-full rounded-xl gap-2" size="lg">
                  <Download className="h-4 w-4" />
                  Download File
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview side */}
          <Card className="rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[600px] min-h-[400px]">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-lg">Export Preview</CardTitle>
              <CardDescription>
                A preview of the generated {format.toUpperCase()} contents.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden relative min-h-[300px]">
              <pre className="absolute inset-0 p-4 font-mono text-xs text-muted-foreground overflow-auto bg-muted/40 select-all whitespace-pre-wrap leading-relaxed">
                {getExportData()}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
