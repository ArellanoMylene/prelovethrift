<template>
 <footer id="contact"><div class="wrap cols">
 <div><div class="b"><img src="/assets/logo.png" alt="" /><b>PRE-LOVED Thrift</b></div>
 <p>Sustainable vintage fashion and curated wardrobe essentials for conscious everyday wear</p>
 <div class="soc"><span v-for="i in [logoInstagram, logoFacebook, logoPinterest]" :key="i"><ion-icon
 :icon="i" /></span></div></div>
 <div><h4>QUICK LINKS</h4><a>Women Dresses</a><a>Tops &amp; T-shirts</a><a>Denim Wear</a><a>Shoes &amp;
 Footwear</a></div>
 <div><h4>CUSTOMER CARE</h4><a>Track Your Order</a><a>Return Policy</a><a>Shipping Information</a><a>Contact
 Support</a></div>
 <div><h4>NEWSLETTER</h4><p>Subscribe to get special offers, free giveaways, and once-in-a-lifetime
 deals.</p>
 <input placeholder="Enter your email" /><button class="btn btn-coral">Subscribe</button></div>
 </div>
 <div class="wrap bottom"><span>© 2026 PRE-LOVED Thrift. All rights reserved.</span><span><a>Privacy
 Policy</a><a>Terms of Service</a></span></div></footer>
</template>
<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { logoInstagram, logoFacebook, logoPinterest } from 'ionicons/icons'
</script>
<style scoped>
footer { background: #f3ebe4; padding: 56px 0 24px; margin-top: 30px; } .cols { display: grid;
 grid-template-columns: 1.3fr 1fr 1fr 1.3fr; gap: 36px; }
.b { display: flex; align-items: center; gap: 10px; } .b img { width: 38px; border-radius: 50%; } .b b { font:
 700 18px var(--font-head); }
p { font-size: 13px; color: var(--muted); line-height: 1.6; } h4 { font-size: 13px; letter-spacing: .5px;
 margin: 0 0 14px; }
a { display: block; font-size: 13px; color: var(--muted); margin-bottom: 10px; cursor: pointer; }
.soc { display: flex; gap: 10px; } .soc span { width: 34px; height: 34px; background: #fff; border-radius: 50%;
 display: grid; place-items: center; }
input { width: 100%; border: 1px solid #e5dcd6; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px;
 font: 13px var(--font-body); box-sizing: border-box; } .btn { width: 100%; justify-content: center; padding:
 12px; border-radius: 12px; }
.bottom { display: flex; justify-content: space-between; margin-top: 34px; padding-top: 20px; border-top: 1px
 solid #e6d9cf; font-size: 12px; color: var(--muted); } .bottom a { display: inline; margin-left: 20px; }
@media (max-width: 820px) { .cols { grid-template-columns: 1fr 1fr; } }
</style>