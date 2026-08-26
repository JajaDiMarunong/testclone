// =====================================================================
// GUESTBOOK & LEADERBOARD — Standalone Page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";

// -------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------
const notesBoardWrap = document.getElementById("notes-board-wrap");
const notesBoard = document.getElementById("notes-board");
const notesCount = document.getElementById("notes-count");
const leaderboardList = document.getElementById("leaderboard-list");
const lbDateFilter = document.getElementById("lb-date-filter");
const lbFilterCount = document.getElementById("lb-filter-count");
const btnBoardZoomIn = document.getElementById("btn-board-zoom-in");
const btnBoardZoomOut = document.getElementById("btn-board-zoom-out");
const btnBoardZoomReset = document.getElementById("btn-board-zoom-reset");

const noteViewModal = document.getElementById("note-view-modal");
const noteViewContent = document.getElementById("note-view-content");
const noteViewName = document.getElementById("note-view-name");
const btnNoteViewClose = document.getElementById("btn-note-view-close");

// -------------------------------------------------------------------
// Board state
// -------------------------------------------------------------------
const BOARD_WIDTH = 1200;
const BOARD_HEIGHT = 800;
let boardScale = 1;
let boardX = 0;
let boardY = 0;
let allNotesCache = [];
let cachedLeaderboard = [];

// -------------------------------------------------------------------
// Boot
// -------------------------------------------------------------------
loadNotesBoard();
loadLeaderboard();

// -------------------------------------------------------------------
// Auto-fit board to viewport on load
// -------------------------------------------------------------------
function fitBoardToViewport() {
  const wrapW = notesBoardWrap.clientWidth;
  const wrapH = notesBoardWrap.clientHeight;
  const scaleX = wrapW / BOARD_WIDTH;
  const scaleY = wrapH / BOARD_HEIGHT;
  boardScale = Math.min(scaleX, scaleY, 1); // never zoom in beyond 1x
  boardX = 0;
  boardY = 0;
  applyBoardTransform();
}

window.addEventListener("load", fitBoardToViewport);
window.addEventListener("resize", fitBoardToViewport);

function applyBoardTransform() {
  notesBoard.style.transform = `translate(${boardX}px, ${boardY}px) scale(${boardScale})`;
}

// -------------------------------------------------------------------
// Load Notes
// -------------------------------------------------------------------
async function loadNotesBoard() {
  notesBoard.innerHTML = `<p style="color:rgba(42,35,32,0.5);padding:20px;text-align:center;">Loading notes…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/notes.json`);
    const data = await res.json();
    allNotesCache = data
      ? Object.entries(data).map(([deviceId, note]) => ({ ...note, deviceId }))
      : [];
    renderNotesBoard();
    fitBoardToViewport();
    notesCount.textContent = `${allNotesCache.length} note${allNotesCache.length === 1 ? "" : "s"}`;
  } catch (err) {
    notesBoard.innerHTML = `<p style="color:rgba(42,35,32,0.5);padding:20px;text-align:center;">Couldn't load notes.</p>`;
  }
}

// -------------------------------------------------------------------
// Note placement with overlap prevention
// -------------------------------------------------------------------
const NOTE_W = 140;
const NOTE_H = 160;
const MARGIN = 16;

function findNonOverlappingPosition(existingNotes) {
  const occupied = existingNotes.map((n) => ({
    x: n.x,
    y: n.y,
    w: NOTE_W + MARGIN,
    h: NOTE_H + MARGIN,
  }));

  // Try random positions first (up to 80 attempts)
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = 20 + Math.random() * (BOARD_WIDTH - NOTE_W - 40);
    const y = 20 + Math.random() * (BOARD_HEIGHT - NOTE_H - 40);
    let overlaps = false;
    for (const o of occupied) {
      if (x < o.x + o.w && x + NOTE_W + MARGIN > o.x &&
          y < o.y + o.h && y + NOTE_H + MARGIN > o.y) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) return { x, y };
  }

  // Fallback: grid-based placement
  const cols = Math.floor((BOARD_WIDTH - 40) / (NOTE_W + MARGIN));
  const rows = Math.floor((BOARD_HEIGHT - 40) / (NOTE_H + MARGIN));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 20 + c * (NOTE_W + MARGIN);
      const y = 20 + r * (NOTE_H + MARGIN);
      let overlaps = false;
      for (const o of occupied) {
        if (x < o.x + o.w && x + NOTE_W + MARGIN > o.x &&
            y < o.y + o.h && y + NOTE_H + MARGIN > o.y) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) return { x, y };
    }
  }

  // Last resort: random with slight offset
  return {
    x: 20 + Math.random() * (BOARD_WIDTH - NOTE_W - 40),
    y: 20 + Math.random() * (BOARD_HEIGHT - NOTE_H - 40),
  };
}

