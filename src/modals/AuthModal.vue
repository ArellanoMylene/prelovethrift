<template>
  <ion-modal :is-open="open" class="auth-modal" @didDismiss="$emit('close')">
    <div class="auth" :class="{ 'is-signup': mode === 'up' }">
      <section class="auth-art" aria-label="Pre-Loved Thrift">
        <img src="/assets/login-thrift.png" alt="A customer browsing clothes at a thrift shop" />
        <div class="art-copy">
          <strong>Pre-Loved Thrift</strong>
          <span>Find a new favorite. Give great finds another life.</span>
        </div>
      </section>
      <section class="auth-panel">
        <div class="top">
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
          <label v-if="mode === 'up'">Name<input v-model="name" placeholder="" autocomplete="name" /></label>
          <label>Email<input v-model="email" type="email" placeholder="" autocomplete="email" required /></label>
          <label>Password<input v-model="password" type="password" placeholder="" autocomplete="new-password"
            required minlength="6" /></label>
          <label v-if="mode === 'up'">Confirm password<input v-model="confirmPassword" type="password" placeholder="" autocomplete="new-password" required minlength="6" /></label>
          <label v-if="mode === 'up'">Address<input v-model="address" placeholder="" autocomplete="street-address" /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <p v-if="notice" class="form-success" role="status">{{ notice }}</p>
          <button class="go" type="submit" :disabled="loading">{{ loading ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account' }}</button>
        </form>
        <div class="social-auth">
          <span>or</span>
          <button type="button" class="google-button" :disabled="loading" @click="google">
            <ion-icon :icon="logoGoogle" /> Continue with Google
          </button>
        </div>
        <p class="alt">{{ mode === 'in' ? 'New here?' : 'Already have an account?' }}
          <a @click="toggle">{{ mode === 'in' ? 'Create an account' : 'Sign in' }}</a></p>
      </section>
      <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, logoGoogle, personOutline, storefrontOutline } from 'ionicons/icons'
import { signInWithGoogle, signInWithPassword, signOut as signOutOfSupabase, signUpWithRole } from '../services/auth'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'auth'): void
  (e: 'seller-login'): void
  (e: 'rider-login'): void
}>()

const mode = ref<'in' | 'up'>('in')
const name = ref(''), email = ref(''), password = ref(''), confirmPassword = ref(''), address = ref('')
const error = ref('')
const notice = ref('')
const loading = ref(false)

const clearForm = () => {
  name.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  address.value = ''
  error.value = ''
  notice.value = ''
  loading.value = false
}

watch(() => props.open, o => {
  if (o) {
    mode.value = 'in'
    clearForm()
  }
})

const toggle = () => {
  mode.value = mode.value === 'in' ? 'up' : 'in'
  clearForm()
}

async function submit() {
  if (loading.value) return
  error.value = ''
  notice.value = ''
  loading.value = true

  try {
    if (mode.value === 'up') {
      if (password.value !== confirmPassword.value) {
        throw new Error('Passwords do not match.')
      }

      const result = await signUpWithRole({
        email: email.value,
        password: password.value,
        name: name.value || email.value.split('@')[0] || 'Shopper',
        role: 'buyer',
        address: address.value
      })

      if (result.needsEmailConfirmation) {
        mode.value = 'in'
        clearForm()
        notice.value = 'Check your email to confirm your account, then sign in.'
        return
      }

      clearForm()
      emit('auth')
      emit('close')
      return
    }

    const profile = await signInWithPassword(email.value, password.value)
    if (profile.role !== 'buyer') {
      await signOutOfSupabase()
      const label = profile.role === 'seller' ? 'seller' : 'rider'
      throw new Error(`This account is registered as a ${label}. Use the ${label} sign-in option instead.`)
    }

    clearForm()
    emit('auth')
    emit('close')
  } catch (reason) {
    console.error('Buyer account sign-in failed.', reason)
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
    await signInWithGoogle('buyer')
  } catch (reason) {
    console.error('Google sign-in failed.', reason)
    error.value = reason instanceof Error ? reason.message : 'Unable to continue with Google.'
  } finally {
    loading.value = false
  }
}
</script>
<style>
ion-modal.auth-modal {
  --width: min(960px, 94vw);
  --height: min(740px, 90vh);
  --border-radius: 28px;
  --box-shadow: 0 30px 70px rgba(60,20,20,.3);
}
.auth {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  color: var(--ink);
}
.auth-art,
.auth-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  transition: transform .65s cubic-bezier(.22,.75,.25,1);
}
.auth-art {
  left: 0;
  overflow: hidden;
  background: #ead9cc;
}
.auth-art > img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}
.auth-art::after {
  position: absolute;
  inset: 30% 0 0;
  background: linear-gradient(180deg, transparent, rgba(42,28,21,.68));
  content: '';
}
.art-copy {
  position: absolute;
  z-index: 1;
  right: 30px;
  bottom: 36px;
  left: 30px;
  display: grid;
  gap: 8px;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0,0,0,.25);
}
.art-copy strong {
  font: 700 25px var(--font-head);
}
.art-copy span {
  max-width: 330px;
  font-size: 13px;
  line-height: 1.5;
}
.auth-panel {
  left: 50%;
  box-sizing: border-box;
  padding: 0 34px 26px;
  overflow-y: auto;
  background: #fff;
  transition: transform .65s cubic-bezier(.22,.75,.25,1), left .65s cubic-bezier(.22,.75,.25,1);
}
.auth.is-signup .auth-art { transform: translateX(100%); }
.auth.is-signup .auth-panel { left: 0; }
.auth .top { position: relative; margin: 0 -34px; text-align: center; padding: 28px 34px 18px; color: #fff;
 background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.auth .account-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 18px 8px 0; }
