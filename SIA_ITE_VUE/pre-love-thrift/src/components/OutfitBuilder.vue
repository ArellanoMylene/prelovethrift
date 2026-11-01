<template>
 <section id="stylist" class="section"><div class="wrap">
  <div class="sec-head"><div><h2>Outfit Builder</h2><p>Choose your character, then style it with pieces from your cart.</p></div></div>
 <div class="builder">
 <div class="stage" ref="stageEl" :class="{ over }" @pointermove="tilt" @pointerleave="untilt">
 <div class="model" :style="{ transform: `scale(${AVATAR_SCALE}) rotateY(${ry}deg) rotateX(${rx}deg)` }">
 <div class="figure">
 <FigureCharacter :character="char" :skin-tone="skin.swatch"
 :top="worn.top" :bottom="worn.bottom" :dress="worn.dress" :shoes="worn.shoes" />
 </div>
 </div>
 <p v-if="!wornList.length" class="hint">Drop an outfit here</p>

 </div>

 <div class="panel">
 <h3>Character</h3>
 <div class="chars"><button v-for="c in characters" :key="c.id" :class="{ on: c.id === char.id }"
 @click="setCharacter(c)">{{ c.label }}</button></div>
 <h3>Body size</h3>
 <div class="seg"><button v-for="t in bodyTypes" :key="t.id" :class="{ on: body === t.id }"
 @click="setBodyType(t.id)">{{ t.label }}</button></div>
 <h3>Skin tone</h3>
 <div class="tones"><button v-for="t in skinTones" :key="t.label" :class="{ on: t.label === skin.label }"
 :style="{ background: t.swatch }" :aria-label="t.label" :title="t.label" @click="skin = t" /></div>
 <h3>Wardrobe <small>from your cart · drag onto the character · or tap to wear</small></h3>
 <div v-if="wardrobe.length" class="tray"><div v-for="g in wardrobe" :key="g.id" class="piece" @pointerdown="down($event, g)">
 <img :src="g.img" :alt="g.name" draggable="false" /><span>{{ g.name }}</span></div></div>
 <p v-else class="empty">Your cart is empty — add pieces from New Arrivals, then build your look here.</p>
 <div class="actions">
 <button class="btn btn-coral" @click="checkoutOutfit">Checkout</button>
 <button class="btn btn-ghost" @click="clearOutfit">Clear outfit</button>
 </div>
 </div>
 </div>
 <img v-if="drag" class="ghost" :src="drag.g.img" :style="{ left: drag.x + 'px', top: drag.y + 'px' }"
 alt="" />
 </div></section>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { characters, bodyTypes, products, skinTones, type CartItem, type Character, type Slot } from '../data/mockData'
import FigureCharacter from './FigureCharacter.vue'
const props = defineProps<{ cart: CartItem[] }>()
const emit = defineEmits<{ (e: 'needLogin', action: () => void): void; (e: 'outfitCheckout', items: CartItem[]): void }>()

const char = ref(characters[0])
const body = ref<(typeof bodyTypes)[number]['id']>('petite')
const skin = ref(skinTones[1])
const worn = ref<Partial<Record<Slot, CartItem>>>({})
const wornList = computed(() => Object.values(worn.value).filter(Boolean) as CartItem[])
const stageEl = ref<HTMLElement>(); const over = ref(false)
const drag = ref<{ g: CartItem; x: number; y: number } | null>(null)

function setCharacter(character: Character) {
 char.value = character
 body.value = character.build === 'chubby' ? 'plus' : 'petite'
}

function setBodyType(value: (typeof bodyTypes)[number]['id']) {
 body.value = value
 char.value = characters.find(c => c.gender === char.value.gender &&
  c.build === (value === 'plus' ? 'chubby' : 'petite')) ?? char.value
}

/* ================= 3D TILT (pointer follows) ================= */
/* Avatar occupies ~90% of the stage so it sits balanced with a small margin. */
const AVATAR_SCALE = 0.9
const rx = ref(0), ry = ref(0)
function tilt(e: PointerEvent) {
  const r = stageEl.value!.getBoundingClientRect()
  ry.value = ((e.clientX - r.left) / r.width - 0.5) * 14
  rx.value = -((e.clientY - r.top) / r.height - 0.5) * 6
}
function untilt() { rx.value = 0; ry.value = 0 }

/* Only pieces with a known slot can be worn, and they all come from the cart. */
const wardrobe = computed(() => props.cart.flatMap(item => {
 const product = products.find(candidate => String(candidate.id) === String(item.id))
 const slot = product?.slot ?? item.slot
 return slot ? [{ ...item, img: product?.img ?? item.img, slot, fit: product?.fit ?? item.fit }] : []
}))

