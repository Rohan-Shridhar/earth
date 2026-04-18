const S = {
  temp: document.getElementById('s-temp'),
  sea:  document.getElementById('s-sea'),
  forest: document.getElementById('s-forest'),
  poll: document.getElementById('s-poll'),
  ice:  document.getElementById('s-ice'),
  energy: document.getElementById('s-energy'),
};
const V = {
  temp: document.getElementById('v-temp'),
  sea:  document.getElementById('v-sea'),
  forest: document.getElementById('v-forest'),
  poll: document.getElementById('v-poll'),
  ice:  document.getElementById('v-ice'),
  energy: document.getElementById('v-energy'),
};

const scoreNum   = document.getElementById('score-number');
const scoreBar   = document.getElementById('score-bar');
const statusLabel = document.getElementById('status-label');
const eventBox   = document.getElementById('event-box');
const ocean      = document.getElementById('ocean');
const atmo       = document.getElementById('atmo');
const landGroup  = document.getElementById('land-group');
const iceGroup   = document.getElementById('ice-group');
const smogGroup  = document.getElementById('smog-group');
const fireGroup  = document.getElementById('fire-group');
const globeSvg   = document.getElementById('globe-svg');
const ring1      = document.getElementById('ring1');
const ring2      = document.getElementById('ring2');
const cloudGroup = document.getElementById('cloud-group');

const CONTINENTS = [
  { 
    d: "M 40,100 C 50,70 90,60 110,80 S 160,90 150,130 S 110,180 80,170 S 30,140 40,100 Z",
    biomes: [
      { d: "M 60,90 C 70,80 90,85 95,100 S 80,120 70,115 S 55,100 60,90 Z", type: 'forest' },
      { d: "M 100,110 C 110,105 130,110 135,125 S 120,150 105,145 S 95,120 100,110 Z", type: 'desert' },
      { d: "M 80,135 C 90,130 110,140 115,155 S 100,175 85,170 S 75,145 80,135 Z", type: 'jungle' }
    ]
  },
  { 
    d: "M 180,60 C 200,50 240,70 230,110 S 190,150 170,130 S 160,80 180,60 Z",
    biomes: [
      { d: "M 195,80 C 205,75 220,85 215,100 S 200,115 190,110 S 185,90 195,80 Z", type: 'forest' }
    ]
  },
  { 
    d: "M 300,120 C 320,100 360,130 350,170 S 310,210 290,180 S 280,140 300,120 Z",
    biomes: [
      { d: "M 310,140 C 320,135 340,145 335,160 S 320,175 310,170 S 305,150 310,140 Z", type: 'forest' },
      { d: "M 320,170 C 330,165 350,175 345,190 S 330,205 320,200 S 315,180 320,170 Z", type: 'jungle' }
    ]
  }
];

const CLOUDS = [
  { cx: 50,  cy: 80,  rx: 40, ry: 6, opacity: 0.4 },
  { cx: 180, cy: 150, rx: 60, ry: 8, opacity: 0.3 },
  { cx: 300, cy: 110, rx: 35, ry: 5, opacity: 0.5 },
  { cx: 120, cy: 190, rx: 50, ry: 7, opacity: 0.2 },
];

let rotOff = 0;
let animId  = null;

function getLandColor(temp, forest, poll) {
  const h = temp / 10;
  const d = 1 - forest / 100;
  if (d > 0.85 || poll > 85) return '#6B4A10';
  if (h > 0.7 && d > 0.5)    return '#B07030';
  if (d > 0.6)                return '#907840';
  if (h > 0.5)                return '#7AAA35';
  const r = Math.round(55  + d * 90  + h * 50);
  const g = Math.round(140 - d * 80  + forest * 0.3);
  const b = Math.round(35  + forest * 0.25);
  return `rgb(${r},${g},${b})`;
}

function getOceanColor(temp, sea, poll) {
  const p = poll / 100;
  // Deep rich blue #1a6fa8 shifting to murky green-brown
  const r = Math.round(26  + p * 80);
  const g = Math.round(111 - p * 20);
  const b = Math.round(168 - p * 120);
  return `rgb(${r},${g},${b})`;
}

