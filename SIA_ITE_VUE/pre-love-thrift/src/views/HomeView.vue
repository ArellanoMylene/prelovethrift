<template>
  <ion-page>
    <ion-content :fullscreen="true">
        <div v-if="!dashboardOpen && !sellerOpen && !riderOpen && !cartOpen" class="store-announcements">
          <div class="elfsight-app-dd1fc735-75ea-4ab8-b6f1-67d55ec594d5" data-elfsight-app-lazy></div>
          <div class="shipping-announcement">Free shipping on orders over ₱2,900 · Spin the wheel in Deals for up to 20% off</div>
        </div>
        <AppHeader v-if="!sellerOpen && !riderOpen" :user="user" :wish-count="wished.length" :cart-count="cart.length"
          :search-open="searchOpen" :profile-open="dashboardOpen || authOpen" :dashboard-mode="dashboardOpen"
        @open-auth="authOpen = true" @open-user="openCustomerDashboard('overview')"
        @open-seller-center="openSellerAuth" @logout="confirmBuyerLogout"
        @open-search="searchOpen = true" @open-chat="chatOpen = true"
        @open-wish="wishOpen = true" @open-cart="cartOpen = true"
        @navigate="handleHeaderNavigation" />
      <div v-if="!dashboardOpen && !sellerOpen && !riderOpen" class="storefront">
        <HeroSection />
        <CategoriesSection />
        <ProductsSection :wished="wishedIds" @toggle-wish="toggleWish" @add-cart="addToCart" />
        <DealsSection />
        <OutfitBuilder :cart="cart" @need-login="needLogin" @outfit-checkout="onOutfitCheckout" />
        <AppFooter />
      </div>
      <UserDashboard v-if="user" :key="dashboardView" v-show="dashboardOpen" :user="user" :wishlist="wished" :cart-count="cart.length"
        :orders="orders" :products="dashboardProducts" :categories="categories" :initial-view="dashboardView"
        @storefront="dashboardOpen = false"
        @add-cart="dashboardAddToCart" @toggle-wish="dashboardToggleWish"
        @update-user="onProfileUpdate" @message="addOrderMessage" />
      <SellerDashboard v-if="sellerUser && sellerOpen" :user="sellerUser" :orders="sellerOrders" :riders="registeredRiders"
        @logout="confirmSellerLogout" @profile-update="onSellerProfileUpdate"
        @status-change="updateSellerOrderStatus" @rider-change="updateSellerOrderRider" />
      <RiderDashboard v-if="riderUser && riderOpen" :rider="riderUser" :orders="sellerOrders"
        @storefront="returnToStorefront" @logout="confirmRiderLogout"
        @profile-update="updateRiderProfile"
        @order-update="updateDeliveryOrder" @message="addOrderMessage" />
    </ion-content>

    <AuthModal :open="authOpen" @close="closeAuth" @auth="onAuth" @seller-login="openSellerAuth" @rider-login="riderAuthOpen = true" />
    <SellerAuthModal :open="sellerAuthOpen" @close="onSellerAuthDismiss" @back="backToAuthSelection" @auth="onSellerAuth" />
    <RiderAuthModal :open="riderAuthOpen" @close="onRiderAuthDismiss" @back="backToAuthSelection" @auth="onRiderAuth" />
    <SearchModal :open="searchOpen" @close="searchOpen = false" />
    <ChatModal :open="chatOpen" @close="chatOpen = false" />
    <CartModal :open="cartOpen" :items="cart" :user="user" @close="cartOpen = false"
      @open-dashboard="dashboardOpen = true; cartOpen = false"
      @remove="confirmRemoveCart" @checkout="checkoutCart" @edit="editCart"
      @toggle="toggleCartSelect" @toggle-all="toggleCartAll"
      @order-placed="showOrderConfirmation" />
    <WishlistModal :open="wishOpen" :items="wished" @close="wishOpen = false"
      @remove="confirmRemoveWish" @add-cart="moveToCart" />

    <div v-if="orderConfirmationOpen" class="success-overlay" @click.self="closeOrderConfirmation">
      <div class="success-popup" role="dialog" aria-modal="true" aria-label="Order confirmation">
        <div class="success-header">
          <div class="success-brand">
            <img class="brand-mark" src="/assets/logo-emblem.png" alt="Pre-Loved Thrift emblem" />
            <div class="brand-copy">
              <strong>PRE-LOVED</strong>
              <span>Thrift</span>
            </div>
          </div>
          <button class="close-top" aria-label="Close" @click="closeOrderConfirmation"><ion-icon :icon="closeOutline" /></button>
        </div>

        <div class="success-body">
          <h2>{{ orderConfirmation.payment === 'GCash' ? 'Order placed' : 'Order confirmed' }} <span class="spark">✨</span></h2>
          <p class="panel-subtitle">Order placed · demo checkout</p>

          <div class="confirmation-box">
            <h3>{{ orderConfirmation.orderId }}</h3>
            <p>₱{{ orderConfirmation.total.toLocaleString('en-PH') }} · {{ orderConfirmation.payment }}. {{ orderConfirmation.payment === 'GCash' ? 'Payment is pending seller verification.' : orderConfirmation.payment.startsWith('Card') ? 'Demo only; no card payment was charged.' : 'No online payment was processed.' }} Your order is in your account dashboard.</p>
          </div>

          <button class="view-orders" type="button" @click="openOrdersFromConfirmation">View my orders</button>
        </div>
      </div>
    </div>

    <div v-if="cartToast" class="cart-toast" role="status" aria-live="polite">
      <span class="toast-icon">✓</span>
      <span>Added to cart</span>
    </div>
  </ion-page>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { IonPage, IonContent, alertController } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import AppHeader from '../components/AppHeader.vue'
