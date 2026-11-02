<template>
  <header class="hdr" :class="{ 'dashboard-mode': dashboardMode }">
    <div class="wrap bar">
      <a class="brand" @click="go('top')">
        <img class="brand-mark" src="/assets/logo-emblem.png" alt="Pre-Loved Thrift emblem" />
        <span class="brand-copy">
          <b>PRE-LOVED</b>
          <small>THRIFT</small>
        </span>
      </a>

      <nav>
        <a v-for="n in nav" :key="n.id" :class="{ on: n.id === active }" @click="go(n.id)">{{ n.label }}</a>
      </nav>

      <div class="acts">
        <button aria-label="Search thrift finds" :aria-pressed="!!searchOpen" :class="{ 'search-pill': true, tgon: searchOpen }" @click="$emit('open-search')">
          <ion-icon :icon="searchOpen ? search : searchOutline" />
          <span>Search thrift finds...</span>
        </button>

        <button class="icon-btn wishlist-btn" aria-label="Wishlist" @click="openWishlist">
          <ion-icon :icon="heartOutline" />
          <span v-if="wishCount" class="badge">{{ wishCount }}</span>
        </button>

        <button class="icon-btn cart-btn" aria-label="Cart" @click="openCart">
          <ion-icon :icon="bagHandle" />
          <span v-if="cartCount" class="badge">{{ cartCount }}</span>
        </button>

        <div v-if="user" class="profile-chip">
          <button type="button" class="profile-avatar-button" aria-label="Open buyer dashboard"
            title="Open buyer dashboard" @click.stop.prevent="openDashboard">
          <span class="profile-avatar">
            <img v-if="user.avatar" :src="user.avatar" alt="" />
            <template v-else>{{ user.name.charAt(0).toUpperCase() }}</template>
          </span>
          </button>
          <span class="profile-details">
            <strong>{{ user.name }}</strong>
            <small>{{ user.email }}</small>
          </span>
        </div>
        <button v-if="user" type="button" class="account-menu-toggle" aria-label="More account options"
          :aria-expanded="accountMenuOpen" aria-haspopup="menu" title="More account options"
          @click.stop.prevent="accountMenuOpen = !accountMenuOpen">
          <ion-icon :icon="chevronDownOutline" />
        </button>

        <button v-else type="button" aria-label="Account" :aria-expanded="user ? accountMenuOpen : undefined"
          :aria-pressed="!!profileOpen" :class="{ 'icon-btn': true, 'me': !!user, 'tgon': profileOpen && !user }"
          @click.stop.prevent="$emit('open-auth')">
          <ion-icon :icon="profileOpen ? person : personOutline" />
        </button>

        <div v-if="user && accountMenuOpen" class="account-menu">
          <div class="account-heading"><b>{{ user.name }}</b><small>{{ user.email }}</small><span>Buyer account</span></div>
          <button class="menu-logout" @click="accountMenuOpen = false; $emit('logout')"><ion-icon :icon="logOutOutline" /> Log out</button>
        </div>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { IonIcon } from '@ionic/vue'
import { searchOutline, search, personOutline, person, bagHandle, logOutOutline, heartOutline, chevronDownOutline } from 'ionicons/icons'

const nav = [{ id: 'top', label: 'Home' }, { id: 'shop', label: 'Shop' }, { id: 'stylist', label: 'Outfit Builder' }, { id: 'deals', label: 'Deals' }, { id: 'contact', label: 'Contact' }]
const props = defineProps<{ user: { name: string; email: string; avatar?: string } | null; searchOpen?: boolean; profileOpen?: boolean; dashboardMode?: boolean; cartCount?: number; wishCount?: number }>()
const emit = defineEmits<{
  (e: 'open-auth'): void
  (e: 'open-user'): void
  (e: 'open-seller-center'): void
  (e: 'rider-login'): void
  (e: 'logout'): void
  (e: 'open-search'): void
  (e: 'open-cart'): void
  (e: 'open-wish'): void
  (e: 'navigate', id: string): void
}>()

