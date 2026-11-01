<template>
  <ion-modal :is-open="open" class="cart-modal" @didDismiss="$emit('close')">
    <div class="lm">
      <div class="cart-shell">
        <div class="cart-topbar">
          <div class="brand-compact">
            <img class="brand-mark" src="/assets/logo-emblem.png" alt="Pre-Loved Thrift emblem" />
            <div class="brand-txt">
              <strong>PRE-LOVED</strong>
              <small>Thrift</small>
            </div>
          </div>
          <button class="close-top" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
        </div>

        <div v-if="!items.length" class="empty">
          <ion-icon :icon="bagHandleOutline" />
          <p>Your cart is empty. Add pieces from New Arrivals or build an outfit.</p>
        </div>

        <template v-else>
          <div v-if="stage === 'cart'" class="cart-stage">
            <div class="cart-main">
              <h1>Your cart ({{ selectedCount || 1 }})</h1>
            <div v-if="user" class="customer-meta">
              <div class="meta-row"><span>Name</span><strong>{{ user.name || 'Guest' }}</strong></div>
              <div class="meta-row"><span>Phone</span><strong>{{ user.phone || 'No phone added' }}</strong></div>
              <div class="meta-row"><span>Address</span><strong>{{ user.address || 'No address added' }}</strong></div>
            </div>
            <p class="shipping-copy">Free shipping on orders over ₱2,900</p>
            <div class="shipping-bar"><span></span></div>

            <div class="item-card" v-for="it in items" :key="it.id">
              <button class="select-btn" :class="{ active: it.selected !== false }" aria-label="Select item" @click="$emit('toggle', it.id)">
                <span></span>
              </button>
              <img :src="it.img" :alt="it.name" />
              <div class="item-copy">
                <b>{{ it.name }}</b>
                <div class="price-row"><span class="price">{{ formatPeso(it.price) }}</span></div>
                <div class="qty-box" aria-label="Quantity selector">
                  <button type="button" aria-label="Decrease quantity">−</button>
                  <span>1</span>
                  <button type="button" aria-label="Increase quantity">+</button>
                </div>

                <div v-if="editingId === it.id" class="edit-panel">
                  <label>
                    <span>Size</span>
                    <select v-model="size">
                      <option value="">Select size</option>
                      <option v-for="option in sizes" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </label>
                  <label>
                    <span>Note</span>
                    <input v-model="note" type="text" placeholder="Add note" />
                  </label>
                  <div class="edit-actions">
                    <button type="button" class="save-btn" @click="save(it)">Save</button>
                    <button type="button" class="cancel-btn" @click="cancel()">Cancel</button>
                  </div>
                </div>
              </div>
              <div class="right-actions">
                <button class="mini-icon" aria-label="Edit item" @click="startEdit(it)">
                  <ion-icon :icon="createOutline" />
                </button>
                <button class="trash" aria-label="Remove item" @click="$emit('remove', it.id)">
                  <ion-icon :icon="trashOutline" />
                </button>
              </div>
            </div>

            <div v-if="selectedCount > 0" class="summary-box">
              <div class="coupon-row">
                <span class="coupon-label">Coupon</span>
                <button class="code-btn" type="button">Code</button>
              </div>

              <div class="summary-row">
                <span>Subtotal</span>
                <b>{{ formatPeso(total) }}</b>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <b>{{ formatPeso(shippingPrice) }}</b>
              </div>
              <div class="summary-row total-row">
                <span>Total</span>
                <b>{{ formatPeso(total + shippingPrice) }}</b>
              </div>
            </div>

            </div>
            <div v-if="selectedCount > 0" class="cart-footer">
              <button class="cta" @click="beginCheckout">Checkout</button>
            </div>
          </div>

          <div v-else class="panel-stage">
            <div class="panel-header">
              <div class="brand-block">
                <img class="brand-badge" src="/assets/logo-emblem.png" alt="Pre-Loved Thrift emblem" />
                <div class="brand-copy">
                  <strong>PRE-LOVED</strong>
                  <span>Thrift</span>
                </div>
              </div>
              <button class="close-btn" aria-label="Close" @click="closeCheckout"><ion-icon :icon="closeOutline" /></button>
            </div>

            <div class="checkout-method-only">
              <div class="delivery-details">
                <h3>Delivery details</h3>
                <label>Recipient name<input v-model.trim="fullName" autocomplete="name" placeholder="Full name" /></label>
                <label>Phone number<input v-model.trim="phone" type="tel" autocomplete="tel" placeholder="Contact number" /></label>
                <label>Delivery address<input v-model.trim="address" autocomplete="street-address" placeholder="House number, street, city" /></label>
                <p v-if="deliveryError" class="delivery-error" role="alert">{{ deliveryError }}</p>
              </div>
              <div class="payment-wrap">
                <h3>Payment method</h3>
                <div class="payment-options stacked">
                  <label :class="{ active: payment === 'GCash' }">
                    <input v-model="payment" type="radio" value="GCash" />
                    <span>GCash</span>
                  </label>
                  <label :class="{ active: payment === 'Card' }">
                    <input v-model="payment" type="radio" value="Card" />
                    <span>Card</span>
                  </label>
                  <label :class="{ active: payment === 'Cash on delivery' }">
                    <input v-model="payment" type="radio" value="Cash on delivery" />
                    <span>Cash on delivery</span>
                  </label>
                </div>
                <div v-if="payment === 'GCash'" class="payment-demo-details">
                  <strong>Pay with GCash</strong>
                  <img
                    :class="gcashQrReady ? 'gcash-qr-image' : 'gcash-qr-probe'"
                    :src="gcashQrUrl"
                    alt="Official GCash payment QR code"
                    @load="gcashQrReady = true"
                    @error="gcashQrReady = false"
                  />
                  <div v-if="!gcashQrReady" class="gcash-qr-placeholder" role="status">
                    <span>Official GCash QR will appear here</span>
                  </div>
                  <small v-if="gcashQrReady">Scan with GCash, then place your order. The seller must verify the transfer manually before confirming your order.</small>
                  <small v-else>GCash checkout is unavailable until the official QR image is added. After payment, the seller must verify the transfer manually.</small>
                </div>
                <div v-else-if="payment === 'Card'" class="payment-demo-details">
                  <strong>Choose card type</strong>
                  <div class="card-type-options">
                    <label :class="{ active: cardType === 'Visa' }">
                      <input v-model="cardType" type="radio" value="Visa" />
                      <span>Visa</span>
                    </label>
                    <label :class="{ active: cardType === 'Mastercard' }">
                      <input v-model="cardType" type="radio" value="Mastercard" />
                      <span>Mastercard</span>
                    </label>
                  </div>
                  <small>Demo only. Card details are not requested and no payment will be charged.</small>
                </div>
              </div>

              <div class="total-divider"></div>

              <div class="summary-row total-row">
                <span>Total</span>
                <strong>₱{{ totalPeso.toLocaleString('en-PH') }}</strong>
              </div>

              <button class="pay-btn" type="button" :disabled="payment === 'GCash' && !gcashQrReady" @click="submitOrder">
                {{ payment === 'GCash' && !gcashQrReady ? 'GCash QR not available' : payment === 'Card' ? 'Place demo order' : 'Place order' }}
              </button>
            </div>
          </div>
        </template>
      </div>

    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, trashOutline, bagHandle, bagHandleOutline, createOutline, checkmarkCircle, ellipseOutline } from 'ionicons/icons'
