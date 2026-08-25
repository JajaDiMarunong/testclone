// =====================================================================
// MUSEUM AR COLLECTION — Main App
// Artworks are now loaded dynamically (built-in + Firebase uploads)
// =====================================================================
const FIREBASE_URL = "https://gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app";
const BACKGROUND_IMAGE = "./assets/background.jpg";

// -------------------------------------------------------------------
// Built-in artworks (local assets). Uploaded artworks are merged
// from Firebase at runtime.
// -------------------------------------------------------------------
const BUILTIN_ARTWORKS = [
  {
    id: "builtin-mona",
    name: "Mona Lisa",
    image: "./assets/mona-marker.jpg",
    artist: "Leonardo da Vinci",
    year: "c. 1503–1506",
    location: "The Louvre, Paris, France",
    details:
      "Painted by Leonardo da Vinci in the early 1500s, this portrait is one of the most " +
      "recognized paintings in the world, known for its subtle, ambiguous smile and soft " +
      "transitions of light and shadow. It has hung in the Louvre in Paris since the museum " +
      "opened to the public.",
    markerImage: "./assets/mona-marker.jpg",
    modelObj: "./assets/monalisa-centered.obj",
    modelMtl: "./assets/monalisa.mtl",
    baseScale: 0.003,
    icon: "🖼️",
    unlocked: false,
    quizCompleted: false,
    quiz: [
      {
        question: "Who painted the Mona Lisa?",
        options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Titian"],
        correctIndex: 1,
      },
      {
        question: "Which museum currently displays the Mona Lisa?",
        options: ["The British Museum", "The Uffizi Gallery", "The Louvre", "The Prado"],
        correctIndex: 2,
      },
      {
        question: "The painting is best known for its...",
        options: ["Bright, bold colors", "Enigmatic smile", "Large size", "Use of gold leaf"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "builtin-kiss",
    name: "The Kiss",
    image: "./assets/the-kiss.jpg",
    artist: "Gustav Klimt",
    year: "1907–1908",
    location: "Österreichische Galerie Belvedere, Vienna, Austria",
    details:
      "Gustav Klimt painted The Kiss between 1907 and 1908, during what's often called his " +
      "\"Golden Phase\" for its extensive use of gold leaf. It shows an entwined couple kneeling " +
      "at the edge of a flower-covered meadow, their bodies wrapped in an elaborate mosaic of " +
      "gold, ornament, and pattern that blurs the line between clothing and abstract design. " +
      "It remains one of the defining images of the Vienna Secession movement and today hangs " +
      "in the Österreichische Galerie Belvedere in Vienna, Austria.",
    markerImage: "./assets/the-kiss.jpg",
    modelObj: null,
    baseScale: 0.06,
    icon: "💛",
    unlocked: false,
    quizCompleted: false,
    quiz: [],
  },
  {
    id: "builtin-placeholder",
    name: "Second Artwork",
    image: "./assets/artwork-2.jpg",
    artist: null,
    year: null,
    location: null,
    details: "Details will appear here once this artwork is added.",
    markerImage: null,
    modelObj: null,
    baseScale: 0.06,
    icon: "🗿",
    unlocked: false,
    quizCompleted: false,
    quiz: [],
  },
];

// Mutable artworks array — populated by initArtworks()
let artworks = [];

// =====================================================================
// BADGES
// =====================================================================
const badges = {
  firstScan: {
    id: "firstScan",
    name: "First Scan",
    description: "Scan your very first artwork",
    icon: "🔍",
    earned: false,
  },
  firstQuiz: {
    id: "firstQuiz",
    name: "First Quiz",
    description: "Complete your first quiz",
    icon: "📝",
    earned: false,
  },
};

function allBadgesEarned() {
  return Object.values(badges).every((b) => b.earned);
}

// -------------------------------------------------------------------
// DOM references
// -------------------------------------------------------------------
const screenUsername = document.getElementById("screen-username");
const usernameInput = document.getElementById("username-input");
const btnUsernameSubmit = document.getElementById("btn-username-submit");

const screenHome = document.getElementById("screen-home");
const screenScanner = document.getElementById("screen-scanner");
const screenDetail = document.getElementById("screen-detail");
const screenQuiz = document.getElementById("screen-quiz");
const screenBadges = document.getElementById("screen-badges");
const screenLeaderboard = document.getElementById("screen-leaderboard");

const bottomNav = document.getElementById("bottom-nav");
const navButtons = document.querySelectorAll(".nav-btn");

const galleryGrid = document.getElementById("gallery-grid");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const scanHint = document.getElementById("scan-hint");

const filterButtons = document.querySelectorAll(".filter-btn");
const filterToast = document.getElementById("filter-toast");

const unlockModal = document.getElementById("unlock-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");

const badgeToast = document.getElementById("badge-toast");
const badgeToastIcon = document.getElementById("badge-toast-icon");
const badgeToastText = document.getElementById("badge-toast-text");

const loadingScreen = document.getElementById("loading-screen");
const loadingText = document.getElementById("loading-text");
const permissionError = document.getElementById("permission-error");

const btnBackHome = document.getElementById("btn-back-home");
const btnKeepScanning = document.getElementById("btn-keep-scanning");
const btnViewCollection = document.getElementById("btn-view-collection");

const detailImage = document.getElementById("detail-image");
const detailTitle = document.getElementById("detail-title");
const detailText = document.getElementById("detail-text");
const btnDetailBack = document.getElementById("btn-detail-back");
const btnTakeQuiz = document.getElementById("btn-take-quiz");
const quizDoneNote = document.getElementById("quiz-done-note");

const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const btnQuizNext = document.getElementById("btn-quiz-next");
const btnQuizBack = document.getElementById("btn-quiz-back");

const btnOpenBadges = document.getElementById("btn-open-badges");
const btnBadgesBack = document.getElementById("btn-badges-back");
const badgesGrid = document.getElementById("badges-grid");

const screenLibrary = document.getElementById("screen-library");
const btnOpenLibrary = document.getElementById("btn-open-library");
const btnLibraryBack = document.getElementById("btn-library-back");
const libraryList = document.getElementById("library-list");

const libraryDetailModal = document.getElementById("library-detail-modal");
const libraryDetailImage = document.getElementById("library-detail-image");
const libraryDetailTitle = document.getElementById("library-detail-title");
const libraryDetailText = document.getElementById("library-detail-text");
const libraryDetailBadge = document.getElementById("library-detail-badge");
const btnLibraryDetailClose = document.getElementById("btn-library-detail-close");
const metaRowArtist = document.getElementById("meta-row-artist");
const metaArtist = document.getElementById("meta-artist");
const metaRowYear = document.getElementById("meta-row-year");
const metaYear = document.getElementById("meta-year");
const metaRowLocation = document.getElementById("meta-row-location");
const metaLocation = document.getElementById("meta-location");

const chatHeadBtn = document.getElementById("chat-head-btn");
const chatPanel = document.getElementById("chat-panel");
const btnChatClose = document.getElementById("btn-chat-close");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const btnChatSend = document.getElementById("btn-chat-send");

const screenSettings = document.getElementById("screen-settings");
const btnOpenSettings = document.getElementById("btn-open-settings");
const btnSettingsBack = document.getElementById("btn-settings-back");
const settingsCurrentName = document.getElementById("settings-current-name");
const settingsChangeName = document.getElementById("settings-change-name");

const leaderboardList = document.getElementById("leaderboard-list");
const notesBoardWrap = document.getElementById("notes-board-wrap");
const notesBoard = document.getElementById("notes-board");
const btnNewNote = document.getElementById("btn-new-note");
const notesLockedMsg = document.getElementById("notes-locked-msg");
const btnBoardZoomIn = document.getElementById("btn-board-zoom-in");
const btnBoardZoomOut = document.getElementById("btn-board-zoom-out");
const btnBoardZoomReset = document.getElementById("btn-board-zoom-reset");

const noteEditorModal = document.getElementById("note-editor-modal");
const noteEditorHeading = document.getElementById("note-editor-heading");
const noteEditorEyebrow = document.getElementById("note-editor-eyebrow");
const noteTabs = document.querySelectorAll(".note-tab");
const noteColorSwatches = document.getElementById("note-color-swatches");
const noteTextInput = document.getElementById("note-text-input");
const noteDrawWrap = document.getElementById("note-draw-wrap");
const noteCanvas = document.getElementById("note-canvas");
const btnClearDrawing = document.getElementById("btn-clear-drawing");

const notePhotoWrap = document.getElementById("note-photo-wrap");
const notePhotoPreview = document.getElementById("note-photo-preview");
const notePhotoResult = document.getElementById("note-photo-result");
const notePhotoError = document.getElementById("note-photo-error");
const btnSnapPhoto = document.getElementById("btn-snap-photo");
const btnRetakePhoto = document.getElementById("btn-retake-photo");
const btnNoteDelete = document.getElementById("btn-note-delete");
const btnNoteCancel = document.getElementById("btn-note-cancel");
const btnNotePost = document.getElementById("btn-note-post");

const noteViewModal = document.getElementById("note-view-modal");
const noteViewContent = document.getElementById("note-view-content");
const noteViewName = document.getElementById("note-view-name");
const btnNoteViewClose = document.getElementById("btn-note-view-close");

const arContainer = document.getElementById("ar-container");

// -------------------------------------------------------------------
// Username / session
// -------------------------------------------------------------------
let currentUsername = null;
let sessionStartTime = null;
let leaderboardSubmitted = false;

btnUsernameSubmit.addEventListener("click", submitUsername);
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitUsername();
});

function submitUsername() {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.focus();
    return;
  }
  currentUsername = name;
  if (!sessionStartTime) sessionStartTime = Date.now();
  screenUsername.classList.add("hidden");
  if (returningToScreenAfterNameChange) {
    returningToScreenAfterNameChange();
    returningToScreenAfterNameChange = null;
  } else {
    showHome();
    bottomNav.classList.remove("hidden");
  }
}

