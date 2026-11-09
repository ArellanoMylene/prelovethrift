<template>
  <ion-modal :is-open="open" class="user-modal" @didDismiss="$emit('close')">
    <div class="usr" v-if="user">
      <div class="top">
        <button class="x" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
        <span class="av">{{ user.name.charAt(0).toUpperCase() }}</span>
        <h3>{{ user.name }}</h3><small>{{ user.email }}</small>
      </div>
      <ul>
        <li v-for="r in rows" :key="r.label" @click="pick(r)"><ion-icon :icon="r.icon" /><span>{{ r.label }}</span><ion-icon :icon="chevronForward" class="ch" /></li>
      </ul>
      <button class="out" @click="$emit('logout')"><ion-icon :icon="logOutOutline" /> Log out</button>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, bagHandleOutline, heartOutline, locationOutline, settingsOutline, chevronForward, logOutOutline } from 'ionicons/icons'
defineProps<{ open: boolean; user: { name: string; email: string } | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'logout'): void; (e: 'open-wish'): void; (e: 'open-cart'): void }>()
const rows = [
  { label: 'My orders', action: 'open-cart', icon: bagHandleOutline },
  { label: 'Wishlist', action: 'open-wish', icon: heartOutline },
  { label: 'Saved addresses', action: '', icon: locationOutline },
  { label: 'Account settings', action: '', icon: settingsOutline }
]
function pick(r: { action: string }) {
  if (r.action === 'open-wish') { emit('close'); emit('open-wish') }
  else if (r.action === 'open-cart') { emit('close'); emit('open-cart') }
}
</script>
<style>
ion-modal.user-modal { --width: min(380px, 92vw); --height: auto; --border-radius: 26px; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.usr { background: #fff; padding-bottom: 20px; }
.usr .top { position: relative; text-align: center; padding: 34px 20px 24px; color: #fff; background: linear-gradient(160deg, #e5807f, #b45a64 70%, #96507a); }
.usr .x { position: absolute; top: 14px; right: 14px; background: #fff3; color: #fff; border: 0; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; }
.usr .av { width: 76px; height: 76px; border-radius: 50%; background: #fbf9f6; color: var(--coral-dark); display: inline-grid; place-items: center; font: 700 32px var(--font-head); margin-bottom: 12px; }
.usr h3 { color: #fff; font-size: 22px; } .usr small { opacity: .9; }
.usr ul { list-style: none; margin: 8px 14px; padding: 0; } .usr li { display: flex; align-items: center; gap: 14px; padding: 15px 12px; border-radius: 14px; cursor: pointer; font-weight: 600; font-size: 15px; }
.usr li:hover { background: var(--cream); } .usr li > ion-icon:first-child { font-size: 21px; color: var(--coral); } .usr li span { flex: 1; } .usr .ch { color: #b9aaa3; }
.usr .out { display: flex; gap: 8px; align-items: center; justify-content: center; width: calc(100% - 28px); margin: 6px 14px 0; padding: 13px; border-radius: 14px; border: 1.5px solid #f0d4d4; background: #fff; color: var(--coral-dark); font: 600 14px var(--font-body); cursor: pointer; }
</style>