import type { CartItem } from '../data/mockData'
import { formatPeso, toPeso } from '../utils/currency'

const props = defineProps<{
  open: boolean
  items: CartItem[]
  user?: { name: string; email: string; phone?: string; address?: string } | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-dashboard'): void
  (e: 'remove', id: CartItem['id']): void
  (e: 'checkout', payload: { orderId: string; payment: string; total: number; customerName: string; customerEmail: string; customerPhone: string; customerAddress: string }): void
  (e: 'edit', payload: { id: CartItem['id']; size?: string; note?: string }): void
  (e: 'toggle', id: CartItem['id']): void
  (e: 'toggle-all', value: boolean): void
  (e: 'order-placed', payload: { orderId: string; payment: string; total: number }): void
}>()

const isOn = (it: CartItem) => it.selected !== false
const selectedItems = computed(() => props.items.filter(isOn))
const selectedCount = computed(() => selectedItems.value.length)
const total = computed(() => selectedItems.value.reduce((s, i) => s + i.price, 0))
const shippingPrice = 4.5
const totalPeso = computed(() => toPeso(total.value))
const allSelected = computed(() => props.items.length > 0 && selectedCount.value === props.items.length)

const sizes = ['XS', 'S', 'M', 'L', 'XL']
const editingId = ref<CartItem['id'] | null>(null)
const size = ref(''), note = ref('')
const stage = ref<'cart' | 'checkout' | 'success'>('cart')
const fullName = ref(''), phone = ref(''), address = ref(''), payment = ref('GCash')
const cardType = ref('Visa')
const gcashQrUrl = '/assets/gcash-qr.png'
const gcashQrReady = ref(false)
const deliveryError = ref('')
const orderId = ref('PL-1004')