const active = ref('top'), accountMenuOpen = ref(false); let lock = 0
const openCart = () => (props.user ? emit('open-cart') : emit('open-auth'))
const openWishlist = () => (props.user ? emit('open-wish') : emit('open-auth'))
const openDashboard = () => {
  accountMenuOpen.value = false
  emit('open-user')
}
const content = () => document.querySelector('ion-content') as HTMLElement | null
function go(id: string) {
  active.value = id; lock = Date.now() + 800
  emit('navigate', id)
}
function spy(e: Event) {
  if (Date.now() < lock) return
  const el = e.target as HTMLElement
  let cur = 'top'
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) cur = 'contact'
  else for (const n of nav.slice(1)) {
    const t = document.getElementById(n.id)
    if (t && t.getBoundingClientRect().top <= window.innerHeight * 0.35) cur = n.id
  }
  active.value = cur
}
let scroller: HTMLElement | null = null
onMounted(async () => {
  try {
    const c = content()
    scroller = c?.shadowRoot?.querySelector<HTMLElement>('.inner-scroll') ?? null
    scroller?.addEventListener('scroll', spy, { passive: true })
  } catch { /* nav still works without scroll tracking */ }
})
onBeforeUnmount(() => scroller?.removeEventListener('scroll', spy))
</script>
<style scoped>
.hdr { --hdr-ink: #2f2726; position: sticky; top: 0; z-index: 50; background: rgba(251,248,246,.96); backdrop-filter: blur(10px); border-bottom: 1px solid #eee7e2; }
.hdr.dashboard-mode .wrap { max-width: none; margin: 0; padding-left: 0; }
.bar { display: flex; align-items: center; justify-content: space-between; min-height: 78px; gap: 22px; }
.brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; cursor: pointer; }
.brand-mark { width: 42px; height: 42px; object-fit: contain; border-radius: 50%; background: #fff; border: 1px solid #e8d8d8; box-shadow: 0 0 0 2px rgba(255,255,255,0.5); }
.brand-copy { display: flex; flex-direction: column; line-height: .9; }
.brand-copy b { font: 700 19px var(--font-head); letter-spacing: .5px; color: var(--hdr-ink); }
.brand-copy small { font-size: 11px; letter-spacing: 3px; color: var(--muted); font-weight: 700; }
nav { display: flex; gap: 30px; }
nav a { position: relative; cursor: pointer; color: var(--hdr-ink); font-weight: 500; font-size: 15px; padding: 6px 0; }
nav a::after { content: ''; position: absolute; left: 0; right: 0; bottom: -7px; height: 2px; background: var(--coral); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
nav a:hover, nav a.on { color: var(--coral); }
nav a:hover::after, nav a.on::after { transform: scaleX(1); }
.acts { display: flex; align-items: center; gap: 8px; position: relative; }
.acts button { border: 0; background: none; cursor: pointer; }
.search-pill { width: 220px; height: 42px; display: flex; align-items: center; justify-content: flex-start; gap: 8px; padding: 0 14px; border: 1px solid #ebded9; border-radius: 999px; background: rgba(255,255,255,.35); color: #8a7c79; font: 400 12px var(--font-body); }
.search-pill ion-icon { font-size: 16px; }
.search-pill:hover, .search-pill.tgon { border-color: #e2bfd0; background: rgba(255,255,255,.6); color: var(--coral-dark); }
.icon-btn { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.18); color: var(--hdr-ink); border: 1px solid #e9ddd6; transition: transform .2s ease, background .2s ease; position: relative; }
.icon-btn:hover { transform: translateY(-1px); background: rgba(219,107,107,.08); }
.icon-btn.me { background: var(--coral); color: #fff; border-color: var(--coral); font: 700 15px var(--font-body); }
.icon-btn.me:hover { background: var(--coral-dark); }
.icon-btn ion-icon { font-size: 18px; }
.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 6px;
  border: 1px solid #efd7d1;
  border-radius: 999px;
  background: rgba(255,255,255,0.7);
  box-shadow: 0 10px 20px rgba(64, 33, 31, 0.06);
  color: var(--hdr-ink);
}
.profile-avatar-button { padding: 0; border-radius: 50%; }
.profile-avatar-button:focus-visible { outline: 2px solid var(--coral-dark); outline-offset: 2px; }
.account-menu-toggle { width: 25px; height: 34px; display: grid; place-items: center; border-radius: 8px; color: #806b64; }
.account-menu-toggle:hover, .account-menu-toggle[aria-expanded="true"] { background: #fbefed !important; color: var(--coral-dark); }
.account-menu-toggle ion-icon { font-size: 15px; }
.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--coral);
  color: #fff;
  font: 700 15px var(--font-body);
  overflow: hidden;
}
.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-details {
  display: grid;
  gap: 2px;
  text-align: left;
  line-height: 1.1;
}
.profile-details strong {
  font-size: 12px;
  color: var(--ink);
}
.profile-details small {
  font-size: 10px;
  color: var(--muted);
}
.badge { position: absolute; top: -5px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: var(--coral); color: #fff; display: grid; place-items: center; font: 700 10px var(--font-body); }
.account-menu { position: absolute; z-index: 60; top: calc(100% + 10px); right: 0; width: 238px; padding: 10px; border: 1px solid #f0e6e0; border-radius: 17px; background: #fff; box-shadow: 0 16px 38px #39231f24; }
.account-heading { display: grid; gap: 4px; padding: 9px 10px 12px; border-bottom: 1px solid #f1e9e4; }
.account-heading b { overflow: hidden; color: var(--ink); font: 700 13px var(--font-body); text-overflow: ellipsis; white-space: nowrap; }
.account-heading small { overflow: hidden; color: var(--muted); font: 10px var(--font-body); text-overflow: ellipsis; white-space: nowrap; }
.account-heading span { color: var(--coral-dark); font: 700 9px var(--font-body); letter-spacing: .08em; text-transform: uppercase; }
.account-menu button { width: 100%; display: flex; justify-content: flex-start; gap: 10px; border-radius: 10px; color: #584942; font: 600 11px var(--font-body); padding: 10px 8px; }
.account-menu button ion-icon { color: var(--coral-dark); font-size: 16px; }
.account-menu button:hover { background: #fbf3f0; }
.account-menu button.menu-logout { border-top: 1px solid #f1e9e4; color: #985b56; }
@media (max-width: 1050px) and (min-width: 821px) {
  .bar { gap: 12px; }
  .brand { gap: 8px; }
  .brand-mark { width: 36px; height: 36px; }
  .brand-copy b { font-size: 16px; }
  .brand-copy small { font-size: 9px; letter-spacing: 2px; }
  nav { flex: 1; min-width: 0; justify-content: space-between; gap: 8px; }
  nav a { white-space: nowrap; font-size: 12px; }
  .acts { flex-shrink: 0; gap: 5px; }
  .search-pill { width: 34px; height: 34px; justify-content: center; padding: 0; }
  .search-pill span { display: none; }
  .icon-btn { width: 32px; height: 32px; }
  .profile-chip { gap: 6px; padding-right: 7px; }
  .profile-details small { display: none; }
}
@media (max-width: 1100px) and (min-width: 1051px) { .search-pill { width: 170px; } nav { gap: 20px; } }
@media (max-width: 820px) {
  .bar { flex-wrap: wrap; row-gap: 10px; padding: 10px 0; }
  .bar nav { width: 100%; order: 3; justify-content: space-between; gap: 8px; overflow-x: auto; scrollbar-width: none; }
  .bar nav::-webkit-scrollbar { display: none; }
  .bar nav a { flex-shrink: 0; white-space: nowrap; font-size: 11px; }
  .search-pill { width: 42px; padding: 0; justify-content: center; }
  .search-pill span { display: none; }
}
</style>
