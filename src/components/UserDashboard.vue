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
                    <button v-if="canReviewOrder(order)" class="item-review-button" type="button"
                      @click="hasReviewedItem(order, item) ? navigateDashboard('reviews') : openReview(order, item)">
                      {{ hasReviewedItem(order, item) ? 'View review' : 'Rate item' }}
                    </button>
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

        <template v-else-if="view === 'reviews'">
          <div class="page-heading"><span class="eyebrow">YOUR THOUGHTS, KEPT</span><h1>My reviews</h1>
            <p>Your reviewed finds and ratings stay here.</p></div>
          <section class="panel customer-reviews">
            <p v-if="reviewsError" class="form-error" role="alert">{{ reviewsError }}</p>
            <div v-if="!reviews.length && !reviewsError" class="empty-state">
              <span class="empty-icon"><ion-icon :icon="starOutline" /></span>
              <div><b>No reviews yet</b><p>After you review a delivered product, it will be saved here.</p></div>
            </div>
            <article v-for="review in customerReviews" :key="review.id" class="customer-review-card">
              <img :src="review.productImage" :alt="review.productName" />
              <div class="customer-review-copy">
                <div class="customer-review-title"><b>{{ review.productName }}</b><time>{{ formatDate(review.createdAt) }}</time></div>
                <span class="customer-review-stars" :aria-label="`${review.rating} out of 5 stars`">{{ '★'.repeat(review.rating) }}<span>{{ '★'.repeat(5 - review.rating) }}</span></span>
                <p>{{ review.reviewText || 'No written comment.' }}</p>
                <span class="customer-review-rider">Delivery rider: {{ review.riderName || 'Not recorded' }}</span>
                <div class="customer-review-services">
                  <span>Seller service: {{ '★'.repeat(review.sellerServiceRating) }}</span>
                  <span>Delivery: {{ '★'.repeat(review.deliveryServiceRating) }}</span>
                  <span>{{ review.showUsername ? 'Name shown' : 'Anonymous' }}</span>
                </div>
                <div v-if="review.photoUrls.length || review.videoUrls.length" class="customer-review-media">
                  <button v-for="(url, index) in review.photoUrls" :key="url" class="customer-review-photo" type="button" :aria-label="`View review photo ${index + 1}`" @click="openReviewPhoto(url)">
                    <img :src="url" :alt="`Review photo ${index + 1}`" />
                  </button>
                  <video v-for="(url, index) in review.videoUrls" :key="url" :src="url" controls preload="metadata" :aria-label="`Review video ${index + 1}`"></video>
                </div>
              </div>
            </article>
          </section>
        </template>

        <div v-if="reviewPhotoOpen" class="review-photo-overlay" role="dialog" aria-modal="true" aria-label="Review photo preview" @click.self="closeReviewPhoto">
          <div class="review-photo-viewer">
            <button type="button" class="review-photo-close" aria-label="Close photo preview" @click="closeReviewPhoto">×</button>
            <img :src="reviewPhotoOpen" alt="Full-size customer review photo" />
          </div>
        </div>

        <div v-if="reviewOpen" class="review-overlay" @click.self="closeReview">
          <div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div class="review-header">
              <button class="review-back" type="button" aria-label="Close review" @click="closeReview">←</button>
              <div class="review-heading">
                <span>PRE-LOVED THRIFT · YOUR REVIEW</span>
                <h2 id="review-title">Rate your find</h2>
                <small>Your feedback helps others shop with confidence.</small>
              </div>
            </div>

            <div class="review-body">
              <span class="review-section-label">THE ITEM</span>
              <div class="review-product">
                <img :src="currentReviewItem?.img || '/assets/logo-emblem.png'" :alt="currentReviewItem?.name || 'Product image'" />
                <div class="review-product-copy">
                  <small>{{ currentReviewItem?.name || 'Selected item' }}</small>
                </div>
              </div>

              <div class="review-rating-card">
                <span class="review-section-label">HOW DID IT FEEL?</span>
                <div class="review-stars">
                  <button v-for="star in 5" :key="star" type="button" class="star-button" :class="{ active: (reviewDrafts[reviewOpen]?.rating ?? 0) >= star }" :aria-label="`${star} star${star === 1 ? '' : 's'}`" :aria-pressed="(reviewDrafts[reviewOpen]?.rating ?? 0) === star" @click="setReviewRating(star)">★</button>
                  <span>{{ reviewDrafts[reviewOpen]?.rating ?? 0 }} / 5</span>
                </div>
              </div>

              <div class="review-rating-card service-rating-card">
                <span class="review-section-label">SERVICE RATINGS</span>
                <div v-for="service in reviewServices" :key="service.key" class="service-rating-row">
                  <span>{{ service.label }}</span>
                  <div class="review-stars">
                    <button v-for="star in 5" :key="star" type="button" class="service-star-button" :class="{ active: reviewDrafts[reviewOpen][service.key] >= star }" :aria-label="`${service.label}: ${star} star${star === 1 ? '' : 's'}`" :aria-pressed="reviewDrafts[reviewOpen][service.key] === star" @click="setServiceRating(service.key, star)">★</button>
                  </div>
                </div>
              </div>

              <textarea v-model="reviewDrafts[reviewOpen].reviewText" class="review-input" rows="4" placeholder="Tell us what you thought about this product."></textarea>
              <div class="review-media-picker">
                <span class="review-section-label">ADD TO YOUR REVIEW</span>
                <div class="review-media-actions">
                  <button type="button" class="review-media-button" :disabled="Boolean(reviewDrafts[reviewOpen].photo)" @click="reviewPhotoInput?.click()">＋ Add photo</button>
                  <button type="button" class="review-media-button" :disabled="Boolean(reviewDrafts[reviewOpen].video)" @click="reviewVideoInput?.click()">＋ Add video</button>
                </div>
                <input ref="reviewPhotoInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="setReviewMedia('photo', $event)" />
                <input ref="reviewVideoInput" class="visually-hidden" type="file" accept="video/mp4,video/webm" @change="setReviewMedia('video', $event)" />
                <div v-if="reviewDrafts[reviewOpen].photo || reviewDrafts[reviewOpen].video" class="review-media-selected">
                  <img v-if="reviewDrafts[reviewOpen].photoPreview" :src="reviewDrafts[reviewOpen].photoPreview" alt="Selected review photo preview" />
                  <video v-if="reviewDrafts[reviewOpen].videoPreview" :src="reviewDrafts[reviewOpen].videoPreview" controls aria-label="Selected review video preview"></video>
                  <span>{{ reviewDrafts[reviewOpen].photo?.name || reviewDrafts[reviewOpen].video?.name }}</span>
                  <button type="button" aria-label="Remove selected media" @click="removeReviewMedia">Remove</button>
                </div>
                <small class="review-media-help">Stored with this review · photos up to 1 MB · videos up to 3 MB</small>
              </div>
              <label class="review-username-toggle">
                <input v-model="reviewDrafts[reviewOpen].showUsername" type="checkbox" />
                <span>Show my name with this review</span>
              </label>
              <button class="review-submit" type="button" :disabled="reviewSubmitting" @click="submitReview">{{ reviewSubmitting ? 'Saving review…' : 'Submit review' }}</button>
              <p v-if="reviewSubmitError" class="form-error" role="alert">{{ reviewSubmitError }}</p>
            </div>
          </div>
        </div>

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

        <template v-else-if="view === 'profile'">
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
import { computed, defineComponent, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline, bagHandleOutline, cartOutline, heart, heartOutline,
  storefrontOutline, personOutline, gridOutline, receiptOutline, createOutline, closeOutline, starOutline
} from 'ionicons/icons'
import type { CartItem, Category, OrderMessage, OrderRecord, Product } from '../data/mockData'
import { formatPeso } from '../utils/currency'
import { createProductReview, listBuyerProductReviews, type ProductReview } from '../services/reviews'