watch(() => props.user, (user) => {
  if (!user) return
  fullName.value = user.name || fullName.value
  phone.value = user.phone || phone.value
  address.value = user.address || address.value
}, { immediate: true })

function beginCheckout() {
  if (!selectedCount.value) return
  stage.value = 'checkout'
}
function closeCheckout() {
  stage.value = 'cart'
}
function closeSuccess() {
  stage.value = 'cart'
  emit('open-dashboard')
  emit('close')
}
function startEdit(it: CartItem) { editingId.value = it.id; size.value = it.size || ''; note.value = it.note || '' }
function cancel() { editingId.value = null }
function save(it: CartItem) {
  emit('edit', { id: it.id, size: size.value || undefined, note: note.value.trim() || undefined })
  editingId.value = null
}
function submitOrder() {
  deliveryError.value = ''
  if (!fullName.value.trim() || !address.value.trim()) {
    deliveryError.value = 'Enter the recipient name and delivery address to continue.'
    return
  }
  orderId.value = `PL-${Math.floor(1000 + Math.random() * 9000)}`
  const paymentMethod = payment.value === 'Card' ? `Card (${cardType.value})` : payment.value
  emit('checkout', {
    orderId: orderId.value,
    payment: paymentMethod,
    total: totalPeso.value,
    customerName: fullName.value.trim(),
    customerEmail: props.user?.email || '',
    customerPhone: phone.value.trim(),
    customerAddress: address.value.trim()
  })
  emit('order-placed', { orderId: orderId.value, payment: paymentMethod, total: totalPeso.value })
  stage.value = 'cart'
  emit('close')
}
</script>
<style scoped>
ion-modal.cart-modal {
  --width: min(480px, 96vw);
  --height: 100vh;
  --height: 100dvh;
  --border-radius: 0;
  --box-shadow: none;
  --background: transparent;
  align-items: flex-start;
  justify-content: flex-end;
}
ion-modal.cart-modal::part(content) {
  width: min(480px, 96vw);
  height: 100vh;
  height: 100dvh;
  margin-left: auto;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 0;
  box-shadow: none;
  background: #f4efe9;
}
.lm {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f4efe9;
  color: #2f2a2b;
}
.checkout-inline-shell {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 18px 14px 12px;
  background: linear-gradient(180deg, rgba(230, 162, 152, 0.98), rgba(214, 122, 118, 0.98));
  border-radius: 28px;
  margin: 12px 8px 0;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14);
}
.success-shell {
  padding-top: 22px;
}
.checkout-inline-card {
  width: 100%;
  max-width: 100%;
  background: transparent;
  color: #fff;
  position: relative;
}
.checkout-inline-card.success-card {
  padding-bottom: 6px;
}
.cart-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
.cart-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid #e8ddd9;
  background: rgba(255,255,255,0.08);
}
.brand-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: block;
  object-fit: contain;
  background: #f4f1f0;
  border: 1px solid #dfbdbd;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.8);
}
.brand-txt {
  display: flex;
  flex-direction: column;
  line-height: .9;
}
.brand-txt strong {
  font-family: Georgia, serif;
  font-size: 17px;
  letter-spacing: 0.04em;
  font-weight: 700;
}
.brand-txt small {
  font-size: 9px;
  letter-spacing: .3em;
  color: #766d6c;
  text-transform: uppercase;
  margin-top: 3px;
}
.close-top {
  border: 0;
  background: transparent;
  font-size: 28px;
  color: #2d2525;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.cart-stage {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.cart-main {
  display: flex;
  flex-direction: column;
  padding: 12px 16px 14px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.cart-footer {
  position: relative;
  z-index: 20;
  flex: 0 0 auto;
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
  border-top: 1px solid #e8ddd9;
  background: #f4efe9;
  box-shadow: 0 -8px 18px rgba(47, 42, 43, .06);
}
.cart-main h1 {
  margin: 0;
  font-size: clamp(22px, 2vw, 28px);
  letter-spacing: -0.06em;
  line-height: 1.08;
  color: #000000;
  font-weight: 800;
}
.customer-meta {
  display: grid;
  gap: 4px;
  margin-top: 7px;
  padding: 8px 11px;
  border-radius: 14px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(99,60,57,0.08);
}
.meta-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  line-height: 1.3;
  color: #3a2e2d;
}
.meta-row span {
  display: inline-block;
  min-width: 56px;
  font-weight: 700;
}
.meta-row strong {
  font-weight: 700;
  text-align: right;
  color: #1f1a1a;
}
.shipping-copy {
  margin: 8px 0 6px;
  color: #000000;
  font-size: 12px;
  font-weight: 600;
}
.shipping-bar {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #f4dfe0;
  overflow: hidden;
}
.shipping-bar span {
  display: block;
  width: 76%;
  height: 100%;
  background: linear-gradient(90deg, #e7837d, #d76666);
  border-radius: inherit;
}
.item-card {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 18px 64px minmax(0, 1fr) 40px;
  gap: 8px;
  align-items: center;
  padding: 7px 0 8px;
  border-bottom: 1px solid #eadfdb;
}
.select-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #4b4344;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.select-btn span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  display: block;
}
.select-btn.active {
  background: #000000;
  border-color: #000000;
}
.select-btn.active span {
  background: #ffffff;
}
.item-card img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 16px;
  background: #f3e6e2;
  border: 1px solid #f0dfdc;
}
.item-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-copy b {
  font-size: 15px;
  color: #000000;
  font-weight: 700;
  line-height: 1.25;
}
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.price {
  font-size: 16px;
  font-weight: 700;
  color: #000000;
}
.edit-panel {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5d8d4;
  border-radius: 12px;
  background: rgba(255,255,255,0.45);
}
.edit-panel label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #4f4545;
  font-weight: 600;
}
.edit-panel select,
.edit-panel input {
  border: 1px solid #d9d0ce;
  border-radius: 10px;
  background: #fff;
  padding: 9px 10px;
  color: #222;
  font: inherit;
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}
.save-btn,
.cancel-btn {
  flex: 1;
  border: 0;
  border-radius: 10px;
  padding: 9px 10px;
  font: 700 13px var(--font-body);
  cursor: pointer;
}
.save-btn {
  background: #d76d6d;
  color: #fff;
}
.cancel-btn {
  background: #f0e7e3;
  color: #2b2424;
}
.qty-box {
  width: fit-content;
  display: flex;
  align-items: center;
  border: 1px solid #d9d0ce;
  border-radius: 10px;
  background: rgba(255,255,255,.4);
  overflow: hidden;
}
.qty-box button {
  width: 30px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #322b2b;
  font-size: 22px;
  cursor: pointer;
}
.qty-box span {
  min-width: 28px;
  text-align: center;
  font-size: 20px;
  color: #2d2929;
  font-weight: 600;
}
.right-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 52px;
  margin-left: 2px;
}
.mini-icon,
.trash {
  border: 1px solid #ead7d0;
  background: rgba(255,255,255,.9);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #4f4241;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(84, 59, 55, 0.08);
  opacity: 1;
  visibility: visible;
}
.mini-icon:hover,
.trash:hover {
  background: #fff;
  border-color: #d8b7b2;
}
.mini-icon ion-icon,
.trash ion-icon { font-size: 19px; }
.summary-box {
  margin-top: 8px;
  padding-top: 8px;
}
.coupon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}
.coupon-label {
  font-size: 14px;
  color: #312a29;
  font-weight: 600;
}
.code-btn {
  min-width: 76px;
  border: 1px solid #d9cfc9;
  border-radius: 12px;
  background: #f4eeed;
  color: #6d5855;
  font: 600 15px var(--font-body);
  padding: 6px 9px;
  cursor: pointer;
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #000000;
  padding: 4px 0;
}
.summary-row b {
  font-size: 14px;
  color: #000000;
  font-weight: 700;
}
.summary-row.total-row {
  margin-top: 3px;
  padding-top: 7px;
  border-top: 1px solid #e5d9d4;
  font-size: 15px;
  font-weight: 700;
}
.summary-row.total-row b {
  font-size: 17px;
  color: #000000;
}
.summary-row span,
.summary-row b,
.summary-row strong,
.summary-row .amount {
  color: #000000;
}
.cta {
  width: 100%;
  border: 0;
  border-radius: 16px;
  padding: 10px 14px;
  margin-top: 0;
  background: linear-gradient(135deg, #df7f7b, #d96a6e);
  color: #fff;
  font: 700 14px var(--font-body);
  cursor: pointer;
  box-shadow: 0 12px 20px rgba(219, 107, 107, 0.22);
}
.cta[disabled] { opacity: .5; cursor: not-allowed; }
@media (max-width: 700px) {
  ion-modal.cart-modal {
    --width: min(92vw, 100%);
    --height: 100vh;
    --height: 100dvh;
  }
  ion-modal.cart-modal::part(content) {
    width: min(92vw, 100%);
    height: 100vh;
    height: 100dvh;
    margin-right: 0;
  }
  .cart-topbar { padding: 6px 12px; }
  .brand-compact { gap: 8px; }
  .brand-mark { width: 30px; height: 30px; }
  .brand-txt strong { font-size: 13px; }
  .cart-main { padding: 8px 12px 12px; }
  .cart-footer { padding: 5px 12px calc(6px + env(safe-area-inset-bottom)); }
  .cart-main h1 { font-size: 20px; }
  .customer-meta { gap: 2px; margin-top: 5px; padding: 5px 8px; }
  .meta-row { font-size: 9px; line-height: 1.25; }
  .shipping-copy { margin: 5px 0; font-size: 11px; }
  .shipping-bar { display: none; }
  .item-card {
    grid-template-columns: 15px 48px minmax(0, 1fr) 32px;
    gap: 6px;
    margin-top: 4px;
    padding: 4px 0 5px;
  }
  .select-btn { width: 15px; height: 15px; }
  .select-btn span { width: 6px; height: 6px; }
  .item-card img { width: 48px; height: 48px; border-radius: 8px; }
  .item-copy { gap: 2px; }
  .item-copy b { font-size: 12px; line-height: 1.1; }
  .price { font-size: 13px; }
  .qty-box button { width: 20px; height: 21px; font-size: 14px; }
  .qty-box span { min-width: 18px; font-size: 12px; }
  .right-actions { gap: 3px; min-width: 32px; margin-left: 0; }
  .mini-icon, .trash { width: 23px; height: 23px; }
  .mini-icon ion-icon, .trash ion-icon { font-size: 13px; }
  .summary-box { margin-top: 5px; padding-top: 5px; }
  .coupon-row { margin-bottom: 2px; }
  .coupon-label { font-size: 11px; }
  .code-btn { min-width: 56px; padding: 3px 6px; font-size: 10px; }
  .summary-row { padding: 2px 0; font-size: 10px; }
  .summary-row b { font-size: 11px; }
  .summary-row.total-row { margin-top: 1px; padding-top: 4px; font-size: 12px; }
  .summary-row.total-row b { font-size: 14px; }
  .cta { padding: 8px 10px; border-radius: 10px; font-size: 13px; }
}
.empty {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 80px 30px 40px;
  color: var(--muted);
}
.empty ion-icon { font-size: 42px; color: #d9c8c2; }
.empty p { margin-top: 12px; font-size: 14px; line-height: 1.6; }

.panel-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  min-height: 0;
  max-height: 78vh;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(230, 162, 152, 0.98), rgba(214, 122, 118, 0.98));
  border-radius: 30px;
  padding: 18px 16px 18px;
  margin: 8px 8px 16px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
}
.panel-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.close-btn {
  position: absolute;
  right: 0;
  top: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255,255,255,.18);
  color: #fff;
  border: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.brand-block {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}
