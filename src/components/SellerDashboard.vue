<template>
  <section class="seller-page">
    <header class="seller-header">
      <div class="seller-brand">
        <img src="/assets/logo.png" alt="" />
        <span><b>PRE-LOVED</b><small>THRIFT</small></span>
      </div>
      <div class="header-actions">
        <div class="seller-account">
          <button class="header-icon account-button" aria-label="Seller account" :aria-expanded="accountMenuOpen" @click="accountMenuOpen = !accountMenuOpen">
            <img v-if="user.avatar" :src="user.avatar" alt="" />
            <span v-else>{{ user.name.charAt(0).toUpperCase() }}</span>
          </button>
          <div v-if="accountMenuOpen" class="account-menu">
            <div class="account-info"><b>{{ user.name }}</b><small>{{ user.email }}</small><span>Seller account</span></div>
            <button @click="accountMenuOpen = false; tab = 'profile'"><ion-icon :icon="personOutline" /> Profile</button>
            <button @click="accountMenuOpen = false; logoutConfirmationOpen = true">Log out</button>
          </div>
        </div>
      </div>
    </header>

    <div class="seller-layout">
      <aside class="seller-sidebar">
        <span class="side-label">SELLER MENU</span>
        <button v-for="item in navItems" :key="item.id" :class="{ active: tab === item.id }" @click="tab = item.id">
          <ion-icon :icon="item.icon" /><span>{{ item.label }}</span>
          <small v-if="item.id === 'alerts' && lowStock.length">{{ lowStock.length }}</small>
          <small v-else-if="item.id === 'reviews' && productReviews.length">{{ productReviews.length }}</small>
        </button>
      </aside>

      <main class="seller-content">
        <template v-if="tab === 'overview'">
          <div class="page-title"><div><span class="eyebrow">SELLER CENTRE</span><h1>Overview</h1>
            <p>Your shop at a glance. Sales and order totals update when purchases are placed in this demo.</p></div>
            <button class="primary-button" @click="tab = 'inventory'"><ion-icon :icon="addOutline" /> Add a product</button></div>
          <div class="metrics">
            <article><span>Revenue</span><b>{{ formatPeso(revenue) }}</b><small>From delivered orders</small></article>
            <article><span>Orders</span><b>{{ orders.length }}</b><small>All order statuses</small></article>
            <article><span>Units sold</span><b>{{ unitsSold }}</b><small>Across all orders</small></article>
            <article class="warning-metric"><span>Low-stock items</span><b>{{ lowStock.length }}</b><small>At or below reorder point</small></article>
          </div>
          <div class="overview-grid">
            <section class="panel">
              <div class="panel-title"><div><span class="eyebrow">SHOP PERFORMANCE</span><h2>Sales analytics</h2></div></div>
              <div class="sales-summary">
                <div><small>Units sold</small><b>{{ inventoryUnitsSold }}</b></div>
                <div><small>Products tracked</small><b>{{ inventory.length }}</b></div>
              </div>
              <div v-if="!inventory.length" class="empty-note">Sales insights will appear when you add products to inventory.</div>
              <div v-else class="dress-sales-analysis">
                <div class="dress-sales-group">
                  <span class="sales-caption"><ion-icon :icon="trendingUpOutline" /> Fast-selling products</span>
                  <template v-if="fastSellingProducts.length">
                    <div v-for="product in fastSellingProducts" :key="product.id" class="dress-sales-row">
                      <img :src="product.img || fallbackImage" :alt="product.name" />
                      <span><b>{{ product.name }}</b><small>{{ product.category }}</small></span>
                      <strong>{{ product.sold }} sold</strong>
                    </div>
                  </template>
                  <p v-else class="dress-sales-empty">No product sales recorded yet.</p>
                </div>
                <div class="dress-sales-group">
                  <span class="sales-caption"><ion-icon :icon="trendingDownOutline" /> Products not sold yet</span>
                  <template v-if="unsoldProducts.length">
                    <div v-for="product in unsoldProducts" :key="product.id" class="dress-sales-row unsold">
                      <img :src="product.img || fallbackImage" :alt="product.name" />
                      <span><b>{{ product.name }}</b><small>{{ product.category }}</small></span>
                      <strong>0 sold</strong>
                    </div>
                  </template>
                  <p v-else class="dress-sales-empty">Every product has at least one sale. Nice work!</p>
                </div>
              </div>
            </section>
            <section class="panel">
              <div class="panel-title"><div><span class="eyebrow">INVENTORY HEALTH</span><h2>Needs restocking</h2></div>
                <button class="text-button" @click="tab = 'alerts'">View all</button></div>
              <div v-if="!lowStock.length" class="empty-note">Everything is stocked above its reorder point.</div>
              <div v-for="product in lowStock.slice(0, 3)" :key="product.id" class="restock-preview">
                <img :src="product.img || fallbackImage" :alt="product.name" />
                <div><b>{{ product.name }}</b><span>{{ product.stock }} left · reorder at {{ product.reorderPoint }}</span></div>
                <ion-icon :icon="alertCircleOutline" />
              </div>
            </section>
          </div>
          <section class="panel recent-orders">
            <div class="panel-title"><div><span class="eyebrow">LATEST ACTIVITY</span><h2>Recent orders</h2></div>
              <button class="text-button" @click="tab = 'orders'">All orders</button></div>
            <OrdersTable v-if="orders.length" :orders="orders.slice(0, 5)" :riders="props.riders" @status-change="updateOrderStatus" @rider-change="updateOrderRider" />
            <div v-else class="empty-note">No orders yet. Orders placed from the storefront will appear here.</div>
          </section>
        </template>

        <template v-else-if="tab === 'inventory'">
        <div class="page-title"><div><span class="eyebrow">YOUR CATALOGUE</span><h1>Products &amp; inventory</h1>
          <p>Add products, update stock, and set automatic reorder points.</p></div></div>
        <section class="panel add-product">
          <div class="panel-title"><div><span class="eyebrow">LIST A NEW FIND</span><h2>Add a product</h2></div></div>
          <form class="product-form" @submit.prevent="addProduct">
            <label>Product name<input v-model.trim="form.name" required maxlength="80" placeholder="e.g. Vintage denim jacket" /></label>
            <label>Category<select v-model="form.category"><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></label>
            <label>Type<select v-model="form.type"><option>Clothing</option><option>Accessories</option><option>Shoes</option><option>Bag</option></select></label>
            <label>Price (₱)<input v-model.number="form.price" type="number" min="1" step="1" required /></label>
            <label>Stock<input v-model.number="form.stock" type="number" min="0" step="1" required /></label>
            <label>Reorder point<input v-model.number="form.reorderPoint" type="number" min="0" step="1" required /></label>
            <label>Colour<input v-model.trim="form.color" maxlength="40" placeholder="Optional" /></label>
            <label class="photo-field">Photo<input type="file" accept="image/*" @change="readPhoto" /></label>
            <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
            <button class="primary-button submit-button" type="submit"><ion-icon :icon="addOutline" /> Add product</button>
          </form>
        </section>
        <section class="panel inventory-panel">
          <div class="panel-title"><div><span class="eyebrow">SHOP CATALOGUE</span><h2>Inventory <small>({{ inventory.length }})</small></h2></div>
            <label class="search-field"><ion-icon :icon="searchOutline" /><input v-model="inventoryQuery" placeholder="Find a product" /></label></div>
          <p v-if="inventoryError" class="form-error inventory-error" role="alert">{{ inventoryError }}</p>
          <div class="table-wrap">
            <table class="inventory-table">
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Reorder at</th><th>Auto-reorder</th><th></th></tr></thead>
              <tbody>
                <tr v-for="product in filteredInventory" :key="product.id">
                  <td><div class="inventory-product"><img :src="product.img || fallbackImage" :alt="product.name" /><div><b>{{ product.name }}</b><small>{{ product.category }} · {{ product.sold }} sold</small></div></div></td>
                  <td><label class="table-input"><span>₱</span><input v-model.number="product.price" type="number" min="1" step="1" aria-label="Product price" @change="saveInventory(product)" /></label></td>
                  <td><input v-model.number="product.stock" class="number-input" type="number" min="0" aria-label="Stock quantity" @change="saveInventory(product)" /></td>
                  <td><input v-model.number="product.reorderPoint" class="number-input" type="number" min="0" aria-label="Reorder point" @change="saveInventory(product)" /></td>
                  <td><label class="switch"><input :checked="product.autoReorder" type="checkbox" :aria-label="`Auto-reorder ${product.name}`" @change="toggleAutoReorder(product, $event)" /><span></span></label></td>
                  <td><button class="icon-button danger" :aria-label="`Delete ${product.name}`" @click="deleteProduct(product.id)"><ion-icon :icon="trashOutline" /></button></td>
                </tr>
                <tr v-if="!filteredInventory.length"><td colspan="6" class="empty-cell">No products match your search.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        </template>

        <template v-else-if="tab === 'orders'">
          <div class="order-processing-heading">
            <h2>Order processing</h2>
            <p>Confirm orders, assign a delivery rider, and update fulfilment status. Assigned rider details appear in the customer dashboard after confirmation.</p>
          </div>
          <section class="panel order-processing-panel">
            <OrdersTable v-if="orders.length" :orders="orders" :riders="props.riders" @status-change="updateOrderStatus" @rider-change="updateOrderRider" />
            <div v-else class="empty-note large-empty"><span class="empty-symbol"><ion-icon :icon="receiptOutline" /></span><b>No orders yet</b><p>Customer purchases will appear in this list.</p></div>
          </section>
        </template>

        <template v-else-if="tab === 'reviews'">
          <div class="page-title"><div><span class="eyebrow">CUSTOMER FEEDBACK</span><h1>Product reviews</h1>
            <p>See what customers are saying about the products in your shop.</p></div></div>
          <section class="panel seller-reviews">
            <p v-if="reviewsError" class="form-error" role="alert">{{ reviewsError }}</p>
            <div v-if="productReviews.length" class="review-summary">
              <span class="review-summary-score">{{ averageReviewRating.toFixed(1) }}</span>
              <span class="seller-review-stars" aria-label="Average customer rating">★</span>
              <span>average rating · {{ productReviews.length }} {{ productReviews.length === 1 ? 'review' : 'reviews' }}</span>
            </div>
            <div v-if="!productReviews.length && !reviewsError" class="empty-note large-empty">
              <span class="empty-symbol"><ion-icon :icon="starOutline" /></span><b>No reviews yet</b>
              <p>Customer reviews for your products will appear here.</p>
            </div>
            <article v-for="review in productReviews" :key="review.id" class="seller-review-card">
              <img :src="reviewProduct(review.productId)?.img || fallbackImage" :alt="reviewProduct(review.productId)?.name || 'Reviewed product'" />
              <div class="seller-review-copy">
                <div class="seller-review-top">
                  <div><b>{{ reviewProduct(review.productId)?.name || 'Reviewed product' }}</b><small>Customer review · {{ formatDate(review.createdAt) }}</small></div>
                  <span class="seller-review-rating">{{ '★'.repeat(review.rating) }}<span>{{ '★'.repeat(5 - review.rating) }}</span></span>
                </div>
                <p>{{ review.reviewText || 'The customer left a rating without a written comment.' }}</p>
                <div class="seller-review-details">
                  <span>Seller service: {{ review.sellerServiceRating }}/5</span>
                  <span>Delivery: {{ review.deliveryServiceRating }}/5</span>
                  <span>{{ review.showUsername ? 'Name shown' : 'Anonymous' }}</span>
                </div>
                <div v-if="review.photoUrls.length || review.videoUrls.length" class="seller-review-media">
                  <button v-for="(url, index) in review.photoUrls" :key="url" class="seller-review-photo" type="button" :aria-label="`View review photo ${index + 1}`" @click="openReviewPhoto(url)">
                    <img :src="url" :alt="`Review photo ${index + 1}`" />
                  </button>
                  <a v-for="url in review.videoUrls" :key="url" :href="url" target="_blank" rel="noopener noreferrer">View video</a>
                </div>
              </div>
            </article>
          </section>
        </template>

        <template v-else-if="tab === 'alerts'">
          <div class="page-title"><div><span class="eyebrow">STOCK MANAGEMENT</span><h1>Reorder alerts</h1>
            <p>Items at or below their reorder point need your attention.</p></div></div>
          <section class="panel alert-panel">
            <p v-if="reorderRequestError" class="form-error" role="alert">{{ reorderRequestError }}</p>
            <p v-if="reorderRequestNotice" class="tip" role="status">{{ reorderRequestNotice }}</p>
            <div v-if="!lowStock.length" class="empty-note large-empty"><span class="empty-symbol"><ion-icon :icon="checkmarkCircleOutline" /></span><b>No restock alerts</b><p>Your products are stocked above their reorder points.</p></div>
            <template v-else>
              <article v-for="product in lowStock" :key="product.id" class="alert-row">
                <img :src="product.img || fallbackImage" :alt="product.name" />
                <div class="alert-copy"><b>{{ product.name }}</b><span>{{ product.stock }} in stock · reorder point {{ product.reorderPoint }}</span></div>
                <button class="primary-button" :disabled="restockRequestsInProgress.includes(product.id)" @click="requestRestock(product)">
                  <ion-icon :icon="refreshOutline" />{{ restockRequestsInProgress.includes(product.id) ? 'Sending…' : hasPendingReorderRequest(product.id) ? 'Already requested' : 'Request restock' }}
                </button>
              </article>
              <p class="tip">Tip: switch on Auto-reorder for a product in Inventory and it will restock itself the moment it hits its reorder point.</p>
            </template>
          </section>
          <section v-if="activeReorderRequests.length" class="panel reorder-history">
            <div class="panel-title"><div><span class="eyebrow">MANUAL RESTOCK</span><h2>Pending reorder requests</h2></div></div>
            <article v-for="request in activeReorderRequests" :key="request.id" class="reorder-history-row">
              <img :src="inventory.find((product) => product.id === request.productId)?.img || fallbackImage" alt="" />
              <div><b>{{ inventory.find((product) => product.id === request.productId)?.name || 'Product' }}</b>
                <small>Stock {{ request.currentStock }} · reorder point {{ request.reorderPoint }} · {{ formatDate(request.createdAt) }}</small></div>
              <span class="request-status" :class="`status-${request.status.toLowerCase()}`">{{ request.status }}</span>
            </article>
          </section>
        </template>

        <template v-else-if="tab === 'payments'">
          <div class="page-title"><div><span class="eyebrow">PAYOUTS &amp; SHOP TOOLS</span><h1>Payments &amp; automation</h1>
            <p>Review recorded payment methods and automatic restock activity.</p></div></div>
          <div class="payment-stats">
            <article v-for="payment in paymentTotals" :key="payment.name" class="panel">
              <span>{{ payment.name }}</span><b>{{ formatPeso(payment.amount) }}</b><small>{{ payment.count }} {{ payment.count === 1 ? 'order' : 'orders' }}</small>
            </article>
          </div>
          <section class="panel automation-panel">
            <div class="panel-title"><div><span class="eyebrow">SHOP ACTIVITY</span><h2>Automation log</h2></div></div>
            <div v-if="!automationLog.length" class="empty-note">Events appear here as orders and restocks happen.</div>
            <ul v-else class="activity-list"><li v-for="entry in automationLog" :key="entry.id">
              <span class="activity-icon"><ion-icon :icon="entry.icon" /></span><div><b>{{ entry.title }}</b><small>{{ entry.detail }}</small></div><time>{{ formatTime(entry.date) }}</time>
            </li></ul>
            <p class="demo-note">Checkout and payment processing are simulated in this demo. No real payments are collected.</p>
          </section>
        </template>

        <template v-else>
          <div class="page-title"><div><span class="eyebrow">YOUR ACCOUNT</span><h1>Profile</h1>
            <p>Update your seller information and profile photo.</p></div></div>
          <section class="panel seller-profile-panel">
            <div class="seller-profile-photo">
              <span class="seller-profile-avatar">
                <img v-if="profileDraft.avatar" :src="profileDraft.avatar" alt="Seller profile photo" />
                <template v-else>{{ profileDraft.name.charAt(0).toUpperCase() }}</template>
              </span>
              <input ref="profilePhotoInput" class="profile-photo-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handleProfilePhoto" />
              <button class="text-button" type="button" @click="profilePhotoInput?.click()">Upload profile photo</button>
              <button v-if="profileDraft.avatar" class="remove-photo" type="button" @click="profileDraft.avatar = ''">Remove photo</button>
            </div>
            <form class="seller-profile-form" @submit.prevent="saveProfile">
              <label>Seller name<input v-model.trim="profileDraft.name" required maxlength="80" autocomplete="name" /></label>
              <label>Email address<input :value="user.email" type="email" readonly /></label>
              <label>Phone number<input v-model.trim="profileDraft.phone" type="tel" autocomplete="tel" placeholder="09xx xxx xxxx" /></label>
              <label>Address<input v-model.trim="profileDraft.address" autocomplete="street-address" placeholder="Shop or business address" /></label>
              <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>
              <button class="primary-button submit-button" type="submit">Save profile</button>
            </form>
          </section>
        </template>
      </main>
    </div>

    <div v-if="reviewPhotoOpen" class="seller-review-photo-overlay" role="dialog" aria-modal="true" aria-label="Review photo preview" @click.self="closeReviewPhoto">
      <div class="seller-review-photo-viewer">
        <button type="button" class="seller-review-photo-close" aria-label="Close photo preview" @click="closeReviewPhoto">×</button>
        <img :src="reviewPhotoOpen" alt="Full-size customer review photo" />
      </div>
    </div>

    <div v-if="logoutConfirmationOpen" class="seller-logout-backdrop" role="presentation" @click.self="logoutConfirmationOpen = false">
      <section class="seller-logout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="seller-logout-title" aria-describedby="seller-logout-description">
        <div class="seller-logout-sign"><ion-icon :icon="logOutOutline" /></div>
        <span class="seller-logout-eyebrow">YOUR SELLER SESSION</span>
        <h2 id="seller-logout-title">Leaving your shop?</h2>
        <p id="seller-logout-description">Are you sure you want to log out of your seller account?</p>
        <div class="seller-logout-actions">
          <button type="button" class="seller-logout-cancel" @click="logoutConfirmationOpen = false">Stay here</button>
          <button type="button" class="seller-logout-confirm" @click="logoutConfirmationOpen = false; $emit('logout')">
            <ion-icon :icon="logOutOutline" /> Log out
          </button>
        </div>
      </section>
    </div>

    <div v-if="reorderPopupOpen" class="reorder-popup-backdrop" role="presentation" @click.self="dismissReorderPopup">
      <section class="reorder-popup" role="alertdialog" aria-modal="true" aria-labelledby="reorder-popup-title">
        <button class="reorder-popup-close" type="button" aria-label="Close reorder alert" @click="dismissReorderPopup">×</button>
        <div class="reorder-popup-sign"><ion-icon :icon="alertCircleOutline" /></div>
        <span class="reorder-popup-eyebrow">INVENTORY CHECK</span>
        <h2 id="reorder-popup-title">Stock running low</h2>
        <p class="reorder-popup-intro">
          {{ lowStock.length }} {{ lowStock.length === 1 ? 'product needs' : 'products need' }} your attention.
          Restock soon to keep your shop ready.
        </p>
        <div class="reorder-popup-items">
          <div v-for="product in lowStock.slice(0, 3)" :key="product.id" class="reorder-popup-item">
            <img :src="product.img || fallbackImage" :alt="product.name" />
            <span class="reorder-popup-product"><b>{{ product.name }}</b><small>Reorder point: {{ product.reorderPoint }}</small></span>
            <span class="reorder-popup-stock">{{ product.stock }} left</span>
          </div>
          <small v-if="lowStock.length > 3" class="reorder-popup-more">+ {{ lowStock.length - 3 }} more products need restocking</small>
        </div>
        <div class="reorder-popup-actions">
          <button type="button" class="reorder-later" @click="dismissReorderPopup">Later</button>
          <button type="button" class="reorder-view" @click="viewReorderAlerts">View alerts</button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { IonIcon, alertController } from '@ionic/vue'
