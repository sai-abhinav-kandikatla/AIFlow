import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Loader2, Share2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { PromptTabs } from '@/components/thread/PromptTabs'
import { ThreadCard } from '@/components/thread/ThreadCard'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { threadApi } from '@/lib/api'
import type { Thread } from '@/lib/types'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export const ThreadDetailPage = () => {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)

  const toggleShare = async () => {
    if (!token || !thread) return
    setSharing(true)
    try {
      if (thread.is_shared) {
        const response = await threadApi.unshare(token, thread.id)
        setThread(response.thread)
        toast.success('Sharing disabled')
      } else {
        const response = await threadApi.share(token, thread.id)
        setThread(response.thread)
        toast.success('Sharing enabled! Link copied to clipboard')
        const link = `${window.location.origin}/shared/${response.thread.share_token}`
        await navigator.clipboard.writeText(link)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Share toggle failed')
    } finally {
      setSharing(false)
    }
  }

  const copyShareLink = async () => {
    if (!thread?.share_token) return
    const link = `${window.location.origin}/shared/${thread.share_token}`
    await navigator.clipboard.writeText(link)
    toast.success('Share link copied to clipboard')
  }

  useEffect(() => {
    if (!token || !id) return
    setLoading(true)
    threadApi
      .get(token, id)
      .then((response) => {
        setThread(response.thread)
        setTitle(response.thread.title)
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load Flow'))
      .finally(() => setLoading(false))
  }, [id, token])

  const saveTitle = async () => {
    if (!token || !thread) return
    const nextTitle = title.trim()
    if (!nextTitle) {
      setTitle(thread.title)
      setEditingTitle(false)
      return
    }
    if (nextTitle === thread.title) {
      setEditingTitle(false)
      return
    }

    const previousThread = thread
    // Optimistic update
    setThread({ ...thread, title: nextTitle })
    setTitle(nextTitle)
    setEditingTitle(false)

    try {
      const response = await threadApi.update(token, thread.id, { title: nextTitle })
      setThread(response.thread)
      setTitle(response.thread.title)
      toast.success('Flow renamed')
    } catch (error) {
      // Rollback on failure
      setThread(previousThread)
      setTitle(previousThread.title)
      toast.error(error instanceof Error ? error.message : 'Rename failed')
    }
  }

  const regenerate = async () => {
    if (!token || !thread) return
    setRegenerating(true)
    try {
      const response = await threadApi.regenerate(token, thread.id)
      setThread(response.thread)
      toast.success('Model handoffs refined')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Flow refinement failed')
    } finally {
      setRegenerating(false)
    }
  }

  const deleteThread = async () => {
    if (!token || !thread) return
    setIsDeleting(true)
    try {
      await threadApi.delete(token, thread.id)
      toast.success('Flow deleted')
      navigate('/app/threads')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-slide-up flex items-center justify-center rounded-2xl border bg-card p-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Flow
      </div>
    )
  }

  if (!thread) {
    return (
      <Card className="animate-scale-in">
        <CardContent className="p-8">
          <p className="text-muted-foreground">Flow not found.</p>
          <Link to="/app/threads" className={buttonVariants({ className: 'mt-4' })}>
            Back to Flows
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="animate-fade-slide-up space-y-6 pb-20">
      <div className="space-y-5">
        <Link to="/app/threads" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <Input
                autoFocus
                value={title}
                onBlur={saveTitle}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                  if (event.key === 'Escape') {
                    setTitle(thread.title)
                    setEditingTitle(false)
                  }
                }}
                className="h-auto rounded-xl border-transparent bg-muted px-3 py-2 text-3xl font-semibold tracking-tight md:text-4xl"
              />
            ) : (
              <button type="button" className="block max-w-full text-left" onClick={() => setEditingTitle(true)} title="Click to rename">
                <h1 className="truncate text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{thread.title}</h1>
              </button>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Click the title to rename this Flow.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={thread.is_shared ? "secondary" : "outline"}
              onClick={toggleShare}
              disabled={sharing}
              className="rounded-xl gap-2"
            >
              <Share2 className="h-4 w-4" />
              {thread.is_shared ? 'Shared' : 'Share'}
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        {thread.is_shared && thread.share_token && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Public share link active</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {window.location.origin}/shared/{thread.share_token}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="shrink-0 rounded-xl gap-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>
          </div>
        )}
      </div>

      <ThreadCard thread={thread} />
      <PromptTabs thread={thread} prompts={thread.prompts} onRegenerate={regenerate} regenerating={regenerating} />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Flow"
        description={`Are you sure you want to delete the Flow "${thread.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={deleteThread}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