.panel-header .brand-block {
  margin-bottom: 0;
}
.brand-badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: block;
  object-fit: contain;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(255,255,255,.75);
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.6);
}
.brand-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.brand-copy strong {
  font-size: 20px;
  letter-spacing: .04em;
  font-weight: 800;
}
.brand-copy span {
  font-size: 11px;
  letter-spacing: .24em;
  font-weight: 600;
}
.panel-stage h2 {
  font-size: clamp(36px, 4.2vw, 62px);
  line-height: 0.95;
  letter-spacing: -0.065em;
  text-align: center;
  margin: 10px 0 0;
  font-weight: 900;
}
.panel-subtitle {
  text-align: center;
  margin: 10px 0 0;
  opacity: .9;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.04em;
}
.checkout-method-only {
  display: grid;
  gap: 10px;
}
.delivery-details {
  display: grid;
  gap: 10px;
}
.delivery-details h3 {
  margin: 0;
  color: #fff;
  font-size: 19px;
}
.delivery-details label {
  display: grid;
  gap: 5px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.delivery-details input {
  min-width: 0;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.8);
  border-radius: 12px;
  outline: none;
  background: rgba(255,255,255,.94);
  color: var(--ink);
  font: 13px var(--font-body);
}
.delivery-error {
  margin: 0;
  color: #fff3e7;
  font-size: 11px;
}
.payment-wrap {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}
.payment-wrap h3 {
  margin: 0;
  font-size: 19px;
  line-height: 1.2;
  color: #fff;
  font-weight: 800;
}
.payment-options {
  display: grid;
  gap: 10px;
}
.payment-options.stacked {
  grid-template-columns: 1fr;
}
.payment-options label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.88);
  background: rgba(255,255,255,.08);
  cursor: pointer;
  padding: 9px 14px;
  transition: background .2s ease, transform .2s ease;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.payment-options label.active {
  background: rgba(255,255,255,.88);
  color: var(--coral-dark);
}
.payment-options input {
  display: none;
}
.payment-demo-details {
  display: grid;
  gap: 7px;
  padding: 12px 14px;
  border: 1px solid rgba(255,255,255,.62);
  border-radius: 12px;
  background: rgba(255,255,255,.14);
  color: #fff;
  font-size: 13px;
}
.payment-demo-details > strong {
  font-size: 14px;
}
.payment-demo-details > span {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.payment-demo-details small {
  color: rgba(255,255,255,.88);
  font-size: 11px;
  line-height: 1.4;
}
.gcash-qr-placeholder {
  display: grid;
  place-items: center;
  width: min(100%, 190px);
  aspect-ratio: 1;
  padding: 18px;
  border: 1px dashed rgba(255,255,255,.85);
  border-radius: 12px;
  background: rgba(255,255,255,.92);
  color: #745c58;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}
.gcash-qr-image {
  display: block;
  width: min(100%, 220px);
  aspect-ratio: 1;
  justify-self: center;
  border-radius: 12px;
  background: #fff;
  object-fit: contain;
}
.gcash-qr-probe {
  display: none;
}
.card-type-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.card-type-options label {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 1px solid rgba(255,255,255,.8);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}
.card-type-options label.active {
  background: rgba(255,255,255,.9);
  color: var(--coral-dark);
}
.total-divider {
  height: 1px;
  background: rgba(255,255,255,.45);
  margin-top: 8px;
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
  color: #fff;
  padding: 8px 0 0;
}
.summary-row strong,
.summary-row b,
.summary-row span {
  color: #fff;
}
.cart-main .summary-box .summary-row,
.cart-main .summary-box .summary-row span,
.cart-main .summary-box .summary-row b {
  color: #000;
}
.total-row {
  margin-top: 2px;
  padding-top: 4px;
}
.total-row strong {
  font-size: 24px;
  font-weight: 800;
}
.pay-btn, .view-orders {
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: rgba(255,255,255,.92);
  color: var(--coral-dark);
  font: 800 20px var(--font-body);
  padding: 14px 16px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(88, 37, 40, 0.18);
  margin-top: 10px;
}
.pay-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
  box-shadow: none;
}
.view-orders {
  margin-top: 18px;
  font-size: 18px;
}
.confirmation-box {
  background: rgba(255,255,255,.9);
  color: var(--ink);
  border-radius: 18px;
  padding: 18px 16px;
  margin-top: 18px;
  text-align: center;
}
.confirmation-box h3 {
  margin: 0;
  font-size: 31px;
  color: var(--ink);
}
.confirmation-box p {
  margin-top: 12px;
  line-height: 1.5;
  color: var(--muted);
  opacity: 1;
  font-size: 15px;
}
.spark { font-size: 22px; }
@media (max-width: 420px) {
  .panel-stage { padding-left: 12px; padding-right: 12px; }
  .payment-options { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .cart-main .summary-box .coupon-label { font-size: 11px; }
  .cart-main .summary-box .code-btn { min-width: 56px; padding: 3px 6px; font-size: 10px; }
  .cart-main .summary-box .summary-row { padding: 2px 0; font-size: 10px; }
  .cart-main .summary-box .summary-row b { font-size: 11px; }
  .cart-main .summary-box .summary-row.total-row { padding-top: 4px; font-size: 12px; }
  .cart-main .summary-box .summary-row.total-row b { font-size: 14px; }
}
</style>
