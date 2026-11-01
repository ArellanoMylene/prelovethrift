<template>
  <ion-modal :is-open="open" class="search-modal" @didDismiss="$emit('close')" @didPresent="input?.focus()">
    <div class="srch">
      <label class="bar"><ion-icon :icon="searchOutline" />
        <input ref="input" v-model="q" placeholder="Search dresses, denim, tops..." aria-label="Search" />
        <button type="button" aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button></label>
      <div class="body">
        <template v-if="!q.trim()">
          <h4>Popular searches</h4>
          <div class="chips"><button v-for="p in popular" :key="p" @click="q = p">{{ p }}</button></div>
        </template>
        <template v-else>
          <ul v-if="results.length"><li v-for="p in results" :key="p.id" @click="pick">
            <img :src="p.img" :alt="p.name" /><div><b>{{ p.name }}</b><small>{{ p.cat }}</small></div><span>{{ formatPeso(p.price) }}</span></li></ul>
          <p v-else class="empty">No matches for "{{ q }}". Try dress, denim or tops.</p>
        </template>
      </div>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { searchOutline, closeOutline } from 'ionicons/icons'
import { products } from '../data/mockData'
import { formatPeso } from '../utils/currency'
defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const q = ref(''); const input = ref<HTMLInputElement>()
const popular = ['Dress', 'Denim', 'Blouse', 'Jeans']
const results = computed(() => { const s = q.value.trim().toLowerCase(); return products.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(s)) })
function pick() { emit('close'); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }) }
</script>
<style>
ion-modal.search-modal { --width: min(620px, 94vw); --height: auto; --max-height: 80vh; --border-radius: 24px; align-items: flex-start; padding-top: 9vh; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.srch { background: #fff; display: flex; flex-direction: column; max-height: 80vh; }
.srch .bar { display: flex; align-items: center; gap: 12px; padding: 18px 22px; border-bottom: 1px solid #f0e6e0; font-size: 22px; color: var(--coral); }
.srch .bar input { flex: 1; border: 0; outline: none; font: 500 17px var(--font-body); color: var(--ink); background: transparent; }
.srch .bar button { background: var(--sand); border: 0; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; }
.srch .body { padding: 18px 22px 24px; overflow-y: auto; } .srch h4 { margin: 0 0 12px; font: 700 13px var(--font-body); color: var(--muted); }
.srch .chips { display: flex; gap: 8px; flex-wrap: wrap; } .srch .chips button { border: 1px solid #eadfd8; background: var(--cream); border-radius: 999px; padding: 8px 15px; font: 600 13px var(--font-body); cursor: pointer; }
.srch ul { list-style: none; margin: 0; padding: 0; } .srch li { display: flex; align-items: center; gap: 14px; padding: 10px; border-radius: 16px; cursor: pointer; }
.srch li:hover { background: var(--cream); } .srch li img { width: 56px; height: 56px; object-fit: contain; background: #f6f1ec; border-radius: 12px; }
.srch li div { flex: 1; display: flex; flex-direction: column; } .srch li small { color: var(--muted); } .srch li span { font-weight: 700; color: var(--coral-dark); }
.srch .empty { color: var(--muted); text-align: center; margin: 16px 0; }
</style>