import {
  addOutline, alertCircleOutline, checkmarkCircleOutline, cubeOutline, gridOutline,
  logOutOutline, personOutline, receiptOutline, refreshOutline, searchOutline, starOutline,
  trashOutline, trendingDownOutline, trendingUpOutline, walletOutline
} from 'ionicons/icons'
import { categories as shopCategories, type CartItem, type SellerOrderRecord } from '../data/mockData'
import { formatPeso } from '../utils/currency'
import { profileToUser, updateMyProfile } from '../services/auth'
import {
  addActivityRecord,
  createSellerProduct,
  deleteSellerProduct,
  listMyReorderRequests,
  listMyActivity,
  listMyProducts,
  createReorderRequest,
  seedMyInventory,
  type ReorderRequest,
  updateSellerProduct,
  type ActivityEntry,
  type InventoryProduct
} from '../services/seller'
import { listSellerProductReviews, type ProductReview } from '../services/reviews'
import type { AppUser, RiderSummary } from '../types/database'

type RiderAccount = RiderSummary
const props = defineProps<{ user: AppUser; orders: SellerOrderRecord[]; riders: RiderAccount[] }>()
const emit = defineEmits<{
  (event: 'logout'): void
  (event: 'profile-update', user: { name: string; email: string; phone?: string; address?: string; avatar?: string }): void
  (event: 'status-change', id: string, status: string): void
  (event: 'rider-change', id: string, rider: RiderAccount): void
}>()
const fallbackImage = '/assets/category-1.png'
const tab = ref('inventory')
const reorderPopupOpen = ref(false)
const logoutConfirmationOpen = ref(false)
const accountMenuOpen = ref(false)
const profilePhotoInput = ref<HTMLInputElement | null>(null)
const profileError = ref('')
const profileDraft = reactive({
  name: props.user.name,
  phone: props.user.phone || '',
  address: props.user.address || '',
  avatar: props.user.avatar || ''
})
watch(() => props.user, (user) => {
  profileDraft.name = user.name
  profileDraft.phone = user.phone || ''
  profileDraft.address = user.address || ''
  profileDraft.avatar = user.avatar || ''
}, { deep: true })
const inventory = ref<InventoryProduct[]>([])
const productReviews = ref<ProductReview[]>([])
const reviewsError = ref('')
const reviewPhotoOpen = ref('')
const inventoryQuery = ref('')
const inventoryError = ref('')
const reorderRequestError = ref('')
const reorderRequestNotice = ref('')
const restockRequestsInProgress = ref<string[]>([])
const formError = ref('')
const photo = ref('')
const reorderRequests = ref<ReorderRequest[]>([])
const automationLog = ref<ActivityEntry[]>([])
const categories = shopCategories.map((category) => category.name)
const navItems = [
  { id: 'overview', label: 'Overview', icon: gridOutline },
  { id: 'inventory', label: 'Products & inventory', icon: cubeOutline },
  { id: 'orders', label: 'Orders', icon: receiptOutline },
  { id: 'reviews', label: 'Reviews', icon: starOutline },
  { id: 'alerts', label: 'Reorder alerts', icon: alertCircleOutline },
  { id: 'payments', label: 'Payments & automation', icon: walletOutline },
  { id: 'profile', label: 'Profile', icon: personOutline }
]
const form = reactive({ name: '', category: categories[0], type: 'Clothing', price: 0, stock: 0, reorderPoint: 3, color: '' })
const orders = computed(() => props.orders)
const averageReviewRating = computed(() => productReviews.value.length
  ? productReviews.value.reduce((sum, review) => sum + review.rating, 0) / productReviews.value.length
  : 0)
