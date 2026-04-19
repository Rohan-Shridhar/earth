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
const runSimBtn  = document.getElementById('run-sim-btn');
const realtimePopEl = document.getElementById('realtime-pop');

// Face elements
const cheekL     = document.getElementById('cheek-l');
const cheekR     = document.getElementById('cheek-r');
const eyeBgL     = document.getElementById('eye-bg-l');
const eyeBgR     = document.getElementById('eye-bg-r');
const eyeXL      = document.getElementById('eye-x-l');
const eyeXR      = document.getElementById('eye-x-r');
const pupilL     = document.getElementById('pupil-l');
const pupilR     = document.getElementById('pupil-r');
const pupilSpiralL = document.getElementById('pupil-spiral-l');
const pupilSpiralR = document.getElementById('pupil-spiral-r');
const pupilGrpL  = document.getElementById('pupil-group-l');
const pupilGrpR  = document.getElementById('pupil-group-r');
const browL      = document.getElementById('brow-l');
const browR      = document.getElementById('brow-r');
const mouth      = document.getElementById('mouth');
const mouthWavy  = document.getElementById('mouth-wavy');

let totalPop = 8200000000;

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
let moonAngle = 0;
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

  // Real-time population ticking
  const yearlyRate = getAnnualGrowthRate() * 1000000;
  const frameRate = yearlyRate / (365 * 24 * 60 * 60 * 60); // 60fps assumption
  totalPop += frameRate;
  realtimePopEl.textContent = Math.floor(totalPop).toLocaleString();

  // Animate pupils drift
  const driftX = Math.sin(rotOff * 0.05) * 3;
  const driftY = Math.cos(rotOff * 0.07) * 3;
  pupilGrpL.setAttribute('transform', `translate(${driftX}, ${driftY})`);
  pupilGrpR.setAttribute('transform', `translate(${driftX}, ${driftY})`);

  // Animate Moon Orbit
  moonAngle += (Math.PI * 2) / 360; // 6 seconds at ~60fps
  const rx = 155;
  const ry = 45;
  const moonX = 130 + rx * Math.cos(moonAngle);
  const moonY = 130 + ry * Math.sin(moonAngle);
  
  const moonGroup = document.getElementById('moon-group');
  if (moonGroup) {
      // Small math to offset the pupil away from earth
      const moonPupilL = document.getElementById('moon-pupil-l');
      const moonPupilR = document.getElementById('moon-pupil-r');
      if (moonPupilL && moonPupilR) {
        // earth is at 130, 130. Moon is at moonX, moonY. Vector to outside is (moonX-130, moonY-130).
        const px = Math.sign(moonX - 130);
        moonPupilL.setAttribute('cx', -6 + px);
        moonPupilR.setAttribute('cx', 6 + px);
      }

      moonGroup.setAttribute('transform', `translate(${moonX}, ${moonY})`);
      const ocean = document.getElementById('ocean');
      
      if (moonY > 130) {
          // Front half: Place after fire-group
          const fireGrp = document.getElementById('fire-group');
          // Since face-group is after fire-group, we can insert before gloss layer (after face-group)
          // easiest is just appendChild, SVG renders it on top! 
          // but we still want it below gloss overlay ideally. Let's just append to end of globeSvg.
          if (globeSvg.lastElementChild !== moonGroup) {
              globeSvg.appendChild(moonGroup);
          }
      } else {
          // Behind half: Place before ocean layer
          if (ocean && ocean.previousElementSibling !== moonGroup) {
              globeSvg.insertBefore(moonGroup, ocean);
          }
      }
  }

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

