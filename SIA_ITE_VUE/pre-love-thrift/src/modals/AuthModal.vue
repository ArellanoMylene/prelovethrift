<template>
  <ion-modal :is-open="open" class="auth-modal" @didDismiss="$emit('close')">
    <div class="auth">
      <div class="top">
        <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
        <span class="mark"><img src="/assets/logo.png" alt="Pre-Loved Thrift" /></span>
        <h3>{{ mode === 'in' ? 'Welcome back' : 'Join Pre-Loved' }}</h3>
        <small>{{ mode === 'in' ? 'Sign in to track orders and saved fits' : 'Create an account in seconds' }}</small>
      </div>
      <div class="account-types" aria-label="Choose account type">
        <span class="type-label">SIGN IN AS</span>
        <button type="button" class="type-active"><ion-icon :icon="personOutline" /> Buyer</button>
        <button type="button" @click="emit('seller-login'); emit('close')"><ion-icon :icon="storefrontOutline" /> Seller</button>
        <button type="button" @click="emit('rider-login'); emit('close')">Delivery rider</button>
      </div>
      <form @submit.prevent="submit">
        <label v-if="mode === 'up'">Name<input v-model="name" placeholder="Your name" autocomplete="name" /></label>
        <label>Email<input v-model="email" type="email" placeholder="you@example.com" autocomplete="email" required /></label>
        <label>Password<input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password"
          required minlength="6" /></label>
        <label v-if="mode === 'up'">Phone number<input v-model="phone" type="tel" placeholder="09xx xxx xxxx" autocomplete="tel" /></label>
        <label v-if="mode === 'up'">Address<input v-model="address" placeholder="Your delivery address" autocomplete="street-address" /></label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <p v-if="notice" class="form-success" role="status">{{ notice }}</p>
        <button class="go" type="submit">{{ mode === 'in' ? 'Sign in' : 'Create account' }}</button>
      </form>
      <p class="alt">{{ mode === 'in' ? 'New here?' : 'Already have an account?' }}
        <a @click="toggle">{{ mode === 'in' ? 'Create an account' : 'Sign in' }}</a></p>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, personOutline, storefrontOutline } from 'ionicons/icons'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'auth', user: { name: string; email: string; phone?: string; address?: string }): void
  (e: 'seller-login'): void
  (e: 'rider-login'): void
}>()

const mode = ref<'in' | 'up'>('in')
const name = ref(''), email = ref(''), password = ref(''), phone = ref(''), address = ref('')
const error = ref('')
const notice = ref('')

interface BuyerAccount {
  name: string
  email: string
  phone?: string
  address?: string
  salt: string
  passwordHash: string
}
const accountsKey = 'pl_buyer_accounts'

watch(() => props.open, o => {
  if (o) {
    mode.value = 'in'
    name.value = ''
    email.value = ''
    password.value = ''
    phone.value = ''
    address.value = ''
    error.value = ''
    notice.value = ''
  }
})

const toggle = () => {
  mode.value = mode.value === 'in' ? 'up' : 'in'
  error.value = ''
  notice.value = ''
}

function readAccounts(): BuyerAccount[] {
  const saved = localStorage.getItem(accountsKey)
  if (!saved) return []
  const parsed: unknown = JSON.parse(saved)
  if (!Array.isArray(parsed)) throw new Error('Stored buyer accounts are invalid.')
  return parsed as BuyerAccount[]
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
  const mail = email.value.trim().toLowerCase()

  try {
    const accounts = readAccounts()
    const existing = accounts.find(account => account.email === mail)
    if (mode.value === 'up') {
      if (existing) {
        error.value = 'An account with this email already exists. Please sign in.'
        return
      }

      const salt = toHex(globalThis.crypto.getRandomValues(new Uint8Array(16)))
      const account: BuyerAccount = {
        name: name.value.trim() || mail.split('@')[0] || 'Shopper',
        email: mail,
        phone: phone.value.trim(),
        address: address.value.trim(),
        salt,
        passwordHash: await hashPassword(password.value, salt)
      }
      localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]))
      mode.value = 'in'
      name.value = ''
      phone.value = ''
      address.value = ''
      password.value = ''
      email.value = mail
      notice.value = 'Account created. Please sign in to continue.'
      return
    }

    if (!existing) {
      error.value = 'No account found for this email. Please create an account first.'
      return
    }
    if (await hashPassword(password.value, existing.salt) !== existing.passwordHash) {
      error.value = 'Incorrect password. Please try again.'
      return
    }

    emit('auth', {
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      address: existing.address
    })
    emit('close')
  } catch (reason) {
    console.error('Buyer account sign-in failed.', reason)
    error.value = reason instanceof Error ? reason.message : 'Unable to access buyer accounts on this device.'
  }
}
</script>
<style>
ion-modal.auth-modal {
  --width: min(480px, 92vw);
  --height: min(620px, 82vh);
  --border-radius: 30px;
  --box-shadow: 0 30px 70px rgba(60,20,20,.3);
}
.auth {
  background: #fff;
  padding-bottom: 22px;
  max-height: 100%;
  overflow-y: auto;
  height: 100%;
}
.auth .top { position: relative; text-align: center; padding: 34px 22px 22px; color: #fff;
 background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.auth .account-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 16px 22px 0; }
.auth .type-label { grid-column: 1 / -1; color: #927d75; font: 800 9px var(--font-body); letter-spacing: .12em; }
.auth .account-types button { min-width: 0; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 9px 5px; border: 1px solid #eadfd8; border-radius: 11px; background: #fff; color: #74635c; cursor: pointer; font: 700 10px var(--font-body); }
.auth .account-types button.type-active { border-color: var(--coral); background: #fae5e2; color: var(--coral-dark); }
.auth .x { position: absolute; top: 14px; right: 14px; background: #fff3; color: #fff; border: 0;
 border-radius: 50%; width: 32px; height: 32px; cursor: pointer; }
.auth .mark { width: 60px; height: 60px; border-radius: 50%; background: #fbf9f6; color: var(--coral-dark);
 display: inline-grid; place-items: center; font-size: 26px; margin-bottom: 12px; overflow: hidden;
 border: 2px solid #fff; }
.auth .mark img { width: 100%; height: 100%; object-fit: cover; }
.auth h3 { color: #fff; font-size: 23px; } .auth small { opacity: .9; }
.auth form { display: grid; gap: 14px; padding: 22px 22px 6px; }
.auth label { display: grid; gap: 6px; font: 600 12px var(--font-body); color: var(--muted); }
.auth input { border: 1.5px solid #eadfd8; border-radius: 14px; padding: 13px 15px; font: 14px var(--font-body);
 background: var(--cream); outline: none; color: var(--ink); }
.auth input:focus { border-color: var(--coral); }
.auth .go { margin-top: 6px; border: 0; border-radius: 14px; padding: 14px; background: var(--coral); color: #fff;
 font: 600 15px var(--font-body); cursor: pointer; box-shadow: 0 12px 26px rgba(219,107,107,.3); }
.auth .form-error { margin: 0 22px; color: #b5473e; font-size: 11px; line-height: 1.5; }
.auth .form-success { margin: 0 22px; color: #39744c; font-size: 11px; line-height: 1.5; }
.auth .alt { text-align: center; font-size: 14px; color: var(--muted); margin: 16px 0 0; }
.auth .alt a { color: var(--coral-dark); font-weight: 700; cursor: pointer; }
</style>
