// =====================================================================
// ADMIN PANEL — standalone page
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const ADMIN_PASSWORD = "GBRMu5281";

// -------------------------------------------------------------------
// Built-in artworks (mirrors the original app.js defaults)
// These are shown in the list but cannot be deleted from here.
// -------------------------------------------------------------------
const BUILTIN_ARTWORKS = [
  {
    id: "builtin-mona",
    name: "Mona Lisa",
    image: "./assets/mona-marker.jpg",
    artist: "Leonardo da Vinci",
    year: "c. 1503–1506",
    location: "The Louvre, Paris, France",
    details: "Painted by Leonardo da Vinci in the early 1500s, this portrait is one of the most recognized paintings in the world, known for its subtle, ambiguous smile and soft transitions of light and shadow. It has hung in the Louvre in Paris since the museum opened to the public.",
    baseScale: 0.003,
    icon: "🖼️",
    hasModel: true,
  },
  {
    id: "builtin-kiss",
    name: "The Kiss",
    image: "./assets/the-kiss.jpg",
    artist: "Gustav Klimt",
    year: "1907–1908",
    location: "Österreichische Galerie Belvedere, Vienna, Austria",
    details: "Gustav Klimt painted The Kiss between 1907 and 1908, during what's often called his \"Golden Phase\" for its extensive use of gold leaf. It shows an entwined couple kneeling at the edge of a flower-covered meadow, their bodies wrapped in an elaborate mosaic of gold, ornament, and pattern that blurs the line between clothing and abstract design. It remains one of the defining images of the Vienna Secession movement and today hangs in the Österreichische Galerie Belvedere in Vienna, Austria.",
    baseScale: 0.06,
    icon: "💛",
    hasModel: false,
  },
  {
    id: "builtin-placeholder",
    name: "Second Artwork",
    image: "./assets/artwork-2.jpg",
    artist: null,
    year: null,
    location: null,
    details: "Details will appear here once this artwork is added.",
    baseScale: 0.06,
    icon: "🗿",
    hasModel: false,
  },
];

// -------------------------------------------------------------------
// DOM refs
// -------------------------------------------------------------------
const screenLogin = document.getElementById("screen-login");
const adminDashboard = document.getElementById("admin-dashboard");
const adminPasswordInput = document.getElementById("admin-password-input");
const adminLoginError = document.getElementById("admin-login-error");
const btnAdminLoginSubmit = document.getElementById("btn-admin-login-submit");
const btnLogout = document.getElementById("btn-logout");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const visitsFilter = document.getElementById("visits-filter");
const visitsChart = document.getElementById("visits-chart");
const visitsChartTotal = document.getElementById("visits-chart-total");

const adminLeaderboardList = document.getElementById("admin-leaderboard-list");
const adminNotesList = document.getElementById("admin-notes-list");
const adminArtworksList = document.getElementById("admin-artworks-list");

const imageUploadZone = document.getElementById("image-upload-zone");
const artworkImageInput = document.getElementById("artwork-image");
const imagePreview = document.getElementById("image-preview");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const btnUploadArtwork = document.getElementById("btn-upload-artwork");
const uploadStatus = document.getElementById("upload-status");

// -------------------------------------------------------------------
// Login
// -------------------------------------------------------------------
btnAdminLoginSubmit.addEventListener("click", () => {
  if (adminPasswordInput.value === ADMIN_PASSWORD) {
    screenLogin.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    loadAllData();
  } else {
    adminLoginError.classList.remove("hidden");
  }
});
adminPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdminLoginSubmit.click();
});
btnLogout.addEventListener("click", () => {
  adminDashboard.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  adminPasswordInput.value = "";
  adminLoginError.classList.add("hidden");
});

// -------------------------------------------------------------------
// Tabs
// -------------------------------------------------------------------
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabPanels.forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
  });
});

// -------------------------------------------------------------------
// Refresh
// -------------------------------------------------------------------
document.getElementById("btn-refresh-admin").addEventListener("click", loadAllData);

async function loadAllData() {
  await Promise.all([
    loadAdminStats(),
    loadAdminLeaderboard(),
    loadAdminNotes(),
    loadAdminArtworks(),
  ]);
}

// =====================================================================
// STATS
// =====================================================================
let cachedVisitTimestamps = [];
let currentVisitsRange = "week";