function drawFrame() {
  rotOff = (rotOff + 0.3) % 400; // Moving coordinate system

  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;

  ocean.setAttribute('fill', getOceanColor(temp, sea, poll));

  // Atmosphere tint - reactive to temperature
  const atmoHue = 180 + (temp * 5);
  atmo.setAttribute('stroke', `hsla(${atmoHue}, 80%, 70%, ${0.2 + (10-temp)*0.01})`);

  // Land Rendering
  const seaRise = sea / 10;
  const landAlpha = 1 - (seaRise * 0.4);
  const forestAlpha = forest / 100;
  const jungleAlpha = (temp > 2 ? (temp-2)/8 : 0) * forestAlpha;
  const desertAlpha = (temp > 4 ? (temp-4)/6 : 0) * (1 - forestAlpha);

  let lHtml = '';
  // Draw two copies for seamless rotation
  [0, 400].forEach(offset => {
    const xOff = (offset - rotOff);
    CONTINENTS.forEach(c => {
      lHtml += `<path d="${c.d}" transform="translate(${xOff}, 0)" fill="#3a8a3a" fill-opacity="${landAlpha}"/>`;
      c.biomes.forEach(b => {
        let bCol = "#2d5a27"; // Forest
        let bAlpha = forestAlpha;
        if (b.type === 'desert') { bCol = "#d2b48c"; bAlpha = desertAlpha; }
        if (b.type === 'jungle') { bCol = "#1b4d1b"; bAlpha = jungleAlpha; }
        lHtml += `<path d="${b.d}" transform="translate(${xOff}, 0)" fill="${bCol}" fill-opacity="${bAlpha * landAlpha}"/>`;
      });
    });
  });
  landGroup.innerHTML = lHtml;

  // Cloud Rendering
  let cHtml = '';
  const cloudRot = (rotOff * 1.5) % 400; // Clouds move at different speed
  const cloudCol = poll > 50 ? `rgba(${180-poll},${180-poll*1.2},${180-poll},` : `rgba(255,255,255,`;
  [0, 400].forEach(offset => {
    const cxOff = (offset - cloudRot);
    CLOUDS.forEach(c => {
      cHtml += `<ellipse cx="${c.cx}" cy="${c.cy}" rx="${c.rx}" ry="${c.ry}" transform="translate(${cxOff}, 0)" fill="${cloudCol}${c.opacity})"/>`;
    });
  });
  cloudGroup.innerHTML = cHtml;

  const iceFrac = ice / 100;
  const iceAlpha = Math.max(0, iceFrac - (temp / 20));
  const iceFill  = `rgba(240,250,255,${iceAlpha * 0.95})`;
  const topSize = 80 * iceFrac;
  const botSize = 70 * iceFrac;
  iceGroup.innerHTML = iceFrac > 0.05
    ? `<ellipse cx="130" cy="5" rx="${topSize}" ry="${topSize * 0.3}" fill="${iceFill}"/>
       <ellipse cx="130" cy="255" rx="${botSize}" ry="${botSize * 0.3}" fill="${iceFill}"/>`
    : '';

  const smogA = Math.min(0.55, poll / 130);
  smogGroup.innerHTML = smogA > 0.02
    ? `<circle cx="130" cy="130" r="122" fill="rgba(${temp > 5 ? '160,100,30' : '80,95,80'},${smogA})"/>`
    : '';

  const firePct = (temp > 5 && forest < 55)
    ? ((temp - 5) / 5) * ((55 - forest) / 55)
    : 0;
  let fires = '';
  if (firePct > 0.15) {
    [[100,115],[155,92],[84,168],[174,142],[120,88],[68,100]].forEach(([fx, fy]) => {
      const s  = firePct * 10;
      const ox = Math.sin(rotOff * 3 + fx) * 2;
      fires += `<ellipse cx="${fx+ox}" cy="${fy}" rx="${s}" ry="${s*1.5}" fill="rgba(255,90,15,${firePct*0.72})"/>`;
      fires += `<ellipse cx="${fx+ox}" cy="${fy - s * 0.6}" rx="${s*0.55}" ry="${s*1.1}" fill="rgba(255,210,40,${firePct*0.55})"/>`;
    });
  }
  fireGroup.innerHTML = fires;

  globeSvg.style.filter = `drop-shadow(0 0 ${20 + (1 - (calcScore()/100)) * 30}px rgba(${scoreToCSSColor(calcScore())},0.45))`;

  animId = requestAnimationFrame(drawFrame);
}

function scoreToCSSColor(score) {
  if (score >= 75) return '40,200,100';
  if (score >= 55) return '200,190,30';
  if (score >= 35) return '220,120,30';
  return '220,50,50';
}

function calcScore() {
  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;
  const energy = +S.energy.value;
  let s = 100;
  s -= temp * 6;
  s -= sea   * 5;
  s -= (100 - forest) * 0.4;
  s -= poll * 0.45;
  s -= (100 - ice)    * 0.25;
  s -= (100 - energy) * 0.3;
  return Math.max(0, Math.min(100, Math.round(s)));
}