let returningToScreenAfterNameChange = null;

settingsChangeName.addEventListener("click", () => {
  usernameInput.value = currentUsername || "";
  returningToScreenAfterNameChange = showSettings;
  screenUsername.classList.remove("hidden");
});

// -------------------------------------------------------------------
// Device ID
// -------------------------------------------------------------------
function getDeviceId() {
  let id = localStorage.getItem("museum_device_id");
  if (!id) {
    id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("museum_device_id", id);
  }
  return id;
}
const myDeviceId = getDeviceId();

const homeBgLayer = document.getElementById("home-bg-layer");
const homeBgImg = document.getElementById("home-bg-img");
const homeBgOverlay = document.querySelector(".home-bg-overlay");

(function tryApplyBackground() {
  const test = new Image();
  test.onload = () => {
    homeBgImg.src = BACKGROUND_IMAGE;
    homeBgImg.classList.add("visible");
    homeBgOverlay.classList.add("visible");
  };
  test.onerror = () => {};
  test.src = BACKGROUND_IMAGE;
})();

function setBgLayerForScreen(isCameraScreen) {
  homeBgLayer.classList.toggle("ar-mode", isCameraScreen);
  chatHeadBtn.classList.toggle("hidden", isCameraScreen);
  if (isCameraScreen) chatPanel.classList.add("hidden");
}

// -------------------------------------------------------------------
// Bottom nav
// -------------------------------------------------------------------
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    setActiveNav(tab);
    if (tab === "home") showHome();
    else if (tab === "scanner") showScanner();
    else if (tab === "leaderboard") showLeaderboard();
  });
});

function setActiveNav(tab) {
  navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
}

// -------------------------------------------------------------------
// Gallery filter state
// -------------------------------------------------------------------
let activeFilter = "all";

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clicked = btn.dataset.filter;
    activeFilter = activeFilter === clicked ? "all" : clicked;
    updateFilterButtonStyles();
    renderGallery();
    if (activeFilter !== "all") showFilterToast(`Showing ${activeFilter} artworks`);
    else hideFilterToast();
  });
});

