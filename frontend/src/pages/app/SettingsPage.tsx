import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CreditCard, KeyRound, Loader2, LogOut, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { billingApi, threadApi } from '@/lib/api'
import type { Thread } from '@/lib/types'
import { currentMonthCount, monthlyThreadLimit } from '@/lib/utils'

export const SettingsPage = () => {
  const {
    profile,
    token,
    updateProfile,
    changePassword: verifyAndChangePassword,
    deleteAccount,
    enrollAuthenticator,
    getMfaStatus,
    removeMfaFactor,
    refreshProfile,
    logout,
    verifyAuthenticatorChallenge,
    verifyAuthenticatorEnrollment,
  } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(profile?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaBusy, setMfaBusy] = useState(false)
  const [mfaStatus, setMfaStatus] = useState<Awaited<ReturnType<typeof getMfaStatus>> | null>(null)
  const [mfaEnrollment, setMfaEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null)
  const [mfaEnrollmentCode, setMfaEnrollmentCode] = useState('')
  const [mfaChallengeCode, setMfaChallengeCode] = useState('')

  useEffect(() => {
    setName(profile?.name ?? '')
    setAvatarUrl(profile?.avatar_url ?? '')
  }, [profile?.avatar_url, profile?.name])

  useEffect(() => {
    if (!token) return
    threadApi
      .list(token)
      .then((response) => setThreads(response.threads))
      .catch(() => undefined)
  }, [token])

  const refreshMfaStatus = async () => {
    setMfaLoading(true)
    try {
      setMfaStatus(await getMfaStatus())
    } catch {
      setMfaStatus(null)
    } finally {
      setMfaLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    refreshMfaStatus()
  }, [token])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ name, avatar_url: avatarUrl })
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('Choose a new password that is different from your current one.')
      return
    }

    setChangingPassword(true)
    try {
      await verifyAndChangePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed after verification')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password change failed')
    } finally {
      setChangingPassword(false)
    }
  }

  const removeAccount = async () => {
    if (!window.confirm('Delete your AI Flow profile and all saved Flows?')) return
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const cancelBilling = async () => {
    if (!token) return
    if (!window.confirm('Cancel your Razorpay subscription at the end of the current billing cycle?')) return

    setBillingLoading(true)
    try {
      const response = await billingApi.cancel(token)
      await refreshProfile()
      toast.success({
        title: 'Subscription cancellation scheduled',
        message: response.message,
      })
    } catch (error) {
      toast.error({
        title: 'Could not cancel Razorpay subscription',
        message: error instanceof Error ? error.message : 'Could not update billing.',
        recovery: 'Check Razorpay configuration and webhook status, then retry.',
      })
    } finally {
      setBillingLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Signed out')
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }

  const startMfaEnrollment = async () => {
    setMfaBusy(true)
    try {
      setMfaEnrollment(await enrollAuthenticator())
      setMfaEnrollmentCode('')
      toast.success('Authenticator setup started')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start MFA setup')
    } finally {
      setMfaBusy(false)
    }
  }

  const confirmMfaEnrollment = async () => {
    if (!mfaEnrollment) return
    setMfaBusy(true)
    try {
      await verifyAuthenticatorEnrollment({ factorId: mfaEnrollment.factorId, code: mfaEnrollmentCode })
      setMfaEnrollment(null)
      setMfaEnrollmentCode('')
      await refreshMfaStatus()
      toast.success('Authenticator enabled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify MFA code')
    } finally {
      setMfaBusy(false)
    }
  }

  const verifyMfaSession = async () => {
    const factor = mfaStatus?.factors.find((item) => item.factor_type === 'totp' && item.status === 'verified')
    if (!factor) return
    setMfaBusy(true)
    try {
      await verifyAuthenticatorChallenge({ factorId: factor.id, code: mfaChallengeCode })
      setMfaChallengeCode('')
      await refreshMfaStatus()
      toast.success('MFA verified for this session')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not verify MFA code')
    } finally {
      setMfaBusy(false)
    }
  }

  const removeAuthenticator = async (factorId: string) => {
    if (!window.confirm('Remove this authenticator factor?')) return
    setMfaBusy(true)
    try {
      await removeMfaFactor(factorId)
      await refreshMfaStatus()
      toast.success('Authenticator removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove MFA factor')
    } finally {
      setMfaBusy(false)
    }
  }

  const monthlyUsage = currentMonthCount(threads)
  const plan = profile?.plan ?? 'free'
  const monthlyLimit = monthlyThreadLimit(plan)
  const usagePercent = monthlyLimit ? Math.min((monthlyUsage / monthlyLimit) * 100, 100) : 100
  const periodEnd = profile?.subscription_current_period_end
    ? new Date(profile.subscription_current_period_end).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  const verifiedMfaFactors = mfaStatus?.factors.filter((factor) => factor.status === 'verified') ?? []
  const needsMfaStepUp = mfaStatus?.nextLevel === 'aal2' && mfaStatus.currentLevel !== 'aal2'
  const qrCodeSrc = mfaEnrollment?.qrCode.startsWith('data:')
    ? mfaEnrollment.qrCode
    : mfaEnrollment
      ? `data:image/svg+xml;utf8,${encodeURIComponent(mfaEnrollment.qrCode)}`
      : ''

  return (
    <div className="animate-fade-slide-up mx-auto max-w-4xl space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your plan, profile, password, and account data.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="tracking-tight">Current plan</CardTitle>
          <CardDescription>Your usage and subscription status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold capitalize text-primary">{plan} plan</span>
              {profile?.subscription_status ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Razorpay status: <span className="capitalize">{profile.subscription_status.replaceAll('_', ' ')}</span>
                  {periodEnd ? ` - Renews ${periodEnd}` : ''}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No active subscription connected.</p>
              )}
            </div>
            {plan === 'free' ? (
              <Button onClick={() => navigate('/pricing')} className="rounded-xl">
                <CreditCard className="h-4 w-4" />
                Upgrade
              </Button>
            ) : (
              <Button variant="destructive" onClick={cancelBilling} disabled={billingLoading} className="rounded-xl">
                {billingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Cancel at cycle end
              </Button>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Flows this month</span>
              <span className="font-medium">{monthlyLimit ? `${monthlyUsage}/${monthlyLimit}` : `${monthlyUsage} / unlimited`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Multi-factor authentication
          </CardTitle>
          <CardDescription>Authenticator app verification for sensitive account actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {mfaLoading ? 'Checking MFA' : verifiedMfaFactors.length > 0 ? 'Authenticator enabled' : 'Authenticator not enabled'}
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                Current session: {mfaStatus?.currentLevel ?? 'unknown'}
                {needsMfaStepUp ? ' - verification required before sensitive actions' : ''}
              </p>
            </div>
            <Button variant="outline" onClick={startMfaEnrollment} disabled={mfaBusy || Boolean(mfaEnrollment)} className="rounded-xl">
              {mfaBusy && !mfaEnrollment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Add authenticator
            </Button>
          </div>

          {mfaEnrollment ? (
            <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-[180px_1fr]">
              {qrCodeSrc ? <img src={qrCodeSrc} alt="" className="h-40 w-40 rounded-md bg-white p-2" /> : null}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Secret</p>
                  <p className="mt-1 break-all font-mono text-sm">{mfaEnrollment.secret}</p>
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    value={mfaEnrollmentCode}
                    onChange={(event) => setMfaEnrollmentCode(event.target.value)}
                    inputMode="numeric"
                    placeholder="6-digit code"
                  />
                  <Button onClick={confirmMfaEnrollment} disabled={mfaBusy || mfaEnrollmentCode.length < 6} className="rounded-xl">
                    {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {needsMfaStepUp ? (
            <div className="grid gap-2 rounded-xl border bg-muted/30 p-4 md:grid-cols-[1fr_auto]">
              <Input
                value={mfaChallengeCode}
                onChange={(event) => setMfaChallengeCode(event.target.value)}
                inputMode="numeric"
                placeholder="Authenticator code"
              />
              <Button onClick={verifyMfaSession} disabled={mfaBusy || mfaChallengeCode.length < 6} className="rounded-xl">
                {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify session
              </Button>
            </div>
          ) : null}

          {verifiedMfaFactors.length > 0 ? (
            <div className="divide-y divide-border rounded-xl border">
              {verifiedMfaFactors.map((factor) => (
                <div key={factor.id} className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">{factor.friendly_name || 'Authenticator app'}</div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{factor.factor_type}</div>
                  </div>
                  <Button variant="ghost" onClick={() => removeAuthenticator(factor.id)} disabled={mfaBusy} className="rounded-xl text-destructive">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="tracking-tight">Profile</CardTitle>
          <CardDescription>Keep your AI Flow workspace recognizable.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="grid gap-4 md:grid-cols-[80px_1fr]">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-muted">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold">{(name || profile?.email || 'U').slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>
            <Button disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <KeyRound className="h-5 w-5 text-primary" />
            Change password
          </CardTitle>
          <CardDescription>Verify your current password before setting a new one.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="space-y-4" onSubmit={changePassword}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>Your current credentials are checked with Supabase before the password is updated.</span>
            </div>
            <Button variant="outline" disabled={changingPassword} className="rounded-xl">
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify and change password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/40">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete account
          </CardTitle>
          <CardDescription>This removes your profile, saved Flows, and generated model handoffs.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Button variant="destructive" onClick={removeAccount} disabled={deleting} className="rounded-xl">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete account
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border/70 pt-6">
        <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="rounded-xl">
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Logout
        </Button>
      </div>
    </div>
  )
}
