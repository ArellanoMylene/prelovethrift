<template>
  <section class="dashboard">
    <div class="dashboard-wrap">
      <aside class="sidebar">
        <div class="member">
          <span class="avatar">
            <img v-if="user.avatar" :src="user.avatar" alt="" />
            <template v-else>{{ user.name.charAt(0).toUpperCase() }}</template>
          </span>
          <div><b>{{ user.name }}</b><small>{{ user.email }}</small></div>
        </div>
        <nav aria-label="Account dashboard">
          <button v-for="item in navItems" :key="item.id" :class="{ active: view === item.id }"
          @click="navigateDashboard(item.id)">
            <ion-icon :icon="item.icon" /><span>{{ item.label }}</span>
            <small v-if="item.id === 'wishlist' && wishlist.length">{{ wishlist.length }}</small>
          </button>
        </nav>
      </aside>

      <main class="content">
        <template v-if="view === 'overview'">
          <div class="welcome">
            <div><span class="eyebrow">YOUR ACCOUNT</span><h1>Welcome back, {{ firstName }}!</h1>
              <p>Find something lovely, or pick up where you left off.</p></div>
            <button class="shop-button" @click="openShop">Explore the shop <ion-icon :icon="arrowForwardOutline" /></button>
          </div>
          <div class="stats">
            <article><span class="stat-icon"><ion-icon :icon="bagHandleOutline" /></span><div><b>{{ orders.length }}</b><small>Orders placed</small></div></article>
            <article><span class="stat-icon"><ion-icon :icon="heartOutline" /></span><div><b>{{ wishlist.length }}</b><small>Saved favorites</small></div></article>
            <article><span class="stat-icon"><ion-icon :icon="cartOutline" /></span><div><b>{{ cartCount }}</b><small>Items in your cart</small></div></article>
          </div>
          <section class="panel purchases">
            <div class="panel-heading"><div><span class="eyebrow">ORDER HISTORY</span><h2>Your recent purchases</h2></div>
              <button class="text-button" @click="view = 'orders'">View all <ion-icon :icon="arrowForwardOutline" /></button></div>
            <div v-if="!orders.length" class="empty-state"><span class="empty-icon"><ion-icon :icon="bagHandleOutline" /></span>
              <div><b>No orders yet</b><p>Your purchased items and their details will appear here.</p></div>
              <button class="outline-button" @click="$emit('storefront')">Start browsing</button></div>
            <div v-else class="order-list">
              <article v-for="order in recentOrders" :key="order.id" class="order">
                <div class="order-info"><b>Order #{{ order.id.slice(-6).toUpperCase() }}</b><span>{{ formatDate(order.date) }} · {{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}</span></div>
                <b class="order-total">{{ formatPeso(order.total) }}</b>
                <div class="order-thumbs"><img v-for="item in order.items.slice(0, 4)" :key="item.id" :src="item.img" :alt="item.name" /></div>
              </article>
            </div>
          </section>
          <section class="panel picked">
            <div class="panel-heading"><div><span class="eyebrow">A FEW GOOD FINDS</span><h2>Picked for you</h2></div>
              <button class="text-button" @click="openShop">Shop all <ion-icon :icon="arrowForwardOutline" /></button></div>
            <ProductGrid :products="products" :wishlist="wishlist" @add-cart="(product) => $emit('add-cart', product)"
              @toggle-wish="(product) => $emit('toggle-wish', product)" />
          </section>
        </template>

        <template v-else-if="view === 'categories'">
          <section class="panel shop-collection">
            <div class="panel-heading"><div><span class="eyebrow">FIND YOUR NEXT FAVORITE</span><h2>Shop by category</h2></div></div>
            <div class="category-filters" aria-label="Filter products by category">
              <button type="button" :class="{ active: !selectedCategory }" @click="selectedCategory = ''">All items</button>
              <button v-for="category in availableCategories" :key="category" type="button"
                :class="{ active: selectedCategory === category }" @click="selectCategory(category)">{{ category }}</button>
            </div>
            <div v-if="categoryProducts.length" class="category-products">
              <ProductGrid :products="categoryProducts" :wishlist="wishlist"
                @add-cart="(product) => $emit('add-cart', product)" @toggle-wish="(product) => $emit('toggle-wish', product)" />
            </div>
            <div v-else class="empty-state"><div><b>No items in this category yet</b><p>Try another category or check back later.</p></div></div>
          </section>
          <section class="panel shop-collection">
            <div class="panel-heading"><div><span class="eyebrow">JUST LISTED</span><h2>New arrivals</h2></div></div>
            <ProductGrid v-if="newArrivals.length" :products="newArrivals" :wishlist="wishlist"
              @add-cart="(product) => $emit('add-cart', product)" @toggle-wish="(product) => $emit('toggle-wish', product)" />
            <div v-else class="empty-state"><div><b>No new arrivals yet</b><p>Newly listed items will appear here.</p></div></div>
          </section>
        </template>

        <template v-else-if="view === 'orders'">
          <div class="page-heading"><span class="eyebrow">THE GOOD STUFF YOU FOUND</span><h1>My orders &amp; purchase history</h1></div>
          <section class="panel order-page">
            <div v-if="!orders.length" class="empty-state"><span class="empty-icon"><ion-icon :icon="bagHandleOutline" /></span>
              <div><b>Your order history is empty</b><p>Once you complete a checkout, your purchases will show up here.</p></div>
              <button class="outline-button" @click="openShop">Browse the shop</button></div>
            <div v-else class="tracking-list">
              <article v-for="order in orders" :key="order.id" class="tracking-order">
                <div class="tracking-header">
                  <div class="tracking-main">
                    <div class="tracking-id-row">
                      <span class="tracking-code">{{ orderLabel(order.id) }}</span>
                      <span class="status-pill" :class="statusClass(order)">{{ getOrderStatus(order) }}</span>
                      <span class="status-pill muted-pill">{{ getPaymentLabel(order) }}</span>
                    </div>
                    <div class="order-meta">{{ formatDate(order.date) }} · {{ getPaymentLabel(order) }}</div>
                  </div>
                  <div class="tracking-total">{{ formatPeso(order.total) }}</div>
                </div>

                <div class="tracking-items">
                  <div v-for="(item, index) in order.items" :key="`${order.id}-${index}`" class="tracking-item">
                    <img :src="item.img || '/assets/logo-emblem.png'" :alt="item.name" />
                    <span>{{ item.name }}<small :class="{ 'item-delivered': order.deliveredItemIndexes?.includes(index) }">
                      {{ order.deliveredItemIndexes?.includes(index) ? 'Delivered' : 'Not delivered yet' }}
                    </small></span>
                  </div>
                </div>

                <div class="tracking-steps" aria-label="Order tracking progress">
                  <div v-for="(step, index) in trackingSteps" :key="step" class="tracking-step" :class="{
                    done: getStepIndex(order) >= index,
                    active: getStepIndex(order) === index
                  }">
                    <span class="step-dot"></span>
                    <span class="step-label">{{ step }}</span>
                  </div>
                </div>

                <div v-if="isOrderConfirmed(order)" class="rider-row">
                  <span>Rider</span>
                  <a v-if="order.riderPhone" class="rider-phone" :href="`tel:${order.riderPhone}`">
                    {{ order.rider || 'Rider' }} · {{ order.riderPhone }}
                  </a>
                  <strong v-else>{{ order.rider || 'Rider is being assigned' }}</strong>
                </div>

                <div v-if="order.customerAddress" class="customer-location-row">
                  <span>Delivery address</span><strong>{{ order.customerAddress }}</strong>
                </div>
                <div v-if="order.deliveryProof" class="customer-proof">
                  <span>Delivery photo</span>
                  <img :src="order.deliveryProof" alt="Photo proof of delivery" />
                  <small v-if="order.deliveryCompletedAt">Delivered {{ formatDate(order.deliveryCompletedAt) }}</small>
                </div>
                <section v-if="isOrderConfirmed(order) && order.rider" class="order-messages">
                  <b>Message {{ order.rider }}</b>
                  <div v-if="order.messages?.length" class="customer-message-list">
                    <div v-for="(message, index) in order.messages" :key="`${message.sentAt}-${index}`"
                      class="customer-message" :class="{ own: message.sender === 'customer' }">
                      <small>{{ message.sender === 'customer' ? 'You' : order.rider }}</small>
                      <p>{{ message.text }}</p>
                    </div>
                  </div>
                  <p v-else class="no-customer-messages">Send your rider a delivery message.</p>
                  <form class="customer-message-form" @submit.prevent="sendCustomerMessage(order)">
                    <input v-model="messageDrafts[order.id]" maxlength="500" placeholder="Write a message…" :aria-label="`Message rider for ${order.id}`" />
                    <button type="submit" :disabled="!messageDrafts[order.id]?.trim()">Send</button>
                  </form>
                </section>

                <button class="buy-again" type="button">Buy again</button>
              </article>
            </div>
          </section>
        </template>

        <template v-else-if="view === 'wishlist'">
          <div class="page-heading"><span class="eyebrow">SAVED WITH LOVE</span><h1>Your wishlist</h1>
            <p>{{ wishlist.length ? 'Keep your favorite finds close by.' : 'Save your favorite finds and they’ll be waiting here.' }}</p></div>
          <section class="panel picked">
            <div v-if="!wishlist.length" class="empty-state"><span class="empty-icon"><ion-icon :icon="heartOutline" /></span>
              <div><b>No favorites saved yet</b><p>Tap the heart on an item to add it to your wishlist.</p></div>
              <button class="outline-button" @click="openShop">Explore finds</button></div>
            <ProductGrid v-else :products="wishlistProducts" :wishlist="wishlist" :show-remove="true"
              @add-cart="(product) => $emit('add-cart', product)" @toggle-wish="(product) => $emit('toggle-wish', product)" />
          </section>
        </template>

        <template v-else>
          <div class="page-heading"><span class="eyebrow">YOUR DETAILS</span><h1><ion-icon :icon="personOutline" /> Profile</h1>
            <p>Manage your personal information and profile photo.</p></div>
          <section class="panel profile-card">
            <div class="profile-photo-control">
              <span class="profile-avatar">
                <img v-if="user.avatar" :src="user.avatar" alt="Profile photo" />
                <template v-else>{{ user.name.charAt(0).toUpperCase() }}</template>
              </span>
              <input ref="photoInput" class="photo-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handlePhotoChange" />
              <button class="change-photo" type="button" @click="photoInput?.click()">Upload profile photo</button>
              <small v-if="profilePhotoError" class="photo-error" role="alert">{{ profilePhotoError }}</small>
            </div>
            <div class="profile-details">
              <div><small>FULL NAME</small><b>{{ user.name }}</b></div>
              <div><small>EMAIL ADDRESS</small><b>{{ user.email }}</b></div>
              <div><small>PHONE NUMBER</small><b>{{ user.phone || 'Not added yet' }}</b></div>
              <div><small>ADDRESS</small><b>{{ user.address || 'Not added yet' }}</b></div>
            </div>
            <button class="edit-profile" type="button" aria-label="Edit profile" @click="startProfileEdit">
              <ion-icon :icon="createOutline" /><span>Edit profile</span>
            </button>
          </section>

        </template>
      </main>
    </div>
    <div v-if="profileEditOpen" class="profile-edit-overlay" @click.self="profileEditOpen = false">
      <div class="profile-edit-modal" role="dialog" aria-modal="true" aria-label="Edit profile">
        <div class="profile-edit-header">
          <div class="profile-brand" aria-label="Pre-Loved Thrift logo">
            <img class="brand-mark" src="/assets/logo-emblem.png" alt="Pre-Loved Thrift" />
            <span>PRE-LOVED<br />THRIFT</span>
          </div>
          <button class="close-profile" type="button" aria-label="Close profile editor" @click="profileEditOpen = false">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>

        <div class="profile-edit-body">
          <div class="profile-edit-photo">
            <span class="profile-edit-avatar">
              <img v-if="profileDraft.avatar" :src="profileDraft.avatar" alt="Profile photo preview" />
              <template v-else>{{ (profileDraft.name || user.name).charAt(0).toUpperCase() }}</template>
            </span>
            <input ref="editPhotoInput" class="photo-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handleEditPhotoChange" />
            <button type="button" class="change-photo" @click="editPhotoInput?.click()">Upload profile photo</button>
            <button v-if="profileDraft.avatar" type="button" class="remove-edit-photo" @click="profileDraft.avatar = ''">Remove photo</button>
          </div>
          <small v-if="profileEditPhotoError" class="photo-error" role="alert">{{ profileEditPhotoError }}</small>
          <label>
            <span>Enter your full name</span>
            <input v-model="profileDraft.name" type="text" />
          </label>
          <label>
            <span>Phone number</span>
            <input v-model="profileDraft.phone" type="tel" />
          </label>
          <label>
            <span>Address</span>
            <input v-model="profileDraft.address" type="text" />
          </label>
        </div>

        <div class="profile-edit-actions">
          <button class="save-button" type="button" @click="saveProfileEdit">OK</button>
          <button class="cancel-button" type="button" @click="profileEditOpen = false">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline, bagHandleOutline, cartOutline, heart, heartOutline,
  storefrontOutline, personOutline, gridOutline, receiptOutline, createOutline, closeOutline
} from 'ionicons/icons'
import type { CartItem, Category, OrderMessage, OrderRecord, Product } from '../data/mockData'
import { formatPeso } from '../utils/currency'