function updateFilterButtonStyles() {
  filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === activeFilter));
}

let toastTimer = null;
function showFilterToast(msg) {
  filterToast.textContent = msg;
  filterToast.classList.remove("hidden");
  clearTimeout(toastTimer);
}
function hideFilterToast() {
  filterToast.classList.add("hidden");
}

// -------------------------------------------------------------------
// Gallery rendering
// -------------------------------------------------------------------
function renderGallery() {
  galleryGrid.innerHTML = "";

  const galleryArtworks = artworks.filter((a) => a.modelObj);

  const visible = galleryArtworks.filter((art) => {
    if (activeFilter === "locked") return !art.unlocked;
    if (activeFilter === "unlocked") return art.unlocked;
    return true;
  });

  visible.forEach((art) => {
    const card = document.createElement("div");
    card.className = "art-card " + (art.unlocked ? "unlocked" : "locked");

    card.innerHTML = `
      <img class="art-card-img" src="${art.image}" alt="${art.name}"
           onerror="this.style.display='none'; this.closest('.art-card').querySelector('.art-card-fallback').style.display='flex';" />
      <div class="art-card-fallback" style="display:none;">${art.icon}</div>
      <div class="art-card-scrim"></div>
      <div class="status-badge ${art.unlocked ? "unlocked" : ""}">${art.unlocked ? "✓ Unlocked" : "🔒 Locked"}</div>
      ${art.quizCompleted ? `<div class="quiz-check-ribbon">✓</div>` : ""}
      <div class="art-card-caption">
        <h3>${art.name}</h3>
        <p>${art.unlocked ? "Tap to view details" : "Scan this artwork to reveal it"}</p>
      </div>
    `;

    if (art.unlocked) {
      card.addEventListener("click", () => openDetail(art.id));
    } else {
      card.addEventListener("click", () => {
        showFilterToast("Scan this artwork first to unlock it");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(hideFilterToast, 1800);
      });
    }

    galleryGrid.appendChild(card);
  });

  const unlockedCount = galleryArtworks.filter((a) => a.unlocked).length;
  const pct = galleryArtworks.length ? (unlockedCount / galleryArtworks.length) * 100 : 0;
  progressFill.style.width = pct + "%";
  progressLabel.textContent = `${unlockedCount} / ${galleryArtworks.length} unlocked`;
}

// -------------------------------------------------------------------
// Screen switching
// -------------------------------------------------------------------
function hideAllScreens() {
  screenHome.classList.add("hidden");
  screenScanner.classList.add("hidden");
  screenDetail.classList.add("hidden");
  screenQuiz.classList.add("hidden");
  screenBadges.classList.add("hidden");
  screenLeaderboard.classList.add("hidden");
  screenLibrary.classList.add("hidden");
  screenSettings.classList.add("hidden");
}

function showHome() {
  hideAllScreens();
  screenHome.classList.remove("hidden");
  bottomNav.classList.remove("hidden");
  setActiveNav("home");
  setBgLayerForScreen(false);
  renderGallery();
}

function showScanner() {
  hideAllScreens();
  screenScanner.classList.remove("hidden");
  bottomNav.classList.add("hidden");
  setBgLayerForScreen(true);
  scanHint.textContent = "Point your camera at an artwork";
  scanHint.classList.remove("found");
}

function showBadges() {
  hideAllScreens();
  screenBadges.classList.add("hidden");
  renderBadges();
  screenBadges.classList.remove("hidden");
  bottomNav.classList.add("hidden");
  setBgLayerForScreen(false);
}

function showLeaderboard() {
  hideAllScreens();
  screenLeaderboard.classList.remove("hidden");
  bottomNav.classList.remove("hidden");
  setActiveNav("leaderboard");
  setBgLayerForScreen(false);
  loadLeaderboard();
  loadNotesBoard();
}

function showLibrary() {
  hideAllScreens();
  renderLibrary();
  screenLibrary.classList.remove("hidden");
  bottomNav.classList.add("hidden");
  setBgLayerForScreen(false);
}

function showSettings() {
  hideAllScreens();
  settingsCurrentName.textContent = `Currently: ${currentUsername || "—"}`;
  screenSettings.classList.remove("hidden");
  bottomNav.classList.add("hidden");
  setBgLayerForScreen(false);
}

btnBackHome.addEventListener("click", showHome);
btnBadgesBack.addEventListener("click", showHome);
btnOpenBadges.addEventListener("click", showBadges);
btnOpenLibrary.addEventListener("click", showLibrary);
btnLibraryBack.addEventListener("click", showHome);
btnOpenSettings.addEventListener("click", showSettings);
btnSettingsBack.addEventListener("click", showHome);

function showUnlockModal(art) {
  modalTitle.textContent = art.name;
  modalDesc.textContent = art.details;
  unlockModal.classList.remove("hidden");
}
function hideUnlockModal() {
  unlockModal.classList.add("hidden");
}
btnKeepScanning.addEventListener("click", hideUnlockModal);
btnViewCollection.addEventListener("click", () => {
  hideUnlockModal();
  showHome();
});

// -------------------------------------------------------------------
// Badge toast + awarding
// -------------------------------------------------------------------
let badgeToastTimer = null;
function showBadgeToast(badge) {
  badgeToastIcon.textContent = badge.icon;
  badgeToastText.textContent = `Badge earned: ${badge.name}`;
  badgeToast.classList.remove("hidden");
  clearTimeout(badgeToastTimer);
  badgeToastTimer = setTimeout(() => badgeToast.classList.add("hidden"), 2600);
}

function awardBadge(key) {
  const badge = badges[key];
  if (!badge || badge.earned) return;
  badge.earned = true;
  showBadgeToast(badge);
  if (allBadgesEarned()) updateNotesGate();
}

function renderBadges() {
  badgesGrid.innerHTML = Object.values(badges)
    .map(
      (b) => `
    <div class="badge-card ${b.earned ? "earned" : ""}">
      <div class="badge-icon">${b.earned ? b.icon : "🔒"}</div>
      <h4>${b.name}</h4>
      <p>${b.earned ? b.description : "Locked"}</p>
    </div>
  `
    )
    .join("");
}