const lowStock = computed(() => inventory.value.filter((product) => product.stock <= product.reorderPoint))
const activeReorderRequests = computed(() => reorderRequests.value.filter((request) => {
  const product = inventory.value.find((item) => item.id === request.productId)
  return product
    && product.stock <= product.reorderPoint
    && request.status.toLowerCase() === 'pending'
}))
const openReviewPhoto = (url: string) => { reviewPhotoOpen.value = url }
const closeReviewPhoto = () => { reviewPhotoOpen.value = '' }
const filteredInventory = computed(() => {
  const query = inventoryQuery.value.trim().toLowerCase()
  return query ? inventory.value.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query)) : inventory.value
})
const revenue = computed(() => orders.value
  .filter((order) => order.status === 'Delivered')
  .reduce((sum, order) => sum + (order.subtotal ?? order.total), 0))
const unitsSold = computed(() => orders.value.reduce((sum, order) => sum + order.items.length, 0))
const fastSellingProducts = computed(() => inventory.value
  .filter((product) => product.sold > 0)
  .sort((a, b) => b.sold - a.sold)
  .slice(0, 3))
const unsoldProducts = computed(() => inventory.value
  .filter((product) => product.sold === 0)
  .slice(0, 3))
const inventoryUnitsSold = computed(() => inventory.value.reduce((total, product) => total + product.sold, 0))
const paymentTotals = computed(() => {
  const totals = new Map<string, { amount: number; count: number }>()
  for (const order of orders.value) {
    if (order.status !== 'Delivered') continue
    const paymentName = order.payment.startsWith('Card') ? 'Card' : order.payment || 'Unspecified'
    const current = totals.get(paymentName) ?? { amount: 0, count: 0 }
    current.amount += order.total
    current.count += 1
    totals.set(paymentName, current)
  }
  return ['GCash', 'Card', 'Cash on delivery', 'Unspecified'].map((name) => ({
    name,
    amount: totals.get(name)?.amount ?? 0,
    count: totals.get(name)?.count ?? 0
  }))
})