import HeroSection from '../components/HeroSection.vue'
import CategoriesSection from '../components/CategoriesSection.vue'
import ProductsSection from '../components/ProductsSection.vue'
import OutfitBuilder from '../components/OutfitBuilder.vue'
import DealsSection from '../components/DealsSection.vue'
import AppFooter from '../components/AppFooter.vue'
import UserDashboard from '../components/UserDashboard.vue'
import SellerDashboard from '../components/SellerDashboard.vue'
import RiderDashboard from '../components/RiderDashboard.vue'
import AuthModal from '../modals/AuthModal.vue'
import SellerAuthModal from '../modals/SellerAuthModal.vue'
import RiderAuthModal from '../modals/RiderAuthModal.vue'
import SearchModal from '../modals/SearchModal.vue'
import ChatModal from '../modals/ChatModal.vue'
import CartModal from '../modals/CartModal.vue'
import WishlistModal from '../modals/WishlistModal.vue'
import { categories, getProductSizes, products, type CartItem, type OrderMessage, type OrderRecord, type Product, type SellerOrderRecord } from '../data/mockData'
import { USD_TO_PHP } from '../utils/currency'
import { getSupabaseClient } from '../utils/supabase'

type User = { name: string; email: string; phone?: string; address?: string; avatar?: string }
type RiderAccount = { name: string; email: string; phone?: string }
const authOpen = ref(false), sellerAuthOpen = ref(false), riderAuthOpen = ref(false), dashboardOpen = ref(false), sellerOpen = ref(false), riderOpen = ref(false), searchOpen = ref(false), chatOpen = ref(false)
const cartOpen = ref(false), wishOpen = ref(false)
const dashboardView = ref<'overview' | 'orders' | 'wishlist' | 'profile' | 'categories'>('overview')
const cartToast = ref(false)
const orderConfirmationOpen = ref(false)
const returningToAuthSelection = ref(false)
const orderConfirmation = ref({ orderId: 'PL-1004', payment: 'GCash', total: 0 })
const user = ref<User | null>(JSON.parse(localStorage.getItem('pl_me') || 'null'))
const sellerUser = ref<User | null>(JSON.parse(localStorage.getItem('pl_seller_me') || 'null'))
const riderUser = ref<User | null>(JSON.parse(localStorage.getItem('pl_rider_me') || 'null'))
const registeredRiders = ref<RiderAccount[]>([])
const wished = ref<CartItem[]>([])
const cart = ref<CartItem[]>([])
const orders = ref<OrderRecord[]>([])
const sellerOrders = ref<SellerOrderRecord[]>([])
const dashboardProducts = ref<Product[]>(products.map(product => ({ ...product, newArrival: true })))
const wishedIds = computed(() => wished.value.map(i => i.id))
let pending: (() => void) | null = null
let cartToastTimer: number | undefined
let unsubscribeSupabaseAuth: (() => void) | undefined