// -------------------------------------------------------------------
// Library
// -------------------------------------------------------------------
function renderLibrary() {
  libraryList.innerHTML = artworks
    .map(
      (art, i) => `
    <div class="library-card" data-index="${i}">
      <div class="library-card-photo">
        <img src="${art.image}" alt="${art.name}"
             onerror="this.style.display='none'; this.closest('.library-card').querySelector('.library-fallback').style.display='flex';" />
        <div class="library-fallback" style="display:none;">${art.icon}</div>
      </div>
      <div class="library-card-info">
        <div class="library-card-title-row">
          <h4>${art.name}</h4>
          ${art.modelObj ? `<span class="model-badge">🧊 3D Model</span>` : ""}
        </div>
        <p>${art.details}</p>
        <span class="library-view-hint">Tap to view</span>
      </div>
    </div>
  `
    )
    .join("");

  libraryList.querySelectorAll(".library-card").forEach((card) => {
    card.addEventListener("click", () => {
      const art = artworks[Number(card.dataset.index)];
      openLibraryDetail(art);
    });
  });
}

function openLibraryDetail(art) {
  libraryDetailImage.src = art.image;
  libraryDetailImage.alt = art.name;
  libraryDetailTitle.textContent = art.name;
  libraryDetailText.textContent = art.details;
  libraryDetailBadge.classList.toggle("hidden", !art.modelObj);

  metaRowArtist.classList.toggle("hidden", !art.artist);
  if (art.artist) metaArtist.textContent = art.artist;
  metaRowYear.classList.toggle("hidden", !art.year);
  if (art.year) metaYear.textContent = art.year;
  metaRowLocation.classList.toggle("hidden", !art.location);
  if (art.location) metaLocation.textContent = art.location;

  libraryDetailModal.classList.remove("hidden");
  libraryDetailModal.querySelector(".library-detail-scroll").scrollTop = 0;
}
btnLibraryDetailClose.addEventListener("click", () => libraryDetailModal.classList.add("hidden"));

// =====================================================================
// KUYA DAVON — AI CHAT (Groq API)
// =====================================================================
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.1-8b-instant";

const MUSEUM_NAME = "Geronimo Berenguer de los Reyes (GBR), Jr. Museum";
const MUSEUM_LOCATION = "General Trias, Philippines";

function buildKuyaDavonSystemPrompt() {
  const artworkList = artworks
    .map((a) => `- "${a.name}"${a.modelObj ? " (has a 3D AR model)" : ""}: ${a.details}`)
    .join("\n");

  return `You are Kuya Davon, a friendly AI guide for the ${MUSEUM_NAME}, located in ${MUSEUM_LOCATION}.

You ONLY answer questions about the artworks currently featured in this museum's app, listed below. Do not answer general knowledge questions, questions about artworks not in this list, or anything unrelated to this collection. If asked something outside this scope, politely explain — in a warm, friendly "kuya" (like a helpful older sibling) tone — that you can only help with questions about the artworks here at the museum, and steer the conversation back to them.

Current artworks in the collection:
${artworkList}

Keep answers concise and conversational.`;
}

let chatHistory = [];

function addChatBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

chatHeadBtn.addEventListener("click", () => {
  chatPanel.classList.toggle("hidden");
  if (!chatPanel.classList.contains("hidden") && chatMessages.children.length === 0) {
    addChatBubble(`Hi po! I'm Kuya Davon 👋 Ask me anything about the artworks here at ${MUSEUM_NAME}.`, "bot");
  }
});
btnChatClose.addEventListener("click", () => chatPanel.classList.add("hidden"));

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addChatBubble(text, "user");
  chatHistory.push({ role: "user", content: text });

  const typingBubble = addChatBubble("typing…", "bot typing");
  btnChatSend.disabled = true;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: buildKuyaDavonSystemPrompt() }, ...chatHistory],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });

    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with an answer for that.";

    typingBubble.remove();
    addChatBubble(reply, "bot");
    chatHistory.push({ role: "assistant", content: reply });

    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
  } catch (err) {
    console.error("Kuya Davon chat error:", err);
    typingBubble.remove();
    addChatBubble("Sorry, I'm having trouble connecting right now. Please try again in a bit.", "bot");
  } finally {
    btnChatSend.disabled = false;
  }
}

btnChatSend.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChatMessage();
});

// -------------------------------------------------------------------
// Artwork detail page
// -------------------------------------------------------------------
let currentDetailArtId = null;

function openDetail(artworkId) {
  const art = artworks.find((a) => a.id === artworkId);
  if (!art) return;
  currentDetailArtId = artworkId;

  detailImage.src = art.image;
  detailImage.alt = art.name;
  detailTitle.textContent = art.name;
  detailText.textContent = art.details;

  const hasQuiz = art.quiz && art.quiz.length > 0;
  btnTakeQuiz.style.display = hasQuiz ? "block" : "none";
  quizDoneNote.classList.toggle("hidden", !art.quizCompleted);

  hideAllScreens();
  screenDetail.classList.remove("hidden");
  bottomNav.classList.add("hidden");
}

btnDetailBack.addEventListener("click", showHome);
btnTakeQuiz.addEventListener("click", () => {
  if (currentDetailArtId !== null) startQuiz(currentDetailArtId);
});

// -------------------------------------------------------------------
// Quiz
// -------------------------------------------------------------------
let quizArtId = null;
let quizIndex = 0;
let quizScore = 0;

function startQuiz(artworkId) {
  const art = artworks.find((a) => a.id === artworkId);
  if (!art || !art.quiz || art.quiz.length === 0) return;

  quizArtId = artworkId;
  quizIndex = 0;
  quizScore = 0;

  hideAllScreens();
  screenQuiz.classList.remove("hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const art = artworks.find((a) => a.id === quizArtId);
  const q = art.quiz[quizIndex];

  quizProgress.textContent = `Question ${quizIndex + 1} / ${art.quiz.length}`;
  quizQuestion.textContent = q.question;
  quizFeedback.classList.add("hidden");
  btnQuizNext.classList.add("hidden");

  quizOptions.innerHTML = "";
  q.options.forEach((option, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => selectQuizAnswer(i));
    quizOptions.appendChild(btn);
  });
}

