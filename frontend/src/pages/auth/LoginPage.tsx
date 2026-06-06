import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe2, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { AuthShell } from '@/pages/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { clearSupabaseAuthStorage } from '@/lib/supabase'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

const captchaSiteKey = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined
const turnstileScriptId = 'aiflow-turnstile-script'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { from?: string; authError?: string; toastShown?: boolean } | null
  const redirectTo = routeState?.from ?? '/app'
  const authError = routeState?.authError
  const shownAuthError = useRef<string | null>(null)
  const captchaRef = useRef<HTMLDivElement | null>(null)
  const captchaWidgetId = useRef<string | null>(null)

  useEffect(() => {
    if (session) navigate(redirectTo, { replace: true })
  }, [navigate, redirectTo, session])

  useEffect(() => {
    if (!captchaRequired || !captchaSiteKey || !captchaRef.current || captchaWidgetId.current) return

    const renderCaptcha = () => {
      if (!window.turnstile || !captchaRef.current || captchaWidgetId.current) return
      captchaWidgetId.current = window.turnstile.render(captchaRef.current, {
        sitekey: captchaSiteKey,
        theme: 'auto',
        callback: setCaptchaToken,
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }

    const existing = document.getElementById(turnstileScriptId)
    if (existing) {
      renderCaptcha()
      existing.addEventListener('load', renderCaptcha, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = turnstileScriptId
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = renderCaptcha
    document.body.appendChild(script)
  }, [captchaRequired])

  const restartGoogleConnection = useCallback(async () => {
    await clearSupabaseAuthStorage()
    await loginWithGoogle()
  }, [loginWithGoogle])

  useEffect(() => {
    if (!authError || routeState?.toastShown || shownAuthError.current === authError) return
    shownAuthError.current = authError
    toast.error({
      title: 'Google sign-in did not finish',
      message: authError,
      recovery: 'Start a clean OAuth attempt. If the same server error appears again, re-copy the Google Client ID and Secret into Supabase.',
      action: {
        label: 'Retry connection',
        onClick: restartGoogleConnection,
      },
      persistent: true,
    })
  }, [authError, restartGoogleConnection, routeState?.toastShown])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await login({ email, password, captcha_token: captchaToken || undefined })
      toast.success('Signed in. Opening your workspace.')
      navigate(redirectTo)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      if (message.toLowerCase().includes('additional verification')) {
        setCaptchaRequired(true)
        setCaptchaToken('')
        captchaWidgetId.current = null
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Sign in to AI Flow" subtitle="Open your saved Flows and keep cross-model work moving.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {captchaRequired ? (
          <div className="rounded-md border bg-muted/40 p-3">
            {captchaSiteKey ? (
              <div ref={captchaRef} className="min-h-[65px]" />
            ) : (
              <p className="text-sm text-muted-foreground">Additional verification is required. Try again later.</p>
            )}
          </div>
        ) : null}
        <Button className="w-full" disabled={loading || (captchaRequired && Boolean(captchaSiteKey) && !captchaToken)}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          restartGoogleConnection().catch((error) =>
            toast.error({
              title: 'Could not start Google sign-in',
              message: error instanceof Error ? error.message : 'Google sign-in failed before redirect.',
              recovery: 'Clear the local auth cache, then retry the Google connection.',
              action: {
                label: 'Clear cache & retry',
                onClick: restartGoogleConnection,
              },
              persistent: true,
            }),
          )
        }
      >
        <Globe2 className="h-4 w-4" />
        Continue with Google
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
