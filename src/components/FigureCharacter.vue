<template>
  <svg class="fig" viewBox="0 0 300 600" role="img" :aria-label="`${character.label} outfit preview`">
    <g class="body">
      <path v-if="character.gender === 'girl'" d="M108 112 C102 63 120 35 150 35 C181 35 199 62 192 113 L199 191 L101 191Z" fill="#49343a" />
      <path :d="geometry.legs" :fill="skinTone" />
      <path :d="geometry.feet" :fill="skinTone" />
      <path :d="geometry.arms" fill="none" :stroke="skinTone" :stroke-width="geometry.armWidth" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M140 123 L160 123 L160 171 L140 171Z" :fill="skinTone" />
      <path :d="geometry.torso" :fill="skinTone" />
      <path d="M108 86 C108 58 125 42 150 42 C175 42 192 59 192 86 L192 99 C192 122 174 141 150 141 C126 141 108 122 108 99Z" :fill="skinTone" />
      <path v-if="character.gender === 'girl'" d="M108 96 C111 57 128 43 150 43 C173 43 188 59 192 96 C178 79 164 69 150 68 C136 69 121 79 108 96Z" fill="#49343a" />
      <path v-else d="M107 82 C108 51 126 36 150 36 C176 36 193 53 194 82 C170 70 132 70 107 82Z" fill="#49343a" />
      <circle cx="133" cy="96" r="3" fill="#382c2a" />
      <circle cx="167" cy="96" r="3" fill="#382c2a" />
      <circle cx="122" cy="109" r="7" fill="#ef9b8c" opacity=".7" />
      <circle cx="178" cy="109" r="7" fill="#ef9b8c" opacity=".7" />
      <path d="M138 116 Q150 126 162 116" fill="none" stroke="#a95c57" stroke-width="2" stroke-linecap="round" />
      <image v-if="top" :href="top.img" v-bind="placement(top, geometry.top)" preserveAspectRatio="none" />
      <image v-if="bottom" :href="bottom.img" v-bind="placement(bottom, {
        ...geometry.bottom,
        x: geometry.bottom.x - geometry.bottom.width * 0.1,
        width: geometry.bottom.width * 1.2,
      })" preserveAspectRatio="none" />
      <image v-if="dress" :href="dress.img" v-bind="placement(dress, geometry.dress)" preserveAspectRatio="none" />
      <image v-if="shoes" :href="shoes.img" v-bind="placement(shoes, geometry.shoes)" preserveAspectRatio="none" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem, Character } from '../data/mockData'

interface FitBox {
  x: number
  y: number
  width: number
  height: number
}

const props = defineProps<{
  character: Character
  skinTone: string
  top?: CartItem
  bottom?: CartItem
  dress?: CartItem
  shoes?: CartItem
}>()

function placement(item: CartItem, target: FitBox) {
  const fit = item.fit
  if (!fit) return { x: target.x, y: target.y, width: target.width, height: target.height }

  const scaleX = target.width / (fit.right - fit.left)
  const scaleY = target.height / (fit.bottom - fit.top)
  return {
    x: target.x - fit.left * scaleX,
    y: target.y - fit.top * scaleY,
    width: fit.imageWidth * scaleX,
    height: fit.imageHeight * scaleY,
  }
}

const geometry = computed(() => props.character.build === 'chubby' ? {
  torso: 'M103 166 Q150 151 197 166 L207 338 L207 386 L93 386 L93 338Z',
  arms: 'M103 174 L97 225 L79 325 M197 174 L203 225 L221 325',
  armWidth: 18,
  legs: 'M103 378 L143 378 L141 555 Q126 565 109 558Z M157 378 L197 378 L191 558 Q174 565 159 555Z',
  feet: 'M111 551 Q127 545 143 556 Q150 563 138 568 Q120 574 104 565 Q99 559 111 551Z M157 556 Q173 545 189 551 Q201 559 196 565 Q180 574 162 568 Q150 563 157 556Z',
  top: { x: 69, y: 151, width: 162, height: 190 },
  bottom: { x: 88, y: 326, width: 124, height: 231 },
  dress: { x: 63, y: 151, width: 174, height: 404 },
  shoes: { x: 84, y: 542, width: 132, height: 37 },
} : {
  torso: 'M111 166 Q150 153 189 166 L195 338 L195 384 L105 384 L105 338Z',
  arms: 'M109 174 L103 225 L88 325 M191 174 L197 225 L212 325',
  armWidth: 16,
  legs: 'M112 378 L145 378 L143 557 Q129 565 114 558Z M155 378 L188 378 L186 558 Q171 565 157 557Z',
  feet: 'M114 551 Q129 545 145 556 Q151 563 139 568 Q122 574 107 565 Q102 559 114 551Z M155 556 Q171 545 186 551 Q198 559 193 565 Q178 574 160 568 Q149 563 155 556Z',
  top: { x: 78, y: 151, width: 144, height: 190 },
  bottom: { x: 99, y: 326, width: 102, height: 231 },
  dress: { x: 75, y: 151, width: 150, height: 404 },
  shoes: { x: 96, y: 542, width: 108, height: 37 },
})
</script>

<style scoped>
.fig {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
</style>
