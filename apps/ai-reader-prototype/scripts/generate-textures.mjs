import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const outDir = join(scriptDir, '..', 'public', 'textures')
mkdirSync(outDir, { recursive: true })

function random(seed) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function speckles(seed, count, color, opacityMin, opacityMax) {
  const next = random(seed)
  const dots = []

  for (let index = 0; index < count; index += 1) {
    const x = Math.round(next() * 1000) / 10
    const y = Math.round(next() * 1000) / 10
    const r = Math.round((0.35 + next() * 1.45) * 100) / 100
    const opacity = Math.round((opacityMin + next() * (opacityMax - opacityMin)) * 100) / 100
    dots.push(`<circle cx="${x}%" cy="${y}%" r="${r}" fill="${color}" opacity="${opacity}" />`)
  }

  return dots.join('\n')
}

const textures = {
  'desk-walnut.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.19" numOctaves="4" seed="1701" />
      <feColorMatrix type="saturate" values="0.25" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.36" />
      </feComponentTransfer>
    </filter>
    <linearGradient id="deskShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#26150d" />
      <stop offset="0.48" stop-color="#170d08" />
      <stop offset="1" stop-color="#0f0704" />
    </linearGradient>
  </defs>
  <rect width="384" height="384" fill="url(#deskShade)" />
  <g opacity="0.18">
    <path d="M18 0v384M49 0v384M79 0v384M111 0v384M146 0v384M181 0v384M214 0v384M247 0v384M283 0v384M318 0v384M352 0v384" stroke="#6f452d" stroke-width="1" />
    <path d="M0 37h384M0 91h384M0 146h384M0 213h384M0 276h384M0 339h384" stroke="#2f1b12" stroke-width="1" />
  </g>
  <rect width="384" height="384" filter="url(#grain)" opacity="0.72" />
  <g>${speckles(2701, 90, '#e4b984', 0.05, 0.16)}</g>
</svg>`,
  'paper-aged.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <filter id="fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.025 0.42" numOctaves="3" seed="1702" />
      <feColorMatrix type="matrix" values="0.55 0 0 0 0.38 0 0.45 0 0 0.31 0 0 0.32 0 0.22 0 0 0 0.32 0" />
    </filter>
    <linearGradient id="paperShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8e8cd" />
      <stop offset="0.58" stop-color="#eed6ae" />
      <stop offset="1" stop-color="#d8bd91" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#paperShade)" />
  <rect width="320" height="320" filter="url(#fiber)" opacity="0.42" />
  <g opacity="0.12">
    <path d="M0 17h320M0 51h320M0 88h320M0 123h320M0 159h320M0 196h320M0 232h320M0 268h320M0 303h320" stroke="#8b6944" stroke-width="0.8" />
    <path d="M22 0v320M57 0v320M91 0v320M127 0v320M163 0v320M198 0v320M233 0v320M268 0v320M303 0v320" stroke="#fff6db" stroke-width="0.6" />
  </g>
  <g>${speckles(2702, 145, '#5a3924', 0.06, 0.2)}</g>
</svg>`,
  'paper-warm.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <filter id="warmFiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.032 0.36" numOctaves="3" seed="1703" />
      <feColorMatrix type="matrix" values="0.5 0 0 0 0.42 0 0.42 0 0 0.33 0 0 0.25 0 0.2 0 0 0 0.34 0" />
    </filter>
    <linearGradient id="warmShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3ddb2" />
      <stop offset="0.56" stop-color="#e6bf82" />
      <stop offset="1" stop-color="#c9975f" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#warmShade)" />
  <rect width="320" height="320" filter="url(#warmFiber)" opacity="0.38" />
  <g>${speckles(2703, 150, '#633e25', 0.06, 0.18)}</g>
</svg>`,
  'tape-fiber.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="96" viewBox="0 0 256 96">
  <defs>
    <filter id="tapeFiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.08 0.42" numOctaves="3" seed="1704" />
      <feColorMatrix type="saturate" values="0.35" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.25" />
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="256" height="96" fill="#f4dfaf" opacity="0.78" />
  <rect width="256" height="96" filter="url(#tapeFiber)" opacity="0.78" />
  <g opacity="0.2">
    <path d="M0 18h256M0 39h256M0 61h256M0 82h256" stroke="#7a5536" stroke-width="0.8" />
    <path d="M19 0v96M48 0v96M76 0v96M106 0v96M136 0v96M166 0v96M195 0v96M225 0v96" stroke="#fff2c8" stroke-width="0.7" />
  </g>
  <g>${speckles(2704, 120, '#654328', 0.08, 0.24)}</g>
</svg>`,
}

for (const [name, svg] of Object.entries(textures)) {
  const path = join(outDir, name)
  writeFileSync(path, svg, 'utf8')
  console.log(`Generated ${path}`)
}
