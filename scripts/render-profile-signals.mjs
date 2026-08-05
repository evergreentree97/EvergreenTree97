import { mkdir, writeFile } from 'node:fs/promises'

const owner = process.env.GITHUB_REPOSITORY_OWNER || 'evergreentree97'
const token = process.env.GITHUB_TOKEN
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'profile-signals-renderer',
  ...(token ? { Authorization: 'Bearer ' + token } : {}),
}

const response = await fetch(
  'https://api.github.com/users/' + owner + '/repos?per_page=100&sort=updated',
  { headers },
)

if (!response.ok) {
  throw new Error('GitHub API request failed: ' + response.status)
}

const excluded = new Set([owner.toLowerCase(), owner.toLowerCase() + '.github.io'])
const repositories = (await response.json()).filter(
  (repository) => !repository.fork && !excluded.has(repository.name.toLowerCase()),
)

if (repositories.length === 0) {
  throw new Error('No public source repositories found')
}

const topRepository = [...repositories].sort(
  (left, right) => right.stargazers_count - left.stargazers_count,
)[0]

const recentRepository = [...repositories].sort(
  (left, right) => new Date(right.pushed_at) - new Date(left.pushed_at),
)[0]

const recentDate = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Seoul',
}).format(new Date(recentRepository.pushed_at))

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const palettes = {
  light: {
    background: '#ffffff',
    border: '#d0d7de',
    text: '#1f2328',
    muted: '#656d76',
    route: '#afb8c1',
    accent: '#b36b19',
  },
  dark: {
    background: '#0d1117',
    border: '#30363d',
    text: '#e6edf3',
    muted: '#8b949e',
    route: '#484f58',
    accent: '#d29922',
  },
}

const steps = ['OBSERVE', 'ISOLATE', 'BUILD', 'VERIFY', 'SHIP']
const positions = [56, 208, 360, 512, 664]
const displayNames = new Map([
  ['easy-shimmer-compose', 'EasyShimmerCompose'],
])
const displayName = (repository) => displayNames.get(repository.name) || repository.name