function refreshRegisteredRiders() {
  try {
    const savedRiders = localStorage.getItem('pl_rider_accounts')
    if (!savedRiders) {
      registeredRiders.value = []
      return
    }
    const parsed: unknown = JSON.parse(savedRiders)
    if (!Array.isArray(parsed)) throw new Error('Stored rider accounts are invalid.')
    registeredRiders.value = parsed.filter((rider): rider is RiderAccount =>
      typeof rider === 'object' && rider !== null &&
      'name' in rider && typeof rider.name === 'string' &&
      'email' in rider && typeof rider.email === 'string'
    )
  } catch (error) {
    console.error('Unable to load registered riders.', error)
    registeredRiders.value = []
  }
}
refreshRegisteredRiders()

onMounted(() => {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const email = session.user.email
        if (!email) {
          console.error('Supabase sign-in completed without an email address.')
          return
        }
        const metadata = session.user.user_metadata
        const existing = user.value?.email.toLowerCase() === email.toLowerCase() ? user.value : null
        onAuth({
          name: metadata.full_name || metadata.name || existing?.name || email.split('@')[0] || 'Shopper',
          email,
          phone: existing?.phone,
          address: existing?.address,
          avatar: metadata.avatar_url || metadata.picture || existing?.avatar
        })
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        localStorage.removeItem('pl_me')
        load(null)
        dashboardOpen.value = false
      }
    })
    unsubscribeSupabaseAuth = () => subscription.unsubscribe()

    const oauthError = new URLSearchParams(window.location.search).get('error_description')
    if (oauthError) {
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('error')
      cleanUrl.searchParams.delete('error_code')
      cleanUrl.searchParams.delete('error_description')
      window.history.replaceState({}, document.title, cleanUrl)
      void alertController.create({
        header: 'Social sign-in failed',
        message: oauthError,
        buttons: ['OK']
      }).then(alert => alert.present())
    }
  }

  if (riderUser.value) riderOpen.value = true
  if (document.querySelector('script[data-elfsight-platform], script[src^="https://elfsightcdn.com/platform.js"]')) return
  const script = document.createElement('script')
  script.src = 'https://elfsightcdn.com/platform.js'
  script.async = true
  script.dataset.elfsightPlatform = ''
  script.onerror = () => console.error('Unable to load Elfsight widgets.')
  document.head.appendChild(script)
})

onUnmounted(() => unsubscribeSupabaseAuth?.())

/* Cart and favorites live per account so they follow the buyer across visits. */
const keyFor = (u: User) => `pl_data_${u.email}`
function load(u: User | null) {
  if (!u) { cart.value = []; wished.value = []; return }
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(u)) || '{}')
    cart.value = Array.isArray(raw.cart) ? raw.cart : []
    wished.value = Array.isArray(raw.wish) ? raw.wish : []
    orders.value = Array.isArray(raw.orders) ? raw.orders : []
  } catch { cart.value = []; wished.value = []; orders.value = [] }
}
function save() {
  if (user.value) localStorage.setItem(keyFor(user.value), JSON.stringify({ cart: cart.value, wish: wished.value, orders: orders.value }))
}
watch([cart, wished, orders], save, { deep: true })
watch(sellerOrders, value => localStorage.setItem('pl_seller_orders', JSON.stringify(value)), { deep: true })
load(user.value)
try {
  const savedSellerOrders = localStorage.getItem('pl_seller_orders')
  sellerOrders.value = savedSellerOrders ? JSON.parse(savedSellerOrders) as SellerOrderRecord[] : []
} catch (error) {
  console.error('Unable to load seller orders.', error)
}

/* Guests get the login form; the clicked action runs right after they log in. */
const needLogin = (action: () => void) => {
  if (user.value) return action()
  pending = action; authOpen.value = true
}
const toItem = (p: Product | CartItem, size?: string): CartItem => ({
  id: size ? `${p.id}::${size}` : p.id,
  name: p.name,
  price: p.price,
  img: p.img,
  slot: p.slot,
  fit: p.fit,
  selected: true,
  size,
  cat: p.cat,
  type: p.type
})

