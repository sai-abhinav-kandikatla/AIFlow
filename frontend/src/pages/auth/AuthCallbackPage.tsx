import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { clearSupabaseAuthStorage, requireSupabase } from '@/lib/supabase'

const OAUTH_NEXT_KEY = 'aiflow.oauth.next'

const cleanAuthError = (message: string) => {
  const normalized = message.replace(/\+/g, ' ')
  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

const readAuthRedirectParams = (search: string, hash: string) => {
  const searchParams = new URLSearchParams(search)
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)

  const get = (key: string) => searchParams.get(key) ?? hashParams.get(key)

  return {
    next: get('next'),
    code: get('code'),
    error: get('error_description') ?? get('error'),
  }
}

const safeNextPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app'
  return value
}

const clearStaleAuthState = async () => {
  await clearSupabaseAuthStorage()
}

export const AuthCallbackPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    const finishAuth = async () => {
      if (handled.current) return
      handled.current = true

      const { next, code, error } = readAuthRedirectParams(location.search, location.hash)
      const storedNext = window.localStorage.getItem(OAUTH_NEXT_KEY)
      const destination = safeNextPath(next ?? storedNext)
      window.localStorage.removeItem(OAUTH_NEXT_KEY)

      if (error) {
        const message = cleanAuthError(error)
        await clearStaleAuthState()
        toast.error({
          title: 'Authentication did not finish',
          message,
          recovery: 'Clear the saved auth state, then start a fresh sign-in or password reset attempt.',
          action: {
            label: 'Clear cache & restart',
            onClick: async () => {
              await clearStaleAuthState()
              window.location.assign('/login')
            },
          },
          persistent: true,
        })
        navigate('/login', { replace: true, state: { authError: message, toastShown: true } })
        return
      }

      try {
        const supabase = requireSupabase()
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            const { data } = await supabase.auth.getSession()
            if (!data.session) throw exchangeError
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!data.session) throw new Error('No Supabase session was returned.')

        navigate(destination, { replace: true })
      } catch (authError) {
        await clearStaleAuthState()
        const message = authError instanceof Error ? authError.message : 'Could not finish authentication'
        toast.error({
          title: 'Authentication did not finish',
          message,
          recovery: 'The auth code could not be exchanged for a session. Clear local auth state, then retry.',
          action: {
            label: 'Clear cache & restart',
            onClick: async () => {
              await clearStaleAuthState()
              window.location.assign('/login')
            },
          },
          persistent: true,
        })
        navigate('/login', { replace: true, state: { authError: message, toastShown: true } })
      }
    }

    finishAuth()
  }, [location.hash, location.search, navigate])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 text-muted-foreground">
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
        <div className="font-medium text-foreground">Finishing authentication</div>
        <p className="mt-1 text-sm">Creating your session and opening the dashboard.</p>
      </div>
    </div>
  )
}
