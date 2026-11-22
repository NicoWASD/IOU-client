// Genera los SVG de la marca IOU en public/brand/.
// Uso: node scripts/build-brand.mjs
//
// Construcción (unidades del glifo):
//   altura de mayúscula 120 · trazo 30 · espacio entre letras 18
//   corte (troquel) entre y=58 y y=62 · la mitad inferior se corre 8 a la derecha
import { mkdirSync, writeFileSync } from 'node:fs';

const I = 'M0 0H30V120H0Z';
const O = 'M48 60a60 60 0 1 0 120 0a60 60 0 1 0-120 0ZM78 60a30 30 0 1 0 60 0a30 30 0 1 0-60 0Z';
const U = 'M186 0H216V66A24 24 0 0 0 264 66V0H294V66A54 54 0 0 1 186 66Z';
export const GLYPHS = `${I}${O}${U}`;
export const W = 302;
export const H = 120;
export const CUT = { top: 58, bottom: 62, shift: 8 };

/** Wordmark: mitad superior en `top`, mitad inferior (corrida) en `bottom`. */
export function wordmark({ top, bottom, id = 'iou' }) {
  return `<defs>
    <clipPath id="${id}-t"><rect x="-20" y="-20" width="${W + 40}" height="${CUT.top + 20}"/></clipPath>
    <clipPath id="${id}-b"><rect x="-20" y="${CUT.bottom}" width="${W + 40}" height="${H}"/></clipPath>
  </defs>
  <path clip-path="url(#${id}-t)" fill="${top}" fill-rule="evenodd" d="${GLYPHS}"/>
  <g transform="translate(${CUT.shift} 0)"><path clip-path="url(#${id}-b)" fill="${bottom}" fill-rule="evenodd" d="${GLYPHS}"/></g>`;
}

const svg = (vb, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

const files = {
  'iou-logo.svg': svg(`0 0 ${W} ${H}`, wordmark({ top: '#1B1E25', bottom: '#2337C6' }), 'IOU'),
  'iou-logo-dark.svg': svg(`0 0 ${W} ${H}`, wordmark({ top: '#E8EAF0', bottom: '#8B9BFF' }), 'IOU'),
  'iou-logo-mono.svg': svg(`0 0 ${W} ${H}`, wordmark({ top: 'currentColor', bottom: 'currentColor' }), 'IOU'),
  // Ícono de app: el wordmark sobre birome, la mitad cortada en resaltador
  'iou-icon.svg': svg(
    '0 0 512 512',
    `<rect width="512" height="512" rx="116" fill="#2337C6"/>
  <g transform="translate(91 190) scale(1.0927)">${wordmark({ top: '#FFFFFF', bottom: '#FFE45C', id: 'ic' })}</g>`,
    'IOU',
  ),
  // Favicon: solo la O cortada, legible a 16-32 px
  'favicon.svg': svg(
    '0 0 128 128',
    `<defs>
    <clipPath id="f-t"><rect width="128" height="61"/></clipPath>
    <clipPath id="f-b"><rect y="67" width="128" height="61"/></clipPath>
  </defs>
  <rect width="128" height="128" rx="30" fill="#2337C6"/>
  <path clip-path="url(#f-t)" fill="#FFFFFF" fill-rule="evenodd" d="M22 64a40 40 0 1 0 80 0a40 40 0 1 0-80 0ZM43 64a19 19 0 1 0 38 0a19 19 0 1 0-38 0Z"/>
  <g transform="translate(6 0)"><path clip-path="url(#f-b)" fill="#FFE45C" fill-rule="evenodd" d="M22 64a40 40 0 1 0 80 0a40 40 0 1 0-80 0ZM43 64a19 19 0 1 0 38 0a19 19 0 1 0-38 0Z"/></g>`,
    'IOU',
  ),
};

const out = new URL('../public/brand/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, content] of Object.entries(files)) writeFileSync(new URL(name, out), content);
console.log(`Generados: ${Object.keys(files).join(', ')}`);
