const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');
const healthEl = document.getElementById('healthValue');
const snakeCountEl = document.getElementById('snakeCount');
const speedValueEl = document.getElementById('speedValue');
const messageEl = document.getElementById('message');
const audioButton = document.getElementById('audioButton');
const resetButton = document.getElementById('resetButton');

const tileSize = 46;
const viewportRadius = 11;
let audioContext;
let soundEnabled = false;


const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  health: 100,
  companions: 0,
  speed: 1,
  lastMove: 0,
};

const controls = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const featureTexts = {
  trees: [
    'A grove of pearly moon-trees with curling leaves.',
    'Tall fern pines scatter sunlight into a green pool.',
    'A circle of friendly mushrooms hums softly.',
  ],
  flowers: [
    'A meadow of glowing petals and sweet breeze.',
    'Dancing blossoms paint the ground in pink and gold.',
    'Tiny star-flowers lean close to the trail.',
  ],
  cave: [
    'A hidden cave mouth breathes cool air.',
    'Crystals sparkle inside a sheltered grotto.',
    'A secret hollow glows with blue moss.',
  ],
  streams: [
    'A gentle stream winds over polished stones.',
    'Water sings quietly through a shaded hollow.',
    'A silver ribbon of water glitters under leaves.',
  ],
  rocks: [
    'Rounded boulders sit like guardians of the path.',
    'A mossy stone circle invites you to rest.',
    'Smooth river rocks scatter along the ground.',
  ],
  animals: [
    'A family of glowing dragonflies flutters nearby.',
    'A shy rabbit peeks from behind a fern.',
    'A soft fox shape prowls through the blossoms.',
  ],
  niceSnake: [
    'A gentle snake offers a healing touch.',
    'A lovely snake curls in a friendly spiral.',
    'A guardian snake shines with warm scales.',
  ],
  meanSnake: [
    'A mean snake hisses with a sharp bite.',
    'A dark snake slithers fast and unfriendly.',
    'A prickly snake guards the path aggressively.',
  ],
};

function resizeCanvas() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function hash(x, y, seed = 0) {
  let n = x * 374761393 + y * 668265263 + seed * 982451653;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function choose(array, ratio = 0.5) {
  return array[Math.floor(hash(...ratio) * array.length)];
}

function tileData(x, y) {
  const h = hash(x, y, 1);
  const h2 = hash(x, y, 2);
  const h3 = hash(x, y, 3);
  const h4 = hash(x, y, 4);
  const biomeValue = hash(x, y, 5);

  const streamBand = Math.abs(Math.sin((x * 0.74 + y * 0.42) * 0.55));
  const water = streamBand > 0.88 && h > 0.45;
  const cave = h2 < 0.05 && !water;
  const rock = !water && h3 < 0.09;
  const flower = !water && h4 < 0.11;
  const tree = !water && !cave && !rock && h > 0.7;
  const animal = !water && !tree && !cave && h2 > 0.84;
  const niceSnake = !water && h3 > 0.96;
  const meanSnake = !water && h4 > 0.97;
  const grass = !water && !cave && !rock && !flower && !tree && !animal;

  const features = [];
  if (streamBand > 0.88 && !water) features.push('stream');
  if (flower) features.push('flowers');
  if (tree) features.push('trees');
  if (cave) features.push('cave');
  if (rock) features.push('rocks');
  if (animal) features.push('animals');
  if (niceSnake) features.push('niceSnake');
  if (meanSnake) features.push('meanSnake');
  if (grass && features.length === 0 && h > 0.78) features.push('flowers');
  if (water) features.push('water');

  return {
    water,
    cave,
    rock,
    flower,
    tree,
    animal,
    niceSnake,
    meanSnake,
    stream: streamBand > 0.92 && !water,
    feature: features[0] || 'grass',
    description: featureTexts[features[0]] ? featureTexts[features[0]][Math.floor(hash(x, y, 9) * featureTexts[features[0]].length)] : 'A serene part of the endless garden.',
  };
}

function drawTile(x, y, tile, offsetX, offsetY) {
  const px = offsetX + x * tileSize;
  const py = offsetY + y * tileSize;
  ctx.save();
  const base = tile.water ? '#53a7d6' : tile.cave ? '#4f4a63' : tile.tree ? '#3f7247' : tile.flower ? '#95c65f' : tile.rock ? '#8c7e72' : '#7ab86a';
  ctx.fillStyle = tile.water ? '#4fb4dd' : tile.cave ? '#4b4f5f' : tile.tree ? '#3a6e44' : tile.flower ? '#92c36f' : tile.rock ? '#8d7e75' : '#78b468';
  ctx.fillRect(px, py, tileSize, tileSize);

  const light = tile.water ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.08)';
  ctx.fillStyle = light;
  ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

  const details = tile.feature;
  if (details === 'trees') {
    drawTree(px, py);
  } else if (details === 'flowers') {
    drawFlowers(px, py);
  } else if (details === 'cave') {
    drawCave(px, py);
  } else if (details === 'rocks') {
    drawRocks(px, py);
  } else if (details === 'stream') {
    drawStream(px, py);
  } else if (details === 'water') {
    drawWater(px, py);
  } else if (details === 'animals') {
    drawAnimal(px, py);
  }
  if (tile.niceSnake) {
    drawSnake(px + tileSize * 0.22, py + tileSize * 0.42, '#f2c66d', '#7b5131');
  }
  if (tile.meanSnake) {
    drawSnake(px + tileSize * 0.24, py + tileSize * 0.45, '#8b2f3f', '#38191f');
  }
  ctx.restore();
}

