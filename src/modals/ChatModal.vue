<template>
  <ion-modal :is-open="open" class="chat-modal" @didDismiss="$emit('close')">
    <div class="chat">
      <header>
        <img src="/assets/logo.png" alt="" />
        <div><b>Ask AI</b><small>Your thrift stylist</small></div>
        <button aria-label="Close" @click="$emit('close')"><ion-icon :icon="closeOutline" /></button>
      </header>
      <div class="msgs" ref="box">
        <div v-for="(m, i) in msgs" :key="i" :class="['m', m.from]">{{ m.text }}</div>
        <div v-if="typing" class="m bot dots"><i /><i /><i /></div>
      </div>
      <div class="chips"><button v-for="c in chips" :key="c" @click="send(c)">{{ c }}</button></div>
      <form @submit.prevent="send(text)">
        <input v-model="text" placeholder="Ask about styles, sizes or deals" aria-label="Message" />
        <button class="go" aria-label="Send"><ion-icon :icon="sendIcon" /></button>
      </form>
    </div>
  </ion-modal>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { IonModal, IonIcon } from '@ionic/vue'
import { closeOutline, send as sendIcon } from 'ionicons/icons'
defineProps<{ open: boolean }>()
defineEmits<{ (e: 'close'): void }>()
const msgs = ref([{ from: 'bot', text: 'Hi! I can suggest outfits, find pieces in your budget or explain our deals. What are you shopping for?' }])
const chips = ['Dress for a dinner', 'Denim ideas', 'What is on sale?']
const text = ref(''); const typing = ref(false); const box = ref<HTMLElement>()
/* Demo replies. Replace the body of reply() with a call to your Gemini backend. */
function reply(q: string) {
  const s = q.toLowerCase()
  if (/dress|dinner|party/.test(s)) return 'Try the Mauve Evening Dress with simple jewellery. You can see how it looks on your character in the Outfit Builder.'
  if (/denim|jean/.test(s)) return 'Vintage denim pairs well with the Cream Blouse. Check the Denim Wear category for the newest pairs.'
  if (/sale|deal|discount|off/.test(s)) return 'Selected women\'s fashion is up to 30% off for a limited time. Scroll to the Deals banner to grab it.'
  if (/shoe|bag|accessor/.test(s)) return 'Shoes and bags are in their own categories under Shop. Neutral tones work with most outfits.'
  return 'I can help with outfit ideas, categories and deals. Try asking for a dress, denim or what is on sale.'
}
async function send(t: string) {
  const q = t.trim(); if (!q || typing.value) return
  msgs.value.push({ from: 'me', text: q }); text.value = ''; typing.value = true
  await nextTick(); box.value?.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' })
  setTimeout(async () => {
    typing.value = false; msgs.value.push({ from: 'bot', text: reply(q) })
    await nextTick(); box.value?.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' })
  }, 700)
}
</script>
<style>
ion-modal.chat-modal { --width: min(420px, 94vw); --height: min(620px, 90vh); --border-radius: 26px; --box-shadow: 0 30px 70px rgba(60,20,20,.3); }
.chat { display: flex; flex-direction: column; height: 100%; background: var(--cream); }
.chat header { display: flex; align-items: center; gap: 12px; padding: 16px 18px; background: linear-gradient(135deg, #e47a7a, #c45f5f); color: #fff; }
.chat header img { width: 40px; height: 40px; border-radius: 50%; background: #fbf9f6; object-fit: cover; }
.chat header div { flex: 1; display: flex; flex-direction: column; } .chat header small { opacity: .85; font-size: 12px; }
.chat header button { background: #fff3; border: 0; color: #fff; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; }
.chat .msgs { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
.chat .m { max-width: 82%; padding: 11px 15px; border-radius: 18px; font-size: 14px; line-height: 1.5; }
.chat .bot { background: #fff; border: 1px solid #f0e6e0; border-bottom-left-radius: 4px; align-self: flex-start; }
.chat .me { background: var(--coral); color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
.chat .dots { display: flex; gap: 4px; } .chat .dots i { width: 7px; height: 7px; border-radius: 50%; background: #cdb9b0; animation: pl-bounce 1s infinite; }
.chat .dots i:nth-child(2) { animation-delay: .15s; } .chat .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes pl-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
.chat .chips { display: flex; gap: 8px; padding: 0 18px 10px; flex-wrap: wrap; }
.chat .chips button { border: 1px solid #eadfd8; background: #fff; border-radius: 999px; padding: 7px 13px; font: 600 12px var(--font-body); cursor: pointer; color: var(--coral-dark); }
.chat form { display: flex; gap: 10px; padding: 12px 16px 16px; border-top: 1px solid #eee3dc; background: #fff; }
.chat form input { flex: 1; border: 1.5px solid #eadfd8; border-radius: 999px; padding: 12px 16px; font: 14px var(--font-body); outline: none; background: var(--cream); }
.chat form input:focus { border-color: var(--coral); }
.chat .go { width: 44px; height: 44px; border-radius: 50%; border: 0; background: var(--coral); color: #fff; cursor: pointer; font-size: 18px; }
</style>