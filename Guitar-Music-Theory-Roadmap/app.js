'use strict';

// ── Tab switching ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
  });
});

// ── Fretboard ──────────────────────────────────────────────────
const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const OPEN_STRINGS = ['E','B','G','D','A','E']; // high to low (display order)
const OPEN_MIDI = [64, 59, 55, 50, 45, 40];    // MIDI pitch of each open string

const SCALE_INTERVALS = {
  all:        [0,1,2,3,4,5,6,7,8,9,10,11],
  pentatonic: [0,3,5,7,10],        // minor pentatonic
  major:      [0,2,4,5,7,9,11],
  dorian:     [0,2,3,5,7,9,10],
  lydian:     [0,2,4,6,7,9,11],
  phrygian:   [0,1,3,5,7,8,10],
};

function buildFretboard(rootNote, scaleName) {
  const table = document.getElementById('fretboard-table');
  table.innerHTML = '';

  const rootIdx = CHROMATIC.indexOf(rootNote);
  const intervals = SCALE_INTERVALS[scaleName];
  const FRETS = 15;

  // Header row
  const hRow = document.createElement('tr');
  const thStr = document.createElement('th');
  thStr.textContent = 'String';
  thStr.className = 'string-label';
  hRow.appendChild(thStr);
  for (let f = 0; f <= FRETS; f++) {
    const th = document.createElement('th');
    th.textContent = f === 0 ? 'Open' : f;
    hRow.appendChild(th);
  }
  table.appendChild(hRow);

  // String rows
  OPEN_STRINGS.forEach((openNote, si) => {
    const openMidi = OPEN_MIDI[si];
    const tr = document.createElement('tr');

    // String label
    const tdLabel = document.createElement('td');
    tdLabel.textContent = openNote;
    tdLabel.className = 'string-label';
    tr.appendChild(tdLabel);

    for (let f = 0; f <= FRETS; f++) {
      const midi = openMidi + f;
      const noteIdx = midi % 12;
      const noteName = CHROMATIC[noteIdx];

      const td = document.createElement('td');
      const div = document.createElement('div');
      div.className = 'fret-cell';

      const semFromRoot = (noteIdx - rootIdx + 12) % 12;
      const inScale = intervals.includes(semFromRoot);

      if (!inScale) {
        div.classList.add('hidden');
        div.textContent = '';
      } else if (semFromRoot === 0) {
        div.classList.add('root');
        div.textContent = noteName;
      } else if (semFromRoot === 7) {
        div.classList.add('fifth');
        div.textContent = noteName;
      } else {
        div.classList.add(scaleName === 'all' ? 'natural' : 'scale');
        div.textContent = noteName;
      }

      td.appendChild(div);
      tr.appendChild(td);
    }

    table.appendChild(tr);
  });
}

document.getElementById('root-select').addEventListener('change', refreshFretboard);
document.getElementById('scale-select').addEventListener('change', refreshFretboard);

function refreshFretboard() {
  const root = document.getElementById('root-select').value;
  const scale = document.getElementById('scale-select').value;
  buildFretboard(root, scale);
}

buildFretboard('C', 'all');

// ── Polyrhythm visualiser ──────────────────────────────────────
function createBeats(containerId, count, color) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  container.innerHTML = '';
  const dots = [];
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'beat-dot';
    container.appendChild(dot);
    dots.push(dot);
  }
  return dots;
}

const dots3 = createBeats('beats-3', 3, 'accent2');
const dots2 = createBeats('beats-2', 2, 'gold');

let step = 0;
const TOTAL_STEPS = 6; // LCM of 2 and 3

function animatePoly() {
  dots3.forEach((d, i) => {
    d.classList.toggle('active', step % 2 === 0 && i === (step / 2) % 3);
  });
  dots2.forEach((d, i) => {
    d.classList.toggle('active', step % 3 === 0 && i === (step / 3) % 2);
  });

  step = (step + 1) % (TOTAL_STEPS * 4);
  setTimeout(animatePoly, 280);
}

animatePoly();