function selectQuizAnswer(selectedIndex) {
  const art = artworks.find((a) => a.id === quizArtId);
  const q = art.quiz[quizIndex];
  const optionButtons = quizOptions.querySelectorAll(".quiz-option-btn");

  optionButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add("correct");
    else if (i === selectedIndex) btn.classList.add("incorrect");
  });

  const isCorrect = selectedIndex === q.correctIndex;
  if (isCorrect) quizScore++;

  quizFeedback.textContent = isCorrect ? "Correct!" : "Not quite — the highlighted answer was correct.";
  quizFeedback.className = "quiz-feedback " + (isCorrect ? "correct" : "incorrect");
  quizFeedback.classList.remove("hidden");

  btnQuizNext.textContent = quizIndex === art.quiz.length - 1 ? "Finish Quiz" : "Next Question";
  btnQuizNext.classList.remove("hidden");
}

btnQuizNext.addEventListener("click", () => {
  const art = artworks.find((a) => a.id === quizArtId);
  if (quizIndex < art.quiz.length - 1) {
    quizIndex++;
    renderQuizQuestion();
  } else {
    const firstTimeCompletingAnyQuiz = !art.quizCompleted && !Object.values(artworks).some((a) => a.quizCompleted);
    art.quizCompleted = true;
    if (firstTimeCompletingAnyQuiz) awardBadge("firstQuiz");
    openDetail(quizArtId);
  }
});

btnQuizBack.addEventListener("click", () => {
  if (currentDetailArtId !== null) openDetail(currentDetailArtId);
  else showHome();
});

// -------------------------------------------------------------------
// Firebase: leaderboard
// -------------------------------------------------------------------
async function loadLeaderboard() {
  leaderboardList.innerHTML = `<p class="leaderboard-status">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/leaderboard.json`);
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    const entries = data ? Object.values(data) : [];
    entries.sort((a, b) => a.time - b.time);

    if (entries.length === 0) {
      leaderboardList.innerHTML = `<p class="leaderboard-status">No completions yet — be the first!</p>`;
      return;
    }

    leaderboardList.innerHTML = entries
      .slice(0, 20)
      .map((e, i) => {
        const rank = i + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
        const rankClass = rank <= 3 ? ` rank-${rank}` : "";
        return `
      <div class="leaderboard-row${rankClass}">
        <span class="leaderboard-rank">${medal || "#" + rank}</span>
        <span class="leaderboard-name">${escapeHtml(e.name || "Anonymous")}${
          rank === 1 ? ' <span class="crown">👑</span>' : ""
        }</span>
        <span class="leaderboard-time">${formatTime(e.time)}</span>
      </div>
    `;
      })
      .join("");
  } catch (err) {
    leaderboardList.innerHTML = `<p class="leaderboard-status">Couldn't load the leaderboard. Check your connection or the Firebase database rules.</p>`;
  }
}

async function submitLeaderboardEntry(name, timeSeconds) {
  try {
    await fetch(`${FIREBASE_URL}/leaderboard.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, time: timeSeconds, timestamp: Date.now() }),
    });
  } catch (err) {
    /* silently ignore */
  }
}

// =====================================================================
// GUESTBOOK BOARD
// =====================================================================
const NOTE_COLORS = ["#f4d35e", "#f2a19b", "#a8d5ba", "#9fc6e0", "#c9a8d8", "#f4f1ea"];
const DEFAULT_BOARD_SCALE = 0.5;
let allNotesCache = [];
let boardScale = DEFAULT_BOARD_SCALE;
let boardX = 0;
let boardY = 0;
let editingMode = "text";
let selectedColor = NOTE_COLORS[0];
let hasDrawing = false;

function applyBoardTransform() {
  notesBoard.style.transform = `translate(${boardX}px, ${boardY}px) scale(${boardScale})`;
}

async function loadNotesBoard() {
  notesBoard.innerHTML = `<p class="leaderboard-status" style="padding:10px;">Loading…</p>`;
  try {
    const res = await fetch(`${FIREBASE_URL}/notes.json`);
    if (!res.ok) throw new Error("status " + res.status);
    const data = await res.json();
    allNotesCache = data
      ? Object.entries(data).map(([deviceId, note]) => ({ ...note, deviceId }))
      : [];
    renderNotesBoard();
    applyBoardTransform();
    updateNewNoteButton();
  } catch (err) {
    notesBoard.innerHTML = `<p class="leaderboard-status" style="padding:10px;">Couldn't load the guestbook. Check your connection or the Firebase database rules.</p>`;
  }
}

function renderNotesBoard() {
  notesBoard.innerHTML = "";
  allNotesCache.forEach((note) => {
    const el = document.createElement("div");
    el.className =
      "note-sticky" +
      (note.type === "photo" ? " type-photo" : "") +
      (note.deviceId === myDeviceId ? " mine" : "");
    el.style.left = note.x + "px";
    el.style.top = note.y + "px";
    if (note.type !== "photo") el.style.background = note.color || NOTE_COLORS[0];
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

    el.addEventListener("click", () => {
      if (note.deviceId === myDeviceId) openNoteEditor(note);
      else openNoteView(note);
    });

    notesBoard.appendChild(el);
  });
}

function updateNewNoteButton() {
  const unlocked = allBadgesEarned();
  const myNote = allNotesCache.find((n) => n.deviceId === myDeviceId);
  btnNewNote.classList.toggle("hidden", !unlocked);
  notesLockedMsg.classList.toggle("hidden", unlocked);
  btnNewNote.textContent = myNote ? "✏️ Edit My Note" : "+ New Note";
}

// ---- board pan + pinch-zoom ----
let boardLastPinchDist = null;
let boardLastTouchX = null;
let boardLastTouchY = null;

notesBoardWrap.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      boardLastPinchDist = getPinchDistance(e.touches);
    } else if (e.touches.length === 1) {
      boardLastTouchX = e.touches[0].clientX;
      boardLastTouchY = e.touches[0].clientY;
    }
  },
  { passive: true }
);

