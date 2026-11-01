<template>
  <ion-modal :is-open="open" class="rider-auth-modal" @didDismiss="$emit('close')">
    <div class="rider-auth">
      <div class="top">
        <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
        <span class="mark"><img src="/assets/logo.png" alt="Pre-Loved Thrift" /></span>
        <h3>Delivery rider</h3>
        <small>{{ mode === 'sign-in' ? 'Sign in to view your assigned deliveries' : 'Create your rider profile' }}</small>
      </div>
      <form @submit.prevent="submit">
        <label v-if="mode === 'create'">Rider name<input v-model.trim="name" placeholder="Your name" autocomplete="name" required /></label>
        <label v-if="mode === 'create'">Phone number<input v-model.trim="phone" type="tel" placeholder="09xx xxx xxxx" autocomplete="tel" required /></label>
        <label>Gmail address<input v-model.trim="email" type="email" placeholder="rider@gmail.com" autocomplete="email" required /></label>
        <label>Password<input v-model="password" type="password" placeholder="At least 6 characters" autocomplete="current-password" required minlength="6" /></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-success" role="status">{{ notice }}</p>
        <button class="go" type="submit">{{ mode === 'sign-in' ? 'Sign in as rider' : 'Create rider account' }}</button>
      </form>
      <p class="mode-switch">
        {{ mode === 'sign-in' ? 'New rider?' : 'Already registered?' }}
        <button type="button" @click="toggleMode">{{ mode === 'sign-in' ? 'Create a rider account' : 'Sign in' }}</button>
      </p>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'auth', rider: { name: string; email: string; phone?: string }): void
}>()
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const error = ref('')
const notice = ref('')
const mode = ref<'sign-in' | 'create'>('sign-in')

interface RiderAccount {
  name: string
  email: string
  phone?: string
  salt: string
  passwordHash: string
}
const accountsKey = 'pl_rider_accounts'

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  name.value = ''
  email.value = ''
  phone.value = ''
  password.value = ''
  error.value = ''
  notice.value = ''
  mode.value = 'sign-in'
})

function toggleMode() {
  mode.value = mode.value === 'sign-in' ? 'create' : 'sign-in'
  error.value = ''
  notice.value = ''
}

function readAccounts(): RiderAccount[] {
  const saved = localStorage.getItem(accountsKey)
  if (!saved) return []
  const parsed: unknown = JSON.parse(saved)
  if (!Array.isArray(parsed)) throw new Error('Stored rider accounts are invalid.')
  return parsed as RiderAccount[]
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(value: string, salt: string) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure password storage is unavailable in this browser.')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`))
  return toHex(new Uint8Array(digest))
}

async function submit() {
  error.value = ''
  const normalizedEmail = email.value.trim().toLowerCase()
  try {
    const accounts = readAccounts()
    const existing = accounts.find(account => account.email === normalizedEmail)
    if (mode.value === 'create') {
      if (existing) {
        error.value = 'A rider account with this email already exists. Sign in instead.'
        return
      }
      const salt = toHex(globalThis.crypto.getRandomValues(new Uint8Array(16)))
      const account = {
        name: name.value.trim(),
        email: normalizedEmail,
        phone: phone.value.trim(),
        salt,
        passwordHash: await hashPassword(password.value, salt)
      }
      localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]))
      mode.value = 'sign-in'
      name.value = ''
      phone.value = ''
      email.value = account.email
      password.value = ''
      notice.value = 'Account created. Please sign in to continue.'
    } else {
      if (!existing) {
        error.value = 'No rider account found for this email. Create a rider account first.'
        return
      }
      if (await hashPassword(password.value, existing.salt) !== existing.passwordHash) {
        error.value = 'Incorrect password. Please try again.'
        return
      }
      emit('auth', { name: existing.name, email: existing.email, phone: existing.phone })
      emit('close')
    }
  } catch (reason) {
    console.error('Rider account sign-in failed.', reason)
    error.value = reason instanceof Error ? reason.message : 'Unable to access rider accounts on this device.'
  }
}
</script>

<style>
ion-modal.rider-auth-modal { --width: min(400px, 92vw); --height: auto; --border-radius: 26px; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.rider-auth { background: #fff; padding-bottom: 22px; }
.rider-auth .top { position: relative; text-align: center; padding: 34px 22px 22px; color: #fff; background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.rider-auth .x { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #fff3; color: #fff; cursor: pointer; }
.rider-auth .mark { width: 60px; height: 60px; margin-bottom: 12px; display: inline-grid; place-items: center; overflow: hidden; border: 2px solid #fff; border-radius: 50%; background: #fbf9f6; }
.rider-auth .mark img { width: 100%; height: 100%; object-fit: cover; }
.rider-auth h3 { color: #fff; font-size: 23px; }
.rider-auth .top small { opacity: .9; }
.rider-auth form { display: grid; gap: 14px; padding: 22px 22px 6px; }
.rider-auth label { display: grid; gap: 6px; color: var(--muted); font: 600 12px var(--font-body); }
.rider-auth input { padding: 13px 15px; border: 1.5px solid #eadfd8; border-radius: 14px; outline: none; background: var(--cream); color: var(--ink); font: 14px var(--font-body); }
.rider-auth input:focus { border-color: var(--coral); }
.rider-auth .go { margin-top: 4px; padding: 14px; border: 0; border-radius: 14px; background: var(--coral); color: #fff; cursor: pointer; font: 600 14px var(--font-body); box-shadow: 0 12px 26px rgba(219,107,107,.3); }
.rider-auth .form-error { margin: 0; color: #b5473e; font-size: 11px; line-height: 1.5; }
.rider-auth .form-success { margin: 0; color: #39744c; font-size: 11px; line-height: 1.5; }
.rider-auth .mode-switch { margin: 14px 20px 0; color: var(--muted); text-align: center; font-size: 12px; }
.rider-auth .mode-switch button { border: 0; background: transparent; color: var(--coral-dark); cursor: pointer; font: inherit; font-weight: 700; }
</style>