const CONDITIONS = [
  { min: 90, label: 'Thriving Paradise',  color: '#3ECF70' },
  { min: 75, label: 'Mostly Healthy',     color: '#70C840' },
  { min: 60, label: 'Under Stress',       color: '#C8B020' },
  { min: 45, label: 'Struggling',         color: '#D08020' },
  { min: 30, label: 'In Crisis',          color: '#C04830' },
  { min: 15, label: 'Critical Danger',    color: '#A02020' },
  { min: 0,  label: 'Near Extinction',    color: '#701010' },
];

const EVENTS = {
  temp:   { 5:'Heat waves devastating global crop yields.', 7:'Coral reefs fully bleached worldwide.', 9:'Equatorial regions becoming uninhabitable.' },
  sea:    { 3:'Coastal communities building emergency sea walls.', 6:'Low-lying island nations submerged.', 9:'Major port cities flooding.' },
  forest: { 60:'Biodiversity loss accelerating rapidly.', 30:'Oxygen production critically reduced.', 5:'Ecosystem collapse imminent.' },
  poll:   { 40:'Air quality reaching hazardous levels.', 70:'Toxic smog blanketing major cities.', 90:'Fresh water sources contaminated.' },
  ice:    { 50:'Arctic shipping lanes permanently open.', 20:'Global sea levels rising rapidly.', 5:'Glacial freshwater reserves depleted.' },
  energy: { 60:'Fossil fuels dominating energy grid.', 30:'Carbon emissions at all-time highs.', 5:'Climate tipping points triggered.' },
};

function getEvents() {
  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;
  const energy = +S.energy.value;
  const msgs = [];
  const check = (val, map, inv) => {
    const keys = Object.keys(map).map(Number).sort((a,b) => inv ? b-a : a-b);
    for (const k of keys) {
      if (inv ? val <= k : val >= k) { msgs.push(map[k]); break; }
    }
  };
  check(temp,   EVENTS.temp);
  check(sea,    EVENTS.sea);
  check(forest, EVENTS.forest, true);
  check(poll,   EVENTS.poll);
  check(ice,    EVENTS.ice,    true);
  check(energy, EVENTS.energy, true);
  return msgs.length
    ? msgs.slice(0, 3).join(' ')
    : 'All systems stable. Earth is in perfect balance.';
}

let pulseTimer = null;
function triggerPulse(color) {
  [ring1, ring2].forEach(r => {
    r.style.borderColor = color;
    r.style.opacity = '0';
    r.style.transform = 'translate(-50%,-50%) scale(1)';
  });
  let t = 0;
  if (pulseTimer) clearInterval(pulseTimer);
  pulseTimer = setInterval(() => {
    t += 0.06;
    ring1.style.opacity = Math.max(0, 0.5 - t * 0.65) + '';
    ring1.style.transform = `translate(-50%,-50%) scale(${1 + t * 0.5})`;
    ring2.style.opacity = Math.max(0, 0.35 - t * 0.5) + '';
    ring2.style.transform = `translate(-50%,-50%) scale(${1 + t * 0.75})`;
    if (t >= 1) clearInterval(pulseTimer);
  }, 30);
}

function update() {
  V.temp.textContent   = `+${S.temp.value}°C`;
  V.sea.textContent    = `+${S.sea.value}m`;
  V.forest.textContent = `${S.forest.value}%`;
  V.poll.textContent   = `${S.poll.value}%`;
  V.ice.textContent    = `${S.ice.value}%`;
  V.energy.textContent = `${S.energy.value}%`;

  const score = calcScore();
  const cond  = CONDITIONS.find(c => score >= c.min) || CONDITIONS[CONDITIONS.length - 1];

  const population = score * 10;
  scoreNum.textContent  = population;
  scoreNum.style.color  = cond.color;
  scoreBar.style.width  = score + '%';
  scoreBar.style.background = cond.color;
  statusLabel.textContent = cond.label;
  statusLabel.style.color = cond.color;

  const events = getEvents();
  eventBox.textContent  = events;
  eventBox.className    = 'event-box' + (score < 45 ? ' danger' : '');

  triggerPulse(cond.color);

  Object.values(V).forEach(el => el.style.color = cond.color);

  // Update range track fill per slider
  Object.entries(S).forEach(([key, el]) => {
    const min = +el.min, max = +el.max, val = +el.value;
    const pct = ((val - min) / (max - min)) * 100;
    el.style.background = `linear-gradient(to right, ${cond.color} ${pct}%, #111e2e ${pct}%)`;
  });
}

function resetAll() {
  S.temp.value   = 0;
  S.sea.value    = 0;
  S.forest.value = 100;
  S.poll.value   = 0;
  S.ice.value    = 100;
  S.energy.value = 100;
  update();
}

Object.values(S).forEach(s => s.addEventListener('input', update));

update();
drawFrame();
