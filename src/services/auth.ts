import { requireSupabase } from '../utils/supabase'
import type { AppUser, Profile, RiderSummary, UserRole } from '../types/database'

const pendingRoleKey = 'pl_pending_oauth_role'

const isRole = (value: unknown): value is UserRole =>
  value === 'buyer' || value === 'seller' || value === 'rider'

function sleep(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export function profileToUser(profile: Profile): AppUser {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.full_name.trim() || profile.email.split('@')[0] || 'Shopper',
    email: profile.email,
    phone: profile.phone || undefined,
    address: profile.address || undefined,
    avatar: profile.avatar || undefined
  }
}

export function queueOAuthRole(role: UserRole) {
  try {
    sessionStorage.setItem(pendingRoleKey, role)
  } catch {
    // Session storage can be unavailable in privacy modes; the profile will
    // simply default to the buyer role in that case.
  }
}

function takeOAuthRole(): UserRole | null {
  try {
    const value = sessionStorage.getItem(pendingRoleKey)
    sessionStorage.removeItem(pendingRoleKey)
    return isRole(value) ? value : null
  } catch {
    return null
  }
}

export function clearPendingOAuthRole() {
  try {
    sessionStorage.removeItem(pendingRoleKey)
  } catch {
    // Ignore storage access failures.
  }
}

export interface SignUpInput {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  address?: string
}

export async function signUpWithRole(input: SignUpInput): Promise<{ needsEmailConfirmation: boolean; profile: Profile | null }> {
  clearPendingOAuthRole()
  const { data, error } = await requireSupabase().auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        role: input.role,
        phone: input.phone?.trim() ?? '',
        address: input.address?.trim() ?? ''
      }
    }
  })

  if (error) throw error
  if (!data.session) return { needsEmailConfirmation: true, profile: null }

  const profile = await fetchMyProfile()
  if (!profile) throw new Error('Your account profile is still being created. Please sign in again in a moment.')
  return { needsEmailConfirmation: false, profile }
}

export async function signInWithPassword(email: string, password: string): Promise<Profile> {
  clearPendingOAuthRole()
  const { error } = await requireSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  })
  if (error) throw error

  const profile = await fetchMyProfile()
  if (!profile) throw new Error('Your account profile is not ready yet. Please try again.')
  return profile
}

export async function signInWithGoogle(role: UserRole): Promise<void> {
  queueOAuthRole(role)
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
      queryParams: { prompt: 'select_account' }
    }
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  clearPendingOAuthRole()
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const client = requireSupabase()
  const { data: { session }, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!session) return null

  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!user) return null

  // The auth trigger runs immediately, but OAuth callbacks can race the first
  // profile read by a few milliseconds.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (error) throw error
    if (data) return data as Profile
    await sleep(250)
  }

  return null
}

export async function applyPendingRole(profile: Profile): Promise<Profile> {
  const pendingRole = takeOAuthRole()
  if (profile.role_locked) return profile

  const client = requireSupabase()
  const { error } = await client.rpc('set_my_role', { new_role: pendingRole ?? 'buyer' })
  if (error && !error.message.toLowerCase().includes('already has a role')) throw error

  return (await fetchMyProfile()) ?? profile
}

export interface ProfilePatch {
  full_name?: string
  phone?: string
  address?: string
  avatar?: string
}

export async function updateMyProfile(patch: ProfilePatch): Promise<Profile> {
  const client = requireSupabase()
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Please sign in again.')

  const update: Record<string, string | null> = {}
  if (patch.full_name !== undefined) update.full_name = patch.full_name.trim()
  if (patch.phone !== undefined) update.phone = patch.phone.trim() || null
  if (patch.address !== undefined) update.address = patch.address.trim() || null
  if (patch.avatar !== undefined) update.avatar = patch.avatar || null

  if (!Object.keys(update).length) throw new Error('Nothing to update.')

  const { data, error } = await client
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}

export async function listRiders(): Promise<RiderSummary[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'rider')
    .order('full_name', { ascending: true })

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id as string,
    name: (row.full_name as string).trim() || (row.email as string),
    email: row.email as string,
    phone: (row.phone as string | null) || undefined
  }))
}