const props = defineProps<{
  user: { name: string; email: string; phone?: string; address?: string; avatar?: string }
  wishlist: CartItem[]
  cartCount: number
  orders: OrderRecord[]
  products: Product[]
  categories: Category[]
  initialView?: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories'
}>()
const emit = defineEmits<{
  (event: 'storefront'): void
  (event: 'add-cart', product: Product): void
  (event: 'toggle-wish', product: Product): void
  (event: 'update-user', user: { name: string; email: string; phone?: string; address?: string; avatar?: string }): void
  (event: 'message', id: string, message: OrderMessage): void
}>()

const view = ref<'overview' | 'orders' | 'wishlist' | 'profile' | 'categories'>(props.initialView || 'overview')
const selectedCategory = ref('')
const messageDrafts = reactive<Record<string, string>>({})

watch(() => props.initialView, (next) => {
  if (next) view.value = next
}, { immediate: true })
const profileEditOpen = ref(false)
const profileDraft = ref({ name: '', phone: '', address: '', avatar: '' })
const photoInput = ref<HTMLInputElement | null>(null)
const editPhotoInput = ref<HTMLInputElement | null>(null)
const profilePhotoError = ref('')
const profileEditPhotoError = ref('')
const maxProfilePhotoSize = 1024 * 1024
const firstName = computed(() => props.user.name.trim().split(/\s+/)[0] || 'there')
const recentOrders = computed(() => props.orders.slice(0, 3))
const wishlistProducts = computed(() => props.wishlist.map((item) => ({
  id: item.id, name: item.name, price: item.price, img: item.img, cat: item.cat || '', type: item.type, slot: item.slot, fit: item.fit
})))
const newArrivals = computed(() => props.products.filter(product => product.newArrival))
const availableCategories = computed(() => [...new Set(props.products.map(product => product.cat).filter(Boolean))].sort((a, b) => a.localeCompare(b)))
const categoryProducts = computed(() => selectedCategory.value
  ? props.products.filter(product => product.cat === selectedCategory.value)
  : props.products)
