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
