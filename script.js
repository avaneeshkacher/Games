const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const paletteEl = document.getElementById("palette");
const positionEl = document.getElementById("position");
const modeEl = document.getElementById("mode");
const selectedEl = document.getElementById("selected");
const toggleModeBtn = document.getElementById("toggle-mode");
const resetBtn = document.getElementById("reset-world");
const saveBtn = document.getElementById("save-world");
const loadBtn = document.getElementById("load-world");

const blocks = [
  { name: "Grass", color: "#4caf50", top: "#7cc96f" },
  { name: "Dirt", color: "#8b5a2b", top: "#a5713f" },
  { name: "Stone", color: "#6e7a8a", top: "#8a98ab" },
  { name: "Sand", color: "#d9c27b", top: "#f0db9b" },
  { name: "Water", color: "#3b82f6", top: "#6ba8ff" },
  { name: "Wood", color: "#b7791f", top: "#d1994b" },
];

const world = {
  cols: 32,
  rows: 24,
  data: [],
};

const camera = {
  x: 0,
  y: 0,
  zoom: 20,
};

let selectedBlock = blocks[0];
let mode = "place";
let isDragging = false;

function initWorld() {
  world.data = new Array(world.rows).fill(null).map(() =>
    new Array(world.cols).fill(null).map(() => {
      const pick = Math.random();
      if (pick > 0.95) return blocks[4];
      if (pick > 0.85) return blocks[3];
      if (pick > 0.6) return blocks[0];
      if (pick > 0.4) return blocks[1];
      if (pick > 0.2) return blocks[2];
      return null;
    })
  );
}

function drawBlock(x, y, block) {
  const size = camera.zoom;
  const screenX = x * size + camera.x;
  const screenY = y * size + camera.y;

  ctx.fillStyle = block.color;
  ctx.fillRect(screenX, screenY, size, size);
  ctx.fillStyle = block.top;
  ctx.fillRect(screenX, screenY, size, size * 0.35);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeRect(screenX, screenY, size, size);
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0c111a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      const block = world.data[y][x];
      if (block) {
        drawBlock(x, y, block);
      }
    }
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let x = 0; x <= world.cols; x += 1) {
    const posX = x * camera.zoom + camera.x;
    ctx.beginPath();
    ctx.moveTo(posX, camera.y);
    ctx.lineTo(posX, world.rows * camera.zoom + camera.y);
    ctx.stroke();
  }
  for (let y = 0; y <= world.rows; y += 1) {
    const posY = y * camera.zoom + camera.y;
    ctx.beginPath();
    ctx.moveTo(camera.x, posY);
    ctx.lineTo(world.cols * camera.zoom + camera.x, posY);
    ctx.stroke();
  }
}

function setMode(nextMode) {
  mode = nextMode;
  modeEl.textContent = nextMode === "place" ? "Place" : "Mine";
  toggleModeBtn.textContent = nextMode === "place" ? "Switch to Mine" : "Switch to Place";
}

function updateSelected(block) {
  selectedBlock = block;
  selectedEl.textContent = block.name;
  document.querySelectorAll(".block").forEach((el) => {
    el.classList.toggle("active", el.dataset.block === block.name);
  });
}

function createPalette() {
  paletteEl.innerHTML = "";
  blocks.forEach((block) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "block";
    item.dataset.block = block.name;

    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = `linear-gradient(180deg, ${block.top}, ${block.color})`;

    const label = document.createElement("span");
    label.textContent = block.name;

    item.appendChild(swatch);
    item.appendChild(label);
    item.addEventListener("click", () => updateSelected(block));

    paletteEl.appendChild(item);
  });

  updateSelected(selectedBlock);
}

function toGridPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left - camera.x) / camera.zoom);
  const y = Math.floor((event.clientY - rect.top - camera.y) / camera.zoom);
  return { x, y };
}

function applyAction(event) {
  const { x, y } = toGridPosition(event);
  positionEl.textContent = `${x}, ${y}`;
  if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) return;

  if (mode === "place") {
    world.data[y][x] = selectedBlock;
  } else {
    world.data[y][x] = null;
  }
  drawGrid();
}

function handleMouseMove(event) {
  const { x, y } = toGridPosition(event);
  positionEl.textContent = `${x}, ${y}`;
  if (isDragging) {
    applyAction(event);
  }
}

canvas.addEventListener("mousedown", (event) => {
  isDragging = true;
  applyAction(event);
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

canvas.addEventListener("mousemove", handleMouseMove);

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const direction = Math.sign(event.deltaY);
  const nextZoom = camera.zoom - direction * 2;
  camera.zoom = Math.min(40, Math.max(12, nextZoom));
  drawGrid();
});

window.addEventListener("keydown", (event) => {
  const pan = 20;
  if (event.key === "ArrowUp") camera.y += pan;
  if (event.key === "ArrowDown") camera.y -= pan;
  if (event.key === "ArrowLeft") camera.x += pan;
  if (event.key === "ArrowRight") camera.x -= pan;
  drawGrid();
});

toggleModeBtn.addEventListener("click", () => {
  setMode(mode === "place" ? "mine" : "place");
});

resetBtn.addEventListener("click", () => {
  initWorld();
  drawGrid();
});

saveBtn.addEventListener("click", () => {
  const payload = JSON.stringify(world.data.map((row) => row.map((cell) => cell?.name ?? null)));
  localStorage.setItem("blockland-world", payload);
  saveBtn.textContent = "Saved!";
  setTimeout(() => {
    saveBtn.textContent = "Save";
  }, 1000);
});

loadBtn.addEventListener("click", () => {
  const payload = localStorage.getItem("blockland-world");
  if (!payload) return;
  const parsed = JSON.parse(payload);
  world.data = parsed.map((row) =>
    row.map((name) => (name ? blocks.find((block) => block.name === name) : null))
  );
  drawGrid();
});

initWorld();
createPalette();
setMode("place");
drawGrid();