notesBoardWrap.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && boardLastPinchDist !== null) {
      const newDist = getPinchDistance(e.touches);
      const factor = newDist / boardLastPinchDist;
      boardScale = Math.min(2.5, Math.max(0.5, boardScale * factor));
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
  },
  { passive: true }
);

notesBoardWrap.addEventListener(
  "touchend",
  (e) => {
    if (e.touches.length < 2) boardLastPinchDist = null;
    if (e.touches.length < 1) {
      boardLastTouchX = null;
      boardLastTouchY = null;
    }
  },
  { passive: true }
);

btnBoardZoomIn.addEventListener("click", () => {
  boardScale = Math.min(2.5, boardScale + 0.2);
  applyBoardTransform();
});
btnBoardZoomOut.addEventListener("click", () => {
  boardScale = Math.max(0.5, boardScale - 0.2);
  applyBoardTransform();
});
btnBoardZoomReset.addEventListener("click", () => {
  boardScale = DEFAULT_BOARD_SCALE;
  boardX = 0;
  boardY = 0;
  applyBoardTransform();
});

// ---- note editor ----
let editingExistingNote = null;
let drawCtx = null;

function initCanvas() {
  drawCtx = noteCanvas.getContext("2d");
  drawCtx.lineWidth = 4;
  drawCtx.lineCap = "round";
  drawCtx.strokeStyle = "#2a2320";

  let drawing = false;
  function pos(e) {
    const rect = noteCanvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function start(e) {
    drawing = true;
    hasDrawing = true;
    const p = pos(e);
    drawCtx.beginPath();
    drawCtx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing) return;
    const p = pos(e);
    drawCtx.lineTo(p.x, p.y);
    drawCtx.stroke();
  }
  function end() {
    drawing = false;
  }
  noteCanvas.addEventListener("touchstart", (e) => { start(e); }, { passive: true });
  noteCanvas.addEventListener("touchmove", (e) => { move(e); }, { passive: true });
  noteCanvas.addEventListener("touchend", end, { passive: true });
  noteCanvas.addEventListener("mousedown", start);
  noteCanvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
}
initCanvas();

btnClearDrawing.addEventListener("click", () => {
  drawCtx.clearRect(0, 0, noteCanvas.width, noteCanvas.height);
  hasDrawing = false;
});

function renderColorSwatches() {
  noteColorSwatches.innerHTML = NOTE_COLORS.map(
    (c) => `<div class="note-swatch${c === selectedColor ? " selected" : ""}" data-color="${c}" style="background:${c};"></div>`
  ).join("");
  noteColorSwatches.querySelectorAll(".note-swatch").forEach((el) => {
    el.addEventListener("click", () => {
      selectedColor = el.dataset.color;
      renderColorSwatches();
    });
  });
}

let capturedPhotoDataUrl = null;

function setEditingMode(mode) {
  editingMode = mode;
  noteTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  noteTextInput.classList.toggle("hidden", mode !== "text");
  noteDrawWrap.classList.toggle("hidden", mode !== "draw");
  notePhotoWrap.classList.toggle("hidden", mode !== "photo");
  noteColorSwatches.classList.toggle("hidden", mode === "photo");

  if (mode === "photo" && !capturedPhotoDataUrl) {
    startPhotoPreview();
  } else {
    stopPhotoPreview();
  }
}
noteTabs.forEach((tab) => tab.addEventListener("click", () => setEditingMode(tab.dataset.mode)));

// -------------------------------------------------------------------
// Photo notes: reuse MindAR's already-running camera feed
// -------------------------------------------------------------------
function findArVideoElement() {
  return document.querySelector("#ar-container video");
}

function startPhotoPreview() {
  const arVideo = findArVideoElement();
  if (!arVideo || !arVideo.srcObject) {
    notePhotoError.classList.remove("hidden");
    notePhotoPreview.classList.add("hidden");
    btnSnapPhoto.disabled = true;
    return;
  }
  notePhotoError.classList.add("hidden");
  btnSnapPhoto.disabled = false;
  notePhotoPreview.srcObject = arVideo.srcObject;
  notePhotoPreview.classList.remove("hidden");
  notePhotoResult.classList.add("hidden");
  notePhotoPreview.play().catch(() => {});
}

function stopPhotoPreview() {
  notePhotoPreview.srcObject = null;
}

