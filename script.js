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
const condLabel  = document.getElementById('condition-label');
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

const LAND = [
  {x:76,y:68,w:46,h:36,rx:10},
  {x:114,y:60,w:32,h:24,rx:8},
  {x:142,y:80,w:28,h:38,rx:9},
  {x:64,y:118,w:52,h:44,rx:13},
  {x:168,y:115,w:36,h:28,rx:8},
  {x:92,y:174,w:38,h:30,rx:9},
  {x:140,y:164,w:26,h:22,rx:6},
  {x:186,y:150,w:22,h:18,rx:6},
  {x:54,y:82,w:18,h:24,rx:6},
  {x:200,y:85,w:16,h:20,rx:5},
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
  const h = temp / 10;
  const t = poll / 100;
  if (t > 0.75) return `rgb(${Math.round(50+t*60)},${Math.round(80-t*30)},${Math.round(40+t*20)})`;
  if (h > 0.7)  return `rgb(${Math.round(30+h*40)},${Math.round(100+h*20)},${Math.round(160-h*60)})`;
  return `rgb(${Math.round(22+t*50+h*30)},${Math.round(90-t*30+sea*3)},${Math.round(185-h*55-t*55)})`;
}

function drawFrame() {
  rotOff = (rotOff + 0.004) % (Math.PI * 2);

  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;

  ocean.setAttribute('fill', getOceanColor(temp, sea, poll));

  // Atmosphere tint
  const heatAlpha = (temp / 10) * 0.3;
  const pollAlpha = (poll / 100) * 0.25;
  atmo.setAttribute('stroke', `rgba(${Math.round(80+heatAlpha*175)},${Math.round(160-heatAlpha*100)},${Math.round(255-heatAlpha*255)},${0.15+heatAlpha+pollAlpha})`);
  atmo.setAttribute('stroke-width', 10 + sea * 1.5);

  const landCol = getLandColor(temp, forest, poll);
  const seaRise = sea / 10;
  let lHtml = '';
  LAND.forEach(p => {
    const ox = Math.sin(rotOff + p.x * 0.04) * 5;
    const sh = seaRise * 6;
    const nx = p.x + ox + sh * 0.5;
    const ny = p.y + sh * 0.7;
    const nw = Math.max(0, p.w - sh * 1.8);
    const nh = Math.max(0, p.h - sh * 1.4);
    if (nw > 3 && nh > 3)
      lHtml += `<rect x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" width="${nw.toFixed(1)}" height="${nh.toFixed(1)}" rx="${p.rx}" fill="${landCol}"/>`;
  });
  landGroup.innerHTML = lHtml;

  const iceFrac = ice / 100;
  const iceAlpha = Math.max(0, iceFrac - (temp / 20));
  const iceFill  = temp > 4 ? `rgba(190,225,255,${iceAlpha * 0.92})` : `rgba(230,245,255,${iceAlpha * 0.97})`;
  const topRx = Math.round(78 * iceFrac);
  const topRy = Math.round(44 * iceFrac);
  const botRx = Math.round(64 * iceFrac);
  const botRy = Math.round(32 * iceFrac);
  iceGroup.innerHTML = topRy > 2
    ? `<ellipse cx="130" cy="10" rx="${topRx}" ry="${topRy}" fill="${iceFill}"/>
       <ellipse cx="130" cy="252" rx="${botRx}" ry="${botRy}" fill="${iceFill}"/>`
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

  scoreNum.textContent  = score;
  scoreNum.style.color  = cond.color;
  scoreBar.style.width  = score + '%';
  scoreBar.style.background = cond.color;
  condLabel.textContent = cond.label;
  condLabel.style.color = cond.color;

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
