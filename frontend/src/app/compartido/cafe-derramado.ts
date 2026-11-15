import { Component, input } from '@angular/core';

/**
 * Taza de porcelana con café que se inclina y se derrama según el scroll.
 * `progreso` va de 0 (taza quieta, con vapor) a 1 (taza inclinada y café salpicando).
 * Todo es SVG + CSS: las piezas leen la variable --p y calculan su posición con calc().
 */
@Component({
  selector: 'app-cafe-derramado',
  host: { '[style.--p]': 'progreso()' },
  template: `
    <svg viewBox="0 0 520 540" role="img" aria-label="Taza de café que se derrama al desplazar la página">
      <defs>
        <linearGradient id="cd-porcelana" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#a59e95"/><stop offset=".14" stop-color="#e7e2da"/><stop offset=".38" stop-color="#ffffff"/>
          <stop offset=".62" stop-color="#f3efe8"/><stop offset=".86" stop-color="#cfc8be"/><stop offset="1" stop-color="#8f877d"/>
        </linearGradient>
        <linearGradient id="cd-plato" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#ece7df"/><stop offset="1" stop-color="#a8a096"/>
        </linearGradient>
        <radialGradient id="cd-interior" cx=".5" cy=".3" r=".8">
          <stop offset="0" stop-color="#f6f2ec"/><stop offset="1" stop-color="#bdb5aa"/>
        </radialGradient>
        <radialGradient id="cd-crema" cx=".42" cy=".4" r=".7">
          <stop offset="0" stop-color="#d9a466"/><stop offset=".45" stop-color="#a5622c"/><stop offset=".85" stop-color="#5b2c0f"/><stop offset="1" stop-color="#3a1a08"/>
        </radialGradient>
        <linearGradient id="cd-liquido" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#2a1206"/><stop offset=".45" stop-color="#6e3412"/><stop offset=".75" stop-color="#b8692a"/><stop offset="1" stop-color="#e3a25a"/>
        </linearGradient>
        <radialGradient id="cd-sombra" cx=".5" cy=".5" r=".5">
          <stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="cd-grano" cx=".35" cy=".3" r=".8">
          <stop offset="0" stop-color="#a0673b"/><stop offset=".6" stop-color="#4a2510"/><stop offset="1" stop-color="#1e0d04"/>
        </radialGradient>
        <!-- "Gooey": une gotas y lenguas de líquido como si fueran un fluido real -->
        <filter id="cd-fluido" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/>
          <feComposite in="SourceGraphic" in2="g" operator="atop"/>
        </filter>
        <filter id="cd-humo" x="-60%" y="-60%" width="220%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.05" numOctaves="2" seed="7">
            <animate attributeName="baseFrequency" dur="8s" values="0.014 0.05;0.018 0.07;0.014 0.05" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="24"/>
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
        <clipPath id="cd-boca"><ellipse cx="250" cy="250" rx="74" ry="15"/></clipPath>
      </defs>

      <!-- sombra sobre la mesa y charco que crece -->
      <ellipse cx="262" cy="472" rx="210" ry="30" fill="url(#cd-sombra)"/>

      <!-- plato -->
      <ellipse cx="262" cy="446" rx="190" ry="34" fill="#8f877d"/>
      <ellipse cx="262" cy="440" rx="190" ry="32" fill="url(#cd-plato)"/>
      <ellipse cx="262" cy="436" rx="118" ry="17" fill="#e4ded5"/>
      <ellipse cx="262" cy="434" rx="96" ry="12" fill="#d6cfc4"/>
      <path d="M100 430 q160 26 320 0" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>
      <!-- charco de café que se forma sobre el plato -->
      <ellipse class="charco" cx="176" cy="440" rx="74" ry="11" fill="url(#cd-liquido)" filter="url(#cd-fluido)"/>
      <ellipse class="charco" cx="160" cy="437" rx="20" ry="2.5" fill="#fff" opacity=".35"/>

      <!-- taza: gira sobre su borde inferior izquierdo -->
      <g class="taza">
        <!-- asa -->
        <path d="M326 282 c62 -14 70 64 4 78" fill="none" stroke="#8f877d" stroke-width="22" stroke-linecap="round"/>
        <path d="M326 282 c62 -14 70 64 4 78" fill="none" stroke="url(#cd-porcelana)" stroke-width="16" stroke-linecap="round"/>
        <!-- cuerpo -->
        <path d="M172 250 c0 70 12 150 52 170 h52 c40 -20 52 -100 52 -170 z" fill="url(#cd-porcelana)"/>
        <path d="M196 268 c2 60 10 120 34 140" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="250" cy="420" rx="38" ry="6" fill="#9c958b"/>
        <!-- boca, interior y café -->
        <ellipse cx="250" cy="250" rx="78" ry="17" fill="#fbfaf7"/>
        <ellipse cx="250" cy="251" rx="72" ry="14" fill="url(#cd-interior)"/>
        <g clip-path="url(#cd-boca)">
          <g class="superficie">
            <ellipse cx="250" cy="256" rx="70" ry="12.5" fill="url(#cd-crema)"/>
            <ellipse cx="226" cy="252" rx="16" ry="3" fill="#fff" opacity=".35"/>
          </g>
        </g>

        <!-- salpicadura: nace del borde izquierdo de la boca -->
        <g class="salpicadura" filter="url(#cd-fluido)" fill="url(#cd-liquido)">
          <path class="lengua l1" d="M180 252 C150 228 120 196 118 160 C116 136 134 124 142 138 C148 150 140 170 152 190 C162 206 176 218 192 244 Z"/>
          <path class="lengua l2" d="M178 250 C140 246 98 240 76 212 C62 194 72 182 86 192 C100 204 112 222 142 232 C158 238 170 240 182 246 Z"/>
          <path class="lengua l3" d="M188 250 C188 220 180 186 186 156 C190 136 204 138 202 158 C200 180 202 214 196 248 Z"/>
          <path class="lengua l4" d="M176 254 C150 262 116 280 96 270 C82 262 92 250 104 254 C120 260 146 252 172 248 Z"/>
          <circle class="gota" style="--dx: -40; --dy: -50" cx="114" cy="150" r="7"/>
          <circle class="gota" style="--dx: -60; --dy: -10" cx="70" cy="196" r="6"/>
          <circle class="gota" style="--dx: 10; --dy: -60" cx="192" cy="140" r="5"/>
          <circle class="gota" style="--dx: -30; --dy: -70" cx="100" cy="122" r="4"/>
          <circle class="gota" style="--dx: -70; --dy: 20" cx="62" cy="230" r="4.5"/>
          <circle class="gota" style="--dx: -20; --dy: -90" cx="150" cy="112" r="3.5"/>
        </g>
        <!-- brillos sobre el líquido (fuera del filtro para que queden nítidos) -->
        <g class="brillos" fill="none" stroke="#fff" stroke-linecap="round">
          <path d="M132 150 c-6 14 2 30 10 42" stroke-width="3" stroke-opacity=".55"/>
          <path d="M88 200 c14 10 30 20 46 26" stroke-width="2.5" stroke-opacity=".45"/>
          <path d="M192 164 c-2 20 0 40 0 60" stroke-width="2" stroke-opacity=".5"/>
        </g>
      </g>

      <!-- vapor: solo con la taza quieta -->
      <g class="vapor" filter="url(#cd-humo)" fill="none" stroke="#fff" stroke-linecap="round">
        <path d="M222 236 q-16 -46 6 -92 q20 -40 -2 -84" stroke-width="12" stroke-opacity=".38"/>
        <path d="M256 232 q-14 -52 10 -104 q18 -38 -4 -80" stroke-width="14" stroke-opacity=".42"/>
        <path d="M288 236 q-12 -40 8 -80 q16 -32 -2 -66" stroke-width="10" stroke-opacity=".32"/>
      </g>

      <!-- granos de café que se esparcen -->
      <g class="granos">
        @for (g of granos; track $index) {
          <g class="grano" [style.--dx]="g.dx" [style.--dy]="g.dy" [style.--giro]="g.giro"
             [attr.transform]="'translate(' + g.x + ' ' + g.y + ') rotate(' + g.r + ')'">
            <g class="grano__cuerpo">
              <ellipse rx="13" ry="9" fill="url(#cd-grano)"/>
              <path d="M-11 0 q6 -4 11 0 q5 4 11 0" fill="none" stroke="#1a0b03" stroke-width="2" stroke-linecap="round"/>
              <ellipse cx="-4" cy="-4" rx="4" ry="1.6" fill="#fff" opacity=".25"/>
            </g>
          </g>
        }
      </g>
    </svg>
  `,
  styles: `
    :host { --p: 0; display: block; }
    svg { width: 100%; height: auto; overflow: visible; }
    svg * { transform-box: view-box; }
    .taza { transform-origin: 196px 418px; transform: rotate(calc(var(--p) * -34deg)) translateY(calc(var(--p) * -6px)); transition: transform .25s ease-out; }
    .superficie { transform-origin: 250px 256px; transform: translateX(calc(var(--p) * -28px)) rotate(calc(var(--p) * 34deg)) scaleX(calc(1 - var(--p) * .35)); transition: transform .25s ease-out; }
    .salpicadura { opacity: min(1, calc(var(--p) * 2.2)); }
    .lengua { transform-origin: 182px 250px; transform: scale(calc(var(--p) * 1.5)); transition: transform .3s ease-out; }
    .l2 { transform: scale(calc(var(--p) * 1.6)); } .l3 { transform: scale(calc(var(--p) * 1.35)); } .l4 { transform: scale(calc(var(--p) * 1.3)); }
    .gota { transform-origin: 182px 250px; transform: translate(calc(var(--p) * var(--dx) * 1.6px), calc(var(--p) * var(--dy) * 1.6px)) scale(calc(var(--p) * 1.3)); transition: transform .3s ease-out; }
    .brillos { transform-origin: 182px 250px; transform: scale(calc(var(--p) * 1.5)); opacity: max(0, calc(var(--p) * 1.6 - .4)); }
    .charco { transform-origin: 230px 440px; transform: scaleX(var(--p)); opacity: min(1, calc(var(--p) * 1.5)); transition: transform .3s ease-out; }
    .vapor { opacity: max(0, calc(1 - var(--p) * 4)); }
    .vapor path { transform-origin: 256px 236px; animation: subir 4s ease-in-out infinite alternate; }
    .vapor path:nth-child(2) { animation-delay: -1.4s; } .vapor path:nth-child(3) { animation-delay: -2.8s; }
    .grano__cuerpo { transform: translate(calc(var(--p) * var(--dx) * 1px), calc(var(--p) * var(--dy) * 1px)) rotate(calc(var(--p) * var(--giro) * 1deg)); transition: transform .35s ease-out; }
    @keyframes subir { from { transform: translateY(6px) scaleY(.94); } to { transform: translateY(-12px) scaleY(1.06); } }
    @media (prefers-reduced-motion: reduce) { .vapor path { animation: none; } }
  `,
})
export class CafeDerramadoComponent {
  /** 0 = taza quieta · 1 = derrame completo */
  readonly progreso = input(0);

  protected readonly granos = [
    { x: 88, y: 470, r: 20, dx: -40, dy: 14, giro: -90 },
    { x: 120, y: 488, r: -30, dx: -20, dy: 22, giro: 120 },
    { x: 410, y: 478, r: 50, dx: 36, dy: 18, giro: 160 },
    { x: 446, y: 462, r: -15, dx: 46, dy: 6, giro: -140 },
    { x: 372, y: 494, r: 80, dx: 18, dy: 26, giro: 90 },
    { x: 60, y: 496, r: 5, dx: -50, dy: 30, giro: 200 },
    { x: 470, y: 494, r: 35, dx: 30, dy: 30, giro: -200 },
  ];
}