const toggleWish = (p: Product) => needLogin(() => {
  const i = wished.value.findIndex(w => w.id === p.id)
  if (i >= 0) wished.value.splice(i, 1); else wished.value.push(toItem(p))
})
const showCartToast = () => {
  cartToast.value = true
  if (cartToastTimer) window.clearTimeout(cartToastTimer)
  cartToastTimer = window.setTimeout(() => {
    cartToast.value = false
  }, 1500)
}
async function promptForProductSize(product: Product | CartItem) {
  const sizes = getProductSizes(product)
  if (!sizes.length) return undefined

  let selectedSize = ''
  const alert = await alertController.create({
    header: sizes[0].startsWith('EU ') ? 'Select shoe size' : 'Select clothing size',
    message: 'Choose a size before adding this item to your cart.',
    inputs: sizes.map(size => ({
      type: 'radio' as const,
      label: size,
      value: size,
      handler: input => { selectedSize = String(input.value) }
    })),
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Add to cart', role: 'confirm', handler: () => Boolean(selectedSize) }
    ]
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  return result.role === 'confirm' ? selectedSize : undefined
}
async function addCartItem(product: Product | CartItem, afterAdded?: () => void) {
  const size = await promptForProductSize(product)
  if (getProductSizes(product).length && !size) return

  const item = toItem(product, size)
  const alreadyInCart = cart.value.some(existing => String(existing.id) === String(item.id) && existing.size === item.size)
  if (!alreadyInCart) cart.value.push(item)
  afterAdded?.()
  showCartToast()
}
const reportAddToCartError = (error: unknown) => {
  console.error('Unable to add product to cart.', error)
  void alertController.create({
    header: 'Unable to add item',
    message: 'Please try again.',
    buttons: ['OK']
  }).then(alert => alert.present())
}
const addToCart = (p: Product) => needLogin(() => { void addCartItem(p).catch(reportAddToCartError) })
const removeWish = (id: CartItem['id']) => {
  const i = wished.value.findIndex(w => w.id === id); if (i >= 0) wished.value.splice(i, 1)
}
const removeCart = (id: CartItem['id']) => {
  const i = cart.value.findIndex(c => c.id === id); if (i >= 0) cart.value.splice(i, 1)
}
const editCart = (p: { id: CartItem['id']; size?: string; note?: string }) => {
  const it = cart.value.find(c => c.id === p.id)
  if (it) { it.size = p.size; it.note = p.note }
}
const moveToCart = (p: CartItem) => needLogin(() => {
  void addCartItem(p, () => removeWish(p.id)).catch(reportAddToCartError)
})
/* A check button on each cart row marks what actually gets checked out. */
const toggleCartSelect = (id: CartItem['id']) => {
  const it = cart.value.find(c => c.id === id)
  if (it) it.selected = it.selected === false
}
const toggleCartAll = (value: boolean) => cart.value.forEach(c => { c.selected = value })
const checkoutCart = (checkout: { orderId: string; payment: string; total: number; customerName: string; customerEmail: string; customerPhone: string; customerAddress: string; paymentProof?: string }) => {
  const purchased = cart.value.filter(c => c.selected !== false)
  if (!purchased.length) return
  const orderTotal = purchased.reduce((sum, item) => sum + item.price, 0)
  orders.value.unshift({
    id: checkout.orderId,
    date: new Date().toISOString(),
    items: purchased.map(item => ({ ...item })),
    total: orderTotal,
    payment: checkout.payment,
    paymentProof: checkout.paymentProof,
    status: 'Pending',
    customerEmail: checkout.customerEmail,
    customerName: checkout.customerName,
    customerPhone: checkout.customerPhone,
    customerAddress: checkout.customerAddress
  })
  sellerOrders.value.unshift({
    id: checkout.orderId,
    date: new Date().toISOString(),
    buyer: user.value?.name ?? 'Guest',
    items: purchased.map(item => ({ ...item })),
    total: orderTotal,
    payment: checkout.payment,
    paymentProof: checkout.paymentProof,
    status: 'Pending',
    customerEmail: checkout.customerEmail,
    customerName: checkout.customerName,
    customerPhone: checkout.customerPhone,
    customerAddress: checkout.customerAddress
  })
  cart.value = cart.value.filter(c => c.selected === false)
}
const showOrderConfirmation = (payload: { orderId: string; payment: string; total: number }) => {
  orderConfirmation.value = payload
  orderConfirmationOpen.value = true
  cartOpen.value = false
  dashboardOpen.value = false
  sellerOpen.value = false
}
const closeOrderConfirmation = () => {
  orderConfirmationOpen.value = false
}
const openOrdersFromConfirmation = () => {
  closeOrderConfirmation()
  dashboardOpen.value = true
  sellerOpen.value = false
}
/* An outfit built in the Outfit Builder is checked out through the same cart. */
const onOutfitCheckout = (items: CartItem[]) => {
  items.forEach(it => { if (!cart.value.some(c => c.id === it.id)) cart.value.push({ ...it, selected: true }) })
  cartOpen.value = true
}

function loadDashboardProducts() {
  const sellerProducts: Product[] = []
  const inventoryKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => key?.startsWith('pl_seller_inventory_') ?? false)

  for (const key of inventoryKeys) {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) continue
      const inventory: unknown = JSON.parse(saved)
      if (!Array.isArray(inventory)) throw new Error(`Seller inventory in ${key} is invalid.`)
      for (const item of inventory) {
        if (typeof item !== 'object' || item === null ||
          !('id' in item) || typeof item.id !== 'string' ||
          !('name' in item) || typeof item.name !== 'string' ||
          !('category' in item) || typeof item.category !== 'string' ||
          !('price' in item) || typeof item.price !== 'number' ||
          !('stock' in item) || typeof item.stock !== 'number' || item.stock <= 0 ||
          !('img' in item) || typeof item.img !== 'string') continue
        sellerProducts.push({
          id: `${key.slice('pl_seller_inventory_'.length)}:${item.id}`,
          name: item.name,
          price: item.price / USD_TO_PHP,
          img: item.img,
          cat: item.category,
          type: item.type,
          newArrival: true
        })
      }
    } catch (error) {
      console.error(`Unable to load products from ${key}.`, error)
    }
  }
  dashboardProducts.value = [...sellerProducts, ...products.map(product => ({ ...product, newArrival: true }))]
}
watch(dashboardOpen, isOpen => {
  if (isOpen) loadDashboardProducts()
})

