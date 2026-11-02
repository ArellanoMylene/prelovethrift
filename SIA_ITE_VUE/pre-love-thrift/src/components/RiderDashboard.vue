<template>
  <section class="rider-page">
    <header class="rider-header">
      <a class="rider-brand" @click="$emit('storefront')">
        <img src="/assets/logo.png" alt="" />
        <span><b>PRE-LOVED</b><small>RIDER PORTAL</small></span>
      </a>
      <div class="rider-account">
        <div class="rider-account-menu">
          <button class="rider-profile-button" type="button" aria-label="Rider account menu" :aria-expanded="accountMenuOpen" @click="accountMenuOpen = !accountMenuOpen">
            <img v-if="rider.avatar" class="rider-header-avatar" :src="rider.avatar" alt="" />
            <ion-icon v-else :icon="personCircleOutline" />
            <span>{{ rider.name }}</span>
          </button>
          <div v-if="accountMenuOpen" class="account-menu">
            <div class="account-info"><b>{{ rider.name }}</b><small>{{ rider.email }}</small><span>Rider account</span></div>
            <button type="button" @click="openProfile">Edit profile</button>
            <button type="button" @click="accountMenuOpen = false; $emit('logout')">Log out</button>
          </div>
        </div>
      </div>
    </header>

    <div v-if="profileOpen" class="profile-overlay" @click.self="profileOpen = false">
      <section class="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="rider-profile-title">
        <button class="profile-close" type="button" aria-label="Close profile editor" @click="profileOpen = false">×</button>
        <span class="eyebrow">ACCOUNT SETTINGS</span>
        <h2 id="rider-profile-title">Rider profile</h2>
        <div class="rider-edit-photo">
          <span class="rider-edit-avatar">
            <img v-if="profileDraft.avatar" :src="profileDraft.avatar" alt="Rider profile photo preview" />
            <template v-else>{{ (profileDraft.name || rider.name).charAt(0).toUpperCase() }}</template>
          </span>
          <input ref="profilePhotoInput" class="rider-photo-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handleProfilePhoto" />
          <button type="button" class="profile-photo-button" @click="profilePhotoInput?.click()">Upload profile photo</button>
          <button v-if="profileDraft.avatar" type="button" class="profile-photo-remove" @click="profileDraft.avatar = ''">Remove photo</button>
        </div>
        <form class="profile-form" @submit.prevent="saveProfile">
          <label>Full name<input v-model.trim="profileDraft.name" required maxlength="80" autocomplete="name" /></label>
          <label>Phone number<input v-model.trim="profileDraft.phone" type="tel" autocomplete="tel" placeholder="09xx xxx xxxx" /></label>
          <label>Gmail address<input :value="rider.email" type="email" disabled /></label>
          <p v-if="profileError" class="profile-error" role="alert">{{ profileError }}</p>
          <div class="profile-actions">
            <button type="button" class="profile-cancel" @click="profileOpen = false">Cancel</button>
            <button type="submit" class="profile-save">Save changes</button>
          </div>
        </form>
      </section>
    </div>

    <main class="rider-content">
      <div class="rider-title">
        <div><span class="eyebrow">DELIVERY OVERVIEW</span><h1>Welcome back, {{ firstName }}</h1>
          <p>Here’s your delivery activity at a glance.</p></div>
        <div class="delivery-summary">
          <div class="delivery-count"><b>{{ activeOrders.length }}</b><span>Active deliveries</span></div>
          <div class="delivery-count completed-count"><b>{{ historyOrders.length }}</b><span>Completed</span></div>
        </div>
      </div>

      <nav class="rider-tabs" aria-label="Delivery views">
        <button :class="{ active: tab === 'active' }" @click="tab = 'active'">Active deliveries <span>{{ activeOrders.length }}</span></button>
        <button :class="{ active: tab === 'history' }" @click="tab = 'history'">Completed history <span>{{ historyOrders.length }}</span></button>
      </nav>

      <div v-if="tab === 'active' && !activeOrders.length" class="rider-empty">
        <b>No assigned deliveries yet</b>
        <p>When a seller assigns an order to <strong>{{ rider.name }}</strong>, it will appear here.</p>
      </div>
      <div v-else-if="tab === 'history' && !historyOrders.length" class="rider-empty">
        <b>No completed deliveries yet</b><p>Completed orders will be kept in your delivery history.</p>
      </div>

      <div v-else class="delivery-list">
        <article v-for="order in visibleOrders" :key="order.id" class="delivery-card">
          <header class="delivery-heading">
            <div><span class="eyebrow">ORDER</span><h2>{{ order.id }}</h2><small>{{ formatDate(order.date) }}</small></div>
            <span class="delivery-status" :class="{ complete: order.status === 'Delivered' }">{{ order.status || 'Confirmed' }}</span>
          </header>

          <div class="customer-contact">
            <div class="contact-copy">
              <span>Customer</span>
              <b>{{ order.customerName || 'Customer' }}</b>
              <small>{{ order.customerPhone || 'Customer phone number not provided.' }}</small>
            </div>
          </div>

          <section class="customer-location">
            <span class="section-label">CUSTOMER DELIVERY ADDRESS</span>
            <p>{{ order.customerAddress || 'Customer address was not provided.' }}</p>
            <a v-if="order.customerAddress" class="directions-logo" :href="mapUrl(order.customerAddress)" target="_blank" rel="noopener noreferrer" aria-label="Open directions" title="Open directions">
              <ion-icon :icon="locationOutline" aria-hidden="true" />
            </a>
          </section>

          <section class="delivery-products">
            <span class="section-label">PRODUCTS TO DELIVER</span>
            <label v-for="(item, index) in order.items" :key="`${order.id}-${index}`" class="delivery-item">
              <img :src="item.img || fallbackImage" :alt="item.name" />
              <span><b>{{ item.name }}</b><small>{{ item.size ? `Size ${item.size}` : 'Order item' }}</small></span>
              <input type="checkbox" :checked="isItemDelivered(order, index)" :aria-label="`${item.name} delivered`"
                @change="toggleDeliveredItem(order, index, ($event.target as HTMLInputElement).checked)" />
              <small class="item-delivery-state">{{ isItemDelivered(order, index) ? 'Delivered' : 'Not delivered' }}</small>
            </label>
          </section>

          <section class="delivery-proof">
            <span class="section-label">DELIVERY PHOTO</span>
            <p>Take a photo at the drop-off to complete delivery. The customer can view this proof.</p>
            <label class="camera-button">
              <input type="file" accept="image/*" capture="environment" @change="readProof(order, $event)" />
              {{ order.deliveryProof ? 'Retake delivery photo' : 'Take / upload delivery photo' }}
            </label>
            <img v-if="order.deliveryProof" class="proof-preview" :src="order.deliveryProof" alt="Delivery proof" />
            <p v-if="errors[order.id]" class="delivery-error" role="alert">{{ errors[order.id] }}</p>
            <button v-if="order.status !== 'Delivered'" class="complete-button" :disabled="!allItemsDelivered(order) || !order.deliveryProof"
              @click="completeDelivery(order)">Complete delivery</button>
            <p v-if="!allItemsDelivered(order) && order.status !== 'Delivered'" class="delivery-hint">Mark every product delivered before completing this order.</p>
            <p v-else-if="!order.deliveryProof && order.status !== 'Delivered'" class="delivery-hint">A delivery photo is required to complete the order.</p>
            <small v-if="order.deliveryCompletedAt" class="completed-date">Completed {{ formatDate(order.deliveryCompletedAt) }}</small>
          </section>

          <section class="message-section">
            <span class="section-label">CUSTOMER MESSAGES</span>
            <div v-if="order.messages?.length" class="message-list">
              <div v-for="(message, index) in order.messages" :key="`${message.sentAt}-${index}`"
                class="message-bubble" :class="{ own: message.sender === 'rider' }">
                <b>{{ message.sender === 'rider' ? 'You' : order.customerName || 'Customer' }}</b>
                <p>{{ message.text }}</p><small>{{ formatDateTime(message.sentAt) }}</small>
              </div>
            </div>
            <p v-else class="no-messages">No messages yet. Send the customer a delivery update.</p>
            <form class="message-form" @submit.prevent="sendMessage(order)">
              <input v-model="drafts[order.id]" maxlength="500" placeholder="Message the customer…" :aria-label="`Message for ${order.id}`" />
              <button type="submit" :disabled="!drafts[order.id]?.trim()">Send</button>
            </form>
          </section>
        </article>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { locationOutline, personCircleOutline } from 'ionicons/icons'