.auth .type-label { grid-column: 1 / -1; color: #927d75; font: 800 9px var(--font-body); letter-spacing: .12em; }
.auth .account-types button { min-width: 0; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 9px 5px; border: 1px solid #eadfd8; border-radius: 11px; background: #fff; color: #74635c; cursor: pointer; font: 700 10px var(--font-body); }
.auth .account-types button.type-active { border-color: var(--coral); background: #fae5e2; color: var(--coral-dark); }
.auth .x { position: absolute; z-index: 3; top: 14px; right: 14px; background: #fff3; color: #fff; border: 0;
 border-radius: 50%; width: 32px; height: 32px; cursor: pointer; }
.auth .mark { width: 60px; height: 60px; border-radius: 50%; background: #fbf9f6; color: var(--coral-dark);
 display: inline-grid; place-items: center; font-size: 26px; margin-bottom: 12px; overflow: hidden;
 border: 2px solid #fff; }
.auth .mark img { width: 100%; height: 100%; object-fit: cover; }
.auth .top h3 { margin: 0 0 5px; color: #fff; font-size: 23px; }
.auth .top small { opacity: .9; }
.auth form { display: grid; gap: 12px; padding: 22px 8px 6px; }
.auth label { display: grid; gap: 6px; font: 600 12px var(--font-body); color: var(--muted); }
.auth input { border: 1.5px solid #eadfd8; border-radius: 14px; padding: 13px 15px; font: 14px var(--font-body);
 background: var(--cream); outline: none; color: var(--ink); }
.auth input:focus { border-color: var(--coral); }
.auth .go { margin-top: 6px; border: 0; border-radius: 14px; padding: 14px; background: var(--coral); color: #fff;
 font: 600 15px var(--font-body); cursor: pointer; box-shadow: 0 12px 26px rgba(219,107,107,.3); }
.auth .form-error { margin: 0; color: #b5473e; font-size: 11px; line-height: 1.5; }
.auth .form-success { margin: 0; color: #39744c; font-size: 11px; line-height: 1.5; }
.auth .go:disabled, .auth .google-button:disabled { opacity: .65; cursor: wait; }
.auth .social-auth { display: grid; gap: 10px; padding: 12px 8px 0; }
.auth .social-auth > span { display: flex; align-items: center; gap: 10px; color: #a9978f; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
.auth .social-auth > span::before, .auth .social-auth > span::after { height: 1px; flex: 1; background: #eadfd8; content: ''; }
.auth .google-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1.5px solid #eadfd8; border-radius: 14px; background: #fff; color: #403632; cursor: pointer; font: 700 13px var(--font-body); }
.auth .google-button ion-icon { color: #db4437; font-size: 18px; }
.auth .google-button:hover { background: #fbf9f6; }
.auth .alt { text-align: center; font-size: 14px; color: var(--muted); margin: 16px 0 0; }
.auth .alt a { color: var(--coral-dark); font-weight: 700; cursor: pointer; }
@media (max-width: 640px) {
  ion-modal.auth-modal { --width: min(480px, 94vw); --height: min(740px, 92vh); --border-radius: 24px; }
  .auth-art { display: none; }
  .auth-panel { left: 0; width: 100%; padding: 0 20px 24px; }
  .auth .top { margin: 0 -20px; padding: 28px 20px 18px; }
  .auth.is-signup .auth-panel { left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .auth-art,
  .auth-panel { transition-duration: .01ms; }
}
</style>