const openCustomerDashboard = (tab: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories' = 'overview') => {
  dashboardOpen.value = true
  dashboardView.value = tab
  sellerOpen.value = false
  authOpen.value = false
}
const onAuth = (u: User) => {
  user.value = u; localStorage.setItem('pl_me', JSON.stringify(u)); load(u)
  openCustomerDashboard('overview')
  pending?.(); pending = null
}
const onProfileUpdate = (updated: User) => {
  user.value = updated
  localStorage.setItem('pl_me', JSON.stringify(updated))
  load(updated)
  dashboardOpen.value = true
  sellerOpen.value = false
}
const closeAuth = () => { authOpen.value = false; pending = null }
const backToAuthSelection = () => {
  returningToAuthSelection.value = true
  sellerAuthOpen.value = false
  riderAuthOpen.value = false
}
const onSellerAuthDismiss = () => {
  sellerAuthOpen.value = false
  if (!returningToAuthSelection.value) return
  returningToAuthSelection.value = false
  authOpen.value = true
}
const onRiderAuthDismiss = () => {
  riderAuthOpen.value = false
  if (!returningToAuthSelection.value) return
  returningToAuthSelection.value = false
  authOpen.value = true
}
const logout = async () => {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Unable to sign out from Supabase.', error)
      const alert = await alertController.create({
        header: 'Unable to log out',
        message: error.message,
        buttons: ['OK']
      })
      await alert.present()
      return
    }
  }
  user.value = null; localStorage.removeItem('pl_me'); load(null); dashboardOpen.value = false
}
async function confirmAction(header: string, message: string) {
  const alert = await alertController.create({
    header,
    message,
    backdropDismiss: false,
    buttons: [
      { text: 'No', role: 'cancel' },
      { text: 'Yes', role: 'confirm' }
    ]
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  return result.role === 'confirm'
}
async function confirmBuyerLogout() {
  if (await confirmAction('Log out?', 'Are you sure you want to log out of your account?')) await logout()
}
async function confirmSellerLogout() {
  if (await confirmAction('Log out?', 'Are you sure you want to log out of your seller account?')) sellerLogout()
}
async function confirmRiderLogout() {
  if (await confirmAction('Log out?', 'Are you sure you want to log out of your rider account?')) riderLogout()
}
async function confirmRemoveCart(id: CartItem['id']) {
  const item = cart.value.find(entry => entry.id === id)
  if (!item || !(await confirmAction('Remove item?', `Remove ${item.name} from your cart?`))) return
  removeCart(id)
}
async function confirmRemoveWish(id: CartItem['id']) {
  const item = wished.value.find(entry => entry.id === id)
  if (!item || !(await confirmAction('Remove favorite?', `Remove ${item.name} from your wishlist?`))) return
  removeWish(id)
}
const openSellerAuth = () => {
  if (sellerUser.value) {
    dashboardOpen.value = false
    sellerOpen.value = true
    return
  }
  sellerAuthOpen.value = true
}
const onSellerAuth = (seller: User) => {
  refreshRegisteredRiders()
  sellerUser.value = seller
  localStorage.setItem('pl_seller_me', JSON.stringify(seller))
  riderUser.value = null
  localStorage.removeItem('pl_rider_me')
  riderOpen.value = false
  dashboardOpen.value = false
  sellerOpen.value = true
}
const onSellerProfileUpdate = (seller: User) => {
  sellerUser.value = seller
}
const onRiderAuth = (rider: User) => {
  refreshRegisteredRiders()
  riderUser.value = rider
  localStorage.setItem('pl_rider_me', JSON.stringify(rider))
  sellerUser.value = null
  localStorage.removeItem('pl_seller_me')
  syncRiderContact(rider)
  dashboardOpen.value = false
  sellerOpen.value = false
  riderOpen.value = true
}
const riderLogout = () => {
  riderUser.value = null
  localStorage.removeItem('pl_rider_me')
  riderOpen.value = false
}
const updateRiderProfile = (updatedRider: User) => {
  const previousName = riderUser.value?.name
  riderUser.value = updatedRider
  localStorage.setItem('pl_rider_me', JSON.stringify(updatedRider))
  try {
    const accounts = JSON.parse(localStorage.getItem('pl_rider_accounts') || '[]') as Array<{ name: string; email: string; phone?: string; salt: string; passwordHash: string }>
    const account = accounts.find(item => item.email === updatedRider.email)
    if (account) {
      account.name = updatedRider.name
      account.phone = updatedRider.phone
      localStorage.setItem('pl_rider_accounts', JSON.stringify(accounts))
    }
  } catch (reason) {
    console.error('Unable to update the saved rider account profile.', reason)
  }
  syncRiderContact(updatedRider, previousName || updatedRider.name)
}
function syncRiderContact(rider: User, previousName = rider.name) {
  const riderNames = new Set([rider.name.trim().toLowerCase(), previousName.trim().toLowerCase()])
  for (const order of sellerOrders.value) {
    if (order.rider && riderNames.has(order.rider.trim().toLowerCase())) {
      updateOrderData(order.id, { rider: rider.name, riderEmail: rider.email, riderPhone: rider.phone })
    }
  }
}
const sellerLogout = () => {
  sellerUser.value = null
  localStorage.removeItem('pl_seller_me')
  sellerOpen.value = false
}
const returnToStorefront = () => { sellerOpen.value = false; dashboardOpen.value = false; riderOpen.value = false }
const updateSellerOrderStatus = (id: string, status: string) => {
  updateOrderData(id, { status })
}
const updateSellerOrderRider = (id: string, rider: RiderAccount) => {
  updateOrderData(id, {
    rider: rider.name,
    riderEmail: rider.email,
    riderPhone: rider.phone
  })
}
const updateDeliveryOrder = (id: string, patch: Partial<OrderRecord>) => {
  updateOrderData(id, patch)
}
const addOrderMessage = (id: string, message: OrderMessage) => {
  const existing = sellerOrders.value.find(item => item.id === id)?.messages
    ?? orders.value.find(item => item.id === id)?.messages
    ?? []
  updateOrderData(id, { messages: [...existing, message] })
}
function updateOrderData(id: string, patch: Partial<OrderRecord>) {
  const sellerOrder = sellerOrders.value.find(item => item.id === id)
  if (sellerOrder) Object.assign(sellerOrder, patch)
  const customerOrder = orders.value.find(item => item.id === id)
  if (customerOrder) Object.assign(customerOrder, patch)
  const storageKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => key?.startsWith('pl_data_') ?? false)
  for (const key of storageKeys) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}') as { orders?: OrderRecord[] }
      if (!Array.isArray(saved.orders)) continue
      const storedOrder = saved.orders.find(order => order.id === id)
      if (!storedOrder) continue
      Object.assign(storedOrder, patch)
      localStorage.setItem(key, JSON.stringify(saved))
    } catch (reason) {
      console.error(`Unable to sync delivery update to ${key}.`, reason)
    }
  }
}
const dashboardAddToCart = (product: Product) => addToCart(product)
const dashboardToggleWish = (product: Product) => toggleWish(product)
function handleHeaderNavigation(id: string) {
  if (dashboardOpen.value && id === 'shop') {
    loadDashboardProducts()
    dashboardView.value = 'categories'
    return
  }
  void navigateStorefront(id)
}
async function navigateStorefront(id: string) {
  if (dashboardOpen.value || sellerOpen.value) {
    dashboardOpen.value = false; sellerOpen.value = false
    await nextTick()
  }
  const content = document.querySelector('ion-content')
  const scroller = content?.shadowRoot?.querySelector<HTMLElement>('.inner-scroll')
  if (!scroller) return
  if (id === 'top') {
    scroller.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = document.getElementById(id)
  if (!target) return
  const targetTop = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
  const headerHeight = document.querySelector('.hdr')?.getBoundingClientRect().height ?? 78
  scroller.scrollTo({ top: Math.max(0, targetTop - headerHeight), behavior: 'smooth' })
}
</script>
<style scoped>
.shipping-announcement {
  min-height: 38px;
  display: grid;
  place-items: center;
  padding: 8px 16px;
  background: #fae2df;
  color: #bd5b58;
  text-align: center;
  font: 600 12px var(--font-body);
}
.success-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(25, 10, 10, 0.18);
  z-index: 2000;
  padding: 20px;
}
.success-popup {
  width: min(440px, calc(100vw - 28px));
  background: linear-gradient(180deg, #d98a87 0%, #d07774 100%);
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(58, 32, 30, 0.2);
  overflow: hidden;
}
.success-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10px 14px 6px;
  min-height: 60px;
  background: rgba(255,255,255,0.04);
}
.success-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}
.success-brand .brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
}
.success-brand .brand-copy strong {
  font-size: 15px;
  letter-spacing: 0.04em;
}
.success-brand .brand-copy span {
  font-size: 9px;
  margin-top: 2px;
  letter-spacing: 0.17em;
}
.success-header .brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: contain;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.8);
}
.success-header .close-top {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 24px;
}
.success-body {
  background: rgba(255,255,255,0.06);
  padding: 8px 18px 18px;
  text-align: center;
}
.success-body h2 {
  margin: 0;
  font-size: clamp(28px, 2.8vw, 42px);
  letter-spacing: -0.06em;
  line-height: 1.05;
  color: #fff;
  font-weight: 800;
}
.spark { font-size: 0.8em; }
.panel-subtitle {
  margin: 8px 0 16px;
  font-size: 18px;
  color: rgba(255,255,255,0.96);
  font-weight: 500;
}
.confirmation-box {
  background: rgba(255,255,255,0.96);
  border-radius: 16px;
  padding: 18px 16px 16px;
  box-shadow: inset 0 0 0 1px rgba(115, 78, 75, 0.08);
}
.confirmation-box h3 {
  margin: 0 0 10px;
  font-size: clamp(28px, 2.5vw, 38px);
  line-height: 1;
  letter-spacing: -0.06em;
  color: #1d1919;
}
.confirmation-box p {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  color: #2b2524;
}
.view-orders {
  width: 100%;
  margin-top: 18px;
  border: 0;
  border-radius: 14px;
  padding: 14px 16px;
  background: #f3d0c8;
  color: #2b2524;
  font: 800 20px var(--font-body);
  cursor: pointer;
}
.cart-toast {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 999px;
  background: rgba(33, 24, 24, 0.94);
  color: #fff;
  font: 700 15px var(--font-body);
  box-shadow: 0 18px 32px rgba(31, 21, 20, 0.28);
  animation: toast-in .2s ease;
  min-width: 180px;
  justify-content: center;
}
.toast-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  color: var(--coral-dark);
  font-weight: 800;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 520px) {
  .shipping-announcement { min-height: 34px; font-size: 10px; }
  .cart-toast { right: 16px; bottom: 16px; }
}
</style>