function renderNotesBoard() {
  notesBoard.innerHTML = "";
  const placed = [];

  allNotesCache.forEach((note) => {
    // If note doesn't have position, assign one
    if (note.x == null || note.y == null) {
      const pos = findNonOverlappingPosition(placed);
      note.x = pos.x;
      note.y = pos.y;
    }

    placed.push({ x: note.x, y: note.y });

    const el = document.createElement("div");
    el.className = "note-sticky" + (note.type === "photo" ? " type-photo" : "");
    el.style.left = note.x + "px";
    el.style.top = note.y + "px";
    if (note.type !== "photo") el.style.background = note.color || "#f4d35e";
    el.style.transform = `rotate(${note.rotation || 0}deg)`;

    if (note.type === "photo") {
      el.innerHTML = `<img class="note-sticky-photo" src="${note.photo}" alt="photo" />`;
    } else if (note.type === "draw") {
      el.innerHTML = `<img class="note-sticky-drawing" src="${note.drawing}" alt="drawing" />`;
    } else {
      el.innerHTML = `<div class="note-sticky-text">${escapeHtml(note.text || "")}</div>`;
    }

    const nameTag = document.createElement("div");
    nameTag.className = "note-sticky-name";
    const dateStr = formatNoteDateShort(note.timestamp);
    nameTag.textContent = dateStr ? `${note.name || "Anonymous"} · ${dateStr}` : note.name || "Anonymous";
    el.appendChild(nameTag);

    el.addEventListener("click", () => openNoteView(note));
    notesBoard.appendChild(el);
  });
}

// -------------------------------------------------------------------
// Board pan + pinch-zoom
// -------------------------------------------------------------------
let boardLastPinchDist = null;
let boardLastTouchX = null;
let boardLastTouchY = null;

notesBoardWrap.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    boardLastPinchDist = getPinchDistance(e.touches);
  } else if (e.touches.length === 1) {
    boardLastTouchX = e.touches[0].clientX;
    boardLastTouchY = e.touches[0].clientY;
  }
}, { passive: true });

notesBoardWrap.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2 && boardLastPinchDist !== null) {
    const newDist = getPinchDistance(e.touches);
    const factor = newDist / boardLastPinchDist;
    boardScale = Math.min(2.5, Math.max(0.3, boardScale * factor));
    boardLastPinchDist = newDist;
    applyBoardTransform();
  } else if (e.touches.length === 1 && boardLastTouchX !== null) {
    const dx = e.touches[0].clientX - boardLastTouchX;
    const dy = e.touches[0].clientY - boardLastTouchY;
    boardX += dx;
    boardY += dy;
    boardLastTouchX = e.touches[0].clientX;
    boardLastTouchY = e.touches[0].clientY;
    applyBoardTransform();
  }
}, { passive: true });

notesBoardWrap.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) boardLastPinchDist = null;
  if (e.touches.length < 1) { boardLastTouchX = null; boardLastTouchY = null; }
}, { passive: true });

// Mouse drag for desktop
let mouseDragging = false;
let mouseLastX = 0;
let mouseLastY = 0;

notesBoardWrap.addEventListener("mousedown", (e) => {
  mouseDragging = true;
  mouseLastX = e.clientX;
  mouseLastY = e.clientY;
  notesBoardWrap.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!mouseDragging) return;
  boardX += e.clientX - mouseLastX;
  boardY += e.clientY - mouseLastY;
  mouseLastX = e.clientX;
  mouseLastY = e.clientY;
  applyBoardTransform();
});

window.addEventListener("mouseup", () => {
  mouseDragging = false;
  notesBoardWrap.style.cursor = "grab";
});