const props = defineProps<{
  user: { id: string; name: string; email: string; phone?: string; address?: string; avatar?: string }
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

const view = ref<'overview' | 'orders' | 'wishlist' | 'profile' | 'categories' | 'reviews'>(props.initialView || 'overview')
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
const navItems: Array<{ id: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories' | 'reviews'; label: string; icon: typeof gridOutline }> = [
  { id: 'overview', label: 'Dashboard', icon: gridOutline },
  { id: 'categories', label: 'Shop', icon: storefrontOutline },
  { id: 'orders', label: 'My orders', icon: receiptOutline },
  { id: 'reviews', label: 'My reviews', icon: starOutline },
  { id: 'wishlist', label: 'Wishlist', icon: heart },
  { id: 'profile', label: 'Profile', icon: personOutline },
]
const trackingSteps = ['Confirmed', 'Packed', 'Shipped', 'Delivered']
type ReviewServiceRating = 'sellerServiceRating' | 'deliveryServiceRating'
type ReviewMediaKind = 'photo' | 'video'
type ReviewDraft = {
  rating: number
  reviewText: string
  sellerServiceRating: number
  deliveryServiceRating: number
  showUsername: boolean
  photo: File | null
  video: File | null
  photoPreview: string
  videoPreview: string
}
const reviewDrafts = reactive<Record<string, ReviewDraft>>({})
const reviewOpen = ref<string | null>(null)
const reviewSubmitError = ref('')
const reviewSubmitting = ref(false)
const reviewPhotoInput = ref<HTMLInputElement | null>(null)
const reviewVideoInput = ref<HTMLInputElement | null>(null)
const reviewServices: Array<{ key: ReviewServiceRating; label: string }> = [
  { key: 'sellerServiceRating', label: 'Seller service' },
  { key: 'deliveryServiceRating', label: 'Delivery service' }
]
const reviews = ref<ProductReview[]>([])
const reviewsError = ref('')
const reviewPhotoOpen = ref('')
const reviewedProductIds = reactive<Record<string, boolean>>({})
const reviewedOrderItemKeys = reactive<Record<string, boolean>>({})
const currentReviewItem = ref<CartItem | null>(null)
const customerReviews = computed(() => reviews.value.map((review) => {
  const relatedOrders = props.orders.filter((order) => order.items.some((orderItem) => reviewProductId(orderItem) === review.productId))
  const matchingOrder = relatedOrders
    .filter((order) => Date.parse(order.date) <= Date.parse(review.createdAt))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] || relatedOrders[0]
  const item = matchingOrder?.items.find((orderItem) => reviewProductId(orderItem) === review.productId)
  return {
    ...review,
    productName: item?.name || 'Reviewed product',
    productImage: item?.img || '/assets/logo-emblem.png',
    riderName: matchingOrder?.rider
  }
}))
const openReviewPhoto = (url: string) => { reviewPhotoOpen.value = url }
const closeReviewPhoto = () => { reviewPhotoOpen.value = '' }
const canReviewOrder = (order: OrderRecord) => {
  const status = getOrderStatus(order).toLowerCase()
  return status === 'delivered' || status === 'claimed'
}
const reviewProductId = (item: CartItem): string | null => {
  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  if (item.productId && isUuid(item.productId)) return item.productId
  const suffix = String(item.id).split('::')[0].split(':').pop() || ''
  return isUuid(suffix) ? suffix : null
}
const reviewKey = (order: OrderRecord, item: CartItem) =>
  reviewProductId(item) || `order-item:${item.rowId || `${order.id}:${item.id}`}`