function render(theme) {
  const palette = palettes[theme]
  const nodes = steps
    .map((step, index) => {
      const x = positions[index]
      return [
        '<g>',
        '  <circle cx="' + x + '" cy="88" r="10" fill="' + palette.background + '" stroke="' + palette.route + '"/>',
        '  <circle class="node-core node-' + index + '" cx="' + x + '" cy="88" r="4" fill="' + palette.accent + '"/>',
        '  <text class="step" x="' + x + '" y="120" text-anchor="middle">' + step + '</text>',
        '</g>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="210" viewBox="0 0 720 210" role="img">',
    '  <title>Choi Sangrok build loop and live open source signals</title>',
    '  <desc>A signal moves through observe, isolate, build, verify, and ship. Public repository data appears below.</desc>',
    '  <style>',
    '    .caption, .step, .meta, .value { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
    '    .caption { fill: ' + palette.text + '; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; }',
    '    .meta { fill: ' + palette.muted + '; font-size: 11px; }',
    '    .step { fill: ' + palette.muted + '; font-size: 10px; font-weight: 600; letter-spacing: .8px; }',
    '    .value { fill: ' + palette.text + '; font-size: 14px; font-weight: 600; }',
    '    .accent { fill: ' + palette.accent + '; }',
    '    .route { stroke-dasharray: 3 9; animation: route 6s linear infinite; }',
    '    .node-core { animation: pulse 7.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; opacity: .35; }',
    '    .node-0 { animation-delay: 0s; }',
    '    .node-1 { animation-delay: 1.5s; }',
    '    .node-2 { animation-delay: 3s; }',
    '    .node-3 { animation-delay: 4.5s; }',
    '    .node-4 { animation-delay: 6s; }',
    '    .signal { filter: drop-shadow(0 0 5px ' + palette.accent + '); }',
    '    @keyframes route { to { stroke-dashoffset: -72; } }',
    '    @keyframes pulse { 0%, 18%, 100% { opacity: .35; transform: scale(.72); } 7% { opacity: 1; transform: scale(1.35); } }',
    '    @media (prefers-reduced-motion: reduce) {',
    '      .route, .node-core { animation: none; }',
    '      .node-core { opacity: 1; transform: none; }',
    '      .signal { display: none; }',
    '    }',
    '  </style>',
    '  <rect x=".5" y=".5" width="719" height="209" fill="' + palette.background + '" stroke="' + palette.border + '"/>',
    '  <text class="caption" x="24" y="30">BUILD LOOP</text>',
    '  <text class="meta" x="696" y="30" text-anchor="end">generated from public GitHub activity</text>',
    '  <path d="M56 88 H664" fill="none" stroke="' + palette.route + '" stroke-width="1"/>',
    '  <path class="route" d="M56 88 H664" fill="none" stroke="' + palette.accent + '" stroke-width="1.5"/>',
    nodes,
    '  <circle class="signal" r="4" fill="' + palette.accent + '">',
    '    <animateMotion dur="7.5s" repeatCount="indefinite" path="M56 88 H664"/>',
    '  </circle>',
    '  <line x1="24" y1="144" x2="696" y2="144" stroke="' + palette.border + '"/>',
    '  <text class="meta" x="24" y="169">OPEN SOURCE</text>',
    '  <text class="value" x="24" y="193">' + escapeXml(displayName(topRepository)) + '</text>',
    '  <text class="value accent" x="208" y="193">' + topRepository.stargazers_count + ' stars</text>',
    '  <text class="meta" x="696" y="169" text-anchor="end">RECENT SIGNAL</text>',
    '  <text class="value" x="696" y="193" text-anchor="end">' + escapeXml(displayName(recentRepository)) + ' · ' + recentDate + '</text>',
    '</svg>',
    '',
  ].join('\n')
}

function renderMobile(theme) {
  const palette = palettes[theme]
  const mobilePositions = [30, 105, 180, 255, 330]
  const nodes = steps
    .map((step, index) => {
      const x = mobilePositions[index]
      return [
        '<g>',
        '  <circle cx="' + x + '" cy="72" r="8" fill="' + palette.background + '" stroke="' + palette.route + '"/>',
        '  <circle class="node-core node-' + index + '" cx="' + x + '" cy="72" r="3.5" fill="' + palette.accent + '"/>',
        '  <text class="step" x="' + x + '" y="100" text-anchor="middle">' + step + '</text>',
        '</g>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="244" viewBox="0 0 360 244" role="img">',
    '  <title>Choi Sangrok build loop and live open source signals</title>',
    '  <desc>A signal moves through observe, isolate, build, verify, and ship. Public repository data appears below.</desc>',
    '  <style>',
    '    .caption, .step, .meta, .value { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }',
    '    .caption { fill: ' + palette.text + '; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; }',
    '    .meta { fill: ' + palette.muted + '; font-size: 10px; }',
    '    .step { fill: ' + palette.muted + '; font-size: 8px; font-weight: 600; letter-spacing: .5px; }',
    '    .value { fill: ' + palette.text + '; font-size: 12.5px; font-weight: 600; }',
    '    .accent { fill: ' + palette.accent + '; }',
    '    .route { stroke-dasharray: 3 8; animation: route 6s linear infinite; }',
    '    .node-core { animation: pulse 7.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; opacity: .35; }',
    '    .node-0 { animation-delay: 0s; }',
    '    .node-1 { animation-delay: 1.5s; }',
    '    .node-2 { animation-delay: 3s; }',
    '    .node-3 { animation-delay: 4.5s; }',
    '    .node-4 { animation-delay: 6s; }',
    '    .signal { filter: drop-shadow(0 0 5px ' + palette.accent + '); }',
    '    @keyframes route { to { stroke-dashoffset: -66; } }',
    '    @keyframes pulse { 0%, 18%, 100% { opacity: .35; transform: scale(.72); } 7% { opacity: 1; transform: scale(1.35); } }',
    '    @media (prefers-reduced-motion: reduce) {',
    '      .route, .node-core { animation: none; }',
    '      .node-core { opacity: 1; transform: none; }',
    '      .signal { display: none; }',
    '    }',
    '  </style>',
    '  <rect x=".5" y=".5" width="359" height="243" fill="' + palette.background + '" stroke="' + palette.border + '"/>',
    '  <text class="caption" x="16" y="25">BUILD LOOP</text>',
    '  <text class="meta" x="344" y="25" text-anchor="end">PUBLIC ACTIVITY</text>',
    '  <path d="M30 72 H330" fill="none" stroke="' + palette.route + '" stroke-width="1"/>',
    '  <path class="route" d="M30 72 H330" fill="none" stroke="' + palette.accent + '" stroke-width="1.5"/>',
    nodes,
    '  <circle class="signal" r="4" fill="' + palette.accent + '">',
    '    <animateMotion dur="7.5s" repeatCount="indefinite" path="M30 72 H330"/>',
    '  </circle>',
    '  <line x1="16" y1="120" x2="344" y2="120" stroke="' + palette.border + '"/>',
    '  <text class="meta" x="16" y="144">OPEN SOURCE</text>',
    '  <text class="value" x="16" y="168">' + escapeXml(displayName(topRepository)) + '</text>',
    '  <text class="value accent" x="344" y="168" text-anchor="end">' + topRepository.stargazers_count + ' stars</text>',
    '  <line x1="16" y1="184" x2="344" y2="184" stroke="' + palette.border + '"/>',
    '  <text class="meta" x="16" y="207">RECENT SIGNAL</text>',
    '  <text class="value" x="16" y="230">' + escapeXml(displayName(recentRepository)) + '</text>',
    '  <text class="meta" x="344" y="230" text-anchor="end">' + recentDate + '</text>',
    '</svg>',
    '',
  ].join('\n')
}

await mkdir(new URL('../assets/', import.meta.url), { recursive: true })
await Promise.all(
  Object.keys(palettes).flatMap((theme) => [
    writeFile(
      new URL('../assets/profile-signals-' + theme + '.svg', import.meta.url),
      render(theme),
      'utf8',
    ),
    writeFile(
      new URL('../assets/profile-signals-mobile-' + theme + '.svg', import.meta.url),
      renderMobile(theme),
      'utf8',
    ),
  ]),
)

console.log(
  'Rendered profile signals for ' +
    topRepository.name +
    ' and ' +
    recentRepository.name,
)
