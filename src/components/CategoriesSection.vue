<template>
 <section id="shop" class="section"><div class="wrap">
 <div class="sec-head"><h2>Shop by Category</h2><a class="link" href="#shop" @click.prevent="emit('navigate', 'shop')">View All Categories →</a></div>
 <div class="row"><article v-for="c in categories" :key="c.name" :style="{ background: `linear-gradient(#fff0
 30%, ${c.bg})`, borderColor: c.bg }">
 <img :src="c.img" :alt="c.name" /><h3>{{ c.name }}</h3><span>{{ c.count }}</span></article></div>
 </div></section>
</template>
<script setup lang="ts">
import { categories } from '../data/mockData'

const emit = defineEmits<{
  (e: 'navigate', id: string): void
}>()
</script>
<style scoped>
.row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
article { border: 1px solid; border-radius: 26px; padding: 18px 18px 22px; text-align: center; cursor: pointer; display: flex; flex-direction: column; }
article img { width: 100%; aspect-ratio: 1 / 1; object-fit: contain; object-position: center; background: #f8f1ee; border-radius: 20px; display: block; padding: 18px; } 
h3 { font-size: 16px; margin: 14px 0 4px; } span { font-size: 13px; color: var(--muted); }
@media (max-width: 900px) { .row { grid-template-columns: repeat(2, 1fr); } }
</style>