// ── Phase expand/collapse (keyboard accessible) ────────────────
document.querySelectorAll('.phase-header').forEach(header => {
  header.setAttribute('tabindex', '0');
  header.style.cursor = 'pointer';

  function toggle() {
    const body = header.nextElementSibling;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    header.setAttribute('aria-expanded', String(!open));
  }

  header.addEventListener('click', toggle);
  header.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

// ── Smooth active nav highlight ─────────────────────────────────
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active-nav'));
      const match = [...navLinks].find(a => a.getAttribute('href') === '#' + entry.target.id);
      if (match) match.classList.add('active-nav');
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => observer.observe(s));

// ── Chord diagrams ─────────────────────────────────────────────
const BEGINNER_CHORDS = [
  {
    key: 'Em', full: 'E Minor',
    feel: 'The easiest chord on guitar — dark and melancholic',
    fingers: [{s:5,f:2,n:2},{s:6,f:2,n:3}],
    open: [1,2,3,4], muted: [],
    steps: [
      'Middle finger (2) on the A string (5th string), 2nd fret',
      'Ring finger (3) on the low E string (6th string), 2nd fret',
      'Strum all 6 strings — every one should ring out clearly',
    ],
    warn: 'Keep your fingers arched — if the G or D string buzzes, adjust your angle.',
    songs: '"House of the Rising Sun", "Wish You Were Here" verse, "Nothing Else Matters" intro',
  },
  {
    key: 'Am', full: 'A Minor',
    feel: 'Sad and beautiful — your second essential chord',
    fingers: [{s:2,f:1,n:1},{s:3,f:2,n:2},{s:4,f:2,n:3}],
    open: [1,5], muted: [6],
    steps: [
      'Index finger (1) on the B string (2nd string), 1st fret',
      'Middle finger (2) on the G string (3rd string), 2nd fret',
      'Ring finger (3) on the D string (4th string), 2nd fret',
      'Mute the low E (6th) string — rest your thumb or don\'t strum it',
    ],
    warn: 'The low E string is muted (×). Strum strings 5 down to 1 only.',
    songs: '"Stairway to Heaven", "Losing My Religion", "Hotel California" verse',
  },
  {
    key: 'E', full: 'E Major',
    feel: 'Powerful and bright — Em\'s happy sibling',
    fingers: [{s:3,f:1,n:1},{s:5,f:2,n:2},{s:4,f:2,n:3}],
    open: [1,2,6], muted: [],
    steps: [
      'Index finger (1) on the G string (3rd string), 1st fret',
      'Middle finger (2) on the A string (5th string), 2nd fret',
      'Ring finger (3) on the D string (4th string), 2nd fret',
      'Strum all 6 strings',
    ],
    warn: 'Notice it\'s almost the same shape as Am but mirrored. Compare the two.',
    songs: '"Satisfaction" (Rolling Stones), "Sweet Home Chicago", countless blues songs',
  },
  {
    key: 'D', full: 'D Major',
    feel: 'Bright and strummy — a cornerstone of guitar pop',
    fingers: [{s:1,f:2,n:1},{s:3,f:2,n:2},{s:2,f:3,n:3}],
    open: [4], muted: [5,6],
    steps: [
      'Index finger (1) on the high e string (1st string), 2nd fret',
      'Middle finger (2) on the G string (3rd string), 2nd fret',
      'Ring finger (3) on the B string (2nd string), 3rd fret',
      'Strum strings 4 to 1 only — mute the A and low E strings',
    ],
    warn: 'Only strum 4 strings (D to high e). The low two strings are muted.',
    songs: '"Brown Eyed Girl", "Wonderwall" (with Capo 2), "Free Fallin\'"',
  },
  {
    key: 'C', full: 'C Major',
    feel: 'The "do-re-mi" chord — sounds instantly uplifting',
    fingers: [{s:2,f:1,n:1},{s:4,f:2,n:2},{s:5,f:3,n:3}],
    open: [1,3], muted: [6],
    steps: [
      'Index finger (1) on the B string (2nd string), 1st fret',
      'Middle finger (2) on the D string (4th string), 2nd fret',
      'Ring finger (3) on the A string (5th string), 3rd fret',
      'Mute the low E string — strum strings 5 down to 1',
    ],
    warn: 'The stretch from the A string to the B string is the tricky part — take it slow.',
    songs: '"Let It Be", "American Pie", "Sweet Home Alabama" (C–D–G loop)',
  },
  {
    key: 'G', full: 'G Major',
    feel: 'Open and resonant — the most popular key on guitar',
    fingers: [{s:6,f:3,n:2},{s:5,f:2,n:1},{s:2,f:3,n:3},{s:1,f:3,n:4}],
    open: [3,4], muted: [],
    steps: [
      'Index finger (1) on the A string (5th string), 2nd fret',
      'Middle finger (2) on the low E string (6th string), 3rd fret',
      'Ring finger (3) on the B string (2nd string), 3rd fret',
      'Pinky (4) on the high e string (1st string), 3rd fret',
      'Strum all 6 strings',
    ],
    warn: 'G is a big stretch. Start with just the low E + A + high e if your pinky won\'t cooperate.',
    songs: '"Knockin\' on Heaven\'s Door", "Country Roads", "Wonderwall"',
  },
];

function chordSVG(chord) {
  const SS = 18, FS = 22, LP = 24, TP = 30, NF = 5;
  const W = LP + 5 * SS + 16;
  const H = TP + NF * FS + 14;

  const sx = s => LP + (6 - s) * SS;
  const fy = f => TP + (f - 0.5) * FS;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

  // Strings (vertical)
  for (let i = 1; i <= 6; i++) {
    s += `<line x1="${sx(i)}" y1="${TP}" x2="${sx(i)}" y2="${TP + NF * FS}" stroke="#4a5568" stroke-width="1.5"/>`;
  }

  // Fret lines + nut
  for (let f = 0; f <= NF; f++) {
    const y = TP + f * FS;
    s += `<line x1="${LP}" y1="${y}" x2="${LP + 5 * SS}" y2="${y}" stroke="${f === 0 ? '#c8a96e' : '#4a5568'}" stroke-width="${f === 0 ? 4 : 1.5}"/>`;
  }

  // Mute / open markers
  for (let i = 1; i <= 6; i++) {
    const x = sx(i);
    const y = TP - 13;
    if (chord.muted.includes(i)) {
      s += `<text x="${x}" y="${y + 5}" text-anchor="middle" fill="#ef4444" font-size="13" font-family="monospace" font-weight="bold">×</text>`;
    } else if (chord.open.includes(i)) {
      s += `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`;
    }
  }

  // Finger dots
  for (const {s: str, f, n} of chord.fingers) {
    const x = sx(str);
    const y = fy(f);
    s += `<circle cx="${x}" cy="${y}" r="8.5" fill="#a855f7"/>`;
    s += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">${n}</text>`;
  }

  s += '</svg>';
  return s;
}

function renderChord(chord) {
  const display = document.getElementById('chord-display');
  const stepsHTML = chord.steps
    .map((st, i) => `<li data-n="${i + 1}">${st}</li>`)
    .join('');

  display.innerHTML = `
    <div class="chord-svg-wrap">
      ${chordSVG(chord)}
      <div class="chord-svg-name">${chord.key}</div>
      <div class="chord-svg-full">${chord.full}</div>
    </div>
    <div class="chord-info">
      <div class="chord-feel">${chord.feel}</div>
      <ul class="chord-steps">${stepsHTML}</ul>
      <div class="chord-warn">&#9888;&#65039; ${chord.warn}</div>
      <div class="chord-songs"><strong>Songs to try:</strong> ${chord.songs}</div>
    </div>`;
}

function initChordLibrary() {
  const nav = document.getElementById('chord-nav');
  if (!nav) return;

  BEGINNER_CHORDS.forEach((chord, i) => {
    const btn = document.createElement('button');
    btn.className = 'chord-nav-btn' + (i === 0 ? ' active' : '');
    btn.textContent = chord.key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chord-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChord(chord);
    });
    nav.appendChild(btn);
  });

  renderChord(BEGINNER_CHORDS[0]);
}