const navItems: Array<{ id: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories'; label: string; icon: typeof gridOutline }> = [
  { id: 'overview', label: 'Dashboard', icon: gridOutline },
  { id: 'categories', label: 'Shop', icon: storefrontOutline },
  { id: 'orders', label: 'My orders', icon: receiptOutline },
  { id: 'wishlist', label: 'Wishlist', icon: heart },
  { id: 'profile', label: 'Profile', icon: personOutline },
]
const trackingSteps = ['Confirmed', 'Packed', 'Shipped', 'Delivered']

const orderLabel = (id: string) => `PL-${String(id).slice(-6).toUpperCase()}`
const getPaymentLabel = (order: OrderRecord) => order.payment || 'Cash on delivery'
const getOrderStatus = (order: OrderRecord) => order.status || 'Confirmed'
const isOrderConfirmed = (order: OrderRecord) => {
  const status = getOrderStatus(order).toLowerCase()
  return ['confirmed', 'packed', 'shipped', 'delivered'].includes(status)
}
const getStepIndex = (order: OrderRecord) => {
  const status = getOrderStatus(order)
  return trackingSteps.findIndex((step) => step.toLowerCase() === status.toLowerCase())
}
const statusClass = (order: OrderRecord) => {
  const status = getOrderStatus(order).toLowerCase()
  if (status === 'delivered') return 'success'
  if (status === 'shipped' || status === 'packed') return 'warning'
  return 'neutral'
}
const ProductGrid = defineComponent({
  props: {
    products: { type: Array as () => Product[], required: true },
    wishlist: { type: Array as () => CartItem[], required: true },
    showRemove: Boolean
  },
  emits: ['add-cart', 'toggle-wish'],
  setup(gridProps, { emit }) {
    return () => h('div', { class: 'product-grid' }, gridProps.products.map((product) => {
      const saved = gridProps.wishlist.some((item) => String(item.id) === String(product.id))
      return h('article', { class: 'product-card', key: product.id }, [
        h('div', { class: 'product-image' }, [
          h('img', { src: product.img, alt: product.name }),
          product.newArrival
            ? h('span', { class: 'hot-label' }, 'NEW ARRIVAL')
            : product.hot ? h('span', { class: 'hot-label' }, 'POPULAR') : null,
          h('button', {
            class: ['favorite', { saved: saved || gridProps.showRemove }],
            'aria-label': gridProps.showRemove ? 'Remove from wishlist' : saved ? 'Remove from wishlist' : 'Add to wishlist',
            onClick: () => emit('toggle-wish', product)
          }, [h(IonIcon, { icon: saved ? heart : heartOutline })])
        ]),
        h('div', { class: 'product-copy' }, [
          h('span', { class: 'product-category' }, product.cat),
          h('h3', product.name),
          h('div', { class: 'price' }, [
            h('b', formatPeso(product.price)),
            product.was ? h('s', formatPeso(product.was)) : null
          ]),
          h('button', { class: 'add-button', onClick: () => emit('add-cart', product) }, 'Add to cart')
        ])
      ])
    }))
  }
})