function checkoutOutfit() {
  const items = wornList.value
  if (items.length === 0) return
  emit('needLogin', () => emit('outfitCheckout', items))
}
function clearOutfit() { worn.value = {} }

function wear(g: CartItem) {
 if (!g.slot) return
 const w = { ...worn.value }
 if (g.slot === 'dress') { delete w.top; delete w.bottom }
 else if (g.slot === 'top' || g.slot === 'bottom') delete w.dress
 w[g.slot] = g; worn.value = w
}
function down(e: PointerEvent, g: CartItem) {
 const sx = e.clientX, sy = e.clientY; let moved = false
 const mv = (m: PointerEvent) => {
 if (!moved && Math.hypot(m.clientX - sx, m.clientY - sy) < 6) return
 moved = true; drag.value = { g, x: m.clientX, y: m.clientY }
 const r = stageEl.value!.getBoundingClientRect(); over.value = m.clientX > r.left && m.clientX < r.right &&
 m.clientY > r.top && m.clientY < r.bottom
 }
 const up = () => {
 window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up)
 if (!moved || over.value) wear(g); drag.value = null; over.value = false
 }
 window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
}
</script>
<style scoped>
.builder { display: grid; grid-template-columns: minmax(280px, 380px) 1fr; gap: 32px; background: #fff; border:
 1px solid #f0e6e0; border-radius: 36px; padding: 28px; }
.stage { position: relative; aspect-ratio: 1 / 2; width: 100%; max-width: 320px; max-height: 640px; border-radius: 28px; background: linear-gradient(#f9e9e4, #f3ebe4); transition: box-shadow .2s; margin: 0 auto; overflow: hidden; perspective: 900px; }
.stage.over { box-shadow: 0 0 0 4px var(--coral); }
.model { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .15s ease-out; }
/* The character and garment clips share one SVG coordinate system. */
.figure { position: absolute; inset: 0; transform-origin: center; filter: drop-shadow(0 8px 10px #0002); transition: transform .25s ease-out; }
.hint { position: absolute; bottom: 14px; width: 100%; text-align: center; font-size: 12px; color: var(--muted);
 margin: 0; }

.panel h3 { font: 700 15px var(--font-body); margin: 0 0 12px; } .panel h3 small { font-weight: 500; color:
 var(--muted); margin-left: 6px; }
.panel h3:not(:first-child) { margin-top: 26px; }
.chars { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.chars button { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 14px; border-radius: 14px; border:
 1.5px solid #eadfd8; background: var(--cream); cursor: pointer; font: 600 13px var(--font-body); color:
 var(--ink); transition: border-color .2s, background .2s; }
.chars button.on { border-color: var(--coral); background: var(--coral-soft); }
.seg { display: flex; gap: 10px; }
.seg button { flex: 1; padding: 11px 12px; border-radius: 14px; border: 1.5px solid #eadfd8; background: var(--cream); cursor: pointer; font: 600 13px var(--font-body); color: var(--ink); transition: border-color .2s, background .2s, color .2s; }
.seg button.on { border-color: var(--coral); background: var(--coral-soft); color: var(--coral-dark); }
.tones { display: flex; gap: 12px; }
.tones button { width: 38px; height: 38px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 1.5px #e0d3ca; cursor: pointer; transition: transform .2s, box-shadow .2s; }
.tones button:hover { transform: translateY(-2px); }
.tones button.on { box-shadow: 0 0 0 3px var(--coral); }
.tray { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 12px; }
.piece { background: var(--cream); border: 1px solid #eadfd8; border-radius: 16px; padding: 8px; text-align:
 center; cursor: grab; touch-action: none; user-select: none; transition: transform .2s, border-color .2s; }
.piece:hover { transform: translateY(-2px); border-color: var(--coral); }
.piece img { width: 100%; height: 96px; object-fit: contain; pointer-events: none; } .piece span { font-size:
 12px; font-weight: 600; }
.empty { background: var(--cream); border: 1px dashed #e5d8cf; border-radius: 16px; padding: 18px; text-align:
 center; font-size: 13px; color: var(--muted); margin: 0; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
.actions .btn { flex: 1; justify-content: center; padding: 14px 20px; }
.actions .btn:disabled { opacity: .5; cursor: not-allowed; }
.ghost { position: fixed; z-index: 9999; height: 130px; transform: translate(-50%, -50%) rotate(-4deg); pointer-events: none; filter: drop-shadow(0 12px 14px #0004); }
@media (max-width: 820px) { .builder { grid-template-columns: 1fr; padding: 18px; } .stage { max-width: 300px; }
 }
</style>