btnBoardZoomIn.addEventListener("click", () => {
  boardScale = Math.min(2.5, boardScale + 0.15);
  applyBoardTransform();
});
btnBoardZoomOut.addEventListener("click", () => {
  boardScale = Math.max(0.3, boardScale - 0.15);
  applyBoardTransform();
});
btnBoardZoomReset.addEventListener("click", fitBoardToViewport);

// -------------------------------------------------------------------
// Note view modal
// -------------------------------------------------------------------
function openNoteView(note) {
  noteViewContent.style.background = note.type === "photo" ? "#f7f4ec" : (note.color || "#f4d35e");
  if (note.type === "photo") {
    noteViewContent.innerHTML = `<img src="${note.photo}" alt="photo" />`;
  } else if (note.type === "draw") {
    noteViewContent.innerHTML = `<img src="${note.drawing}" alt="drawing" />`;
  } else {
    noteViewContent.innerHTML = `<p>${escapeHtml(note.text || "")}</p>`;
  }
  const dateStr = formatNoteDateFull(note.timestamp);
  noteViewName.textContent = dateStr ? `— ${note.name || "Anonymous"} · ${dateStr}` : `— ${note.name || "Anonymous"}`;
  noteViewModal.classList.remove("hidden");
}
btnNoteViewClose.addEventListener("click", () => noteViewModal.classList.add("hidden"));

// -------------------------------------------------------------------
// Leaderboard
// -------------------------------------------------------------------
async function loadLeaderboard() {
  leaderboardList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
    const data = await res.json();
    cachedLeaderboard = data ? Object.entries(data) : [];
    cachedLeaderboard.sort((a, b) => a[1].time - b[1].time);
    renderLeaderboardList();
  } catch (err) {
    leaderboardList.innerHTML = `<p class="leaderboard-status">Couldn't load leaderboard.</p>`;
  }
}

function renderLeaderboardList() {
  const filterValue = lbDateFilter.value;
  const filtered = filterEntriesByDate(cachedLeaderboard, filterValue);

  lbFilterCount.textContent = filtered.length > 0
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
    : "No results";

  if (filtered.length === 0) {
    leaderboardList.innerHTML = `<p class="leaderboard-status">No entries match this filter.</p>`;
    return;
  }

  leaderboardList.innerHTML = filtered
    .map(([key, e], i) => {
      const rank = i + 1;
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
      const rankClass = rank <= 3 ? ` rank-${rank}` : "";
      return `
        <div class="leaderboard-row${rankClass}">
          <span class="leaderboard-rank">${medal || "#" + rank}</span>
          <span class="leaderboard-name">${escapeHtml(e.name || "Anonymous")}${rank === 1 ? ' <span class="crown">👑</span>' : ""}</span>
          <span class="leaderboard-time">${formatTime(e.time)}</span>
        </div>`;
    })
    .join("");
}

lbDateFilter.addEventListener("change", renderLeaderboardList);

// -------------------------------------------------------------------
// Date filtering
// -------------------------------------------------------------------
function getDateRange(filterValue) {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  let start = 0;
  let end = Infinity;

  switch (filterValue) {
    case "today": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = d.getTime(); end = start + DAY; break;
    }
    case "yesterday": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = d.getTime(); end = start + DAY; break;
    }
    case "week": {
      const ws = getWeekStart(now);
      start = ws.getTime(); end = start + 7 * DAY; break;
    }
    case "lastweek": {
      const ws = getWeekStart(now);
      start = ws.getTime() - 7 * DAY; end = ws.getTime(); break;
    }
    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(); break;
    }
    case "lastmonth": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      end = new Date(now.getFullYear(), now.getMonth(), 1).getTime(); break;
    }
  }
  return { start, end };
}

function filterEntriesByDate(entries, filterValue) {
  if (filterValue === "all") return entries;
  const { start, end } = getDateRange(filterValue);
  return entries.filter(([, e]) => {
    const ts = e.timestamp || 0;
    return ts >= start && ts <= end;
  });
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// -------------------------------------------------------------------
// Utilities
// -------------------------------------------------------------------
function formatTime(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatNoteDateShort(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatNoteDateFull(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
