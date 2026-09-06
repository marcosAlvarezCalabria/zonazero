import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'artista-adrian.html', 'artista-dani.html', 'artista-yera.html', 'artista-reque.html', 'artista-metx.html', 'artista-nur.html'];

test('entrega una portada y una ficha independiente por artista', async () => {
  await Promise.all(pages.map((page) => access(resolve(root, page))));
  const index = await readFile(resolve(root, 'index.html'), 'utf8');
  for (const page of pages.slice(1)) assert.match(index, new RegExp(`href="${page}"`));
});

test('todos los recursos locales referenciados existen', async () => {
  for (const page of pages) {
    const html = await readFile(resolve(root, page), 'utf8');
    const sources = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:jpg|css|js|mp4))"/g)].map((match) => match[1]);
    await Promise.all(sources.map((source) => access(resolve(root, source))));
  }
});

test('los selectores de inspección son únicos en cada página', async () => {
  for (const page of pages) {
    const html = await readFile(resolve(root, page), 'utf8');
    const ids = [...html.matchAll(/data-od-id="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page} contiene data-od-id duplicados`);
  }
});

test('la portada incluye controles reales para filtros, visor y consulta', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /id="booking-form"/);
  assert.equal((html.match(/class="form-step/g) || []).length, 4);
  assert.match(script, /encodeURIComponent\(message\)/);
  assert.match(script, /work\.hidden =/);
  assert.match(script, /openLightbox/);
  assert.match(html, /data-filter="color"/);
  assert.equal((html.match(/class="work"/g) || []).length, 9);
});

test('las nuevas fotografías de portfolio están cargadas y descritas', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const additions = [
    'mtlvjosq-SaveClip.App_462872536_17924673851970234_3254465980882394643_n.jpg',
    'mtlvjott-SaveClip.App_571384764_18543846520021583_7341902319424093848_n.jpg',
    'mtlvjou9-SaveClip.App_573522537_18109887085600070_6009022484883957400_n.jpg',
    'mtlvjovc-SaveClip.App_459222287_17920235672970234_6118545707464644845_n.jpg',
    'mtlvjowc-SaveClip.App_459183618_17920235669970234_1364495493407135198_n.jpg'
  ];
  for (const image of additions) assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  assert.equal((html.match(/loading="lazy" decoding="async" alt="[^"]+"/g) || []).length, 9);
});

test('el roster y la consulta utilizan los profesionales confirmados', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  for (const professional of ['Adrián', 'Dani', 'Yera', 'Reque', 'Metx', 'Nur']) assert.match(html, new RegExp(`>${professional}<`));
  for (const staleName of ['>Albar<']) assert.equal(html.includes(staleName), false);
  assert.ok(html.indexOf('>Adrián<') < html.indexOf('>Dani<'), 'Adrián debe aparecer primero en el roster');
  const professionalSelect = html.match(/<select id="artist"[\s\S]*?<\/select>/)?.[0] || '';
  assert.equal(professionalSelect.includes('>Adrián<'), true, 'Adrián debe poder seleccionarse para una consulta');
  assert.equal(professionalSelect.includes('>Reque<'), true, 'Reque debe poder seleccionarse para una consulta');
  assert.equal(professionalSelect.includes('>Metx<'), true, 'Metx debe poder seleccionarse para una consulta');
  assert.equal((html.match(/class="artist-thumb"/g) || []).length, 6, 'cada profesional debe tener una miniatura compacta');
  for (const image of ['mto0jvyy-adianOwner.jpg', 'mtlu1h13-zz_post-3.jpg', 'mtlu1h14-zz_post-2.jpg', 'mto16aii-reque.tattoo.jpg', 'mtpk42zf-metxArtisjpg.jpg', 'mtpkht5n-microPiercingArtis.jpg']) {
    assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  }
  assert.match(html, /id="resenas"/);
});

test('la ficha de Metx utiliza su retrato y únicamente sus seis trabajos confirmados', async () => {
  const html = await readFile(resolve(root, 'artista-metx.html'), 'utf8');
  assert.match(html, /Tatuadora · Ilustrativo/);
  assert.match(html, /Línea · Blackwork/);
  assert.match(html, /mtpk42zf-metxArtisjpg\.jpg/);
  assert.match(html, /Retrato de Metx, tatuadora de Zona Zero/);
  const images = [
    'mto1gl65-SaveClip.App_473707889_18495452926021141_3606689238667488404_n.jpg',
    'mto1gl75-SaveClip.App_582437860_18556206010021141_1105020117768374969_n.jpg',
    'mto1gl89-SaveClip.App_743034709_18620935540021141_1085293683203218751_n.jpg',
    'mto1glpg-SaveClip.App_491449096_18515748304021141_5132975024518017276_n.jpg',
    'mto1glqz-SaveClip.App_573364369_18554315131021141_6294255585830782481_n.jpg',
    'mto1glu2-SaveClip.App_486958963_18509873992021141_4207262605988160805_n.jpg'
  ];
  for (const image of images) assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  assert.equal((html.match(/<figure data-od-id="trabajo-metx-/g) || []).length, 6);
  assert.equal(/instagram\.com\//.test(html), false, 'no se debe inventar una cuenta de Instagram para Metx');
});

test('la ficha de Reque utiliza su retrato y sus siete trabajos confirmados', async () => {
  const html = await readFile(resolve(root, 'artista-reque.html'), 'utf8');
  assert.match(html, /Tatuador · Black &amp; Grey/);
  assert.match(html, /@reque\.tattoo/);
  assert.match(html, /Realismo/);
  const images = [
    'mto16aii-reque.tattoo.jpg',
    'mto16a2a-SaveClip.App_655500316_18102399778930014_3990111600828746515_n.jpg',
    'mto16a57-SaveClip.App_653387536_18015155474830186_8685649210598602147_n.jpg',
    'mto16ac1-SaveClip.App_657199387_18097282652318172_5776100785688546468_n.jpg',
    'mto16agf-SaveClip.App_696505405_18129936442600070_3972151268005842503_n.jpg',
    'mto16aii-SaveClip.App_619720863_18093639572490085_7452303675189049952_n.jpg',
    'mto16aka-SaveClip.App_624928607_2070226300428407_4632931483161169650_n.jpg',
    'mto16akc-SaveClip.App_503578159_712111837874199_3191922486799424700_n.jpg'
  ];
  for (const image of images) assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  assert.equal((html.match(/<figure data-od-id="trabajo-reque-/g) || []).length, 7);
  assert.match(html, /href="https:\/\/www\.instagram\.com\/reque\.tattoo\/"/);
});

test('la ficha de Nur utiliza su retrato y sus seis trabajos confirmados', async () => {
  const html = await readFile(resolve(root, 'artista-nur.html'), 'utf8');
  assert.match(html, /Piercer · Body artist/);
  assert.match(html, /@nurbodyart/);
  assert.match(html, /Joyería dental/);
  assert.match(html, /Micropigmentación/);
  const images = [
    'mtpkht5n-microPiercingArtis.jpg',
    'mto06v1k-SaveClip.App_681920740_18110944048885101_4937448264770988936_n.jpg',
    'mto06v59-SaveClip.App_675438174_18110944030885101_3255893492332117362_n.jpg',
    'mto06v8l-SaveClip.App_681595011_18110944039885101_22415362082006325_n.jpg',
    'mto06vd3-SaveClip.App_649227675_18105341041885101_5018355703711365977_n.jpg',
    'mto06vh7-SaveClip.App_652576195_18106226890885101_2053082643598427625_n.jpg',
    'mto06vhs-SaveClip.App_652829597_18106226863885101_9049998928136920629_n.jpg'
  ];
  for (const image of images) assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  assert.equal((html.match(/<figure data-od-id="trabajo-nur-/g) || []).length, 6);
  assert.equal(html.includes('mto08y93-nurbodiartArtisPiercingjpg.jpg'), false, 'la ficha debe usar el retrato nuevo de Nur');
  assert.match(html, /href="https:\/\/www\.instagram\.com\/nurbodyart\/"/);
});

test('la ficha de Adrián utiliza únicamente sus trabajos confirmados', async () => {
  const html = await readFile(resolve(root, 'artista-adrian.html'), 'utf8');
  assert.match(html, /Propietario · Tatuador/);
  assert.match(html, /@adrian\.zzero/);
  assert.match(html, /Realismo ilustrativo/);
  assert.match(html, /mto0jvyy-adianOwner\.jpg/);
  assert.match(html, /alt="Adrián, propietario de Zona Zero, trabajando en una sesión de tatuaje"/);
  const images = [
    'mtnzxqfk-SaveClip.App_754970846_18616008490021583_6056674136819187876_n.jpg',
    'mtnzxqig-SaveClip.App_611260912_18557821984021583_1134680683159935913_n.jpg',
    'mtnzxql4-SaveClip.App_766168469_18620655172021583_7918786745616392964_n.jpg',
    'mtnzxqn8-SaveClip.App_791436390_18630254719021583_8644112717591925011_n.jpg',
    'mtnzxqqy-SaveClip.App_472395687_18484547755021583_8890182793193208084_n.jpg',
    'mtnzxquh-SaveClip.App_746862880_18613877275021583_2888227101420111766_n.jpg'
  ];
  for (const image of images) assert.match(html, new RegExp(image.replaceAll('.', '\\.')));
  assert.equal((html.match(/<figure data-od-id="trabajo-adrian-/g) || []).length, 6);
  assert.equal(/mtnz5w[a-z0-9-]*\.jpg/.test(html), false, 'ninguna imagen de Reque debe aparecer en la ficha de Adrián');
  assert.match(html, /href="https:\/\/www\.instagram\.com\/adrian\.zzero\/"/);
});

test('no publica marcadores ni métricas inventadas', async () => {
  const content = await Promise.all([...pages, 'zona-zero.css', 'zona-zero.js'].map((file) => readFile(resolve(root, file), 'utf8')));
  const joined = content.join('\n').toLowerCase();
  for (const forbidden of ['lorem ipsum', '[replace]', 'feature one', '99.9%', '10× faster', 'todo:']) {
    assert.equal(joined.includes(forbidden), false, `se encontró contenido prohibido: ${forbidden}`);
  }
});

test('mantiene mínimos de accesibilidad y adaptación móvil', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const css = await readFile(resolve(root, 'zona-zero.css'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  assert.match(html, /class="skip-link"/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /\.artist-thumb \{ width: 72px; height: 72px/);
  assert.match(css, /\.artist-thumb \{ width: 52px; height: 52px/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /@media \(max-height: 560px\) and \(orientation: landscape\)/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.contact-lines > a, \.contact-lines > span/);
  assert.match(script, /matchMedia\('\(min-width: 981px\)'\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test('el hero reproduce el vídeo real al entrar y mantiene el parallax seguro', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const css = await readFile(resolve(root, 'zona-zero.css'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  assert.match(html, /class="hero-video" muted(?:="")? autoplay(?:="")? playsinline(?:="")? preload="auto"/);
  assert.match(html, /mtlw6d17-Puerta_abriéndose_202609032001\.mp4/);
  assert.equal(html.includes('Desliza para abrir'), false);
  assert.match(html, /class="section wall-parallax" id="artistas"/);
  assert.match(css, /mtlv36z1-SaveClip\.App_502574655_682519531239054_524627440372362808_n\.jpg/);
  assert.match(css, /\.hero-video \{/);
  assert.match(script, /requestAnimationFrame\(updateWallParallax\)/);
  assert.match(script, /startHeroVideo\(\);/);
  assert.match(script, /'pointerdown', 'keydown', 'touchstart'/);
  assert.match(script, /heroVideo\.play\(\)/);
  assert.match(script, /heroVideo\.playbackRate = 1\.5/);
  assert.equal(/door-reveal|door-leaf|door-entry/.test(`${html}\n${css}\n${script}`), false);
  assert.match(script, /prefers-reduced-motion: reduce/);
});

test('la entrada del hero muestra solo el vídeo durante los primeros cuatro segundos y medio', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const css = await readFile(resolve(root, 'zona-zero.css'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  assert.match(html, /<body class="home-page">/);
  assert.match(css, /home-chrome-in[\s\S]*4\.5s both/);
  assert.match(css, /home-copy-in[\s\S]*4\.5s both/);
  assert.match(css, /visibility: hidden/);
  assert.match(script, /skip-home-intro/);
  assert.match(script, /window\.location\.hash/);
});

test('el pulido final utiliza controles semánticos, foco contenido y estados anunciados', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const css = await readFile(resolve(root, 'zona-zero.css'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  assert.equal((html.match(/<button class="work"/g) || []).length, 9);
  assert.equal((html.match(/aria-haspopup="dialog"/g) || []).length, 9);
  assert.match(html, /class="mobile-nav"[^>]*aria-hidden="true"/);
  assert.match(html, /role="progressbar"[^>]*aria-valuenow="1"/);
  assert.match(html, /id="idea"[^>]*minlength="12"[^>]*required/);
  assert.match(html, /class="lightbox"[^>]*aria-hidden="true"/);
  assert.match(css, /animation: ticker 4\.8s linear 1 both/);
  assert.match(script, /const trapFocus =/);
  assert.match(script, /mobileNav\.inert = !open/);
  assert.match(script, /aria-valuetext/);
  assert.match(script, /aria-busy/);
});

test('la sección de artistas integra una secuencia de 240 fotogramas controlada por scroll', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const css = await readFile(resolve(root, 'zona-zero.css'), 'utf8');
  const script = await readFile(resolve(root, 'zona-zero.js'), 'utf8');
  const frames = (await readdir(resolve(root, 'artist-sequence'))).filter((file) => /^frame-\d{4}\.jpg$/.test(file)).sort();
  assert.equal(frames.length, 240);
  assert.equal(frames[0], 'frame-0001.jpg');
  assert.equal(frames.at(-1), 'frame-0240.jpg');
  assert.match(html, /class="artist-scroll-story"/);
  assert.match(html, /class="artist-sequence-canvas"/);
  assert.match(html, /class="artist-sequence-copy"/);
  assert.match(html, /La piel recuerda/);
  assert.match(html, /lo que el tiempo no borra\./);
  assert.match(html, /data-frame-count="240"/);
  assert.match(html, /artist-sequence\/frame-0240\.jpg/);
  assert.equal(html.includes('artist-scroll-copy'), false);
  assert.equal(html.includes('artist-sequence-meta'), false);
  assert.equal(html.includes('artist-sequence-status'), false);
  assert.match(html, /class="artist-sequence-progress"/);
  assert.match(css, /artist-scroll-story\.is-enhanced/);
  assert.match(css, /artist-sequence-stage \{ min-height: 300svh/);
  assert.match(css, /artist-sequence-sticky \{ position: relative; width: 100%; max-width: none; height: 100svh/);
  assert.match(css, /@media \(min-width: 701px\)[\s\S]*artist-scroll-story, \.artist-sequence-stage, \.artist-sequence-sticky \{[\s\S]*width: 100vw/);
  assert.match(css, /margin-left: calc\(50% - 50vw\)/);
  assert.match(css, /artist-sequence-sticky \{ position: sticky; top: 0/);
  assert.equal(/class="artist-sequence-sticky"\s+style=/.test(html), false, 'la secuencia no debe conservar un ancho fijo inline');
  assert.match(css, /#artistas\.section \{ padding-block: 0/);
  assert.match(css, /#artistas\.wall-parallax \{ overflow: clip/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*artist-sequence-sticky \{ width: calc\(100% - 24px\); height: 84svh/);
  assert.match(css, /prefers-reduced-motion[\s\S]*artist-sequence-canvas/);
  assert.match(script, /const updateSequence =/);
  assert.match(script, /requestAnimationFrame\(updateSequence\)/);
  assert.match(script, /--sequence-copy-opacity/);
  assert.match(script, /--sequence-copy-clip/);
  assert.match(script, /activateSequence\(\);/);
  assert.match(script, /getComputedStyle\(sticky\)\.top/);
  assert.match(script, /bounds\.height - sticky\.offsetHeight/);
  assert.match(script, /artist-sequence\/frame-/);
  assert.equal(script.includes('artist-sequence-counter'), false);
  assert.equal(script.includes('artist-sequence-status'), false);
  assert.equal(script.includes('scrollIntoView'), false);
});