async function loadAdminStats() {
  await Promise.all([loadActiveNow(), loadVisitData(), loadCounts()]);
  renderVisitsChart(currentVisitsRange);
}

async function loadActiveNow() {
  try {
    const res = await fetch(`${FIREBASE_URL}/presence.json`);
    const data = await res.json();
    const entries = data ? Object.values(data) : [];
    const activeCount = entries.filter((p) => Date.now() - p.timestamp < 60000).length;
    document.getElementById("stat-active-now").textContent = activeCount;
  } catch (err) {
    document.getElementById("stat-active-now").textContent = "?";
  }
}

async function loadCounts() {
  try {
    const [artRes, lbRes, notesRes] = await Promise.all([
      fetch(`${FIREBASE_URL}/artworks.json`),
      fetch(`${FIREBASE_URL}/leaderboard.json`),
      fetch(`${FIREBASE_URL}/notes.json`),
    ]);
    const artData = await artRes.json();
    const lbData = await lbRes.json();
    const notesData = await notesRes.json();

    const uploadedCount = artData ? Object.keys(artData).length : 0;
    document.getElementById("stat-artwork-count").textContent = BUILTIN_ARTWORKS.length + uploadedCount;
    document.getElementById("stat-leaderboard-count").textContent = lbData ? Object.keys(lbData).length : 0;
    document.getElementById("stat-notes-count").textContent = notesData ? Object.keys(notesData).length : 0;
  } catch (err) {
    document.getElementById("stat-artwork-count").textContent = "?";
    document.getElementById("stat-leaderboard-count").textContent = "?";
    document.getElementById("stat-notes-count").textContent = "?";
  }
}

async function loadVisitData() {
  const DAY = 24 * 60 * 60 * 1000;
  try {
    const res = await fetch(`${FIREBASE_URL}/analytics_visits.json`);
    const data = await res.json();
    cachedVisitTimestamps = data ? Object.values(data).map((v) => v.timestamp).filter(Boolean) : [];

    const staleCutoff = Date.now() - 35 * DAY;
    const staleEntries = data ? Object.entries(data).filter(([, v]) => v.timestamp < staleCutoff) : [];
    staleEntries.forEach(([key]) => {
      fetch(`${FIREBASE_URL}/analytics_visits/${key}.json`, { method: "DELETE" }).catch(() => {});
    });
  } catch (err) {
    cachedVisitTimestamps = [];
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function renderVisitsChart(range) {
  const DAY = 24 * 60 * 60 * 1000;
  const timestamps = cachedVisitTimestamps;
  let bars = [];

  if (range === "week" || range === "lastweek") {
    const thisWeekStart = getWeekStart(new Date());
    const weekStart = range === "lastweek" ? new Date(thisWeekStart.getTime() - 7 * DAY) : thisWeekStart;
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const binStart = weekStart.getTime() + i * DAY;
      const binEnd = binStart + DAY;
      bars.push({ label: dayLabels[i], count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
    }
  } else if (range === "month") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let weekStart = getWeekStart(monthStart);
    let weekNum = 1;
    while (weekStart.getTime() < monthEnd.getTime()) {
      const binStart = Math.max(weekStart.getTime(), monthStart.getTime());
      const binEnd = Math.min(weekStart.getTime() + 7 * DAY, monthEnd.getTime());
      bars.push({ label: `Wk${weekNum}`, count: timestamps.filter((t) => t >= binStart && t < binEnd).length });
      weekStart = new Date(weekStart.getTime() + 7 * DAY);
      weekNum++;
    }
  } else {
    const byMonth = {};
    timestamps.forEach((t) => {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    const sortedKeys = Object.keys(byMonth).sort((a, b) => {
      const [ya, ma] = a.split("-").map(Number);
      const [yb, mb] = b.split("-").map(Number);
      return ya - yb || ma - mb;
    });
    bars = sortedKeys.slice(-12).map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { label: new Date(y, m, 1).toLocaleDateString(undefined, { month: "short" }), count: byMonth[key] };
    });
    if (bars.length === 0) bars = [{ label: "—", count: 0 }];
  }

  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  visitsChart.innerHTML = bars
    .map(
      (b) => `
    <div class="visits-chart-bar">
      <span class="visits-chart-bar-count">${b.count}</span>
      <div class="visits-chart-bar-fill" style="height: ${Math.max(4, (b.count / maxCount) * 60)}px;"></div>
      <span class="visits-chart-bar-label">${b.label}</span>
    </div>`
    )
    .join("");

  const total = bars.reduce((sum, b) => sum + b.count, 0);
  visitsChartTotal.textContent = `${total} visit${total === 1 ? "" : "s"} in this range`;
}

visitsFilter.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-tab");
  if (!btn) return;
  currentVisitsRange = btn.dataset.range;
  visitsFilter.querySelectorAll(".filter-tab").forEach((t) => t.classList.toggle("active", t === btn));
  renderVisitsChart(currentVisitsRange);
});