function navigateDashboard(destination: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories') {
  if (destination === 'categories') selectedCategory.value = ''
  view.value = destination
}
function openShop() {
  selectedCategory.value = ''
  view.value = 'categories'
}
function selectCategory(category: string) {
  selectedCategory.value = category
  view.value = 'categories'
}
function startProfileEdit() {
  profileDraft.value = {
    name: props.user.name || '',
    phone: props.user.phone || '',
    address: props.user.address || '',
    avatar: props.user.avatar || ''
  }
  profileEditPhotoError.value = ''
  profileEditOpen.value = true
}
function saveProfileEdit() {
  const updated = {
    ...props.user,
    name: profileDraft.value.name.trim() || props.user.name,
    phone: profileDraft.value.phone.trim() || undefined,
    address: profileDraft.value.address.trim() || undefined,
    avatar: profileDraft.value.avatar || undefined
  }

  localStorage.setItem('pl_me', JSON.stringify(updated))
  profileEditOpen.value = false
  emit('update-user', updated)
}
function handleEditPhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  profileEditPhotoError.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    profileEditPhotoError.value = 'Choose a PNG, JPG, or WebP image.'
    input.value = ''
    return
  }
  if (file.size > maxProfilePhotoSize) {
    profileEditPhotoError.value = 'Choose an image smaller than 1 MB.'
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      profileEditPhotoError.value = 'Unable to read this image. Please try another file.'
      return
    }
    profileDraft.value.avatar = reader.result
    profileEditPhotoError.value = ''
  }
  reader.onerror = () => {
    profileEditPhotoError.value = 'Unable to read this image. Please try another file.'
  }
  reader.readAsDataURL(file)
  input.value = ''
}
function handlePhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  profilePhotoError.value = ''
  if (!file) return

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    profilePhotoError.value = 'Choose a PNG, JPG, or WebP image.'
    input.value = ''
    return
  }
  if (file.size > maxProfilePhotoSize) {
    profilePhotoError.value = 'Choose an image smaller than 1 MB.'
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      profilePhotoError.value = 'Unable to read this image. Please try another file.'
      return
    }
    emit('update-user', { ...props.user, avatar: reader.result })
    profilePhotoError.value = ''
  }
  reader.onerror = () => {
    profilePhotoError.value = 'Unable to read this image. Please try another file.'
  }
  reader.readAsDataURL(file)
  input.value = ''
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function sendCustomerMessage(order: OrderRecord) {
  const text = messageDrafts[order.id]?.trim()
  if (!text) return
  emit('message', order.id, { sender: 'customer', text, sentAt: new Date().toISOString() })
  messageDrafts[order.id] = ''
}
</script>