function getAnnualGrowthRate() {
  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;
  const energy = +S.energy.value;

  let growth = 80; // Base +80M
  growth -= (temp / 10) * 200;
  growth -= (poll / 100) * 150;
  growth -= (1 - forest / 100) * 100;
  growth -= (sea / 10) * 80;
  growth -= (1 - energy / 100) * 60;
  growth -= (1 - ice / 100) * 40;
  return growth;
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

  const earthHealth = score * 10;
  scoreNum.textContent  = earthHealth;
  scoreNum.style.color  = cond.color;
  scoreBar.style.width  = score + '%';
  scoreBar.style.background = cond.color;
  statusLabel.textContent = cond.label;
  statusLabel.style.color = cond.color;

  // Face expressions based on score
  // Cheeks
  if (score > 60) {
    cheekL.setAttribute('fill', 'rgba(255,100,150,0.5)');
    cheekR.setAttribute('fill', 'rgba(255,100,150,0.5)');
    cheekL.style.display = 'block';
    cheekR.style.display = 'block';
  } else if (score >= 45) {
    cheekL.style.display = 'none';
    cheekR.style.display = 'none';
  } else {
    cheekL.setAttribute('fill', 'rgba(150,150,150,0.5)');
    cheekR.setAttribute('fill', 'rgba(150,150,150,0.5)');
    cheekL.style.display = 'block';
    cheekR.style.display = 'block';
  }

  // Eyes and Pupils
  if (score > 75) {
    eyeBgL.setAttribute('ry', '14');
    eyeBgR.setAttribute('ry', '14');
    eyeBgL.style.display = 'block';
    eyeBgR.style.display = 'block';
    eyeXL.style.display = 'none';
    eyeXR.style.display = 'none';
    
    pupilL.setAttribute('r', '5');
    pupilR.setAttribute('r', '5');
    pupilL.style.display = 'block';
    pupilR.style.display = 'block';
    pupilSpiralL.style.display = 'none';
    pupilSpiralR.style.display = 'none';
  } else if (score >= 45) {
    eyeBgL.setAttribute('ry', '8');
    eyeBgR.setAttribute('ry', '8');
    eyeBgL.style.display = 'block';
    eyeBgR.style.display = 'block';
    eyeXL.style.display = 'none';
    eyeXR.style.display = 'none';

    pupilL.setAttribute('r', '5');
    pupilR.setAttribute('r', '5');
    pupilL.style.display = 'block';
    pupilR.style.display = 'block';
    pupilSpiralL.style.display = 'none';
    pupilSpiralR.style.display = 'none';
  } else if (score >= 20) {
    eyeBgL.setAttribute('ry', '4');
    eyeBgR.setAttribute('ry', '4');
    eyeBgL.style.display = 'block';
    eyeBgR.style.display = 'block';
    eyeXL.style.display = 'none';
    eyeXR.style.display = 'none';

    pupilL.setAttribute('r', '3');
    pupilR.setAttribute('r', '3');
    pupilL.style.display = 'block';
    pupilR.style.display = 'block';
    pupilSpiralL.style.display = 'none';
    pupilSpiralR.style.display = 'none';
  } else {
    eyeBgL.style.display = 'none';
    eyeBgR.style.display = 'none';
    eyeXL.style.display = 'block';
    eyeXR.style.display = 'block';

    pupilL.style.display = 'none';
    pupilR.style.display = 'none';
    pupilSpiralL.style.display = 'block';
    pupilSpiralR.style.display = 'block';
  }

  // Eyebrows
  if (score > 75) {
    browL.style.transform = 'translateY(0) rotate(0deg)';
    browR.style.transform = 'translateY(0) rotate(0deg)';
  } else if (score >= 45) {
    browL.style.transform = 'translateY(0) rotate(10deg)';
    browR.style.transform = 'translateY(0) rotate(-10deg)';
  } else {
    browL.style.transform = 'translateY(6px) rotate(20deg)';
    browR.style.transform = 'translateY(6px) rotate(-20deg)';
  }

  // Mouth
  if (score >= 30) {
    mouth.style.display = 'block';
    mouthWavy.style.display = 'none';
    if (score > 75) {
      mouth.setAttribute('d', 'M 110 155 Q 130 185 150 155');
    } else if (score >= 60) {
      mouth.setAttribute('d', 'M 115 160 Q 130 172 145 160');
    } else if (score >= 45) {
      mouth.setAttribute('d', 'M 115 165 Q 130 165 145 165');
    } else {
      mouth.setAttribute('d', 'M 115 170 Q 130 160 145 170');
    }
  } else {
    mouth.style.display = 'none';
    mouthWavy.style.display = 'block';
  }

  if (score < 20) {
    mouthWavy.classList.add('wobbling-mouth');
  } else {
    mouthWavy.classList.remove('wobbling-mouth');
  }

  // Moon Face Updates
  const moonEyeBgL = document.getElementById('moon-eye-bg-l');
  const moonEyeBgR = document.getElementById('moon-eye-bg-r');
  const moonPupilL = document.getElementById('moon-pupil-l');
  const moonPupilR = document.getElementById('moon-pupil-r');
  const moonBrowL  = document.getElementById('moon-brow-l');
  const moonBrowR  = document.getElementById('moon-brow-r');
  const moonMouth  = document.getElementById('moon-mouth');
  const moonMouthO = document.getElementById('moon-mouth-o');
  const moonSweatL = document.getElementById('moon-sweat-l');
  const moonSweatR = document.getElementById('moon-sweat-r');
  const moonBase   = document.getElementById('moon-base');

  if (moonBase) {
    if (score > 75) {
      moonEyeBgL.setAttribute('rx', '3'); moonEyeBgL.setAttribute('ry', '3');
      moonEyeBgR.setAttribute('rx', '3'); moonEyeBgR.setAttribute('ry', '3');
      moonPupilL.style.display = 'none'; moonPupilR.style.display = 'none';
      moonBrowL.style.display = 'none'; moonBrowR.style.display = 'none';
      moonMouth.setAttribute('d', 'M -4 2 Q 0 6 4 2'); // gentle smile
      moonMouth.style.display = 'block'; moonMouthO.style.display = 'none';
      moonSweatL.style.display = 'none'; moonSweatR.style.display = 'none';
      moonBase.setAttribute('fill', '#d8d8d0');
    } else if (score > 50) {
      moonEyeBgL.setAttribute('rx', '3'); moonEyeBgL.setAttribute('ry', '2');
      moonEyeBgR.setAttribute('rx', '3'); moonEyeBgR.setAttribute('ry', '2');
      moonPupilL.style.display = 'none'; moonPupilR.style.display = 'none';
      moonBrowL.style.display = 'block'; moonBrowR.style.display = 'block';
      moonBrowL.setAttribute('d', 'M -10 -7 Q -6 -6 -2 -7'); 
      moonBrowR.setAttribute('d', 'M 2 -7 Q 6 -6 10 -7');
      moonMouth.setAttribute('d', 'M -4 4 Q 0 4 4 4'); // flat mouth
      moonMouth.style.display = 'block'; moonMouthO.style.display = 'none';
      moonSweatL.style.display = 'none'; moonSweatR.style.display = 'none';
      moonBase.setAttribute('fill', '#d8d8d0');
    } else if (score > 25) {
      moonEyeBgL.setAttribute('rx', '3'); moonEyeBgL.setAttribute('ry', '1.5');
      moonEyeBgR.setAttribute('rx', '3'); moonEyeBgR.setAttribute('ry', '1.5');
      moonPupilL.style.display = 'none'; moonPupilR.style.display = 'none';
      moonBrowL.style.display = 'block'; moonBrowR.style.display = 'block';
      moonBrowL.setAttribute('d', 'M -10 -9 Q -6 -5 -2 -9');
      moonBrowR.setAttribute('d', 'M 2 -9 Q 6 -5 10 -9');
      moonMouth.setAttribute('d', 'M -4 6 Q 0 3 4 6'); // worried frown
      moonMouth.style.display = 'block'; moonMouthO.style.display = 'none';
      moonSweatL.style.display = 'none'; moonSweatR.style.display = 'block';
      moonBase.setAttribute('fill', '#d8d8d0');
    } else {
      moonEyeBgL.setAttribute('rx', '4'); moonEyeBgL.setAttribute('ry', '4');
      moonEyeBgR.setAttribute('rx', '4'); moonEyeBgR.setAttribute('ry', '4');
      moonPupilL.style.display = 'block'; moonPupilR.style.display = 'block';
      moonBrowL.style.display = 'block'; moonBrowR.style.display = 'block';
      moonBrowL.setAttribute('d', 'M -10 -11 Q -6 -13 -2 -11');
      moonBrowR.setAttribute('d', 'M 2 -11 Q 6 -13 10 -11');
      moonMouth.style.display = 'none'; moonMouthO.style.display = 'block';
      moonSweatL.style.display = 'block'; moonSweatR.style.display = 'block';
      moonBase.setAttribute('fill', '#f0f0e8');
    }
  }

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

  // Sync simulation button color
  runSimBtn.style.borderColor = cond.color;
  runSimBtn.style.color = cond.color;
  runSimBtn.style.boxShadow = `0 0 20px ${cond.color}22`;
}