btnSnapPhoto.addEventListener("click", () => {
  const arVideo = findArVideoElement();
  if (!arVideo) return;

  const maxDim = 480;
  const scale = Math.min(1, maxDim / Math.max(arVideo.videoWidth, arVideo.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(arVideo.videoWidth * scale);
  canvas.height = Math.round(arVideo.videoHeight * scale);
  canvas.getContext("2d").drawImage(arVideo, 0, 0, canvas.width, canvas.height);
  capturedPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.85);

  notePhotoResult.src = capturedPhotoDataUrl;
  notePhotoResult.classList.remove("hidden");
  notePhotoPreview.classList.add("hidden");
  btnSnapPhoto.classList.add("hidden");
  btnRetakePhoto.classList.remove("hidden");
  stopPhotoPreview();
});

btnRetakePhoto.addEventListener("click", () => {
  capturedPhotoDataUrl = null;
  notePhotoResult.classList.add("hidden");
  btnRetakePhoto.classList.add("hidden");
  btnSnapPhoto.classList.remove("hidden");
  startPhotoPreview();
});

function openNoteEditor(existingNote) {
  editingExistingNote = existingNote || null;
  noteEditorHeading.textContent = existingNote ? "Edit Your Note" : "Leave Your Mark";
  noteEditorEyebrow.textContent = existingNote
    ? `Posted ${formatNoteDateFull(existingNote.timestamp)}`
    : "Your Notepad";
  btnNoteDelete.classList.toggle("hidden", !existingNote);

  selectedColor = existingNote?.color || NOTE_COLORS[0];
  renderColorSwatches();

  drawCtx.clearRect(0, 0, noteCanvas.width, noteCanvas.height);
  hasDrawing = false;
  noteTextInput.value = "";

  capturedPhotoDataUrl = null;
  notePhotoResult.classList.add("hidden");
  notePhotoPreview.classList.remove("hidden");
  btnRetakePhoto.classList.add("hidden");
  btnSnapPhoto.classList.remove("hidden");

  if (existingNote && existingNote.type === "draw") {
    setEditingMode("draw");
    const img = new Image();
    img.onload = () => {
      drawCtx.drawImage(img, 0, 0);
      hasDrawing = true;
    };
    img.src = existingNote.drawing;
  } else if (existingNote && existingNote.type === "photo") {
    capturedPhotoDataUrl = existingNote.photo;
    setEditingMode("photo");
    notePhotoResult.src = existingNote.photo;
    notePhotoResult.classList.remove("hidden");
    notePhotoPreview.classList.add("hidden");
    btnSnapPhoto.classList.add("hidden");
    btnRetakePhoto.classList.remove("hidden");
  } else if (existingNote) {
    setEditingMode("text");
    noteTextInput.value = existingNote.text || "";
  } else {
    setEditingMode("text");
  }

  noteEditorModal.classList.remove("hidden");
}

btnNewNote.addEventListener("click", () => {
  const myNote = allNotesCache.find((n) => n.deviceId === myDeviceId);
  openNoteEditor(myNote || null);
});

btnNoteCancel.addEventListener("click", () => {
  stopPhotoPreview();
  noteEditorModal.classList.add("hidden");
});

btnNotePost.addEventListener("click", async () => {
  const isDraw = editingMode === "draw";
  const isPhoto = editingMode === "photo";
  if (isDraw && !hasDrawing) return;
  if (isPhoto && !capturedPhotoDataUrl) return;
  if (!isDraw && !isPhoto && !noteTextInput.value.trim()) return;

  btnNotePost.disabled = true;

  const note = {
    name: currentUsername || "Anonymous",
    type: editingMode,
    color: selectedColor,
    timestamp: Date.now(),
    x: editingExistingNote ? editingExistingNote.x : 40 + Math.random() * 860,
    y: editingExistingNote ? editingExistingNote.y : 40 + Math.random() * 560,
    rotation: editingExistingNote ? editingExistingNote.rotation : Math.round(Math.random() * 16 - 8),
  };
  if (isDraw) note.drawing = noteCanvas.toDataURL("image/png");
  else if (isPhoto) note.photo = capturedPhotoDataUrl;
  else note.text = noteTextInput.value.trim();

  try {
    await fetch(`${FIREBASE_URL}/notes/${myDeviceId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
  } catch (err) {
    /* ignore */
  }

  btnNotePost.disabled = false;
  stopPhotoPreview();
  noteEditorModal.classList.add("hidden");
  loadNotesBoard();
});

btnNoteDelete.addEventListener("click", async () => {
  await fetch(`${FIREBASE_URL}/notes/${myDeviceId}.json`, { method: "DELETE" }).catch(() => {});
  stopPhotoPreview();
  noteEditorModal.classList.add("hidden");
  loadNotesBoard();
});

// ---- read-only view for someone else's note ----
function openNoteView(note) {
  noteViewContent.style.background = note.type === "photo" ? "#f7f4ec" : note.color || NOTE_COLORS[0];
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

// =====================================================================
// AR INITIALIZATION
// =====================================================================
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downscaleForCompile(img, maxDim = 700) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  if (scale === 1) return img;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// -------------------------------------------------------------------
// Gesture state: pinch-to-zoom + drag-to-rotate on the active target
// -------------------------------------------------------------------
let activeModelEl = null;
let activeBaseScale = 0.06;
let currentScale = 0.06;
let currentRotY = 0;
let currentRotX = 0;

function applyTransform() {
  if (!activeModelEl) return;
  activeModelEl.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
  activeModelEl.setAttribute("rotation", `${currentRotX} ${currentRotY} 0`);
}

let lastPinchDistance = null;
let lastTouchX = null;
let lastTouchY = null;

window.addEventListener(
  "touchstart",
  (e) => {
    if (screenScanner.classList.contains("hidden")) return;
    if (e.touches.length === 2) {
      lastPinchDistance = getPinchDistance(e.touches);
    } else if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  },
  { passive: true }
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (screenScanner.classList.contains("hidden") || !activeModelEl) return;

    if (e.touches.length === 2 && lastPinchDistance !== null) {
      const newDistance = getPinchDistance(e.touches);
      const factor = newDistance / lastPinchDistance;
      const minScale = activeBaseScale * 0.3;
      const maxScale = activeBaseScale * 3;
      currentScale = Math.min(maxScale, Math.max(minScale, currentScale * factor));
      lastPinchDistance = newDistance;
      applyTransform();
    } else if (e.touches.length === 1 && lastTouchX !== null) {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      currentRotY += dx * 0.5;
      currentRotX += dy * 0.5;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      applyTransform();
    }
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (e.touches.length < 2) lastPinchDistance = null;
    if (e.touches.length < 1) {
      lastTouchX = null;
      lastTouchY = null;
    }
  },
  { passive: true }
);

// -------------------------------------------------------------------
// Target found / lost
// -------------------------------------------------------------------
function getOrCreateModelEntity(art, targetIndex, targetEl) {
  if (!art.modelObj) return null;

  let modelEl = document.getElementById(`model-${targetIndex}`);
  if (modelEl) return modelEl;

  modelEl = document.createElement("a-entity");
  modelEl.setAttribute("id", `model-${targetIndex}`);
  modelEl.setAttribute(
    "obj-model",
    `obj: ${art.modelObj};${art.modelMtl ? ` mtl: ${art.modelMtl};` : ""}`
  );
  modelEl.setAttribute("material", "side: double");
  modelEl.setAttribute("position", "0 0 0.1");
  modelEl.setAttribute("rotation", "0 0 0");
  modelEl.setAttribute("scale", `${art.baseScale} ${art.baseScale} ${art.baseScale}`);
  modelEl.addEventListener("model-error", (e) =>
    console.error(`"${art.name}" model failed to load:`, e.detail)
  );
  targetEl.appendChild(modelEl);
  return modelEl;
}

function handleTargetFound(art, targetIndex, targetEl) {
  scanHint.textContent = "Pinch to zoom · Drag to rotate";
  scanHint.classList.add("found");

  const modelEl = getOrCreateModelEntity(art, targetIndex, targetEl);

  activeModelEl = modelEl;
  activeBaseScale = art.baseScale;
  currentScale = art.baseScale;
  currentRotY = 0;
  currentRotX = 0;
  applyTransform();

  const firstTimeEver = !artworks.some((a) => a.unlocked);
  const wasAlreadyUnlocked = art.unlocked;
  art.unlocked = true;
  if (firstTimeEver) awardBadge("firstScan");

  if (art.modelObj) {
    if (!wasAlreadyUnlocked) {
      showUnlockModal(art);
      checkCollectionComplete();
    }
  } else {
    showUnlockModal(art);
  }
}

function handleTargetLost() {
  scanHint.textContent = "Point your camera at an artwork";
  scanHint.classList.remove("found");
  activeModelEl = null;
}

function checkCollectionComplete() {
  const galleryArtworks = artworks.filter((a) => a.modelObj);
  const allUnlocked = galleryArtworks.length > 0 && galleryArtworks.every((a) => a.unlocked);
  if (allUnlocked && !leaderboardSubmitted && sessionStartTime) {
    leaderboardSubmitted = true;
    const elapsed = (Date.now() - sessionStartTime) / 1000;
    submitLeaderboardEntry(currentUsername || "Anonymous", elapsed);
  }
}

// -------------------------------------------------------------------
// Build AR scene
// -------------------------------------------------------------------
async function initAR() {
  const scannableAll = artworks.filter((a) => a.markerImage);

  loadingText.textContent = "Loading artwork images…";
  const results = await Promise.allSettled(scannableAll.map((a) => loadImage(a.markerImage)));

  const scannable = [];
  const images = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      scannable.push(scannableAll[i]);
      images.push(downscaleForCompile(result.value));
    } else {
      console.error(
        `Marker image failed to load for "${scannableAll[i].name}" (${scannableAll[i].markerImage}). ` +
          `Check the file exists at that exact path/filename (case-sensitive) in your deployed assets folder.`
      );
    }
  });

  if (images.length === 0) {
    throw new Error("No marker images could be loaded at all — check your assets folder and file paths.");
  }

  loadingText.textContent = "Analyzing artworks (compiling recognition data)…";
  const compiler = new window.MINDAR.IMAGE.Compiler();
  await compiler.compileImageTargets(images, (progress) => {
    loadingText.textContent = `Analyzing artworks… ${Math.round(progress)}%`;
  });
  const exportedBuffer = await compiler.exportData();
  const blobUrl = URL.createObjectURL(new Blob([exportedBuffer]));

  loadingText.textContent = "Starting camera…";

  const targetEntities = scannable
    .map((art, i) => `<a-entity id="ar-target-${i}" mindar-image-target="targetIndex: ${i}"></a-entity>`)
    .join("\n");

  arContainer.innerHTML = `
    <a-scene
      id="ar-scene"
      mindar-image="imageTargetSrc: ${blobUrl}; maxTrack: ${scannable.length}; filterMinCF: 0.0001; filterBeta: 1000; missTolerance: 5; warmupTolerance: 3; uiLoading: no; uiScanning: no; uiError: no;"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
    >
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      ${targetEntities}
    </a-scene>
  `;

  const arScene = document.getElementById("ar-scene");
  arScene.addEventListener("renderstart", () => {
    setTimeout(() => loadingScreen.classList.add("hidden"), 300);
  });

  scannable.forEach((art, i) => {
    const targetEl = document.getElementById(`ar-target-${i}`);
    targetEl.addEventListener("targetFound", () => handleTargetFound(art, i, targetEl));
    targetEl.addEventListener("targetLost", handleTargetLost);
  });
}

// =====================================================================
// DYNAMIC ARTWORK LOADING (built-in + Firebase uploads)
// =====================================================================
async function initArtworks() {
  // Start with built-in artworks
  let merged = BUILTIN_ARTWORKS.map((a) => ({ ...a }));

  // Fetch uploaded artworks from Firebase
  try {
    const res = await fetch(`${FIREBASE_URL}/artworks.json`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const uploaded = Object.entries(data).map(([key, val]) => ({
          id: key,
          name: val.name,
          image: val.image,
          artist: val.artist,
          year: val.year,
          location: val.location,
          details: val.details,
          markerImage: val.image,       // uploaded image IS the marker
          modelObj: null,               // no 3D model for uploads
          modelMtl: null,
          baseScale: val.baseScale || 0.06,
          icon: val.icon || "🖼️",
          unlocked: false,
          quizCompleted: false,
          quiz: val.quiz || [],
        }));
        merged = merged.concat(uploaded);
      }
    }
  } catch (err) {
    console.warn("Could not load uploaded artworks from Firebase:", err);
  }

  artworks = merged;
}

// =====================================================================
// ANALYTICS: page visits + presence heartbeat
// =====================================================================
function recordVisit() {
  fetch(`${FIREBASE_URL}/analytics_visits.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp: Date.now() }),
  }).catch(() => {});
}

function sendHeartbeat() {
  fetch(`${FIREBASE_URL}/presence/${myDeviceId}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timestamp: Date.now(), name: currentUsername || "Anonymous" }),
  }).catch(() => {});
}

function startPresenceHeartbeat() {
  sendHeartbeat();
  setInterval(sendHeartbeat, 20000);
}

recordVisit();
startPresenceHeartbeat();

// =====================================================================
// BOOT
// =====================================================================
initArtworks().then(() => {
  navigator.mediaDevices?.getUserMedia?.({ video: true })
    .then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      return initAR();
    })
    .catch((err) => {
      console.error("Camera/AR init failed:", err);
      loadingScreen.classList.add("hidden");
      permissionError.classList.remove("hidden");
    });
});
