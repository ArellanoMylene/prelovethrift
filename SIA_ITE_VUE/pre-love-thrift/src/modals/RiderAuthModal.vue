<template>
  <ion-modal :is-open="open" class="rider-auth-modal" @didDismiss="$emit('close')">
    <div class="rider-auth" :class="{ 'is-signup': mode === 'create' }">
      <section class="rider-auth-art" aria-label="Pre-Loved Thrift">
        <img src="/assets/login-thrift.png" alt="A customer browsing clothes at a thrift shop" />
        <div class="art-copy">
          <strong>Pre-Loved Thrift</strong>
          <span>Find a new favorite. Give great finds another life.</span>
        </div>
      </section>
      <section class="rider-auth-panel">
        <div class="top">
          <button class="back" type="button" aria-label="Back to account selection" @click="emit('back')"><ion-icon :icon="arrowBackOutline" /></button>
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
      </section>
      <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { arrowBackOutline, closeOutline } from 'ionicons/icons'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'back'): void
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
ion-modal.rider-auth-modal { --width: min(960px, 94vw); --height: min(740px, 90vh); --border-radius: 28px; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.rider-auth { position: relative; width: 100%; height: 100%; overflow: hidden; background: #fff; color: var(--ink); }
.rider-auth-art, .rider-auth-panel { position: absolute; top: 0; bottom: 0; width: 50%; transition: transform .65s cubic-bezier(.22,.75,.25,1), left .65s cubic-bezier(.22,.75,.25,1); }
.rider-auth-art { left: 0; overflow: hidden; background: #ead9cc; }
.rider-auth-art > img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center; }
.rider-auth-art::after { position: absolute; inset: 30% 0 0; background: linear-gradient(180deg, transparent, rgba(42,28,21,.68)); content: ''; }
.rider-auth .art-copy { position: absolute; z-index: 1; right: 30px; bottom: 36px; left: 30px; display: grid; gap: 8px; color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,.25); }
.rider-auth .art-copy strong { font: 700 25px var(--font-head); }
.rider-auth .art-copy span { max-width: 330px; font-size: 13px; line-height: 1.5; }
.rider-auth-panel { left: 50%; box-sizing: border-box; padding: 0 34px 26px; overflow-y: auto; background: #fff; }
.rider-auth.is-signup .rider-auth-art { transform: translateX(100%); }
.rider-auth.is-signup .rider-auth-panel { left: 0; }
.rider-auth .top { position: relative; margin: 0 -34px; text-align: center; padding: 28px 34px 18px; color: #fff; background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.rider-auth .x { position: absolute; z-index: 2; top: 14px; right: 14px; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #fff3; color: #fff; cursor: pointer; }
.rider-auth .back { position: absolute; top: 14px; left: 14px; width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 50%; background: #fff3; color: #fff; cursor: pointer; font-size: 19px; }
.rider-auth .mark { width: 60px; height: 60px; margin-bottom: 12px; display: inline-grid; place-items: center; overflow: hidden; border: 2px solid #fff; border-radius: 50%; background: #fbf9f6; }
.rider-auth .mark img { width: 100%; height: 100%; object-fit: cover; }
.rider-auth .top h3 { margin: 0 0 5px; color: #fff; font-size: 23px; }
.rider-auth .top small { opacity: .9; }
.rider-auth form { display: grid; gap: 14px; padding: 22px 8px 6px; }
.rider-auth label { display: grid; gap: 6px; color: var(--muted); font: 600 12px var(--font-body); }
.rider-auth input { padding: 13px 15px; border: 1.5px solid #eadfd8; border-radius: 14px; outline: none; background: var(--cream); color: var(--ink); font: 14px var(--font-body); }
.rider-auth input:focus { border-color: var(--coral); }
.rider-auth .go { margin-top: 4px; padding: 14px; border: 0; border-radius: 14px; background: var(--coral); color: #fff; cursor: pointer; font: 600 14px var(--font-body); box-shadow: 0 12px 26px rgba(219,107,107,.3); }
.rider-auth .form-error { margin: 0; color: #b5473e; font-size: 11px; line-height: 1.5; }
.rider-auth .form-success { margin: 0; color: #39744c; font-size: 11px; line-height: 1.5; }
.rider-auth .mode-switch { margin: 14px 8px 0; color: var(--muted); text-align: center; font-size: 12px; }
.rider-auth .mode-switch button { border: 0; background: transparent; color: var(--coral-dark); cursor: pointer; font: inherit; font-weight: 700; }
@media (max-width: 640px) {
  ion-modal.rider-auth-modal { --width: min(480px, 94vw); --height: min(740px, 92vh); --border-radius: 24px; }
  .rider-auth-art { display: none; }
  .rider-auth-panel, .rider-auth.is-signup .rider-auth-panel { left: 0; width: 100%; padding: 0 20px 24px; }
  .rider-auth .top { margin: 0 -20px; padding: 28px 20px 18px; }
}
@media (prefers-reduced-motion: reduce) { .rider-auth-art, .rider-auth-panel { transition-duration: .01ms; } }
</style>