<style scoped>
.dashboard { min-height: calc(100vh - 78px); padding: 0; background: #fbf9f6; }
.dashboard-wrap { width: 100%; min-height: calc(100vh - 78px); box-sizing: border-box; margin: 0; padding: 0 24px 0 0; display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: start; gap: 24px; }
.sidebar, .panel { background: #fff; border: 1px solid #f0e6e0; border-radius: 24px; }
.sidebar { height: calc(100vh - 78px); box-sizing: border-box; padding: 16px; position: sticky; top: 78px; align-self: start; overflow-y: auto; border-radius: 0; }
.member { padding: 8px 8px 20px; margin-bottom: 12px; border-bottom: 1px solid #f1e9e4; display: flex; align-items: center; gap: 12px; min-width: 0; }
.avatar, .profile-avatar { width: 44px; height: 44px; flex: 0 0 auto; border-radius: 50%; display: grid; place-items: center; background: #f9e2df; color: var(--coral-dark); font: 700 20px var(--font-head); overflow: hidden; }
.avatar img, .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.member div { min-width: 0; display: grid; gap: 3px; }
.member b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--ink); }
.member small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--muted); }
.sidebar nav { display: grid; gap: 4px; }
.sidebar nav button { width: 100%; border: 0; border-radius: 12px; background: transparent; padding: 12px 10px; display: flex; align-items: center; gap: 11px; cursor: pointer; color: #695c57; text-align: left; font: 600 13px var(--font-body); }
.sidebar nav button ion-icon { font-size: 18px; color: #9c8980; }
.sidebar nav button span { flex: 1; }
.sidebar nav button small { min-width: 20px; padding: 2px 6px; border-radius: 20px; background: #f8e5e2; color: var(--coral-dark); text-align: center; }
.sidebar nav button:hover, .sidebar nav button.active { background: #f9e3e1; color: var(--coral-dark); }
.sidebar nav button.active ion-icon { color: var(--coral-dark); }
.sidebar nav button.logout-link { color: #9b6864; margin-top: 8px; }
.content { min-width: 0; display: grid; gap: 20px; }
.welcome { min-height: 184px; border-radius: 24px; padding: 30px 34px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: #fff; background: radial-gradient(circle at 86% 18%, #ffffff26 0 10%, transparent 10.5%), linear-gradient(125deg, #d86d6e, #b95e6a 72%, #96507a); box-shadow: 0 14px 32px #c45f5f22; }
.welcome h1, .page-heading h1 { margin: 8px 0; font: 700 30px var(--font-head); }
.welcome h1 { color: #fff; }
.welcome p, .page-heading p { margin: 0; color: #fffdeedb; font-size: 13px; line-height: 1.6; }
.eyebrow { color: #b66b67; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.welcome .eyebrow { color: #ffe4df; }
.shop-button, .outline-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 12px; background: #fff; color: var(--coral-dark); padding: 12px 16px; white-space: nowrap; cursor: pointer; font: 700 12px var(--font-body); }
.shop-button:hover, .outline-button:hover { transform: translateY(-1px); box-shadow: 0 8px 20px #572e3022; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.stats article { min-width: 0; display: flex; align-items: center; gap: 12px; padding: 17px; border: 1px solid #f0e6e0; border-radius: 18px; background: #fff; }
.stat-icon { flex: 0 0 auto; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 13px; background: #fbefed; color: var(--coral-dark); font-size: 20px; }
.stats article div { display: grid; gap: 3px; }
.stats article b { color: var(--ink); font-size: 19px; }
.stats article small { color: var(--muted); font-size: 11px; white-space: nowrap; }
.panel { padding: 24px; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.panel-heading h2 { margin: 5px 0 0; font: 700 20px var(--font-head); color: var(--ink); }
.text-button { display: inline-flex; align-items: center; gap: 5px; background: none; border: 0; color: var(--coral-dark); font: 700 12px var(--font-body); cursor: pointer; white-space: nowrap; }
.empty-state { min-height: 122px; display: flex; align-items: center; gap: 15px; border-radius: 16px; padding: 18px; background: #fcf9f7; }
.empty-icon { width: 42px; height: 42px; flex: 0 0 auto; border-radius: 14px; display: grid; place-items: center; background: #f9e6e3; color: var(--coral-dark); font-size: 20px; }
.empty-state div { flex: 1; }
.empty-state b { color: var(--ink); font-size: 13px; }
.empty-state p { margin: 5px 0 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
.outline-button { border: 1px solid #efd6d2; background: #fff; }
.order-list { display: grid; gap: 12px; }
.order { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px 16px; padding: 14px; border: 1px solid #f1e9e4; border-radius: 15px; }
.order-info { display: grid; gap: 5px; }
.order-info b { font-size: 13px; color: var(--ink); }
.order-info span { font-size: 11px; color: var(--muted); }
.order-total { color: var(--coral-dark); font-size: 14px; }
.order-thumbs { display: flex; grid-column: 1 / -1; }
.order-thumbs img { width: 38px; height: 38px; object-fit: cover; background: #faf4f1; border: 2px solid white; border-radius: 10px; margin-right: -6px; }
.page-heading { padding: 8px 4px 4px; }
.page-heading h1 { display: flex; align-items: center; gap: 9px; color: var(--ink); }
.page-heading h1 ion-icon { color: var(--coral-dark); font-size: 24px; }
.page-heading p { color: var(--muted); }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.category-card { min-width: 0; border: 1px solid #f0e6e0; border-radius: 17px; overflow: hidden; padding: 0 0 12px; background: #fff; text-align: left; cursor: pointer; color: var(--ink); font: 700 12px var(--font-body); }
.category-card img { width: 100%; height: 105px; display: block; object-fit: cover; background: #f8eae5; margin-bottom: 10px; }
.category-card span { margin-left: 12px; }
.category-card ion-icon { float: right; margin: 0 11px 0 4px; color: var(--coral-dark); }
.category-card:hover { border-color: #e7b5b1; transform: translateY(-2px); }
.category-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.category-filters button { padding: 9px 13px; border: 1px solid #efdfda; border-radius: 999px; background: #fff; color: #705f58; cursor: pointer; font: 600 11px var(--font-body); }
.category-filters button.active, .category-filters button:hover { border-color: var(--coral); background: #f9e2df; color: var(--coral-dark); }
.category-products { margin-top: 2px; }
:deep(.product-grid) { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
:deep(.product-card) { min-width: 0; overflow: hidden; border: 1px solid #f0e6e0; border-radius: 17px; background: #fff; transition: transform .2s, box-shadow .2s; }
:deep(.product-card:hover) { transform: translateY(-3px); box-shadow: 0 10px 24px #5a31301a; }
:deep(.product-image) { position: relative; margin: 8px; aspect-ratio: 1; overflow: hidden; border-radius: 12px; background: #f7f1ed; }
:deep(.product-image img) { width: 100%; height: 100%; object-fit: contain; }
:deep(.hot-label) { position: absolute; top: 8px; left: 8px; padding: 4px 8px; border-radius: 20px; background: var(--coral); color: white; font-size: 9px; font-weight: 800; }
:deep(.favorite) { position: absolute; top: 7px; right: 7px; width: 30px; height: 30px; display: grid; place-items: center; border: 0; border-radius: 50%; background: #fff; color: #b9968e; cursor: pointer; font-size: 17px; }
:deep(.favorite.saved) { color: var(--coral-dark); }
:deep(.product-copy) { padding: 0 11px 12px; }
:deep(.product-category) { color: #9b827a; font-size: 9px; text-transform: uppercase; letter-spacing: .09em; }
:deep(.product-copy h3) { min-height: 34px; margin: 5px 0 7px; font: 700 12px/1.4 var(--font-body); color: var(--ink); }
:deep(.price) { display: flex; align-items: baseline; gap: 7px; color: var(--coral-dark); font-size: 14px; }
:deep(.price s) { color: #aa9b94; font-size: 10px; }
:deep(.add-button) { width: 100%; margin-top: 10px; padding: 9px 5px; border: 0; border-radius: 10px; background: var(--coral); color: #fff; cursor: pointer; font: 700 11px var(--font-body); }
:deep(.add-button:hover) { background: var(--coral-dark); }
.order-page { min-height: 180px; }
.tracking-list { display: grid; gap: 18px; }
.tracking-order { display: grid; gap: 16px; padding: 18px 20px 20px; border: 1px solid #f0e6e0; border-radius: 22px; background: #fbf8f6; }
.tracking-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.tracking-main { display: grid; gap: 8px; }
.tracking-id-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.tracking-code { font-size: 18px; font-weight: 800; color: var(--ink); letter-spacing: -0.04em; }
.status-pill { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.01em; }
.status-pill.success { background: #def4e6; color: #2d8c60; }
.status-pill.warning { background: #f9ebd6; color: #b7792a; }
.status-pill.neutral { background: #f4dfdd; color: #c76563; }
.status-pill.muted-pill { background: #fdf1ee; color: #896d66; }
.order-meta { font-size: 12px; color: #8d7b74; }
.tracking-total { font-size: 20px; font-weight: 800; color: var(--ink); letter-spacing: -0.04em; }
.tracking-items { display: grid; gap: 7px; }
.tracking-item { min-width: 0; display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 14px; background: #f7efe9; }
.tracking-item img { width: 48px; height: 48px; flex: 0 0 auto; padding: 3px; object-fit: contain; border-radius: 10px; background: #fff; }
.tracking-item span { min-width: 0; display: grid; gap: 4px; color: var(--ink); font-size: 13px; font-weight: 600; }
.tracking-item small { color: #a17870; font-size: 10px; font-weight: 600; }
.tracking-item small.item-delivered { color: #39744c; }
.tracking-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; position: relative; padding-top: 10px; }
.tracking-steps::before { content: ''; position: absolute; left: 10px; right: 10px; top: 15px; height: 2px; background: #e6c0b9; }
.tracking-step { position: relative; display: grid; justify-items: center; gap: 8px; text-align: center; z-index: 1; }
.step-dot { width: 14px; height: 14px; border-radius: 50%; background: #f5d2cb; border: 2px solid #f5d2cb; box-shadow: 0 0 0 2px #fff; }
.tracking-step.done .step-dot { background: #d76d68; border-color: #d76d68; }
.tracking-step.active .step-dot { background: #d76d68; border-color: #d76d68; box-shadow: 0 0 0 3px rgba(215, 109, 104, 0.2); }
.step-label { font-size: 12px; color: #a97b74; font-weight: 600; }
.tracking-step.done .step-label, .tracking-step.active .step-label { color: #d76d68; }
.rider-row { display: flex; align-items: center; justify-content: flex-start; gap: 10px; padding-top: 4px; font-size: 12px; color: #8d7b74; }
.rider-row strong { color: var(--ink); font-size: 15px; font-weight: 700; }
.rider-phone { color: var(--coral-dark); font-size: 15px; font-weight: 700; text-decoration: none; }
.customer-location-row { display: grid; gap: 5px; padding-top: 4px; color: #8d7b74; font-size: 12px; }
.customer-location-row strong { color: var(--ink); font-size: 12px; font-weight: 600; }
.customer-proof { display: grid; justify-items: start; gap: 7px; color: #8d7b74; font-size: 12px; }
.customer-proof img { width: min(100%, 300px); max-height: 240px; border: 1px solid #f0e6e0; border-radius: 12px; background: #fff; object-fit: contain; }
.customer-proof small { color: #98857d; font-size: 10px; }
.order-messages { display: grid; gap: 9px; padding-top: 12px; border-top: 1px solid #f0e6e0; }
.order-messages > b { color: #493832; font-size: 12px; }
.customer-message-list { max-height: 200px; overflow-y: auto; display: grid; gap: 7px; }
.customer-message { width: fit-content; max-width: 86%; padding: 8px 10px; border-radius: 11px 11px 11px 3px; background: #f7efe9; }
.customer-message.own { justify-self: end; border-radius: 11px 11px 3px 11px; background: #f9e2df; }
.customer-message small { color: #927d75; font-size: 9px; }
.customer-message p { margin: 4px 0 0; color: #493832; font-size: 11px; overflow-wrap: anywhere; }
.no-customer-messages { margin: 0; color: #8d7b74; font-size: 11px; }
.customer-message-form { display: flex; gap: 8px; }
.customer-message-form input { min-width: 0; min-height: 38px; flex: 1; padding: 0 11px; border: 1px solid #eadfd9; border-radius: 10px; outline: none; font: 12px var(--font-body); }
.customer-message-form button { padding: 0 14px; border: 0; border-radius: 10px; background: var(--coral); color: #fff; cursor: pointer; font: 700 11px var(--font-body); }
.customer-message-form button:disabled { opacity: .5; cursor: not-allowed; }
.buy-again { width: fit-content; border: 1px solid #e7b8b0; border-radius: 12px; padding: 10px 22px; background: transparent; color: var(--coral-dark); font: 700 14px var(--font-body); cursor: pointer; }
.profile-card { display: flex; align-items:  center; gap: 20px; padding: 26px; position: relative; }
.profile-avatar { width: 68px; height: 68px; font-size: 30px; }
.profile-photo-control { display: grid; justify-items: center; gap: 8px; flex: 0 0 auto; }
.photo-input { display: none; }
.change-photo { border: 0; background: none; color: var(--coral-dark); cursor: pointer; font: 700 11px var(--font-body); }
.photo-error { max-width: 100px; color: #b34242; font-size: 10px; text-align: center; }
.profile-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; }
.profile-details div { display: grid; gap: 6px; }
.profile-details small { color: #9b827a; font-size: 9px; letter-spacing: .1em; font-weight: 800; }
.profile-details b { color: var(--ink); font-size: 13px; overflow-wrap: anywhere; }
.edit-profile {
  position: absolute;
  right: 20px;
  top: 20px;
  min-width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #f0e4df;
  border-radius: 999px;
  background: #fffaf9;
  color: var(--coral-dark);
  cursor: pointer;
  font: 700 11px var(--font-body);
}
.edit-profile ion-icon { font-size: 18px; }
.profile-edit-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(25, 10, 10, 0.18);
  z-index: 2000;
}
.profile-edit-modal {
  width: min(480px, calc(100vw - 26px));
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 16px 36px rgba(70, 28, 28, 0.18);
  overflow: hidden;
  border: 0;
}
.profile-edit-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 18px 12px;
  min-height: 72px;
  background: #e9b1a8;
}
.profile-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2a2323;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 10px;
  line-height: 1.1;
}
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: block;
  object-fit: contain;
  background: rgba(255,255,255,0.22);
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.32);
}
.close-profile {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  color: #2a2323;
  font-size: 18px;
  cursor: pointer;
}
.profile-edit-body {
  padding: 14px 18px 0;
  display: grid;
  gap: 13px;
  background: #ffffff;
}
.profile-edit-photo { display: flex; align-items: center; gap: 10px; }
.profile-edit-avatar { width: 48px; height: 48px; flex: 0 0 auto; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: #f9e2df; color: var(--coral-dark); font-size: 18px; font-weight: 700; }
.profile-edit-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-edit-photo .change-photo, .remove-edit-photo { padding: 8px 10px; border: 1px solid #eadfd9; border-radius: 9px; background: #fff; color: var(--coral-dark); cursor: pointer; font: 700 10px var(--font-body); }
.remove-edit-photo { color: #705f58; }
.profile-edit-body > .photo-error { max-width: none; text-align: left; }
.profile-edit-body label {
  display: grid;
  gap: 7px;
  color: #1f1b1b;
  font-weight: 700;
}
.profile-edit-body > label > span {
  font-size: 13px;
  line-height: 1.3;
  color: #2b2524;
}
.profile-edit-body input {
  width: 100%;
  border: 1px solid rgba(81, 71, 71, 0.85);
  border-radius: 12px;
  background: rgba(255,255,255,0.96);
  padding: 11px 13px;
  font: 600 14px var(--font-body);
  outline: none;
  color: #1d1a1b;
  box-sizing: border-box;
}
.profile-edit-body input:focus {
  border-color: rgba(105, 100, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(105, 100, 255, 0.12);
}
.profile-edit-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 18px;
  padding: 18px 18px 20px;
  background: #ffffff;
}
.save-button, .cancel-button {
  border: 0;
  background: none;
  cursor: pointer;
  font: 700 16px var(--font-body);
}
.save-button {
  min-width: 120px;
  border-radius: 18px;
  background: #f3d0c8;
  color: #2a2323;
  padding: 12px 16px;
}
.cancel-button {
  color: #2b2524;
  padding: 8px 0;
  font-size: 16px;
}
@media (max-width: 920px) {
  .dashboard-wrap { grid-template-columns: 205px minmax(0, 1fr); gap: 16px; padding-right: 16px; }
  .sidebar { padding: 12px; }
  :deep(.product-grid) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stats { gap: 8px; }
  .stats article { padding: 12px 10px; gap: 8px; }
  .stats article small { white-space: normal; }
}
@media (max-width: 640px) {
  .dashboard { padding: 0; }
  .dashboard-wrap { width: 100%; min-height: 0; padding: 0; grid-template-columns: 1fr; gap: 12px; }
  .sidebar { height: auto; max-height: none; position: static; padding: 9px 12px; overflow: hidden; border-radius: 0; }
  .content { padding: 0 12px 24px; }
  .member { display: none; }
  .sidebar nav { display: flex; overflow-x: auto; gap: 5px; }
  .sidebar nav button { width: auto; flex: 0 0 auto; padding: 10px; font-size: 11px; }
  .sidebar nav button ion-icon { display: none; }
  .sidebar nav button.store-link { margin: 0; border: 0; padding-top: 10px; }
  .sidebar nav button.logout-link { white-space: nowrap; }
  .welcome { min-height: 150px; padding: 22px; align-items: flex-start; flex-direction: column; }
  .welcome h1 { font-size: 25px; }
  .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stats article { display: grid; justify-items: start; padding: 11px; }
  .stats article b { font-size: 16px; }
  .stats article small { font-size: 9px; }
  .panel { padding: 16px; }
  .empty-state { align-items: flex-start; flex-wrap: wrap; }
  .empty-state div { min-width: calc(100% - 58px); }
  .empty-state .outline-button { margin-left: 57px; }
  .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  :deep(.product-grid) { gap: 8px; }
  :deep(.product-copy) { padding: 0 8px 10px; }
  :deep(.product-copy h3) { font-size: 11px; }
  .profile-card { align-items: flex-start; padding-top: 68px; }
  .profile-details { grid-template-columns: 1fr; gap: 14px; }
}
</style>
