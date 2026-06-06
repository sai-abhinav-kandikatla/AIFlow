import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { authApi } from '@/lib/api'
import { clearSupabaseAuthStorage, getAuthRedirectUrl, requireSupabase, supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

const OAUTH_NEXT_KEY = 'aiflow.oauth.next'

type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  token: string | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signup: (payload: { name?: string; email: string; password: string }) => Promise<{ message: string; needsVerification: boolean }>
  login: (payload: { email: string; password: string; captcha_token?: string }) => Promise<void>
  loginWithGoogle: () => Promise<void>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (password: string) => Promise<void>
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>
  updateProfile: (payload: { name?: string; avatar_url?: string }) => Promise<void>
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
  getMfaStatus: () => Promise<{
    currentLevel: string | null
    nextLevel: string | null
    factors: Array<{ id: string; friendly_name?: string; factor_type: string; status: string }>
  }>
  enrollAuthenticator: () => Promise<{ factorId: string; qrCode: string; secret: string }>
  verifyAuthenticatorEnrollment: (payload: { factorId: string; code: string }) => Promise<void>
  verifyAuthenticatorChallenge: (payload: { factorId: string; code: string }) => Promise<void>
  removeMfaFactor: (factorId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const token = session?.access_token ?? null

  const clearStaleAuthState = useCallback(async () => {
    await clearSupabaseAuthStorage()
    setSession(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const accessToken = session?.access_token
    if (!accessToken) {
      setProfile(null)
      return
    }
    const response = await authApi.me(accessToken)
    setProfile(response.user)
  }, [session?.access_token])

  useEffect(() => {
    let mounted = true
    if (!supabase) {
      setLoading(false)
      return
    }
    const client = supabase

    const initializeSession = async () => {
      try {
        const { data } = await client.auth.getSession()
        if (!mounted) return
        setSession(data.session)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeSession().catch(() => {
      if (mounted) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setProfile(null)
      return
    }
    refreshProfile().catch(() => setProfile(null))
  }, [refreshProfile, token])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      token,
      loading,
      refreshProfile,
      signup: async (payload) => {
        await clearStaleAuthState()
        try {
          const response = await authApi.signup(payload)
          await clearStaleAuthState()
          return {
            message: response.message,
            needsVerification: true,
          }
        } catch (error) {
          await clearStaleAuthState()
          throw error
        }
      },
      login: async (payload) => {
        await clearStaleAuthState()
        const response = await authApi.login(payload)
        const { data } = await requireSupabase().auth.setSession(response.session)
        setSession(data.session ?? response.session)
        setProfile(response.user)
      },
      loginWithGoogle: async () => {
        const client = requireSupabase()
        await clearStaleAuthState()
        window.localStorage.setItem(OAUTH_NEXT_KEY, '/app')

        try {
          const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
              queryParams: {
                prompt: 'select_account',
              },
              redirectTo: getAuthRedirectUrl(),
            },
          })
          if (error) throw error
        } catch (error) {
          await clearStaleAuthState()
          throw error
        }
      },
      resendVerification: async (email) => {
        await authApi.resendVerification({ email })
      },
      forgotPassword: async (email) => {
        await authApi.forgotPassword({ email })
      },
      resetPassword: async (password) => {
        const accessToken = session?.access_token
        if (!accessToken) throw new Error('Reset link expired. Request a new password reset email.')
        await authApi.resetPassword(accessToken, { password })
        await clearStaleAuthState()
      },
      changePassword: async ({ currentPassword, newPassword }) => {
        if (!token) throw new Error('Not signed in.')
        await authApi.changePassword(token, {
          current_password: currentPassword,
          new_password: newPassword,
        })
        await clearStaleAuthState()
      },
      updateProfile: async (payload) => {
        if (!token) throw new Error('Not signed in.')
        const response = await authApi.updateMe(token, payload)
        setProfile(response.user)
      },
      deleteAccount: async () => {
        if (!token) throw new Error('Not signed in.')
        await authApi.deleteMe(token)
        await supabase?.auth.signOut()
        setSession(null)
        setProfile(null)
      },
      logout: async () => {
        if (token) {
          await authApi.logout(token).catch(() => undefined)
        }
        await supabase?.auth.signOut()
        setSession(null)
        setProfile(null)
      },
      getMfaStatus: async () => {
        const client = requireSupabase()
        const [{ data: levelData, error: levelError }, { data: factorData, error: factorError }] = await Promise.all([
          client.auth.mfa.getAuthenticatorAssuranceLevel(),
          client.auth.mfa.listFactors(),
        ])
        if (levelError) throw levelError
        if (factorError) throw factorError

        return {
          currentLevel: levelData.currentLevel,
          nextLevel: levelData.nextLevel,
          factors: factorData.all.map((factor) => ({
            id: factor.id,
            friendly_name: factor.friendly_name ?? undefined,
            factor_type: factor.factor_type,
            status: factor.status,
          })),
        }
      },
      enrollAuthenticator: async () => {
        const { data, error } = await requireSupabase().auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'AIFlow authenticator',
        })
        if (error) throw error
        return {
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
        }
      },
      verifyAuthenticatorEnrollment: async ({ factorId, code }) => {
        const client = requireSupabase()
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId })
        if (challengeError) throw challengeError
        const { error } = await client.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code,
        })
        if (error) throw error
        const { data: sessionData } = await client.auth.getSession()
        setSession(sessionData.session)
      },
      verifyAuthenticatorChallenge: async ({ factorId, code }) => {
        const client = requireSupabase()
        const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code })
        if (error) throw error
        const { data: sessionData } = await client.auth.getSession()
        setSession(sessionData.session)
      },
      removeMfaFactor: async (factorId) => {
        const { error } = await requireSupabase().auth.mfa.unenroll({ factorId })
        if (error) throw error
      },
    }),
    [clearStaleAuthState, loading, profile, refreshProfile, session, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