const OrdersTable = defineComponent({
  props: {
    orders: { type: Array as () => SellerOrderRecord[], required: true },
    riders: { type: Array as () => RiderAccount[], required: true }
  },
  emits: ['status-change', 'rider-change'],
  setup(tableProps, { emit: emitTable }) {
    const riderDrafts = reactive<Record<string, string>>({})
    return () => h('div', { class: 'table-wrap orders-table-wrap' }, [
      h('table', { class: 'orders-table' }, [
        h('thead', [h('tr', ['Order', 'Buyer', 'Items', 'Total', 'Payment', 'Rider', 'Status'].map((label) => h('th', label)))]),
        h('tbody', tableProps.orders.map((order) => h('tr', { key: order.id }, [
          h('td', { class: 'order-number' }, [h('b', order.id), h('small', formatDate(order.date))]),
          h('td', { class: 'order-buyer' }, order.buyer),
          h('td', { class: 'order-items' }, [
            h('div', { class: 'order-item-thumbnails' }, order.items.map((item, index) => h('img', {
              key: `${order.id}-${index}`,
              src: item.img || fallbackImage,
              alt: item.name,
              title: item.name,
              style: { backgroundColor: ['#f8e4d7', '#dcebe6', '#f7dfe2', '#f8e9ce'][index % 4] }
            })))
          ]),
          h('td', { class: 'order-total' }, formatPeso(order.total)),
          h('td', { class: 'order-payment' }, [
            h('span', order.payment === 'Unspecified' ? 'Not recorded' : order.payment),
            h('small', {
              class: order.payment.startsWith('Card') ? 'payment-paid' : 'payment-pending'
            }, order.payment === 'GCash' ? order.paymentProof ? 'Awaiting verification' : 'Proof missing' : order.payment.startsWith('Card') ? 'Paid' : order.payment === 'Cash on delivery' ? 'On delivery' : 'Pending'),
            ...(order.paymentProof ? [h('a', {
              href: order.paymentProof,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, 'Review proof')] : [])
          ]),
          h('td', { class: 'order-rider' }, [
            h('div', { class: 'rider-assignment' }, [
              h('select', {
                value: riderDrafts[order.id] ?? (
                  order.riderEmail
                    ? tableProps.riders.find(rider => rider.email.toLowerCase() === order.riderEmail?.toLowerCase())?.id ?? ''
                    : tableProps.riders.find(rider => rider.name.trim().toLowerCase() === order.rider?.trim().toLowerCase())?.id ?? ''
                ),
                'aria-label': `Rider for ${order.id}`,
                onChange: (event: Event) => { riderDrafts[order.id] = (event.target as HTMLSelectElement).value }
              }, [
                h('option', { value: '' }, tableProps.riders.length ? 'Select rider' : 'No riders registered'),
                ...tableProps.riders.map(rider => h('option', { key: rider.id, value: rider.id }, `${rider.name} · ${rider.email}`))
              ]),
              h('button', {
                type: 'button',
                disabled: !(riderDrafts[order.id] ?? '').trim(),
                onClick: () => {
                  const rider = tableProps.riders.find(item => item.id === riderDrafts[order.id])
                  if (rider) {
                    emitTable('rider-change', order.id, rider)
                    delete riderDrafts[order.id]
                  }
                }
              }, order.riderEmail ? 'Update' : 'Assign')
            ])
          ]),
          h('td', { class: 'order-status' }, [h('select', {
            value: order.status,
            'aria-label': `Status for ${order.id}`,
            onChange: (event: Event) => emitTable('status-change', order.id, (event.target as HTMLSelectElement).value)
          }, ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => h('option', { value: status }, status)))])
        ])))
      ])
    ])
  }
})

onMounted(async () => {
  await Promise.all([loadInventory(), loadActivity()])
  await showReorderAlert()
  await loadReorderRequests()
  await loadReviews()
})

async function showReorderAlert() {
  if (!lowStock.value.length) return
  reorderPopupOpen.value = true
}

function dismissReorderPopup() {
  reorderPopupOpen.value = false
}

function viewReorderAlerts() {
  reorderPopupOpen.value = false
  tab.value = 'alerts'
}

async function loadInventory() {
  try {
    let rows = await listMyProducts(props.user.id)
    if (!rows.length) {
      await seedMyInventory()
      rows = await listMyProducts(props.user.id)
    }
    inventory.value = rows
    inventoryError.value = ''
  } catch (error) {
    console.error('Unable to load seller inventory.', error)
    inventory.value = []
    inventoryError.value = 'Seller inventory could not be loaded from Supabase.'
  }
}

async function loadActivity() {
  try {
    automationLog.value = await listMyActivity(props.user.id)
  } catch (error) {
    console.error('Unable to load seller activity.', error)
    automationLog.value = []
  }
}

async function loadReorderRequests() {
  try {
    reorderRequests.value = await listMyReorderRequests(inventory.value.map((product) => product.id))
  } catch (error) {
    console.error('Unable to load reorder requests.', error)
    reorderRequestError.value = error instanceof Error ? error.message : 'Reorder requests could not be loaded.'
  }
}

async function loadReviews() {
  try {
    productReviews.value = await listSellerProductReviews(inventory.value.map((product) => product.id))
  } catch (error) {
    console.error('Unable to load seller product reviews.', error)
    reviewsError.value = 'Customer reviews could not be loaded. Please try again later.'
  }
}