function resetAll() {
  S.temp.value   = 0;
  S.sea.value    = 0;
  S.forest.value = 100;
  S.poll.value   = 0;
  S.ice.value    = 100;
  S.energy.value = 100;
  totalPop = 8200000000;
  update();
}

Object.values(S).forEach(s => s.addEventListener('input', update));

function runSimulation() {
  const temp   = +S.temp.value;
  const sea    = +S.sea.value;
  const forest = +S.forest.value;
  const poll   = +S.poll.value;
  const ice    = +S.ice.value;
  const energy = +S.energy.value;

  let currentPop = 8200; // In Millions (8.2B)
  const history = [];

  for (let i = 1; i <= 10; i++) {
    let growth = 80; // Base +80M
    growth -= (temp / 10) * 200;
    growth -= (poll / 100) * 150;
    growth -= (1 - forest / 100) * 100;
    growth -= (sea / 10) * 80;
    growth -= (1 - energy / 100) * 60;
    growth -= (1 - ice / 100) * 40;
    
    currentPop += growth;
    if (currentPop < 0) currentPop = 0;
    history.push({ year: 2026 + i, pop: (currentPop / 1000).toFixed(2) + 'B' });
  }

  const finalPop = (currentPop / 1000).toFixed(2) + 'B';
  const totalChange = (currentPop - 8200) / 1000;
  
  let verdictText = "";
  let verdictClass = "";
  if (totalChange > 0.2) {
    verdictText = `Positive Outlook: Population grew by ${totalChange.toFixed(2)}B. Earth remains a thriving home for humanity.`;
    verdictClass = "verdict-good";
  } else if (totalChange >= -0.5) {
    verdictText = `Stagnant Development: Population shifted by ${totalChange.toFixed(2)}B. Humanity is holding on, but resources are tight.`;
    verdictClass = "verdict-warn";
  } else {
    verdictText = `Critical Alert: Catastrophic decline of ${Math.abs(totalChange).toFixed(2)}B. Severe environmental collapse has decimated the population.`;
    verdictClass = "verdict-bad";
  }

  const verdictEl = document.getElementById('sim-verdict');
  document.getElementById('final-pop').textContent = finalPop;
  verdictEl.textContent = verdictText;
  verdictEl.className = `sim-verdict ${verdictClass}`;
  
  const grid = document.getElementById('year-grid');
  grid.innerHTML = history.map(h => `
    <div class="year-item">
      <span class="year-num">${h.year}</span>
      <span class="year-val">${h.pop}</span>
    </div>
  `).join('');

  // Lock button state during simulation
  runSimBtn.textContent = "Simulating...";
  runSimBtn.classList.add('simulating');

  setTimeout(() => {
    document.getElementById('sim-panel').classList.add('active');
    
    // Animation reveal
    const items = grid.querySelectorAll('.year-item');
    items.forEach((item, idx) => {
      setTimeout(() => item.classList.add('show'), idx * 80);
    });

    // Reset button after reveal
    setTimeout(() => {
      runSimBtn.textContent = "⚡ Simulate 10 Years";
      runSimBtn.classList.remove('simulating');
    }, items.length * 80 + 500);
  }, 1000);
}