// =====================================================================
// LEADERBOARD
// =====================================================================
async function loadAdminLeaderboard() {
  adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
    const data = await res.json();
    const entries = data ? Object.entries(data) : [];
    entries.sort((a, b) => a[1].time - b[1].time);

    adminLeaderboardList.innerHTML = entries.length
      ? entries
          .map(
            ([key, e]) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-name">${escapeHtml(e.name || "Anonymous")} — ${formatTime(e.time)}</div>
          <div class="admin-row-date">${formatDateFull(e.timestamp)}</div>
        </div>
        <button class="admin-delete-btn" data-path="leaderboard/${key}" data-label="this leaderboard entry">Delete</button>
      </div>`
          )
          .join("")
      : `<p class="leaderboard-status">No entries.</p>`;

    attachDeleteHandlers();
  } catch (err) {
    adminLeaderboardList.innerHTML = `<p class="leaderboard-status">Couldn't load leaderboard data.</p>`;
  }
}

// =====================================================================
// NOTES
// =====================================================================
async function loadAdminNotes() {
  adminNotesList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/notes.json`);
    const data = await res.json();
    const entries = data ? Object.entries(data) : [];
    entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    const typeIcon = { text: "📝", draw: "🎨", photo: "📷" };

    adminNotesList.innerHTML = entries.length
      ? entries
          .map(
            ([key, n]) => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-name">${typeIcon[n.type] || "📝"} ${escapeHtml(n.name || "Anonymous")}</div>
          <div class="admin-row-meta">${!n.type || n.type === "text" ? escapeHtml((n.text || "").slice(0, 40)) : `(${n.type})`}</div>
          <div class="admin-row-date">${formatDateFull(n.timestamp)}</div>
        </div>
        <button class="admin-delete-btn" data-path="notes/${key}" data-label="this note">Delete</button>
      </div>`
          )
          .join("")
      : `<p class="leaderboard-status">No notes.</p>`;

    attachDeleteHandlers();
  } catch (err) {
    adminNotesList.innerHTML = `<p class="leaderboard-status">Couldn't load guestbook data.</p>`;
  }
}

// =====================================================================
// ARTWORKS
// =====================================================================
let uploadedArtworksCache = [];

async function loadAdminArtworks() {
  adminArtworksList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/artworks.json`);
    const data = await res.json();
    uploadedArtworksCache = data ? Object.entries(data).map(([key, val]) => ({ key, ...val })) : [];

    const allArtworks = [
      ...BUILTIN_ARTWORKS.map((a) => ({ ...a, _source: "builtin" })),
      ...uploadedArtworksCache.map((a) => ({ ...a, _source: "uploaded", id: a.key })),
    ];

    document.getElementById("artworks-count-label").textContent = `${allArtworks.length} total`;

    adminArtworksList.innerHTML = allArtworks
      .map((art) => {
        const isBuiltin = art._source === "builtin";
        const thumb = art.image && art.image.startsWith("data:") ? art.image : art.image;
        const meta = [art.artist, art.year].filter(Boolean).join(" · ") || "No metadata";
        return `
      <div class="artwork-row">
        <img class="artwork-row-thumb" src="${thumb}" alt="" onerror="this.style.display='none'" />
        <div class="artwork-row-info">
          <p class="artwork-name">${escapeHtml(art.name)}</p>
          <p class="artwork-meta">${escapeHtml(meta)}</p>
          <span class="artwork-source ${isBuiltin ? "builtin" : ""}">${isBuiltin ? "Built-in" : "Uploaded"}</span>
        </div>
        ${isBuiltin ? "" : `<button class="admin-delete-btn" data-path="artworks/${art.id}" data-label="this artwork">Delete</button>`}
      </div>`;
      })
      .join("");

    attachDeleteHandlers();
  } catch (err) {
    adminArtworksList.innerHTML = `<p class="leaderboard-status">Couldn't load artworks.</p>`;
  }
}