function reviewProduct(productId: string | null) {
  return productId ? inventory.value.find((product) => product.id === productId) : undefined
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

async function saveProfile() {
  profileError.value = ''
  if (!profileDraft.name.trim()) {
    profileError.value = 'Enter your seller name.'
    return
  }

  try {
    const profile = await updateMyProfile({
      full_name: profileDraft.name,
      phone: profileDraft.phone,
      address: profileDraft.address,
      avatar: profileDraft.avatar
    })
    const updated = profileToUser(profile)
    emit('profile-update', updated)
  } catch (error) {
    console.error('Unable to save seller profile.', error)
    profileError.value = error instanceof Error ? error.message : 'Unable to save your profile.'
  }
}

function updateOrderStatus(id: string, status: string) {
  emit('status-change', id, status)
  void addActivity('Order status updated', `${id} is now ${status.toLowerCase()}.`)
}
function updateOrderRider(id: string, rider: RiderAccount) {
  emit('rider-change', id, rider)
  void addActivity('Delivery rider assigned', `${rider.name} was assigned to ${id}.`)
}

const hasPendingReorderRequest = (productId: string) =>
  activeReorderRequests.value.some((request) => request.productId === productId)

async function requestRestock(product: InventoryProduct) {
  reorderRequestError.value = ''
  reorderRequestNotice.value = ''
  if (hasPendingReorderRequest(product.id)) {
    reorderRequestNotice.value = `A restock request for ${product.name} is already pending.`
    return
  }

  restockRequestsInProgress.value.push(product.id)
  try {
    const request = await createReorderRequest(product)
    reorderRequests.value = [request, ...reorderRequests.value]
    await addActivity('Restock requested', `${product.name}: stock ${product.stock}, reorder point ${product.reorderPoint}.`)
  } catch (error) {
    console.error('Unable to save reorder request.', error)
    reorderRequestError.value = error instanceof Error ? error.message : 'Unable to save the reorder request.'
  } finally {
    restockRequestsInProgress.value = restockRequestsInProgress.value.filter((id) => id !== product.id)
  }
}

async function saveInventory(product: InventoryProduct) {
  inventoryError.value = ''
  try {
    await updateSellerProduct(product.id, {
      price: product.price,
      stock: product.stock,
      reorderPoint: product.reorderPoint,
      autoReorder: product.autoReorder
    })
  } catch (error) {
    console.error('Unable to save inventory changes.', error)
    inventoryError.value = error instanceof Error ? error.message : 'Unable to save inventory changes.'
    return
  }

  try {
    inventory.value = await listMyProducts(props.user.id)
  } catch (error) {
    console.error('Unable to refresh inventory after saving changes.', error)
    inventoryError.value = 'Inventory was saved, but could not be refreshed. Reload the page to see the latest stock.'
  }
}

async function toggleAutoReorder(product: InventoryProduct, event: Event) {
  const input = event.target as HTMLInputElement
  const previous = product.autoReorder
  const next = input.checked
  product.autoReorder = next
  input.disabled = true
  inventoryError.value = ''

  try {
    await updateSellerProduct(product.id, { autoReorder: next })
  } catch (error) {
    product.autoReorder = previous
    input.checked = previous
    console.error('Unable to save auto-reorder setting.', error)
    inventoryError.value = error instanceof Error ? error.message : 'Unable to save auto-reorder setting.'
    return
  } finally {
    input.disabled = false
  }

  try {
    const refreshedInventory = await listMyProducts(props.user.id)
    inventory.value = refreshedInventory
    const savedProduct = refreshedInventory.find((item) => item.id === product.id)
    if (!savedProduct || savedProduct.autoReorder !== next) {
      inventoryError.value = 'Supabase did not confirm the Auto-reorder setting. Please try again.'
      return
    }
    if (next && product.stock <= product.reorderPoint && savedProduct.stock <= savedProduct.reorderPoint) {
      inventoryError.value = 'Auto-reorder was enabled, but Supabase did not replenish this low-stock product. Apply the auto-reorder trigger migration and try again.'
    }
  } catch (error) {
    console.error('Unable to refresh inventory after changing auto-reorder.', error)
    inventoryError.value = 'Auto-reorder was saved, but inventory could not be refreshed. Reload the page to see the latest stock.'
  }
}

async function addProduct() {
  formError.value = ''
  if (!form.name || form.price <= 0 || form.stock < 0 || form.reorderPoint < 0) {
    formError.value = 'Enter a name, a price above zero, and valid stock values.'
    return
  }

  try {
    const created = await createSellerProduct(props.user.id, {
      name: form.name,
      category: form.category || categories[0],
      type: form.type,
      price: form.price,
      stock: form.stock,
      reorderPoint: form.reorderPoint,
      color: form.color,
      image: photo.value || fallbackImage
    })
    inventory.value.unshift(created)
    await addActivity('Product added', `${form.name} was added to inventory.`)
    Object.assign(form, { name: '', price: 0, stock: 0, reorderPoint: 3, color: '' })
    photo.value = ''
    const fileInput = document.querySelector<HTMLInputElement>('.photo-field input')
    if (fileInput) fileInput.value = ''
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to add this product.'
  }
}

async function deleteProduct(id: string) {
  const product = inventory.value.find((item) => item.id === id)
  if (!product) return
  const alert = await alertController.create({
    header: 'Delete product?',
    message: `Are you sure you want to delete ${product.name} from your inventory?`,
    backdropDismiss: false,
    buttons: [
      { text: 'No', role: 'cancel' },
      { text: 'Yes', role: 'confirm' }
    ]
  })
  await alert.present()
  const result = await alert.onDidDismiss()
  if (result.role !== 'confirm') return

  try {
    await deleteSellerProduct(id)
    inventory.value = inventory.value.filter((item) => item.id !== id)
    await addActivity('Product removed', `${product.name} was removed from inventory.`)
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Unable to delete this product.'
  }
}

async function addActivity(title: string, detail: string) {
  try {
    const entry = await addActivityRecord(props.user.id, title, detail)
    automationLog.value = [entry, ...automationLog.value].slice(0, 30)
  } catch (error) {
    console.error('Unable to record seller activity.', error)
  }
}

function readPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    formError.value = 'Choose a valid image file.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'Product images must be smaller than 2 MB.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') photo.value = reader.result
    else formError.value = 'Unable to read the selected image.'
  }
  reader.onerror = () => { formError.value = 'Unable to read the selected image.' }
  reader.readAsDataURL(file)
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
.seller-page { min-height: 100vh; padding: 0; background: #fbf9f6; color: var(--ink); }
.seller-header { position: sticky; top: 0; z-index: 20; height: 78px; box-sizing: border-box; padding: 10px 24px 10px 0; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid #f0e6e0; background: rgba(251,249,246,.96); backdrop-filter: blur(10px); }
.seller-brand { display: flex; align-items: center; gap: 12px; }
.seller-brand img { width: 48px; height: 48px; object-fit: cover; border-radius: 50%; background: #f7f0eb; }
.seller-brand span { display: grid; gap: 4px; }
.seller-brand b { color: #442f2b; font: 700 19px var(--font-head); }
.seller-brand small { color: #8e756d; font-size: 9px; font-weight: 700; letter-spacing: .28em; }
.header-actions { display: flex; align-items: center; gap: 7px; }
.header-actions button { min-width: 38px; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 0; background: transparent; color: #403632; cursor: pointer; }
.header-actions .ask-button { gap: 7px; padding: 0 15px; border-radius: 999px; background: var(--coral-soft); color: var(--coral-dark); white-space: nowrap; font: 700 12px var(--font-body); }
.header-actions .header-icon { position: relative; width: 38px; border-radius: 50%; font-size: 21px; }
.header-actions .header-icon:hover { background: var(--coral-soft); color: var(--coral-dark); }
.seller-account { position: relative; }
.header-actions .account-button { width: 38px; overflow: hidden; border-radius: 50%; background: #f9e2df; color: var(--coral-dark); font-size: 15px; font-weight: 800; }
.account-button img { width: 100%; height: 100%; object-fit: cover; }
.account-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 30; width: 220px; padding: 10px; border: 1px solid #f0e6e0; border-radius: 16px; background: #fff; box-shadow: 0 16px 38px #39231f24; }
.header-actions .account-menu button { width: 100%; min-height: 36px; justify-content: flex-start; padding: 0 10px; border-radius: 9px; color: #584942; font: 600 11px var(--font-body); }
.header-actions .account-menu button:hover { background: #fbf3f0; }
.account-info { display: grid; gap: 4px; padding: 8px 10px 11px; border-bottom: 1px solid #f1e9e4; }
.account-info b { overflow: hidden; color: var(--ink); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.account-info small { overflow: hidden; color: var(--muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.account-info span { color: var(--coral-dark); font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.primary-button { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border: 0; border-radius: 12px; background: var(--coral); color: #fff; cursor: pointer; font: 700 12px var(--font-body); box-shadow: 0 8px 18px #c45f5f29; transition: transform .18s, box-shadow .18s; }
.primary-button:hover { transform: translateY(-1px); box-shadow: 0 8px 18px #c45f5f29; }
.seller-layout { width: 100%; min-height: calc(100vh - 78px); box-sizing: border-box; margin: 0; padding: 0 24px 0 0; display: grid; grid-template-columns: 220px minmax(0, 1fr); align-items: start; gap: 24px; }
.seller-sidebar, .panel { border: 1px solid #f0e6e0; border-radius: 22px; background: #fff; }
.seller-sidebar { position: sticky; top: 78px; height: calc(100vh - 78px); box-sizing: border-box; overflow-y: auto; display: flex; flex-direction: column; align-self: start; padding: 16px; border-radius: 0; }
.side-label, .eyebrow { color: #a17870; font-size: 9px; font-weight: 800; letter-spacing: .16em; }
.side-label { display: block; padding: 5px 10px 12px; }
.seller-sidebar > button { width: 100%; min-height: 44px; margin: 2px 0; padding: 0 11px; display: flex; align-items: center; gap: 11px; border: 0; border-radius: 12px; background: transparent; color: #705f58; cursor: pointer; text-align: left; font: 600 12px var(--font-body); }
.seller-sidebar > button ion-icon { color: #9e8880; font-size: 18px; }
.seller-sidebar > button span { flex: 1; }
.seller-sidebar > button small { min-width: 20px; padding: 3px 6px; border-radius: 15px; background: var(--coral); color: #fff; text-align: center; font-weight: 700; }
.seller-sidebar > button:hover, .seller-sidebar > button.active { background: #f9e2df; color: var(--coral-dark); }
.seller-sidebar > button:disabled { opacity: 1; cursor: default; }
.seller-sidebar > button:disabled:not(.active) { color: #705f58; }
.seller-sidebar > button.active ion-icon { color: var(--coral-dark); }
.seller-content { min-width: 0; display: grid; align-content: start; gap: 18px; }
.page-title { min-height: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; border: 1px solid #f0d8d4; border-radius: 18px; background: linear-gradient(120deg, #fff1ed, #f8e3df 58%, #f6e8e2); }
.page-title h1 { margin: 6px 0 5px; color: #3e2e2a; font: 700 28px var(--font-head); }
.page-title p { margin: 0; max-width: 640px; color: var(--muted); font-size: 12px; line-height: 1.6; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.metrics article, .payment-stats article { min-width: 0; padding: 17px; display: grid; align-content: center; gap: 6px; border: 1px solid #f0e6e0; border-radius: 18px; background: #fff; }
.metrics article { min-height: 105px; }
.metrics article span, .payment-stats article span { color: var(--muted); font-size: 11px; font-weight: 600; }
.metrics article b, .payment-stats article b { color: #422d29; font: 700 25px var(--font-head); }
.metrics article small, .payment-stats article small { color: #a28f87; font-size: 10px; }
.metrics article.warning-metric b { color: #d26451; }
.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.panel { min-width: 0; padding: 20px; }
.seller-profile-panel { display: grid; grid-template-columns: 180px minmax(0, 1fr); align-items: start; gap: 28px; }
.seller-profile-photo { display: grid; justify-items: center; gap: 10px; padding: 10px 0; }
.seller-profile-avatar { width: 116px; height: 116px; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: #f9e2df; color: var(--coral-dark); font: 700 42px var(--font-head); }
.seller-profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-photo-input { display: none; }
.remove-photo { border: 0; background: none; color: #a64b45; cursor: pointer; font: 600 11px var(--font-body); }
.seller-profile-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.seller-profile-form label { display: grid; gap: 7px; color: #705f58; font: 600 11px var(--font-body); }
.seller-profile-form input { min-width: 0; padding: 12px 13px; border: 1px solid #eadfd8; border-radius: 11px; outline: none; background: #fbf9f6; color: var(--ink); font: 13px var(--font-body); }
.seller-profile-form input:focus { border-color: var(--coral); }
.seller-profile-form input[readonly] { color: #93817b; }
.seller-profile-form .form-error { grid-column: 1 / -1; margin: 0; color: #b5473e; font-size: 11px; }
.seller-profile-form .submit-button { grid-column: 1 / -1; justify-self: start; }
.panel-title { min-height: 34px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.panel-title h2 { margin: 5px 0 0; color: #402f2b; font: 700 19px var(--font-head); }
.panel-title h2 small { color: #99857e; font: 600 12px var(--font-body); }
.text-button { border: 0; background: none; color: var(--coral-dark); cursor: pointer; font: 700 11px var(--font-body); }
.empty-note { padding: 14px 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
.seller-reviews { display: grid; gap: 12px; }
.review-summary { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border: 1px solid #f1e2d9; border-radius: 14px; background: #fff8f4; color: var(--muted); font-size: 11px; }
.review-summary-score { color: #493832; font: 700 23px var(--font-head); }
.seller-review-stars, .seller-review-rating { color: #e8a34f; letter-spacing: 1px; }
.seller-review-card { display: flex; gap: 14px; padding: 14px; border: 1px solid #f0e6e0; border-radius: 16px; background: #fff; }
.seller-review-card > img { width: 68px; height: 68px; flex: 0 0 auto; border-radius: 12px; background: #f7eeea; object-fit: contain; object-position: center; }
.seller-review-copy { min-width: 0; flex: 1; }
.seller-review-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.seller-review-top > div { min-width: 0; display: grid; gap: 4px; }
.seller-review-top b { color: #493832; font-size: 12px; }
.seller-review-top small { color: var(--muted); font-size: 10px; }
.seller-review-rating { flex: 0 0 auto; font-size: 13px; white-space: nowrap; }
.seller-review-rating span { color: #d9cec7; }
.seller-review-copy p { margin: 8px 0; color: #675a54; font-size: 11px; line-height: 1.6; white-space: pre-wrap; }
.seller-review-details, .seller-review-media { display: flex; flex-wrap: wrap; gap: 8px 12px; color: var(--muted); font-size: 10px; }
.seller-review-media { margin-top: 7px; }
.seller-review-media a { color: var(--coral-dark); font-weight: 700; }
.seller-review-photo { display: block; width: 64px; height: 64px; overflow: hidden; padding: 3px; border: 1px solid #f0e6e0; border-radius: 9px; background: #fff; cursor: zoom-in; }
.seller-review-photo img { display: block; width: 100%; height: 100%; border-radius: 6px; object-fit: contain; }
.seller-review-photo-overlay { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 24px; background: rgba(31, 24, 23, .78); }
.seller-review-photo-viewer { position: relative; box-sizing: border-box; width: min(86vw, 560px); height: min(78vh, 560px); overflow: hidden; border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(0, 0, 0, .35); }
.seller-review-photo-viewer > img { position: absolute; inset: 16px; display: block; width: calc(100% - 32px); height: calc(100% - 32px); object-fit: contain; }
.seller-review-photo-close { position: absolute; top: 8px; right: 8px; z-index: 1; width: 34px; height: 34px; border: 0; border-radius: 50%; background: #fff2ee; color: var(--ink); cursor: pointer; font-size: 24px; line-height: 1; }
.seller-logout-backdrop { position: fixed; inset: 0; z-index: 1101; display: grid; place-items: center; padding: 20px; background: rgba(48, 36, 34, .52); backdrop-filter: blur(5px); }
.seller-logout-dialog { position: relative; box-sizing: border-box; width: min(100%, 430px); padding: 28px; overflow: hidden; border: 1px solid #fff; border-radius: 26px; background: linear-gradient(160deg, #fffaf7 0%, #fff 62%); box-shadow: 0 24px 70px rgba(52, 33, 29, .28); animation: reorder-popup-in .24s ease-out; }
.seller-logout-dialog::before { position: absolute; inset: 0 0 auto; height: 6px; background: linear-gradient(90deg, #e9947e, #d86464, #e8ad74); content: ''; }
.seller-logout-sign { width: 58px; height: 58px; margin-bottom: 15px; display: grid; place-items: center; border: 1px solid #f4d0c6; border-radius: 19px; background: linear-gradient(145deg, #fff0eb, #ffe2d8); color: #c85f56; box-shadow: 0 8px 18px rgba(200, 95, 86, .13); }
.seller-logout-sign ion-icon { font-size: 29px; }
.seller-logout-eyebrow { color: #b2786b; font-size: 9px; font-weight: 800; letter-spacing: .16em; }
.seller-logout-dialog h2 { margin: 6px 0 7px; color: #493832; font: 700 25px/1.2 var(--font-head); }
.seller-logout-dialog p { margin: 0; color: #85736d; font-size: 12px; line-height: 1.6; }
.seller-logout-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
.seller-logout-actions button { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 17px; border-radius: 999px; cursor: pointer; font: 700 11px var(--font-body); }
.seller-logout-cancel { border: 1px solid #eadbd4; background: #fff; color: #806d65; }
.seller-logout-confirm { border: 1px solid #cf625b; background: linear-gradient(135deg, #df7970, #c95c59); color: #fff; box-shadow: 0 7px 15px rgba(201, 92, 89, .22); }
.sales-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 4px 0 14px; padding: 11px 12px; border: 1px solid #f1e4dd; border-radius: 13px; background: linear-gradient(110deg, #fff8f5, #fff); }
.sales-summary div { display: grid; gap: 4px; }
.sales-summary small { color: var(--muted); font-size: 9px; }
.sales-summary b { color: #493832; font-size: 15px; }
.sales-caption { display: flex; align-items: center; gap: 6px; color: #927d75; font-size: 10px; font-weight: 700; }
.sales-caption ion-icon { font-size: 14px; color: var(--coral-dark); }
.dress-sales-analysis { display: grid; gap: 13px; }
.dress-sales-group { display: grid; gap: 7px; }
.dress-sales-row { min-width: 0; display: flex; align-items: center; gap: 9px; padding: 7px 8px; border: 1px solid #e8f0e7; border-radius: 12px; background: #f8fcf8; }
.dress-sales-row.unsold { border-color: #f1e7df; background: #fffaf7; }
.dress-sales-row img { width: 38px; height: 42px; flex: 0 0 auto; border-radius: 8px; background: #f8f0ec; object-fit: contain; }
.dress-sales-row > span { min-width: 0; flex: 1; display: grid; gap: 3px; }
.dress-sales-row b { overflow: hidden; color: #57443d; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.dress-sales-row small { color: var(--muted); font-size: 9px; }
.dress-sales-row strong { flex: 0 0 auto; color: #39744c; font-size: 9px; }
.dress-sales-row.unsold strong { color: #a56c4e; }
.dress-sales-empty { margin: 0; color: var(--muted); font-size: 10px; }
.sales-row > div:first-child { margin-bottom: 7px; display: flex; justify-content: space-between; gap: 12px; font-size: 11px; }
.sales-row b { color: #634c44; }
.bar { height: 8px; overflow: hidden; border-radius: 10px; background: #f8e2df; }
.bar span { height: 100%; display: block; border-radius: inherit; background: var(--coral); }
.restock-preview { display: flex; align-items: center; gap: 11px; margin: 8px 0; padding: 10px; border: 1px solid #f3d9d5; border-radius: 14px; background: #fff9f8; }
.restock-preview img { width: 42px; height: 42px; object-fit: contain; border-radius: 11px; background: #f9e5e1; }
.restock-preview div { min-width: 0; flex: 1; display: grid; gap: 5px; }
.restock-preview b { overflow: hidden; color: var(--ink); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.restock-preview span { color: var(--muted); font-size: 10px; }
.restock-preview > ion-icon { color: #d4775f; font-size: 18px; }
.recent-orders { padding-bottom: 14px; }
.product-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.product-form label, .alert-row label { display: grid; gap: 6px; color: var(--muted); font-size: 10px; font-weight: 700; }
.product-form input, .product-form select, .alert-row input, .number-input, .table-input, .orders-table select, .search-field { width: 100%; min-width: 0; height: 38px; padding: 0 10px; border: 1px solid #eadfd9; border-radius: 10px; outline: none; background: #fff; color: var(--ink); font: 500 11px var(--font-body); }
.product-form input:focus, .product-form select:focus, .alert-row input:focus, .number-input:focus, .orders-table select:focus { border-color: var(--coral); box-shadow: 0 0 0 3px #db6b6b18; }
.product-form .photo-field input { padding: 8px 4px; font-size: 10px; }
.form-error { grid-column: 1 / -1; margin: 0; color: #b5473e; font-size: 11px; }
.submit-button { grid-column: 1 / -1; justify-self: start; }
.inventory-panel { padding-bottom: 10px; }
.search-field { width: 210px; height: 36px; display: flex; align-items: center; gap: 7px; }
.search-field ion-icon { color: #99857e; }
.search-field input { width: 100%; border: 0; outline: 0; font: 500 11px var(--font-body); }
.table-wrap { width: 100%; overflow-x: auto; }
.inventory-table, .orders-table { width: 100%; border-collapse: collapse; text-align: left; }
.inventory-table th, .orders-table th { padding: 10px 8px; border-bottom: 1px solid #eee5df; color: #927d75; font-size: 9px; font-weight: 700; white-space: nowrap; }
.inventory-table td, .orders-table td { padding: 10px 8px; border-bottom: 1px solid #f2ebe6; color: #5a4943; font-size: 10px; }
.inventory-table tr:last-child td, .orders-table tr:last-child td { border-bottom: 0; }
.inventory-product { min-width: 170px; display: flex; align-items: center; gap: 9px; }
.inventory-product img { width: 40px; height: 42px; object-fit: contain; border-radius: 9px; background: #f8f0ec; }
.inventory-product div { display: grid; gap: 4px; }
.orders-table td:first-child { display: grid; gap: 4px; }
.inventory-product b, .orders-table td:first-child b { max-width: 175px; overflow: hidden; color: #493832; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.inventory-product small, .orders-table td:first-child small { color: #99877f; font-size: 9px; }
.table-input { width: 75px; height: 31px; padding: 0 7px; display: flex; align-items: center; gap: 3px; }
.table-input span { color: #a08a81; }
.table-input input { width: 100%; border: 0; outline: 0; color: var(--ink); font: 500 10px var(--font-body); }
.number-input { width: 62px; height: 31px; padding: 0 7px; }
.switch { width: 36px; height: 20px; display: block; position: relative; }
.switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.switch span { position: absolute; inset: 0; border-radius: 20px; background: #ded4cf; cursor: pointer; transition: background .2s; }
.switch span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: white; transition: transform .2s; }
.switch input:checked + span { background: var(--coral); }
.switch input:checked + span::after { transform: translateX(16px); }
.icon-button { width: 30px; height: 30px; display: grid; place-items: center; border: 0; border-radius: 9px; background: #fff; cursor: pointer; }
.icon-button.danger { color: #b57970; }
.icon-button:hover { background: #f9e7e4; }
.empty-cell { padding: 26px !important; color: var(--muted) !important; text-align: center; }
.order-processing-panel { padding: 24px 25px 20px; border-radius: 25px; }
.order-processing-heading { padding: 16px 20px; border: 1px solid #f0d8d4; border-radius: 18px; background: linear-gradient(120deg, #fff1ed, #f8e3df 58%, #f6e8e2); }
.order-processing-heading h2 { margin: 0 0 6px; color: #402f2b; font: 700 23px Georgia, serif; }
.order-processing-heading p { max-width: 900px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
:deep(.orders-table-wrap) { overflow-x: hidden; }
:deep(.orders-table) { width: 100%; min-width: 0; border-collapse: collapse; text-align: left; table-layout: fixed; }
:deep(.orders-table th) { padding: 10px 8px; border-bottom: 1px solid #eee5df; color: #927d75; font-size: 12px; font-weight: 500; }
:deep(.orders-table td) { height: 80px; padding: 11px 8px; border-bottom: 1px solid #f2ebe6; color: #493832; font-size: 13px; vertical-align: middle; }
:deep(.orders-table th:nth-child(1)), :deep(.orders-table td:nth-child(1)) { width: 14%; }
:deep(.orders-table th:nth-child(2)), :deep(.orders-table td:nth-child(2)) { width: 13%; }
:deep(.orders-table th:nth-child(3)), :deep(.orders-table td:nth-child(3)) { width: 12%; }
:deep(.orders-table th:nth-child(4)), :deep(.orders-table td:nth-child(4)) { width: 9%; }
:deep(.orders-table th:nth-child(5)), :deep(.orders-table td:nth-child(5)) { width: 14%; }
:deep(.orders-table th:nth-child(6)), :deep(.orders-table td:nth-child(6)) { width: 21%; }
:deep(.orders-table th:nth-child(7)), :deep(.orders-table td:nth-child(7)) { width: 17%; }
:deep(.orders-table .order-number) { display: table-cell; }
:deep(.orders-table .order-number b), :deep(.orders-table .order-number small) { display: block; }
:deep(.orders-table .order-number b) { margin-bottom: 5px; color: #493832; font-size: 12px; overflow-wrap: anywhere; }
:deep(.orders-table .order-number small) { color: #99877f; font-size: 10px; }
:deep(.orders-table .order-buyer), :deep(.orders-table .order-total) { font-size: 12px; overflow-wrap: anywhere; }
:deep(.orders-table td.order-items) { display: table-cell; }
:deep(.order-item-thumbnails) { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
:deep(.order-item-thumbnails img) { width: 40px; height: 40px; max-width: 100%; flex: 0 0 40px; padding: 4px; object-fit: contain; border-radius: 11px; }
:deep(.orders-table .order-payment) { min-width: 0; }
:deep(.order-payment > span), :deep(.order-payment > small) { display: block; }
:deep(.order-payment > small) { width: fit-content; max-width: 100%; margin-top: 5px; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
:deep(.order-payment .payment-paid) { background: #e3f1e7; color: #39744c; }
:deep(.order-payment .payment-pending) { background: #f5eee7; color: #826b56; }
:deep(.rider-assignment) { display: grid; gap: 5px; }
:deep(.rider-assignment select) { width: 100%; min-width: 0; height: 34px; padding: 0 7px; border: 1px solid #eadfd9; border-radius: 9px; color: var(--ink); font: 500 10px var(--font-body); }
:deep(.rider-assignment button) { width: fit-content; min-height: 27px; padding: 0 10px; border: 0; border-radius: 8px; background: #f9e2df; color: var(--coral-dark); cursor: pointer; font: 700 10px var(--font-body); }
:deep(.rider-assignment button:disabled) { opacity: .5; cursor: not-allowed; }
:deep(.orders-table .order-status) { min-width: 0; }
:deep(.orders-table select) { width: 100%; max-width: 145px; height: 42px; padding: 0 8px; border-radius: 12px; font-size: 12px; }
.large-empty { min-height: 180px; display: grid; place-content: center; justify-items: center; text-align: center; }
.empty-symbol { width: 48px; height: 48px; margin-bottom: 8px; display: grid; place-items: center; border-radius: 15px; background: #fbefed; color: var(--coral-dark); font-size: 23px; }
.large-empty > b { color: #57443d; font-size: 13px; }
.large-empty p { margin: 5px 0 0; color: var(--muted); font-size: 11px; }
.alert-panel { padding: 22px; }
.alert-row { display: grid; grid-template-columns: 48px minmax(140px, 1fr) auto; align-items: center; gap: 12px; margin: 8px 0; padding: 12px; border: 1px solid #f2d5d1; border-radius: 15px; background: #fff9f8; }
.alert-row > img { width: 46px; height: 46px; object-fit: contain; border-radius: 11px; background: #f8e3df; }
.alert-copy { min-width: 0; display: grid; gap: 6px; }
.alert-copy b { overflow: hidden; color: #493832; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.alert-copy span { color: var(--muted); font-size: 10px; }
.alert-row input { height: 34px; }
.alert-row .primary-button { min-height: 36px; padding: 0 12px; font-size: 10px; white-space: nowrap; }
.alert-row .primary-button:disabled { cursor: not-allowed; opacity: .58; }
.reorder-history { display: grid; gap: 10px; }
.reorder-history-row { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 1px solid #f0e6e0; border-radius: 13px; background: #fff; }
.reorder-history-row img { width: 40px; height: 40px; flex: 0 0 auto; border-radius: 9px; background: #f8f0ec; object-fit: contain; }
.reorder-history-row > div { min-width: 0; flex: 1; display: grid; gap: 4px; }
.reorder-history-row b { overflow: hidden; color: #57443d; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.reorder-history-row small { color: var(--muted); font-size: 9px; }
.request-status { padding: 5px 8px; border-radius: 999px; background: #fff0e2; color: #9c642e; font-size: 9px; font-weight: 800; text-transform: capitalize; }
.request-status.status-approved, .request-status.status-completed, .request-status.status-fulfilled { background: #e6f4e8; color: #39744c; }
.tip { margin: 14px 0 0; color: var(--muted); font-size: 11px; line-height: 1.6; }
.reorder-popup-backdrop { position: fixed; inset: 0; z-index: 1100; display: grid; place-items: center; padding: 20px; background: rgba(48, 36, 34, .52); backdrop-filter: blur(5px); }
.reorder-popup { position: relative; box-sizing: border-box; width: min(100%, 430px); padding: 28px; overflow: hidden; border: 1px solid #fff; border-radius: 26px; background: linear-gradient(160deg, #fffaf7 0%, #fff 62%); box-shadow: 0 24px 70px rgba(52, 33, 29, .28); animation: reorder-popup-in .24s ease-out; }
.reorder-popup::before { position: absolute; inset: 0 0 auto; height: 6px; background: linear-gradient(90deg, #e9947e, #d86464, #e8ad74); content: ''; }
.reorder-popup-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: 0; border-radius: 50%; background: #fff0eb; color: #72564e; cursor: pointer; font-size: 22px; line-height: 1; }
.reorder-popup-sign { width: 58px; height: 58px; margin-bottom: 15px; display: grid; place-items: center; border: 1px solid #f4d0c6; border-radius: 19px; background: linear-gradient(145deg, #fff0eb, #ffe2d8); color: #c85f56; box-shadow: 0 8px 18px rgba(200, 95, 86, .13); }
.reorder-popup-sign ion-icon { font-size: 30px; }
.reorder-popup-eyebrow { color: #b2786b; font-size: 9px; font-weight: 800; letter-spacing: .16em; }
.reorder-popup h2 { margin: 6px 0 7px; color: #493832; font: 700 25px/1.2 var(--font-head); }
.reorder-popup-intro { margin: 0; color: #85736d; font-size: 12px; line-height: 1.6; }
.reorder-popup-items { display: grid; gap: 8px; margin: 18px 0; }
.reorder-popup-item { min-width: 0; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid #f2e7e1; border-radius: 13px; background: rgba(255,255,255,.9); }
.reorder-popup-item img { width: 42px; height: 42px; flex: 0 0 auto; border-radius: 10px; background: #f8f0ec; object-fit: contain; }
.reorder-popup-product { min-width: 0; flex: 1; display: grid; gap: 4px; }
.reorder-popup-product b { overflow: hidden; color: #57443d; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.reorder-popup-product small { color: #99877f; font-size: 9px; }
.reorder-popup-stock { flex: 0 0 auto; padding: 5px 8px; border-radius: 999px; background: #fff0eb; color: #b94e48; font-size: 9px; font-weight: 800; }
.reorder-popup-more { color: #907b73; font-size: 10px; text-align: center; }
.reorder-popup-actions { display: flex; justify-content: flex-end; gap: 9px; }
.reorder-popup-actions button { min-height: 39px; padding: 0 17px; border-radius: 999px; cursor: pointer; font: 700 11px var(--font-body); }
.reorder-later { border: 1px solid #eadbd4; background: #fff; color: #806d65; }
.reorder-view { border: 1px solid #cf625b; background: linear-gradient(135deg, #df7970, #c95c59); color: #fff; box-shadow: 0 7px 15px rgba(201, 92, 89, .22); }
@keyframes reorder-popup-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.payment-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.payment-stats article { gap: 8px; }
.payment-stats article b { font-size: 24px; }
.automation-panel { min-height: 150px; }
.activity-list { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.activity-list li { display: flex; align-items: center; gap: 11px; padding: 11px 0; border-top: 1px solid #f2ebe6; }
.activity-icon { width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 11px; background: #fbefed; color: var(--coral-dark); }
.activity-list li div { flex: 1; display: grid; gap: 4px; }
.activity-list li b { color: #59473f; font-size: 11px; }
.activity-list li small, .activity-list time { color: #98857d; font-size: 9px; }
.demo-note { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid #f2ebe6; color: #9b8982; font-size: 10px; line-height: 1.5; }
@media (max-width: 900px) {
  .seller-layout { grid-template-columns: 190px minmax(0, 1fr); gap: 14px; }
  .seller-header { padding-right: 16px; }
  .metrics, .payment-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .overview-grid { grid-template-columns: 1fr; }
  .inventory-table { min-width: 720px; }
  :deep(.orders-table) { min-width: 0; }
}
@media (max-width: 620px) {
  .alert-row { grid-template-columns: 42px minmax(0, 1fr); gap: 9px; }
  .alert-row .primary-button { grid-column: 2; justify-self: start; }
  .reorder-history-row { align-items: flex-start; }
  .reorder-popup { padding: 24px 19px 19px; border-radius: 22px; }
  .reorder-popup h2 { font-size: 22px; }
  .reorder-popup-actions button { flex: 1; }
  .seller-logout-dialog { padding: 24px 19px 19px; border-radius: 22px; }
  .seller-logout-dialog h2 { font-size: 22px; }
  .seller-logout-actions button { flex: 1; }
  .seller-header { height: 70px; padding: 8px 12px 8px 0; gap: 8px; }
  .seller-brand img { width: 42px; height: 42px; }
  .seller-brand b { font-size: 16px; }
  .seller-brand small { font-size: 8px; }
  .header-actions { gap: 2px; }
  .header-actions .header-icon, .header-actions .account-button { width: 32px; min-width: 32px; min-height: 32px; font-size: 18px; }
  .seller-layout { width: 100%; min-height: calc(100vh - 70px); margin: 0; padding: 0; grid-template-columns: 1fr; gap: 12px; }
  .seller-sidebar { position: static; height: auto; max-height: none; padding: 9px; overflow: hidden; border-radius: 22px; }
  .side-label { display: none; }
  .seller-sidebar nav { display: flex; overflow-x: auto; gap: 4px; }
  .seller-sidebar > button { width: auto; min-height: 36px; flex: 0 0 auto; gap: 6px; padding: 0 9px; font-size: 10px; }
  .seller-sidebar > button ion-icon { font-size: 15px; }
  .seller-profile-panel { grid-template-columns: 1fr; gap: 16px; }
  .seller-profile-form { grid-template-columns: 1fr; }
  .seller-content { gap: 12px; }
  .seller-review-card { gap: 10px; padding: 10px; }
  .seller-review-card > img { width: 54px; height: 54px; }
  .seller-review-top { flex-direction: column; gap: 5px; }
  .page-title { min-height: 0; align-items: flex-start; flex-direction: column; padding: 16px; border-radius: 17px; }
  .page-title h1 { font-size: 24px; }
  .page-title p { font-size: 11px; }
  .panel { padding: 15px; border-radius: 17px; }
  .order-processing-heading { padding: 16px; border-radius: 17px; }
  .order-processing-panel { padding: 16px 14px; }
  .order-processing-heading h2 { font-size: 23px; }
  .order-processing-heading p { font-size: 12px; }
  .product-form { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .search-field { width: 145px; }
  .panel-title h2 { font-size: 17px; }
}
</style>