import type { OrderMessage, OrderRecord } from '../data/mockData'

const props = defineProps<{
  rider: { name: string; email: string; phone?: string; avatar?: string }
  orders: OrderRecord[]
}>()
const emit = defineEmits<{
  (event: 'storefront'): void
  (event: 'logout'): void
  (event: 'profile-update', rider: { name: string; email: string; phone?: string; avatar?: string }): void
  (event: 'order-update', id: string, patch: Partial<OrderRecord>): void
  (event: 'message', id: string, message: OrderMessage): void
}>()

const tab = ref<'active' | 'history'>('active')
const drafts = reactive<Record<string, string>>({})
const errors = reactive<Record<string, string>>({})
const profileOpen = ref(false)
const accountMenuOpen = ref(false)
const profileDraft = reactive({ name: props.rider.name, phone: props.rider.phone || '', avatar: props.rider.avatar || '' })
const profileError = ref('')
const profilePhotoInput = ref<HTMLInputElement | null>(null)
const fallbackImage = '/assets/deal.png'
const firstName = computed(() => props.rider.name.trim().split(/\s+/)[0] || 'Rider')
const assignedOrders = computed(() => props.orders.filter(order => {
  if (order.riderEmail?.trim()) return order.riderEmail.trim().toLowerCase() === props.rider.email.trim().toLowerCase()
  return order.rider?.trim().toLowerCase() === props.rider.name.trim().toLowerCase()
}))
const activeOrders = computed(() => assignedOrders.value.filter(order => order.status !== 'Delivered' && order.status !== 'Cancelled'))
const historyOrders = computed(() => assignedOrders.value.filter(order => order.status === 'Delivered').sort((a, b) => Date.parse(b.deliveryCompletedAt || b.date) - Date.parse(a.deliveryCompletedAt || a.date)))
const visibleOrders = computed(() => tab.value === 'active' ? activeOrders.value : historyOrders.value)