const hasReviewedItem = (order: OrderRecord, item: CartItem) => {
  const productId = reviewProductId(item)
  return Boolean((productId && reviewedProductIds[productId]) || reviewedOrderItemKeys[reviewKey(order, item)])
}
onMounted(async () => {
  try {
    reviews.value = await listBuyerProductReviews(props.user.id)
    reviews.value.forEach((review) => {
      if (review.productId) reviewedProductIds[review.productId] = true
    })
  } catch (error) {
    console.error('Unable to load customer reviews.', error)
    reviewsError.value = 'Your reviews could not be loaded. Please try again later.'
  }
})
const openReview = (order: OrderRecord, item: CartItem) => {
  if (!canReviewOrder(order) || hasReviewedItem(order, item)) return
  reviewSubmitError.value = ''
  const key = reviewKey(order, item)
  reviewDrafts[key] ??= {
    rating: 5,
    reviewText: '',
    sellerServiceRating: 5,
    deliveryServiceRating: 5,
    showUsername: false,
    photo: null,
    video: null,
    photoPreview: '',
    videoPreview: ''
  }
  reviewOpen.value = key
  currentReviewItem.value = item
}
const closeReview = () => {
  reviewSubmitError.value = ''
  reviewOpen.value = null
  currentReviewItem.value = null
}
const setReviewRating = (rating: number) => {
  if (!reviewOpen.value) return
  reviewDrafts[reviewOpen.value] = { ...reviewDrafts[reviewOpen.value], rating }
}
const setServiceRating = (service: ReviewServiceRating, rating: number) => {
  if (!reviewOpen.value) return
  reviewDrafts[reviewOpen.value][service] = rating
}
const setReviewMedia = (kind: ReviewMediaKind, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !reviewOpen.value) return

  const allowedType = kind === 'photo'
    ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    : ['video/mp4', 'video/webm'].includes(file.type)
  const maxSize = kind === 'photo' ? 1 * 1024 * 1024 : 3 * 1024 * 1024
  if (!allowedType || file.size > maxSize) {
    reviewSubmitError.value = kind === 'photo'
      ? 'Choose a JPG, PNG, or WebP photo under 1 MB.'
      : 'Choose an MP4 or WebM video under 3 MB.'
    input.value = ''
    return
  }

  reviewSubmitError.value = ''
  const draft = reviewDrafts[reviewOpen.value]
  const previewKey = kind === 'photo' ? 'photoPreview' : 'videoPreview'
  if (draft[previewKey]) URL.revokeObjectURL(draft[previewKey])
  draft[kind] = file
  draft[previewKey] = URL.createObjectURL(file)
  input.value = ''
}
const removeReviewMedia = () => {
  if (!reviewOpen.value) return
  const draft = reviewDrafts[reviewOpen.value]
  if (draft.photoPreview) URL.revokeObjectURL(draft.photoPreview)
  if (draft.videoPreview) URL.revokeObjectURL(draft.videoPreview)
  draft.photo = null
  draft.video = null
  draft.photoPreview = ''
  draft.videoPreview = ''
}
onBeforeUnmount(() => {
  Object.values(reviewDrafts).forEach((draft) => {
    if (draft.photoPreview) URL.revokeObjectURL(draft.photoPreview)
    if (draft.videoPreview) URL.revokeObjectURL(draft.videoPreview)
  })
})
const submitReview = async () => {
  const reviewId = reviewOpen.value
  const item = currentReviewItem.value
  if (!reviewId || !item || reviewSubmitting.value) return
  const draft = reviewDrafts[reviewId]
  if (!draft || draft.rating < 1) {
    reviewSubmitError.value = 'Choose a star rating before submitting.'
    return
  }
  const productId = reviewProductId(item)
  if (!productId) {
    reviewSubmitError.value = 'This order item has no valid product ID, which is required by the Supabase review table.'
    return
  }

  reviewSubmitting.value = true
  reviewSubmitError.value = ''
  try {
    const savedReview = await createProductReview({
      userId: props.user.id,
      productId,
      rating: draft.rating,
      reviewText: draft.reviewText,
      sellerServiceRating: draft.sellerServiceRating,
      deliveryServiceRating: draft.deliveryServiceRating,
      showUsername: draft.showUsername,
      photo: draft.photo,
      video: draft.video
    })
    reviews.value = [savedReview, ...reviews.value]
    reviewedProductIds[productId] = true
    reviewedOrderItemKeys[reviewId] = true
    if (draft.photoPreview) URL.revokeObjectURL(draft.photoPreview)
    if (draft.videoPreview) URL.revokeObjectURL(draft.videoPreview)
    delete reviewDrafts[reviewId]
    reviewOpen.value = null
    currentReviewItem.value = null
  } catch (error) {
    console.error('Unable to submit product review.', error)
    reviewSubmitError.value = error instanceof Error ? error.message : 'Your review could not be submitted. Please try again.'
  } finally {
    reviewSubmitting.value = false
  }
}

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

