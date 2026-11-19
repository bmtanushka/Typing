/**
 * Small inline SVG illustrations for info steps. Static markup only
 * (no user content), coloured with CSS classes so themes work.
 */
const svg = (body, label) =>
  `<svg class="art" viewBox="0 0 240 160" role="img" aria-label="${label}">${body}</svg>`;

export const ART = {
  posture: svg(`
    <rect x="18" y="138" width="204" height="6" rx="3" class="art-line"/>
    <rect x="138" y="88" width="84" height="7" rx="3" class="art-desk"/>
    <rect x="200" y="95" width="6" height="43" class="art-desk"/>
    <rect x="176" y="40" width="44" height="32" rx="5" class="art-screen"/>
    <rect x="194" y="72" width="8" height="16" class="art-desk"/>
    <rect x="150" y="82" width="26" height="6" rx="2" class="art-key"/>
    <rect x="58" y="96" width="44" height="8" rx="4" class="art-chair"/>
    <rect x="58" y="52" width="8" height="52" rx="4" class="art-chair"/>
    <rect x="76" y="104" width="6" height="34" class="art-chair"/>
    <circle cx="86" cy="34" r="14" class="art-skin"/>
    <path d="M80 50v46" class="art-body"/>
    <path d="M80 96h40v42" class="art-body"/>
    <path d="M82 60l26 18 40 4" class="art-arm"/>
    <path d="M100 52l70 0" class="art-sight"/>
    <path d="M118 138h14" class="art-body"/>`, 'A person sitting up straight at a desk, eyes level with the screen'),

  eyes: svg(`
    <rect x="50" y="18" width="140" height="92" rx="10" class="art-screen"/>
    <rect x="62" y="30" width="116" height="68" rx="6" class="art-screen-in"/>
    <path d="M88 64c10-14 54-14 64 0-10 14-54 14-64 0z" class="art-eye"/>
    <circle cx="120" cy="64" r="9" class="art-pupil"/>
    <rect x="70" y="122" width="100" height="22" rx="6" class="art-key"/>
    <path d="M160 132l14 0M40 132l16 0" class="art-sight"/>
    <path d="M120 112v6" class="art-line-s"/>`, 'An eye looking at the screen above the keyboard'),

  stars: svg(`
    <path d="M40 120h40v-24h40v-24h40v-24h40" class="art-steps"/>
    <path d="M60 86l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" class="art-star"/>
    <path d="M140 38l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" class="art-star"/>
    <path d="M100 62l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" class="art-star"/>
    <circle cx="206" cy="36" r="10" class="art-flag"/>`, 'Steps climbing up with stars along the way'),

  bumps: svg(`
    <rect x="34" y="40" width="74" height="74" rx="14" class="art-key-li"/>
    <rect x="132" y="40" width="74" height="74" rx="14" class="art-key-ri"/>
    <text x="71" y="86" class="art-letter">F</text>
    <text x="169" y="86" class="art-letter">J</text>
    <rect x="57" y="96" width="28" height="5" rx="2.5" class="art-bump"/>
    <rect x="155" y="96" width="28" height="5" rx="2.5" class="art-bump"/>
    <path d="M71 150v-26M169 150v-26" class="art-finger"/>`, 'The F and J keys, each with a small raised bump'),
};
