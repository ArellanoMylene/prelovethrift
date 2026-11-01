<template>
 <section id="deals" class="section">
  <div class="wrap">
   <div class="sec-head"><div><h2>Deals &amp; Rewards</h2><p>Special offers and a chance to win on your next thrift find.</p></div></div>
   <div class="deal">
    <div><span class="chip">• Limited Time Offer</span><h2>Up To 30% OFF</h2>
    <p>On Selected Women's Fashion. Explore our handpicked styles and refresh your wardrobe today.</p>
    <a class="btn go">Grab the Deal →</a></div>
    <img src="/assets/deal.png" alt="Shirts on a rack"/>
   </div>
   <div class="elfsight-app-748c4ec6-824e-4bff-87c0-fda99c84e4ea"></div>
  </div>
 </section>
</template>
 <style scoped>
.deal { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; padding: 56px 60px;
 border-radius: 44px; color: #fff; background: linear-gradient(135deg, #e47a7a, #c45f5f); box-shadow: 0 24px 
 50px rgba(196,95,95,.3); }
.chip { background: rgba(255,255,255,.22); padding: 7px 14px; border-radius: 999px; font: 700 12px var(--font-body); }
h2 { color: #fff; font-size: 48px; margin: 18px 0 10px; } p { opacity: .92; line-height: 1.6; max-width: 420px;
 margin: 0 0 24px; }
.go { background: #fff; color: var(--coral); } img { width: 100%; aspect-ratio: 1.5; object-fit: cover; border-radius: 20px; border: 1px solid #fff6; }
@media (max-width: 820px) { .deal { grid-template-columns: 1fr; padding: 34px 26px; } h2 { font-size: 36px; } }
</style>