function isItemDelivered(order: OrderRecord, index: number) {
  return order.deliveredItemIndexes?.includes(index) ?? false
}
function allItemsDelivered(order: OrderRecord) {
  return order.items.length > 0 && order.items.every((_, index) => isItemDelivered(order, index))
}
function toggleDeliveredItem(order: OrderRecord, index: number, delivered: boolean) {
  const indexes = new Set(order.deliveredItemIndexes || [])
  if (delivered) indexes.add(index)
  else indexes.delete(index)
  emit('order-update', order.id, { deliveredItemIndexes: [...indexes].sort((a, b) => a - b) })
}
function completeDelivery(order: OrderRecord) {
  errors[order.id] = ''
  if (!allItemsDelivered(order) || !order.deliveryProof) {
    errors[order.id] = 'Mark every item delivered and add a delivery photo first.'
    return
  }
  emit('order-update', order.id, { status: 'Delivered', deliveryCompletedAt: new Date().toISOString() })
}
function sendMessage(order: OrderRecord) {
  const text = drafts[order.id]?.trim()
  if (!text) return
  emit('message', order.id, { sender: 'rider', text, sentAt: new Date().toISOString() })
  drafts[order.id] = ''
}
function openProfile() {
  accountMenuOpen.value = false
  profileDraft.name = props.rider.name
  profileDraft.phone = props.rider.phone || ''
  profileDraft.avatar = props.rider.avatar || ''
  profileError.value = ''
  profileOpen.value = true
}
function saveProfile() {
  const name = profileDraft.name.trim()
  if (!name) {
    profileError.value = 'Enter your name to save your profile.'
    return
  }
  emit('profile-update', { name, email: props.rider.email, phone: profileDraft.phone.trim(), avatar: profileDraft.avatar || undefined })
  profileOpen.value = false
  profileError.value = ''
}
function handleProfilePhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  profileError.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    profileError.value = 'Choose a PNG, JPG, or WebP image.'
    input.value = ''
    return
  }
  if (file.size > 1024 * 1024) {
    profileError.value = 'Choose an image smaller than 1 MB.'
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      profileError.value = 'Unable to read this image. Please try another file.'
      return
    }
    profileDraft.avatar = reader.result
  }
  reader.onerror = () => { profileError.value = 'Unable to read this image. Please try another file.' }
  reader.readAsDataURL(file)
  input.value = ''
}
async function readProof(order: OrderRecord, event: Event) {
  errors[order.id] = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errors[order.id] = 'Choose a photo file for delivery proof.'
    input.value = ''
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    errors[order.id] = 'Choose a photo smaller than 15 MB.'
    input.value = ''
    return
  }
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is unavailable in this browser.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.65))
    if (!blob) throw new Error('Unable to process the delivery photo.')
    if (blob.size > 450 * 1024) throw new Error('The processed photo is too large to save. Choose a smaller image.')
    const reader = new FileReader()
    const proof = await new Promise<string>((resolve, reject) => {
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read the delivery photo.'))
      reader.onerror = () => reject(new Error('Unable to read the delivery photo.'))
      reader.readAsDataURL(blob)
    })
    emit('order-update', order.id, { deliveryProof: proof })
  } catch (reason) {
    errors[order.id] = reason instanceof Error ? reason.message : 'Unable to save the delivery photo.'
  } finally {
    URL.revokeObjectURL(objectUrl)
    input.value = ''
  }
}
function mapUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<style scoped>
.rider-page { min-height: 100vh; padding-bottom: 48px; background: #fbf9f6; color: var(--ink); }
.rider-header { min-height: 76px; padding: 10px max(20px, calc((100% - 1120px) / 2)); display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #f0e6e0; background: #fff; }
.rider-brand { display: flex; align-items: center; gap: 11px; color: inherit; text-decoration: none; cursor: pointer; }
.rider-brand img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.rider-brand span { display: grid; gap: 4px; }
.rider-brand b { color: #442f2b; font: 700 17px var(--font-head); }
.rider-brand small { color: #8e756d; font-size: 9px; font-weight: 700; letter-spacing: .2em; }
.rider-account { display: flex; align-items: center; gap: 10px; color: #644f47; font-size: 13px; }
.rider-account-menu { position: relative; }
.rider-account button, .customer-location a { padding: 8px 12px; border: 1px solid #eadfd9; border-radius: 10px; background: #fff; color: var(--coral-dark); cursor: pointer; text-decoration: none; font: 700 11px var(--font-body); }
.rider-account .rider-profile-button { display: inline-flex; align-items: center; gap: 6px; border-color: transparent; background: transparent; color: #644f47; font: 600 12px var(--font-body); }
.rider-profile-button ion-icon { font-size: 25px; color: var(--coral-dark); }
.rider-profile-button .rider-header-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.account-menu { position: absolute; z-index: 20; top: calc(100% + 10px); right: 0; width: 220px; padding: 9px; display: grid; gap: 4px; border: 1px solid #f0e6e0; border-radius: 14px; background: #fff; box-shadow: 0 14px 35px #39231f1c; }
.account-menu .account-info { padding: 8px; display: grid; gap: 4px; border-bottom: 1px solid #f2ebe6; }
.account-info b { color: #493832; font-size: 12px; }
.account-info small, .account-info span { overflow: hidden; color: #927d75; font-size: 10px; text-overflow: ellipsis; }
.account-menu > button { padding: 9px; border: 0; border-radius: 8px; background: transparent; color: #644f47; text-align: left; }
.account-menu > button:hover { background: #fff5f2; }
.profile-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 16px; background: #2e201f70; }
.profile-dialog { position: relative; width: min(420px, 100%); padding: 25px; border: 1px solid #f0e6e0; border-radius: 20px; background: #fff; box-shadow: 0 24px 70px #39231f30; }
.profile-close { position: absolute; top: 12px; right: 14px; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #fbf3f0; color: #705f58; cursor: pointer; font-size: 22px; }
.profile-dialog h2 { margin: 6px 0 18px; color: #3e2e2a; font: 700 24px var(--font-head); }
.rider-edit-photo { display: flex; align-items: center; gap: 12px; margin: -4px 0 16px; }
.rider-edit-avatar { width: 54px; height: 54px; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: #f9e2df; color: var(--coral-dark); font-size: 20px; font-weight: 700; }
.rider-edit-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rider-photo-input { display: none; }
.profile-photo-button, .profile-photo-remove { padding: 8px 10px; border: 1px solid #eadfd9; border-radius: 9px; background: #fff; color: var(--coral-dark); cursor: pointer; font: 700 10px var(--font-body); }
.profile-photo-remove { color: #705f58; }
.profile-form { display: grid; gap: 14px; }
.profile-form label { display: grid; gap: 6px; color: #705f58; font-size: 11px; font-weight: 700; }
.profile-form input { width: 100%; min-height: 42px; padding: 0 12px; border: 1px solid #eadfd9; border-radius: 11px; outline: none; color: #493832; font: 13px var(--font-body); }
.profile-form input:focus { border-color: var(--coral); }
.profile-form input:disabled { background: #f7f3f0; color: #99877f; }
.profile-error { margin: 0; color: #b5473e; font-size: 11px; }
.profile-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.profile-actions button { min-height: 38px; padding: 0 13px; border-radius: 10px; cursor: pointer; font: 700 11px var(--font-body); }
.profile-cancel { border: 1px solid #eadfd9; background: #fff; color: #705f58; }
.profile-save { border: 0; background: var(--coral); color: #fff; }
.rider-content { width: min(1050px, calc(100% - 32px)); margin: 28px auto; display: grid; gap: 18px; }
.rider-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 24px; border: 1px solid #f1dfd4; border-radius: 18px; background: #fff0e6; }
.eyebrow, .section-label { color: #a17870; font-size: 9px; font-weight: 800; letter-spacing: .15em; }
.rider-title h1 { margin: 5px 0; color: #3e2e2a; font: 700 28px var(--font-head); }
.rider-title p { margin: 0; color: var(--muted); font-size: 12px; }
.delivery-summary { display: flex; gap: 10px; }
.delivery-count { min-width: 120px; padding: 13px 17px; display: grid; justify-items: center; gap: 4px; border: 1px solid #f0e6e0; border-radius: 15px; background: #fff; }
.delivery-count.completed-count { background: #f5faf6; }
.delivery-count b { color: #493832; font: 700 22px var(--font-head); }
.delivery-count span { color: var(--muted); font-size: 10px; }
.rider-tabs { display: flex; gap: 9px; padding-bottom: 9px; border-bottom: 1px solid #eadfd9; }
.rider-tabs button { padding: 9px 13px; display: flex; align-items: center; gap: 8px; border: 0; border-radius: 10px; background: transparent; color: #705f58; cursor: pointer; font: 600 12px var(--font-body); }
.rider-tabs button.active { background: #f9e2df; color: var(--coral-dark); }
.rider-tabs span { min-width: 19px; padding: 3px 6px; border-radius: 20px; background: #fff; text-align: center; font-size: 10px; }
.rider-empty, .delivery-card { border: 1px solid #f0e6e0; border-radius: 18px; background: #fff; }
.rider-empty { padding: 40px 20px; color: #493832; text-align: center; }
.rider-empty p { margin-bottom: 0; color: var(--muted); font-size: 12px; }
.delivery-list { display: grid; gap: 15px; }
.delivery-card { padding: 20px; display: grid; gap: 16px; }
.delivery-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 13px; border-bottom: 1px solid #f2ebe6; }
.delivery-heading h2 { margin: 4px 0; color: #493832; font: 700 17px var(--font-head); }
.delivery-heading small { color: var(--muted); font-size: 10px; }
.delivery-status { padding: 6px 11px; border-radius: 999px; background: #f8eee0; color: #92724c; font-size: 11px; font-weight: 700; }
.delivery-status.complete { background: #e3f1e7; color: #39744c; }
.customer-contact { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.contact-copy { display: grid; gap: 5px; }
.contact-copy span { color: var(--muted); font-size: 10px; }
.contact-copy b { color: #493832; font-size: 13px; }
.contact-copy small { color: var(--muted); font-size: 11px; }
.customer-location, .delivery-products, .delivery-proof, .message-section { display: grid; gap: 9px; }
.customer-location p, .delivery-proof > p { margin: 0; color: #5a4943; font-size: 12px; line-height: 1.5; }
.customer-location .directions-logo { width: 40px; height: 40px; padding: 0; display: grid; place-items: center; border-radius: 50%; color: var(--coral-dark); font-size: 20px; }
.customer-location .directions-logo:hover { background: #fff5f2; border-color: #e8c9c1; }
.delivery-products { gap: 7px; }
.delivery-item { min-width: 0; padding: 8px; display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; align-items: center; gap: 10px; border: 1px solid #f2ebe6; border-radius: 12px; }
.delivery-item img { width: 46px; height: 46px; padding: 4px; border-radius: 10px; background: #f8e4d7; object-fit: contain; }
.delivery-item > span { min-width: 0; display: grid; gap: 4px; }
.delivery-item b { overflow: hidden; color: #493832; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.delivery-item small { color: var(--muted); font-size: 9px; }
.delivery-item input { width: 18px; height: 18px; accent-color: #b45a64; }
.delivery-item .item-delivery-state { grid-column: 2 / -1; margin-top: -6px; }
.camera-button { width: fit-content; padding: 10px 13px; border-radius: 10px; background: #f9e2df; color: var(--coral-dark); cursor: pointer; font: 700 11px var(--font-body); }
.camera-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; clip-path: inset(50%); }
.proof-preview { width: min(100%, 340px); max-height: 280px; border: 1px solid #f0e6e0; border-radius: 12px; object-fit: contain; background: #f8f4f1; }
.delivery-error { color: #b5473e !important; }
.complete-button { width: fit-content; min-height: 40px; padding: 0 16px; border: 0; border-radius: 11px; background: var(--coral); color: #fff; cursor: pointer; font: 700 12px var(--font-body); }
.complete-button:disabled { opacity: .48; cursor: not-allowed; }
.delivery-hint, .completed-date { color: var(--muted); font-size: 10px; }
.message-list { max-height: 250px; overflow-y: auto; display: grid; gap: 8px; }
.message-bubble { width: fit-content; max-width: 86%; padding: 9px 11px; border-radius: 12px 12px 12px 3px; background: #f7efe9; }
.message-bubble.own { justify-self: end; border-radius: 12px 12px 3px 12px; background: #f9e2df; }
.message-bubble b, .message-bubble small { color: #927d75; font-size: 9px; }
.message-bubble p { margin: 4px 0; color: #493832; font-size: 11px; overflow-wrap: anywhere; }
.no-messages { margin: 0; color: var(--muted); font-size: 11px; }
.message-form { display: flex; gap: 8px; }
.message-form input { min-width: 0; min-height: 38px; flex: 1; padding: 0 11px; border: 1px solid #eadfd9; border-radius: 10px; outline: none; font: 12px var(--font-body); }
.message-form button { padding: 0 14px; border: 0; border-radius: 10px; background: var(--coral); color: #fff; cursor: pointer; font: 700 11px var(--font-body); }
.message-form button:disabled { opacity: .5; cursor: not-allowed; }
@media (max-width: 600px) {
  .rider-header { padding: 9px 12px; }
  .rider-brand img { width: 38px; height: 38px; }
  .rider-brand b { font-size: 14px; }
  .rider-account { gap: 7px; font-size: 11px; }
  .rider-content { width: calc(100% - 24px); margin: 18px auto; }
  .rider-title h1 { font-size: 23px; }
  .rider-title p { max-width: 240px; line-height: 1.5; }
  .delivery-summary { gap: 6px; }
  .delivery-count { min-width: 78px; padding: 9px 7px; }
  .delivery-count span { font-size: 9px; }
  .delivery-card { padding: 14px; }
}
</style>