function navigateDashboard(destination: 'overview' | 'orders' | 'wishlist' | 'profile' | 'categories' | 'reviews') {
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
.dashboard-wrap { width: 100%; min-height: calc(100vh - 78px); box-sizing: border-box; margin: 0; padding: 0 24px 0 0; display: grid; grid-template-columns: 320px minmax(0, 1fr); align-items: start; gap: 24px; }
.sidebar, .panel { background: #fff; border: 1px solid #f0e6e0; border-radius: 24px; }
.sidebar { height: calc(100vh - 78px); box-sizing: border-box; padding: 18px 18px 14px; position: sticky; top: 78px; align-self: start; overflow-y: auto; background: #f7f0ee; border: 1px solid #eeded8; border-radius: 18px; box-shadow: none; }
.member { padding: 6px 6px 18px; margin-bottom: 8px; border-bottom: 1px solid #e8d5d0; display: flex; align-items: center; gap: 14px; min-width: 0; }
.avatar, .profile-avatar { width: 52px; height: 52px; flex: 0 0 auto; border-radius: 16px; display: grid; place-items: center; background: #f1d0c9; color: var(--coral-dark); font: 700 26px var(--font-head); overflow: hidden; }
.avatar img, .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.member div { min-width: 0; display: grid; gap: 3px; }
.member b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 18px; line-height: 1.2; color: var(--ink); }
.member small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--muted); }
.sidebar nav { display: grid; gap: 10px; padding-top: 8px; }
.sidebar nav button { width: 100%; border: 0; border-radius: 16px; background: transparent; padding: 12px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; color: #473c39; text-align: left; font: 600 15px/1.3 var(--font-body); }
.sidebar nav button ion-icon { font-size: 20px; color: #5a4c48; }
.sidebar nav button span { flex: 1; }
.sidebar nav button small { min-width: 20px; padding: 2px 6px; border-radius: 20px; background: #f8e5e2; color: var(--coral-dark); text-align: center; }
.sidebar nav button:hover { background: rgba(245, 210, 204, 0.35); color: #3a2c2c; }
.sidebar nav button.active { background: #f2d7d1; color: #2d2625; }
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
.tracking-item span { min-width: 0; flex: 1; display: grid; gap: 4px; color: var(--ink); font-size: 13px; font-weight: 600; }
.tracking-item small { color: #a17870; font-size: 10px; font-weight: 600; }
.tracking-item small.item-delivered { color: #39744c; }
.item-review-button { flex: 0 0 auto; padding: 8px 11px; border: 1px solid #efd8d0; border-radius: 999px; background: #fff; color: var(--coral-dark); cursor: pointer; font: 700 10px var(--font-body); }
.item-review-button:hover { border-color: var(--coral); background: #fff9f7; }
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
.order-review-row {
  display: flex;
  justify-content: flex-end;
  grid-column: 1 / -1;
}
.review-button, .review-submit {
  border: 0;
  border-radius: 999px;
  background: #f5d9d3;
  color: #1d1a1a;
  font: 700 12px var(--font-body);
  cursor: pointer;
}
.review-button {
  padding: 9px 16px;
}
.review-done {
  color: #8d746d;
  font-size: 12px;
  font-weight: 700;
}
.review-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(43, 34, 32, 0.48);
  backdrop-filter: blur(5px);
  z-index: 1000;
}
.review-modal {
  width: min(100%, 560px);
  max-height: min(88vh, 760px);
  overflow-y: auto;
  border-radius: 24px;
  background: var(--cream);
  box-shadow: 0 28px 80px rgba(45, 29, 26, 0.3);
  border: 1px solid rgba(255, 255, 255, .8);
}
.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #efe5df;
  background: linear-gradient(110deg, #fff8f5, #fff 70%);
}
.review-back {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  font-size: 23px;
  line-height: 1;
  transition: background .18s ease, transform .18s ease;
}
.review-back:hover {
  background: var(--coral-soft);
  transform: translateX(-2px);
}
.review-heading {
  flex: 1;
  min-width: 0;
}
.review-heading > span, .review-section-label {
  color: #a77a70;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .14em;
}
.review-heading h2 {
  margin: 4px 0 0;
  color: var(--ink);
  font: 700 20px/1.2 var(--font-head);
}
.review-heading small {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 10px;
}
.review-submit {
  width: 100%;
  min-height: 42px;
  padding: 0 18px;
  background: var(--coral);
  color: #fff;
  font: 700 13px var(--font-body);
  box-shadow: 0 7px 16px rgba(219, 107, 107, .22);
  transition: background .18s ease, transform .18s ease;
}
.review-submit:hover {
  background: var(--coral-dark);
  transform: translateY(-1px);
}
.review-body {
  display: grid;
  gap: 9px;
  padding: 12px 20px 18px;
}
.review-product {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 9px;
  border: 1px solid #f0e5df;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(63, 42, 34, .035);
}
.review-product img {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 13px;
  object-fit: cover;
  background: #f7eeea;
}
.review-product-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.review-product-copy small {
  color: var(--ink);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
}
.review-product-meta {
  display: flex;
  gap: 10px;
  color: var(--muted);
  font-size: 11px;
}
.review-rating-card {
  display: grid;
  gap: 5px;
  padding: 9px 13px;
  border: 1px solid #f1e2d9;
  border-radius: 18px;
  background: linear-gradient(120deg, #fff 0%, #fff8f4 100%);
}
.review-stars {
  display: flex;
  align-items: center;
  gap: 6px;
}
.star-button {
  border: 0;
  background: transparent;
  color: #d9cec7;
  font-size: 26px;
  padding: 2px;
  cursor: pointer;
  line-height: 1;
  transition: color .15s ease, transform .15s ease;
}
.star-button.active {
  color: #e8a34f;
}
.star-button:hover {
  transform: scale(1.12);
}
.review-stars span {
  margin-left: 6px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}
.review-input {
  width: 100%;
  box-sizing: border-box;
  resize: none;
  min-height: 76px;
  border: 1px solid #eadbd3;
  border-radius: 17px;
  background: #fff;
  padding: 11px 13px;
  font: 500 12px/1.55 var(--font-body);
  color: var(--ink);
}
.review-input::placeholder {
  color: #998983;
}
.review-input:focus {
  outline: 3px solid rgba(219, 107, 107, .14);
  border-color: var(--coral);
}
.service-rating-card { gap: 8px; }
.service-rating-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--ink); font-size: 11px; font-weight: 700; }
.service-rating-row .review-stars { gap: 2px; }
.service-star-button { padding: 1px; border: 0; background: transparent; color: #d9cec7; cursor: pointer; font-size: 19px; line-height: 1; }
.service-star-button.active { color: #e8a34f; }
.review-media-picker { display: grid; gap: 7px; padding: 10px 12px; border: 1px solid #f1e2d9; border-radius: 16px; background: #fff; }
.review-media-actions { display: flex; gap: 8px; }
.review-media-button { border: 1px solid #efd9d2; border-radius: 999px; padding: 7px 11px; background: #fff8f5; color: var(--ink); cursor: pointer; font: 700 10px var(--font-body); }
.review-media-button:disabled { opacity: .55; cursor: not-allowed; }
.review-media-help { color: var(--muted); font-size: 9px; }
.review-media-selected { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--muted); font-size: 10px; }
.review-media-selected img, .review-media-selected video { width: 42px; height: 42px; flex: 0 0 auto; border-radius: 8px; background: #f7eeea; object-fit: cover; }
.review-media-selected span { overflow: hidden; flex: 1; text-overflow: ellipsis; white-space: nowrap; }
.review-media-selected button { border: 0; background: none; color: var(--coral-dark); cursor: pointer; font: 700 10px var(--font-body); }
.review-username-toggle { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 11px; }
.review-username-toggle input { accent-color: var(--coral); }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.customer-reviews {
  display: grid;
  gap: 12px;
}
.customer-review-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 1px solid #f0e6e0;
  border-radius: 17px;
  background: #fff;
}
.customer-review-card > img {
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: #f7eeea;
  object-fit: contain;
}
.customer-review-copy {
  min-width: 0;
  flex: 1;
}
.customer-review-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.customer-review-title b {
  color: var(--ink);
  font-size: 13px;
}
.customer-review-title time {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 10px;
}
.customer-review-stars {
  display: block;
  margin-top: 5px;
  color: #e8a34f;
  font-size: 14px;
  letter-spacing: 1px;
}
.customer-review-stars span {
  color: #d9cec7;
}
.customer-review-copy p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.customer-review-rider { display: block; margin-top: 6px; color: var(--muted); font-size: 10px; }
.customer-review-services, .customer-review-media { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-top: 7px; color: var(--muted); font-size: 10px; }
.customer-review-photo { display: block; width: 64px; height: 64px; overflow: hidden; padding: 3px; border: 1px solid #f0e6e0; border-radius: 9px; background: #fff; cursor: zoom-in; }
.customer-review-photo img { display: block; width: 100%; height: 100%; border-radius: 6px; object-fit: contain; }
.customer-review-media video { width: min(220px, 100%); max-height: 150px; border-radius: 8px; background: #261f1e; }
.review-photo-overlay { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 24px; background: rgba(31, 24, 23, .78); }
.review-photo-viewer { position: relative; box-sizing: border-box; width: min(86vw, 560px); height: min(78vh, 560px); overflow: hidden; border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(0, 0, 0, .35); }
.review-photo-viewer > img { position: absolute; inset: 16px; display: block; width: calc(100% - 32px); height: calc(100% - 32px); object-fit: contain; }
.review-photo-close { position: absolute; top: 8px; right: 8px; z-index: 1; width: 34px; height: 34px; border: 0; border-radius: 50%; background: #fff2ee; color: var(--ink); cursor: pointer; font-size: 24px; line-height: 1; }
.review-submit:disabled {
  cursor: wait;
  opacity: .7;
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
  .review-overlay { align-items: flex-end; padding: 10px; }
  .review-modal { width: min(100%, 560px); max-height: 88dvh; border-radius: 22px; }
  .review-header { gap: 8px; padding: 11px 14px; }
  .review-back { width: 34px; height: 34px; }
  .review-heading > span { font-size: 8px; }
  .review-heading h2 { font-size: 16px; }
  .review-heading small { font-size: 9px; }
  .review-submit { min-height: 40px; }
  .review-body { gap: 8px; padding: 10px 14px 14px; }
  .review-product img { width: 52px; height: 52px; }
  .review-product-copy small { font-size: 12px; }
  .review-stars { gap: 4px; }
  .star-button { font-size: 22px; }

  .review-input { min-height: 68px; }
  .customer-review-card { gap: 10px; padding: 11px; }
  .customer-review-card > img { width: 60px; height: 60px; }
  .customer-review-title { flex-direction: column; gap: 3px; }
}
.review-modal button:focus-visible {
  outline: 3px solid rgba(219, 107, 107, .35);
  outline-offset: 2px;
}
</style>