// ---- Image upload handling ----
let processedImageBase64 = null;

imageUploadZone.addEventListener("click", () => artworkImageInput.click());
artworkImageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadStatus.textContent = "Processing image…";
  uploadStatus.className = "upload-status";

  try {
    const img = await loadImageFromFile(file);
    const canvas = downscaleImage(img, 700);
    processedImageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    imagePreview.src = processedImageBase64;
    imagePreview.classList.remove("hidden");
    uploadPlaceholder.classList.add("hidden");
    uploadStatus.textContent = `Ready: ${Math.round(processedImageBase64.length / 1024)} KB`;
    uploadStatus.className = "upload-status success";
  } catch (err) {
    uploadStatus.textContent = "Failed to process image. Try a smaller file.";
    uploadStatus.className = "upload-status error";
    processedImageBase64 = null;
  }
});

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downscaleImage(img, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

btnUploadArtwork.addEventListener("click", async () => {
  const name = document.getElementById("artwork-name").value.trim();
  const details = document.getElementById("artwork-details").value.trim();

  if (!name || !details || !processedImageBase64) {
    uploadStatus.textContent = "Please fill in all required fields and select an image.";
    uploadStatus.className = "upload-status error";
    return;
  }

  btnUploadArtwork.disabled = true;
  uploadStatus.textContent = "Uploading…";
  uploadStatus.className = "upload-status";

  const artwork = {
    name,
    image: processedImageBase64,
    artist: document.getElementById("artwork-artist").value.trim() || null,
    year: document.getElementById("artwork-year").value.trim() || null,
    location: document.getElementById("artwork-location").value.trim() || null,
    details,
    baseScale: 0.06,
    icon: "🖼️",
    hasModel: false,
    createdAt: Date.now(),
  };

  try {
    await fetch(`${FIREBASE_URL}/artworks.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artwork),
    });

    uploadStatus.textContent = "Artwork uploaded successfully!";
    uploadStatus.className = "upload-status success";

    // Reset form
    document.getElementById("artwork-name").value = "";
    document.getElementById("artwork-artist").value = "";
    document.getElementById("artwork-year").value = "";
    document.getElementById("artwork-location").value = "";
    document.getElementById("artwork-details").value = "";
    processedImageBase64 = null;
    imagePreview.classList.add("hidden");
    uploadPlaceholder.classList.remove("hidden");

    loadAdminArtworks();
    loadCounts();
  } catch (err) {
    uploadStatus.textContent = "Upload failed. Check your connection.";
    uploadStatus.className = "upload-status error";
  } finally {
    btnUploadArtwork.disabled = false;
  }
});

// =====================================================================
// SHARED UTILITIES
// =====================================================================
function attachDeleteHandlers() {
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll(".admin-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(`Delete ${btn.dataset.label}? This can't be undone.`)) return;
      btn.disabled = true;
      btn.textContent = "…";
      await fetch(`${FIREBASE_URL}/${btn.dataset.path}.json`, { method: "DELETE" }).catch(() => {});
      loadAllData();
    });
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-export-leaderboard").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
  downloadJson("leaderboard-export.json", await res.json());
});
document.getElementById("btn-export-notes").addEventListener("click", async () => {
  const res = await fetch(`${FIREBASE_URL}/notes.json`);
  downloadJson("guestbook-notes-export.json", await res.json());
});
document.getElementById("btn-clear-leaderboard").addEventListener("click", async () => {
  if (!confirm("Delete ALL leaderboard entries? This can't be undone.")) return;
  await fetch(`${FIREBASE_URL}/leaderboard.json`, { method: "DELETE" }).catch(() => {});
  loadAllData();
});
document.getElementById("btn-clear-notes").addEventListener("click", async () => {
  if (!confirm("Delete ALL guestbook notes? This can't be undone.")) return;
  await fetch(`${FIREBASE_URL}/notes.json`, { method: "DELETE" }).catch(() => {});
  loadAllData();
});

function formatTime(seconds) {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function formatDateFull(timestamp) {
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