function closeSimulation() {
  document.getElementById('sim-panel').classList.remove('active');
}

update();
drawFrame();

// Earth Day Banner
function initEarthDayBanner() {
  const titleStr = "Happy Earth Day";
  const titleEl = document.getElementById('ed-title');
  if (titleEl) {
    let html = '';
    for (let i = 0; i < titleStr.length; i++) {
      if (titleStr[i] === ' ') {
        html += `<div style="flex-basis: 100%; height: 8px;"></div>`;
      } else {
        html += `<span style="animation-delay: ${i * 0.05}s">${titleStr[i]}</span>`;
      }
    }
    html += `<div style="flex-basis: 100%; height: 8px;"></div>`;
    html += `<span class="ed-emoji" style="animation-delay: ${titleStr.length * 0.05}s">🌍</span>`;
    titleEl.innerHTML = html;

    setTimeout(triggerConfetti, titleStr.length * 50 + 500); // trigger after letters land
  }
}

function triggerConfetti() {
  const container = document.getElementById('ed-confetti-container');
  if (!container) return;
  container.innerHTML = '';
  
  const colors = ['#3ecf70', '#50a0ff', '#ffffff'];
  const NUM_PARTICLES = 60;
  
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const isCircle = Math.random() > 0.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    
    // Spread confetti randomly across the banner's area and fall
    const tx = (Math.random() - 0.5) * 800; // X spread
    const ty = (Math.random() - 0.5) * 200 + 80; // Y spread (bias down)
    const rot = (Math.random() - 0.5) * 720;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "confetti-particle");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.style.setProperty('--tx', `calc(-50% + ${tx}px)`);
    svg.style.setProperty('--ty', `calc(-50% + ${ty}px)`);
    svg.style.setProperty('--rot', `${rot}deg`);
    
    if (isCircle) {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", size/2);
      circle.setAttribute("cy", size/2);
      circle.setAttribute("r", size/2);
      circle.setAttribute("fill", color);
      svg.appendChild(circle);
    } else {
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", size);
      rect.setAttribute("height", size);
      rect.setAttribute("fill", color);
      svg.appendChild(rect);
    }
    
    container.appendChild(svg);
  }
}

initEarthDayBanner();
