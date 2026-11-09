<template>
  <section class="hero">
    <div class="wrap">
      <div class="grid">
        <div class="copy">
          <span class="tag"><ion-icon :icon="leafOutline" /> Sustainable &amp; Vintage</span>
          <h1>Stylish Looks.<br />Everyday <em>You.</em></h1>
          <p>Trendy thrift styles, premium quality &amp; unmatched comfort with styling recommendations.</p>

          <div class="cta">
            <button class="btn btn-coral" @click="go('shop')">Shop Now <ion-icon :icon="arrowForward" /></button>
            <button class="btn btn-ghost" @click="go('stylist')"><ion-icon :icon="colorWandOutline" /> Try Outfit Builder</button>
          </div>

          <div class="proof">
            <div class="av">
              <i style="background:#3c4a7a" />
              <i style="background:#3f8fb6" />
              <i style="background:#2a2220" />
            </div>
            <div>
              <b>Loved by 10K+ Women</b>
              <div class="rate">
                <ion-icon v-for="n in 5" :key="n" :icon="star" />
                <span>4.8 (2.5K Reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="visual">
          <div class="image-card">
            <span class="floating-pill top-pill"><ion-icon :icon="sparklesOutline" /> Second-hand, first-class</span>
            <div class="image-frame">
              <img src="/assets/hero-model.png" alt="Model wearing a curated second-hand look" />
            </div>
            <span class="floating-pill bottom-pill"><ion-icon :icon="shieldCheckmarkOutline" /> Curated &amp; authenticated</span>
          </div>
        </div>
      </div>

      <div class="benefits" aria-label="Shopping benefits">
        <article><ion-icon :icon="cubeOutline" aria-hidden="true" /><div><b>Free shipping</b><span>On orders over ₱2,900</span></div></article>
        <article><ion-icon :icon="shieldCheckmarkOutline" aria-hidden="true" /><div><b>Quality checked</b><span>Every piece inspected</span></div></article>
        <article><ion-icon :icon="refreshOutline" aria-hidden="true" /><div><b>Easy returns</b><span>7-day return window</span></div></article>
        <article><ion-icon :icon="cardOutline" aria-hidden="true" /><div><b>Secure payment</b><span>GCash · Card · COD</span></div></article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  leafOutline,
  arrowForward,
  colorWandOutline,
  star,
  cubeOutline,
  shieldCheckmarkOutline,
  refreshOutline,
  cardOutline,
  sparklesOutline,
} from 'ionicons/icons'

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
</script>

<style scoped>
.hero {
  padding: 42px 0 28px;
  background: linear-gradient(180deg, rgba(244, 232, 227, 0.8) 0%, rgba(246, 239, 235, 0.92) 100%);
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.12fr);
  gap: 56px;
  align-items: center;
}
.copy { padding: 30px 0; }
.tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(219, 107, 107, 0.12);
  color: var(--coral-dark);
  font: 700 12px var(--font-body);
}
.tag ion-icon { font-size: 13px; }
h1 {
  margin: 24px 0 18px;
  font-family: var(--font-head);
  font-size: clamp(54px, 5vw, 94px);
  line-height: .9;
  letter-spacing: -0.06em;
}
h1 em { color: var(--coral); font-style: normal; }
p {
  max-width: 470px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.6;
}
.cta {
  display: flex;
  gap: 14px;
  margin: 28px 0;
  flex-wrap: wrap;
}
.btn {
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 15px 22px;
  font: 600 16px var(--font-body);
  cursor: pointer;
}
.btn-coral {
  background: var(--coral);
  color: #fff;
  box-shadow: 0 14px 24px rgba(219, 107, 107, 0.3);
}
.btn-ghost {
  background: rgba(255,255,255,0.38);
  border-color: rgba(219, 107, 107, 0.42);
  color: var(--coral-dark);
}
.proof {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  border-radius: 16px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(127, 109, 99, 0.16);
}
.av {
  display: flex;
  align-items: center;
}
.av i {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  margin-left: -8px;
  border: 2px solid rgba(255,255,255,0.7);
  display: block;
}
.av i:first-child { margin-left: 0; }
.proof b {
  display: block;
  font-size: 13px;
  margin-bottom: 2px;
}
.rate {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--muted);
  font-size: 12px;
}
.rate ion-icon { color: #f0b13b; }
.visual { display: flex; justify-content: center; }
.image-card {
  position: relative;
  width: min(100%, 650px);
  padding: 18px 18px 14px;
  border-radius: 38px;
  background: rgba(255,255,255,0.28);
  border: 1px solid rgba(170, 133, 123, 0.2);
}
.image-frame {
  overflow: hidden;
  border-radius: 34px;
  border: 4px solid rgba(255,255,255,0.95);
  box-shadow: 0 30px 55px rgba(187, 120, 108, 0.22);
}
.image-frame img {
  display: block;
  width: 100%;
  height: min(78vw, 640px);
  max-height: 712px;
  object-fit: cover;
  object-position: center;
}
.floating-pill {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 24px rgba(72, 53, 47, 0.08);
  border: 1px solid rgba(121, 103, 98, 0.08);
  color: #332c2a;
  font: 600 15px var(--font-body);
}
.top-pill {
  top: 26px;
  left: 34px;
}
.bottom-pill {
  right: 28px;
  bottom: 24px;
}
.floating-pill ion-icon { font-size: 14px; color: var(--coral-dark); }
.benefits {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}
.benefits article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(135, 115, 108, 0.12);
  border-radius: 18px;
}
.benefits article ion-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(219,107,107,.12);
  color: var(--coral-dark);
  font-size: 20px;
}
.benefits article b {
  display: block;
  color: #3c3130;
  font-size: 13px;
}
.benefits article span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
}
@media (max-width: 820px) {
  .hero { padding-top: 30px; }
  .grid { grid-template-columns: 1fr; gap: 22px; }
  .copy { padding-top: 10px; }
  h1 { font-size: clamp(44px, 12vw, 74px); }
  .floating-pill { font-size: 13px; padding: 10px 12px; }
  .benefits { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .image-card { padding: 12px; }
  .top-pill { top: 16px; left: 16px; }
  .bottom-pill { right: 16px; bottom: 16px; }
  .benefits { gap: 10px; }
  .benefits article { padding: 12px 10px; }
  .benefits article b { font-size: 11px; }
  .benefits article span { font-size: 10px; }
}
</style>
