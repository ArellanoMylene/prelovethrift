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
          <label v-if="mode === 'create'">Rider name<input v-model.trim="name" placeholder="" autocomplete="name" required /></label>
          <label v-if="mode === 'create'">Address<input v-model.trim="address" placeholder="" autocomplete="street-address" required /></label>
          <label>Gmail address<input v-model.trim="email" type="email" placeholder="" autocomplete="email" required /></label>
          <label>Password<input v-model="password" type="password" placeholder="" autocomplete="current-password" required minlength="6" /></label>
          <label v-if="mode === 'create'">Confirm password<input v-model="confirmPassword" type="password" placeholder="" autocomplete="new-password" required minlength="6" /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <p v-if="notice" class="form-success" role="status">{{ notice }}</p>
          <button class="go" type="submit" :disabled="loading">{{ loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign in as rider' : 'Create rider account' }}</button>
        </form>
        <div class="social-auth">
          <span>or</span>
          <button type="button" class="google-button" :disabled="loading" @click="google">
            <ion-icon :icon="logoGoogle" /> Continue with Google
          </button>
        </div>
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
import { arrowBackOutline, closeOutline, logoGoogle } from 'ionicons/icons'
import { signInWithGoogle, signInWithPassword, signOut as signOutOfSupabase, signUpWithRole } from '../services/auth'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (event: 'close'): void
  (event: 'back'): void
  (event: 'auth'): void
}>()
const name = ref('')
const address = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const notice = ref('')
const loading = ref(false)
const mode = ref<'sign-in' | 'create'>('sign-in')

const clearForm = () => {
  name.value = ''
  address.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  notice.value = ''
  loading.value = false
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  mode.value = 'sign-in'
  clearForm()
})

function toggleMode() {
  mode.value = mode.value === 'sign-in' ? 'create' : 'sign-in'
  clearForm()
}

async function submit() {
  if (loading.value) return
  error.value = ''
  notice.value = ''
  loading.value = true

  try {
    if (mode.value === 'create') {
      if (password.value !== confirmPassword.value) {
        throw new Error('Passwords do not match.')
      }

      const result = await signUpWithRole({
        email: email.value,
        password: password.value,
        name: name.value,
        role: 'rider',
        address: address.value
      })

      if (result.needsEmailConfirmation) {
        mode.value = 'sign-in'
        clearForm()
        notice.value = 'Check your email to confirm your rider account, then sign in.'
        return
      }

      clearForm()
      emit('auth')
      emit('close')
      return
    }

    const profile = await signInWithPassword(email.value, password.value)
    if (profile.role !== 'rider') {
      await signOutOfSupabase()
      const label = profile.role === 'seller' ? 'seller' : 'buyer'
      throw new Error(`This account is registered as a ${label}. Use the ${label} sign-in option instead.`)
    }

    clearForm()
    emit('auth')
    emit('close')
  } catch (reason) {
    console.error('Rider account sign-in failed.', reason)
    error.value = reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}

async function google() {
  if (loading.value) return
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    await signInWithGoogle('rider')
  } catch (reason) {
    console.error('Google rider sign-in failed.', reason)
    error.value = reason instanceof Error ? reason.message : 'Unable to continue with Google.'
  } finally {
    loading.value = false
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
.rider-auth .go:disabled, .rider-auth .google-button:disabled { opacity: .65; cursor: wait; }
.rider-auth .social-auth { display: grid; gap: 10px; padding: 12px 8px 0; }
.rider-auth .social-auth > span { display: flex; align-items: center; gap: 10px; color: #a9978f; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
.rider-auth .social-auth > span::before, .rider-auth .social-auth > span::after { height: 1px; flex: 1; background: #eadfd8; content: ''; }
.rider-auth .google-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1.5px solid #eadfd8; border-radius: 14px; background: #fff; color: #403632; cursor: pointer; font: 700 13px var(--font-body); }
.rider-auth .google-button ion-icon { color: #db4437; font-size: 18px; }
.rider-auth .google-button:hover { background: #fbf9f6; }
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