function drawTree(px, py) {
  ctx.fillStyle = '#2f5b34';
  ctx.beginPath();
  ctx.ellipse(px + 23, py + 18, 17, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e3f29';
  ctx.fillRect(px + 19, py + 20, 8, 16);
}

function drawFlowers(px, py) {
  const positions = [
    [14, 16], [32, 10], [21, 30], [10, 34], [34, 28],
  ];
  positions.forEach(([ox, oy], index) => {
    ctx.fillStyle = index % 2 === 0 ? '#e1a3ef' : '#ffde7a';
    ctx.beginPath();
    ctx.arc(px + ox, py + oy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + ox, py + oy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawCave(px, py) {
  ctx.fillStyle = '#292f38';
  ctx.beginPath();
  ctx.ellipse(px + 24, py + 28, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.arc(px + 22, py + 26, 6, 0, Math.PI, true);
  ctx.fill();
}

function drawRocks(px, py) {
  ctx.fillStyle = '#6a5e53';
  ctx.beginPath();
  ctx.ellipse(px + 18, py + 28, 10, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + 30, py + 23, 9, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawStream(px, py) {
  ctx.strokeStyle = '#78c9f6';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(px + 4, py + 10);
  ctx.bezierCurveTo(px + 14, py + 16, px + 26, py + 28, px + 40, py + 36);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(px + 6, py + 9);
  ctx.bezierCurveTo(px + 16, py + 14, px + 28, py + 26, px + 38, py + 34);
  ctx.stroke();
}

function drawWater(px, py) {
  ctx.fillStyle = '#3b9acc';
  ctx.fillRect(px + 4, py + 8, tileSize - 8, tileSize - 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + 6, py + 18);
  ctx.quadraticCurveTo(px + 20, py + 10, px + 38, py + 22);
  ctx.stroke();
}

function drawAnimal(px, py) {
  ctx.fillStyle = '#ffdba1';
  ctx.beginPath();
  ctx.arc(px + 24, py + 26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c57a4e';
  ctx.fillRect(px + 24, py + 28, 10, 4);
}

function drawSnake(px, py, bodyColor, accent) {
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(px + 12, py + 7, 11, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + 26, py + 13, 7, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(px + 27, py + 12, 2.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#fff2cf';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fee7a6';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e06a90';
  ctx.beginPath();
  ctx.arc(-4, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getCurrentTile() {
  return tileData(player.x, player.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function update(delta) {
  if (player.health <= 0) return;
  const speed = player.speed * 0.004 * delta;
  let moved = false;
  if (controls.up) { player.vy = -1; moved = true; }
  if (controls.down) { player.vy = 1; moved = true; }
  if (controls.left) { player.vx = -1; moved = true; }
  if (controls.right) { player.vx = 1; moved = true; }
  if (!moved) {
    player.vx = 0;
    player.vy = 0;
  }
  if (moved) {
    const dx = Math.sign(player.vx);
    const dy = Math.sign(player.vy);
    if (dx !== 0 || dy !== 0) {
      const nextX = player.x + dx;
      const nextY = player.y + dy;
      player.x = nextX;
      player.y = nextY;
      player.lastMove = Date.now();
      handleTileEvent(getCurrentTile());
      if (soundEnabled) playMoveSound();
    }
  }
  if (Date.now() - player.lastMove > 8000 && player.health < 100) {
    player.health = clamp(player.health + 1, 0, 100);
  }
}

function handleTileEvent(tile) {
  if (tile.niceSnake && Math.random() < 0.85) {
    const heal = 12 + Math.floor(hash(player.x, player.y, 11) * 10);
    player.health = clamp(player.health + heal, 0, 100);
    player.companions = clamp(player.companions + 1, 0, 6);
    updateMessage(featureTexts.niceSnake[Math.floor(hash(player.x, player.y, 12) * featureTexts.niceSnake.length)] + ` Healed +${heal}.`);
    if (soundEnabled) playChime();
    return;
  }
  if (tile.meanSnake) {
    const damage = 8 + Math.floor(hash(player.x, player.y, 13) * 10);
    const defense = Math.min(player.companions * 7, 30);
    const finalHit = Math.max(0, damage - defense);
    player.health = clamp(player.health - finalHit, 0, 100);
    if (player.companions > 0 && Math.random() < 0.72) {
      player.companions = clamp(player.companions - 1, 0, 5);
      updateMessage(featureTexts.meanSnake[Math.floor(hash(player.x, player.y, 14) * featureTexts.meanSnake.length)] + ` Your friend helped block the bite. Lost ${finalHit} health.`);
    } else {
      updateMessage(featureTexts.meanSnake[Math.floor(hash(player.x, player.y, 14) * featureTexts.meanSnake.length)] + ` Took ${finalHit} damage.`);
    }
    if (soundEnabled) playStrike();
    if (player.health <= 0) {
      updateMessage('A mean snake was too much this time, but the garden is always waiting for another adventure.');
    }
    return;
  }
  updateMessage(tile.description);
}

function updateMessage(text) {
  messageEl.textContent = text;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const displayWidth = canvas.width / devicePixelRatio;
  const displayHeight = canvas.height / devicePixelRatio;
  const columns = Math.ceil(displayWidth / tileSize) + 2;
  const rows = Math.ceil(displayHeight / tileSize) + 2;
  const centerX = Math.floor(columns / 2);
  const centerY = Math.floor(rows / 2);
  const offsetX = displayWidth / 2 - tileSize / 2 - player.x * tileSize;
  const offsetY = displayHeight / 2 - tileSize / 2 - player.y * tileSize;

  for (let gridY = -centerY; gridY <= centerY; gridY++) {
    for (let gridX = -centerX; gridX <= centerX; gridX++) {
      const worldX = player.x + gridX;
      const worldY = player.y + gridY;
      const tile = tileData(worldX, worldY);
      drawTile(gridX + centerX, gridY + centerY, tile, offsetX - (centerX * tileSize), offsetY - (centerY * tileSize));
    }
  }

  drawPlayer(displayWidth / 2, displayHeight / 2);
  healthEl.textContent = player.health;
  snakeCountEl.textContent = player.companions;
  speedValueEl.textContent = player.speed === 1 ? 'Normal' : 'Swift';
}

function gameLoop(timestamp) {
  const delta = timestamp - (gameLoop.lastTime || timestamp);
  gameLoop.lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowUp' || event.key.toLowerCase() === 'w') controls.up = true;
    if (event.code === 'ArrowDown' || event.key.toLowerCase() === 's') controls.down = true;
    if (event.code === 'ArrowLeft' || event.key.toLowerCase() === 'a') controls.left = true;
    if (event.code === 'ArrowRight' || event.key.toLowerCase() === 'd') controls.right = true;
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowUp' || event.key.toLowerCase() === 'w') controls.up = false;
    if (event.code === 'ArrowDown' || event.key.toLowerCase() === 's') controls.down = false;
    if (event.code === 'ArrowLeft' || event.key.toLowerCase() === 'a') controls.left = false;
    if (event.code === 'ArrowRight' || event.key.toLowerCase() === 'd') controls.right = false;
  });
}

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    soundEnabled = true;
    if (audioContext.state === 'suspended') audioContext.resume();
    updateMessage('Sound is enabled. Listen for birds, bites, and magic snake chimes.');
  } catch (err) {
    soundEnabled = false;
    updateMessage('Audio unavailable. You can still explore the endless garden.');
  }
}

function createTone(frequency, duration, type = 'sine', volume = 0.16) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
  oscillator.connect(gainNode).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

function playMoveSound() {
  createTone(320, 90, 'triangle', 0.08);
}

function playChime() {
  createTone(620, 200, 'triangle', 0.14);
  setTimeout(() => createTone(840, 180, 'sine', 0.1), 90);
}

function playStrike() {
  createTone(220, 140, 'square', 0.16);
  setTimeout(() => createTone(330, 120, 'triangle', 0.09), 90);
}

function resetGame() {
  player.x = 0;
  player.y = 0;
  player.health = 100;
  player.companions = 0;
  player.speed = 1;
  updateMessage('A new adventure begins. The endless garden is yours to explore.');
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  bindInput();
  resetButton.addEventListener('click', resetGame);
  audioButton.addEventListener('click', () => {
    if (!soundEnabled) {
      initAudio();
      audioButton.textContent = 'Sound Enabled';
      audioButton.disabled = true;
    }
  });
  updateMessage('Step into the endless garden. Friendly snakes will heal you and magical surprises await.');
  requestAnimationFrame(gameLoop);
});
