<template>
  <ion-modal :is-open="open" class="wish-modal" @didDismiss="$emit('close')">
    <div class="lm">
      <div class="top">
        <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
        <span class="mark"><ion-icon :icon="heart" /></span>
        <h3>Favorites</h3>
        <small>{{ items.length }} {{ items.length === 1 ? 'piece' : 'pieces' }} saved for later</small>
      </div>
      <div v-if="!items.length" class="empty">
        <ion-icon :icon="heartOutline" />
        <p>No favorites yet. Tap the heart on a product to save it here.</p>
      </div>
      <ul v-else class="list">
        <li v-for="it in items" :key="it.id">
          <div class="row">
            <img :src="it.img" :alt="it.name" />
            <div class="info"><b>{{ it.name }}</b><span class="price">{{ formatPeso(it.price) }}</span></div>
            <div class="acts">
              <button class="ico add" aria-label="Move to cart" @click="$emit('add-cart', it)">
                <ion-icon :icon="bagAddOutline" />
              </button>
              <button class="ico del" aria-label="Remove" @click="$emit('remove', it.id)">
                <ion-icon :icon="trashOutline" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, trashOutline, heart, heartOutline, bagAddOutline } from 'ionicons/icons'
import type { CartItem } from '../data/mockData'
import { formatPeso } from '../utils/currency'

defineProps<{ open: boolean; items: CartItem[] }>()
defineEmits<{ (e: 'close'): void; (e: 'remove', id: CartItem['id']): void; (e: 'add-cart', item: CartItem): void }>()
</script>
<style scoped>
ion-modal.wish-modal { --width: min(420px, 92vw); --height: min(640px, 90vh); --border-radius: 26px; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.lm { display: flex; flex-direction: column; height: 100%; background: #fff; }
.top { position: relative; text-align: center; padding: 26px 22px 20px; color: #fff;
  background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.top .x { position: absolute; top: 14px; right: 14px; background: #fff3; color: #fff; border: 0;
  border-radius: 50%; width: 32px; height: 32px; cursor: pointer; display: grid; place-items: center; font-size: 18px; }
.top .mark { width: 56px; height: 56px; border-radius: 50%; background: #fbf9f6; color: var(--coral-dark);
  display: inline-grid; place-items: center; font-size: 26px; margin-bottom: 10px; border: 2px solid #fff; }
.top h3 { color: #fff; font-size: 22px; } .top small { opacity: .9; }
.empty { padding: 44px 26px; text-align: center; color: var(--muted); display: grid; gap: 10px; justify-items: center; margin: 0; }
.empty ion-icon { font-size: 42px; color: #e0cfc7; }
.empty p { margin: 0; font-size: 14px; }
.list { list-style: none; margin: 0; padding: 12px 14px; overflow-y: auto; flex: 1; }
.list li { padding: 10px; border-radius: 18px; transition: background .2s; }
.list li:hover { background: var(--cream); }
.row { display: flex; align-items: center; gap: 14px; }
.row img { width: 62px; height: 62px; object-fit: contain; border-radius: 14px; background: var(--sand); flex-shrink: 0; }
.info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.info b { font: 600 14px var(--font-body); color: var(--ink); }
.info .price { color: var(--coral-dark); font-weight: 700; }
.acts { display: flex; gap: 8px; flex-shrink: 0; }
.ico { width: 38px; height: 38px; border-radius: 12px; cursor: pointer; display: grid; place-items: center; font-size: 17px; border: 1.5px solid #f0d4d4; background: #fff; color: var(--coral-dark); transition: background .2s, transform .2s; }
.ico:hover { transform: translateY(-1px); }
.ico.add { background: var(--coral); border-color: var(--coral); color: #fff; box-shadow: 0 8px 18px rgba(219,107,107,.3); }
.ico.add:hover { background: var(--coral-dark); }
.ico.del:hover { background: var(--coral-soft); }
</style>
