<template>
  <section class="section">
    <div class="wrap">
      <div class="sec-head">
        <div>
          <h2>New Arrivals</h2>
          <p>Explore our latest trendy pieces</p>
        </div>
        <a class="link" href="#shop" @click.prevent="emit('navigate', 'shop')">View All Products →</a>
      </div>
      <div class="row">
        <article v-for="p in products" :key="p.id" :class="{ hot: p.hot }">
          <div class="img">
            <img :src="p.img" :alt="p.name" />
            <span v-if="p.hot" class="hot-b">HOT</span>
            <button class="heart" :class="{ on: wished.includes(p.id) }" aria-label="Wishlist"
              @click="$emit('toggle-wish', p)">
              <ion-icon :icon="wished.includes(p.id) ? heart : heartOutline" />
            </button>
          </div>
          <h3>{{ p.name }}</h3>
          <div class="price">
            <b>{{ formatPeso(p.price) }}</b>
            <s v-if="p.was">{{ formatPeso(p.was) }}</s>
          </div>
          <button class="add" @click="$emit('add-cart', p)">
            <span>Add to cart</span>
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { heart, heartOutline, bagHandle } from 'ionicons/icons'
import { products, type Product } from '../data/mockData'
import { formatPeso } from '../utils/currency'

const emit = defineEmits<{
  (event: 'navigate', id: string): void
  (event: 'toggle-wish', product: Product): void
  (event: 'add-cart', product: Product): void
}>()

withDefaults(defineProps<{ wished?: (string | number)[] }>(), { wished: () => [] })
</script>

<style scoped>
.row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
article {
  background: #fff;
  border: 1px solid #f0e6e0;
  border-radius: 24px;
  padding: 14px;
  transition: transform .25s ease, box-shadow .25s ease;
}
article:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(80, 40, 40, 0.1);
}
article.hot {
  border-color: #f3c6c6;
  box-shadow: 0 14px 30px rgba(219, 107, 107, 0.18);
}
.img {
  position: relative;
  background: #f6f1ec;
  border-radius: 18px;
  aspect-ratio: 1;
  overflow: hidden;
}
.img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform .4s ease;
}
article:hover .img img {
  transform: scale(1.06);
}
.hot-b {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--coral);
  color: #fff;
  font: 700 11px var(--font-body);
  padding: 4px 10px;
  border-radius: 999px;
  box-shadow: 0 6px 14px rgba(219, 107, 107, 0.4);
}
.heart {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  cursor: pointer;
  color: #c9a8a8;
  font-size: 19px;
  display: grid;
  place-items: center;
  box-shadow: 0 6px 16px rgba(80, 40, 40, 0.12);
  transition: transform .2s ease, color .2s ease, background .2s ease;
}
.heart:hover {
  transform: scale(1.12);
  color: var(--coral);
}
.heart.on {
  color: #fff;
  background: linear-gradient(135deg, #f08a8a, #db6b6b);
  animation: pop .32s ease;
}
@keyframes pop {
  0% { transform: scale(0.8); }
  55% { transform: scale(1.22); }
  100% { transform: scale(1); }
}
h3 {
  font: 600 15px var(--font-body);
  margin: 14px 4px 6px;
}
.price {
  margin: 0 4px 12px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.price b { font-size: 17px; color: var(--coral-dark); }
s {
  color: var(--muted);
}
.add {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 11px 12px;
  background: linear-gradient(135deg, #df7f7b, #d96a6e);
  font: 700 13px var(--font-body);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  box-shadow: 0 8px 16px rgba(219, 107, 107, 0.22);
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.add:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(219, 107, 107, 0.32);
  filter: brightness(1.02);
}
.add:active {
  transform: translateY(0) scale(0.98);
}
@media (max-width: 900px) {
  .row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>