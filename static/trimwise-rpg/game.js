const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE_W = 64;
const TILE_H = 32;
const WORLD_W = 10;
const WORLD_H = 10;
const ORIGIN_X = WIDTH / 2;
const ORIGIN_Y = 120;

const keys = new Set();
const stations = [
  { name: 'Treadmill', x: 2, y: 2, complete: false, tip: '+Cardio' },
  { name: 'Bench', x: 7, y: 2, complete: false, tip: '+Strength' },
  { name: 'Sauna', x: 2, y: 7, complete: false, tip: '+Recovery' },
  { name: 'Studio', x: 7, y: 7, complete: false, tip: '+Class' },
];

const player = {
  x: 5,
  y: 5,
  speed: 2.2,
  facing: 0,
  bob: 0,
};

function isoToScreen(x, y) {
  return {
    x: ORIGIN_X + (x - y) * (TILE_W / 2),
    y: ORIGIN_Y + (x + y) * (TILE_H / 2),
  };
}

function drawDiamond(x, y, color) {
  const p = isoToScreen(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + TILE_W / 2, p.y + TILE_H / 2);
  ctx.lineTo(p.x, p.y + TILE_H);
  ctx.lineTo(p.x - TILE_W / 2, p.y + TILE_H / 2);
  ctx.closePath();
  ctx.fill();
}

function drawGymLogo() {
  const x = WIDTH - 210;
  const y = 30;
  const g = ctx.createLinearGradient(x, y, x + 130, y + 80);
  g.addColorStop(0, '#9f1737');
  g.addColorStop(1, '#ef8e2c');

  ctx.fillStyle = '#0f1118';
  ctx.fillRect(WIDTH - 260, 10, 240, 120);

  ctx.strokeStyle = g;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 20);
  ctx.quadraticCurveTo(x + 70, y + 60, x + 120, y + 20);
  ctx.moveTo(x + 20, y + 95);
  ctx.quadraticCurveTo(x + 70, y + 55, x + 120, y + 95);
  ctx.moveTo(x + 70, y + 20);
  ctx.lineTo(x + 70, y + 95);
  ctx.stroke();

  ctx.fillStyle = '#f0b38f';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('TRIMWISE', WIDTH - 240, 118);
}

function drawStation(s) {
  const p = isoToScreen(s.x, s.y);
  ctx.fillStyle = s.complete ? '#2f8f4e' : '#4e5b85';
  ctx.fillRect(p.x - 24, p.y - 26, 48, 24);

  ctx.fillStyle = '#e7e7e7';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(s.name, p.x, p.y - 33);

  if (s.complete) {
    ctx.fillStyle = '#d9f99d';
    ctx.fillText('DONE', p.x, p.y - 44);
  }
}

function drawPlayer() {
  const p = isoToScreen(player.x, player.y);
  const bob = Math.sin(player.bob) * 2;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 26, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // retro simplified sprite inspired colors from supplied sheet
  ctx.fillStyle = '#f3cb9e';
  ctx.fillRect(p.x - 6, p.y - 24 + bob, 12, 10); // head
  ctx.fillStyle = '#b41f3a';
  ctx.fillRect(p.x - 8, p.y - 14 + bob, 16, 14); // torso
  ctx.fillStyle = '#6f7f9f';
  ctx.fillRect(p.x - 8, p.y + bob, 6, 12); // leg1
  ctx.fillRect(p.x + 2, p.y + bob, 6, 12); // leg2
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(p.x - 9, p.y + 12 + bob, 7, 4);
  ctx.fillRect(p.x + 2, p.y + 12 + bob, 7, 4);
}

function drawUI(message) {
  ctx.fillStyle = 'rgba(8,10,17,0.7)';
  ctx.fillRect(10, 10, 370, 78);

  ctx.fillStyle = '#f5d0a7';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Trimwise Fitness - Bridgwater', 20, 32);

  const done = stations.filter((s) => s.complete).length;
  ctx.fillStyle = '#d7defc';
  ctx.fillText(`Workout progress: ${done}/${stations.length}`, 20, 52);
  ctx.fillText(message, 20, 72);

  if (done === stations.length) {
    ctx.fillStyle = 'rgba(11, 45, 22, 0.85)';
    ctx.fillRect(WIDTH / 2 - 210, HEIGHT - 80, 420, 48);
    ctx.fillStyle = '#d9f99d';
    ctx.textAlign = 'center';
    ctx.fillText('Workout complete! Welcome to the Trimwise Hall of Gains.', WIDTH / 2, HEIGHT - 50);
  }
}

function nearestStation() {
  let best = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = Math.hypot(player.x - s.x, player.y - s.y);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return { station: best, distance: bestDist };
}

function update(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) dy += 1;
  if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) dx += 1;

  const len = Math.hypot(dx, dy) || 1;
  const sprint = keys.has('Shift') ? 1.6 : 1;
  player.x += ((dx / len) * player.speed * sprint * dt) / 16;
  player.y += ((dy / len) * player.speed * sprint * dt) / 16;

  player.x = Math.max(0.5, Math.min(WORLD_W - 0.5, player.x));
  player.y = Math.max(0.5, Math.min(WORLD_H - 0.5, player.y));

  if (dx !== 0 || dy !== 0) player.bob += 0.25 * sprint;
}

function render(message) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const checker = (x + y) % 2 === 0 ? '#27324d' : '#2f3c5c';
      drawDiamond(x, y, checker);
    }
  }

  for (const s of stations) drawStation(s);
  drawPlayer();
  drawGymLogo();
  drawUI(message);
}

let last = performance.now();
let promptText = 'Explore the gym floor and train at every station.';

function loop(now) {
  const dt = now - last;
  last = now;
  update(dt);

  const { station, distance } = nearestStation();
  if (station && distance < 1.05 && !station.complete) {
    promptText = `Press SPACE to use ${station.name} ${station.tip}`;
  } else if (station && distance < 1.05 && station.complete) {
    promptText = `${station.name} already complete. Move to another station.`;
  } else {
    promptText = 'Keep moving. Complete all stations to finish the level.';
  }

  render(promptText);
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.add(key);

  if (key === ' ' || key === 'Spacebar') {
    const { station, distance } = nearestStation();
    if (station && distance < 1.05) {
      station.complete = true;
    }
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(key);
});

requestAnimationFrame(loop);