initChordLibrary();

// Checklist done-state
document.querySelectorAll('.check-item input').forEach(cb => {
  cb.addEventListener('change', () => cb.closest('.check-item').classList.toggle('done', cb.checked));
});

// ── Metronome ──────────────────────────────────────────────────
class Metronome {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.tempo = 80;
    this.beatsPerBar = 4;
    this.currentBeat = 0;
    this.nextNoteTime = 0;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.1;
    this.timerID = null;
    this.onBeatCbs = [];
  }

  ctx() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  }

  scheduleClick(beat, time) {
    const ctx = this.ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const accent = beat === 0;
    osc.frequency.value = accent ? 1040 : 800;
    gain.gain.setValueAtTime(accent ? 0.55 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
    osc.start(time);
    osc.stop(time + 0.05);
    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => this.onBeatCbs.forEach(cb => cb(beat, this.beatsPerBar)), delay);
  }

  schedule() {
    const ctx = this.ctx();
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleClick(this.currentBeat, this.nextNoteTime);
      this.nextNoteTime += 60 / this.tempo;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }
    this.timerID = setTimeout(() => this.schedule(), this.lookahead);
  }

  start() {
    const ctx = this.ctx();
    if (ctx.state === 'suspended') ctx.resume();
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.schedule();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
  }

  toggle() {
    this.isPlaying ? this.stop() : this.start();
    return this.isPlaying;
  }

  setTempo(bpm) { this.tempo = Math.max(20, Math.min(300, bpm)); }
  setBeats(n) { this.beatsPerBar = n; this.currentBeat = 0; }
  onBeat(cb) { this.onBeatCbs.push(cb); }
}

function initMetronome() {
  const bpmDisplay = document.getElementById('metro-bpm');
  const slider = document.getElementById('metro-slider');
  const btn = document.getElementById('metro-btn');
  const timeSelect = document.getElementById('metro-time');
  const beatsRow = document.getElementById('metro-beats');
  if (!bpmDisplay || !slider || !btn) return;

  const metro = new Metronome();
  let dots = [];

  function buildDots(n) {
    beatsRow.innerHTML = '';
    dots = [];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'metro-dot' + (i === 0 ? ' accent' : '');
      beatsRow.appendChild(d);
      dots.push(d);
    }
  }

  buildDots(4);

  metro.onBeat((beat, total) => {
    dots.forEach((d, i) => d.classList.toggle('active', i === beat));
  });

  slider.addEventListener('input', () => {
    metro.setTempo(+slider.value);
    bpmDisplay.textContent = slider.value;
  });

  timeSelect.addEventListener('change', () => {
    const n = +timeSelect.value;
    metro.setBeats(n);
    buildDots(n);
  });

  btn.addEventListener('click', () => {
    const playing = metro.toggle();
    btn.textContent = playing ? '&#9646;&#9646; Stop' : '&#9654; Start';
    btn.innerHTML = playing ? '&#9646;&#9646; Stop' : '&#9654; Start';
    btn.classList.toggle('playing', playing);
    if (!playing) dots.forEach(d => d.classList.remove('active'));
  });
}

initMetronome();
