/* ══════════════════════════════════════════════════════════
   STUDENT PROJECT SHOWCASE — script.js
   Author: Generated for Instructor Portfolio
   Features:
     - Loading animation
     - Sticky navbar + scroll effects
     - Dark/Light mode toggle
     - Mobile navigation
     - Hero particle canvas animation
     - Scroll reveal (IntersectionObserver)
     - Animated counters
     - Projects search & filter
     - Scroll-to-top button
     - Dynamic copyright year
     - Active nav link tracking
══════════════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────
   UTILITIES
────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, evt, fn, opts) => el?.addEventListener(evt, fn, opts);

/* ──────────────────────────────────────
   FIREBASE RATING CONFIG
────────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyDVan4lKVi3HSJl1OFFqUlyiYmsrKRXJLY",
  authDomain: "student-project-showcase-8d973.firebaseapp.com",
  projectId: "student-project-showcase-8d973",
  storageBucket: "student-project-showcase-8d973.firebasestorage.app",
  messagingSenderId: "416522834622",
  appId: "1:416522834622:web:3e830ddb896bbc1e6d44ef",
  measurementId: "G-VF1EMMMQSN",
  appCheckSiteKey: "",
};

const RATING_COLLECTION = "projectRatings";
const RATING_MAX = 5;
const ratingState = {
  auth: null,
  db: null,
  user: null,
  ready: false,
  error: "",
  projects: new Map(),
  votes: new Map(),
  listeners: new Map(),
};

let firebaseRatingsPromise = null;

function isFirebaseConfigured() {
  return ["apiKey", "authDomain", "projectId", "appId"].every((key) => {
    const value = firebaseConfig[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

function isAppCheckConfigured() {
  const value = firebaseConfig.appCheckSiteKey;
  return typeof value === "string" && value.trim().length > 0;
}

function getFirebaseAppConfig() {
  const { appCheckSiteKey, ...appConfig } = firebaseConfig;
  return appConfig;
}

function formatRating(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function humanizeTags(tags = "") {
  return tags
    .split(/\s+/)
    .filter(Boolean)
    .map((tag) => tag.replace(/-/g, " ").toUpperCase())
    .join(", ");
}

function getProjectHost(url) {
  if (!url || url === "#") return "project-showcase.local";

  try {
    const parsed = new URL(url, window.location.href);
    return parsed.hostname || "project-showcase.local";
  } catch (err) {
    return "project-showcase.local";
  }
}

function sanitizeExternalUrl(url) {
  if (!url || url === "#") return "#";

  try {
    const parsed = new URL(url, window.location.href);
    const allowedProtocols = new Set(["http:", "https:", "mailto:"]);
    return allowedProtocols.has(parsed.protocol) ? parsed.href : "#";
  } catch (err) {
    return "#";
  }
}

function hardenOutboundLinks(ctx = document) {
  $$("a[target='_blank'], a[target=\"_blank\"]", ctx).forEach((link) => {
    const safeUrl = sanitizeExternalUrl(link.getAttribute("href"));
    link.setAttribute("href", safeUrl);
    link.setAttribute("rel", "noopener noreferrer");
    link.setAttribute("referrerpolicy", "no-referrer");
  });
}

let lastModalTrigger = null;

function getProjectModal() {
  let modal = $("#projectModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "projectModal";
  modal.className = "project-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="project-modal__backdrop" data-modal-close></div>
    <div class="project-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="projectModalTitle">
      <button type="button" class="project-modal__close" aria-label="Close modal" data-modal-close>&times;</button>
      <div class="project-modal__content" id="projectModalContent"></div>
    </div>
  `;

  on(modal, "click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeProjectModal();
  });

  on(document, "keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeProjectModal();
  });

  document.body.append(modal);
  return modal;
}

function openProjectModal(content, trigger) {
  const modal = getProjectModal();
  const contentEl = $("#projectModalContent", modal);
  if (!contentEl) return;

  lastModalTrigger = trigger || document.activeElement;
  contentEl.innerHTML = content;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  requestAnimationFrame(() => {
    modal.classList.add("is-open");
    $(".project-modal__close", modal)?.focus();
  });
}

function closeProjectModal() {
  const modal = $("#projectModal");
  if (!modal || modal.hidden) return;

  modal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    modal.hidden = true;
    $("#projectModalContent", modal).innerHTML = "";
    lastModalTrigger?.focus?.();
    lastModalTrigger = null;
  }, 180);
}

/* ──────────────────────────────────────
   DYNAMIC PROJECT LOADING
────────────────────────────────────── */
async function loadProjects() {
  const projectsGrid = $("#projectsGrid");
  if (!projectsGrid) return;

  // Array of student project files to load
  // Example: ['student-1', 'student-2', ..., 'student-70']
  const projectFiles = [
    "denver",
    "fritchel",
    "grace",
    "jabez",
    "jamaica",
    "jesum",
    "kelvin",
    "mariel",
    "nino",
    "precious",
    "glyndon",
    "dacsil",
    "ghelo",
    "john",
    "joshua",
    "king",
    "mark",
    "maryjoy",
    "prince",
    "troy",
    "erbert",
    "angelyn",
    "junifiel",
    "klex",
    "trixia",
    "amir",
    "britney",
    "jumafe",
    "reymar",
    "charles",
    // Add more as needed: 'student-7', 'student-8', ..., 'student-70'
  ];

  try {
    for (const file of projectFiles) {
      try {
        const response = await fetch(`./projects/${file}.html`);
        if (response.ok) {
          const html = await response.text();
          const template = document.createElement("template");
          template.innerHTML = html.trim();

          $$(".project-card", template.content).forEach((card) => {
            if (!card.dataset.projectId) card.dataset.projectId = file;
          });

          projectsGrid.append(template.content);
        } else {
          console.warn(`Could not load project: ${file}.html`);
        }
      } catch (err) {
        console.warn(`Error loading project: ${file}.html`, err);
      }
    }
  } catch (err) {
    console.error("Error in loadProjects:", err);
  }

  initializeLoadedProjects(projectsGrid);
  hardenOutboundLinks(projectsGrid);
}

function initializeLoadedProjects(projectsGrid) {
  const cards = $$(".project-card", projectsGrid);

  cards.forEach((card, index) => {
    if (!card.dataset.projectId)
      card.dataset.projectId = `project-${index + 1}`;
    registerProjectCard(card);
  });

  attachTiltEffect(cards);
  observeRevealElements();
  updateFeaturedProject();
  initializeFirebaseRatings();

  // Initialize pagination display after projects are loaded
  if (window.initPaginationDisplay) {
    window.initPaginationDisplay();
  }
}

function registerProjectCard(card) {
  const projectId = card.dataset.projectId;
  const project = extractProjectData(card);
  ratingState.projects.set(projectId, project);
  applyGithubAvatar(card, project);
  prepareProjectImagePreview(card, projectId);
  ensureProjectTitleRating(card, projectId);
  ensureRatingUi(card, projectId);
}

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function extractProjectData(card) {
  const actionLinks = $$(".project-card__actions a", card);
  const techTags = $$(".tech__tag", card).map((tag) =>
    cleanText(tag.textContent),
  );
  const liveUrl = sanitizeExternalUrl(
    actionLinks[0]?.getAttribute("href") || "#",
  );
  const githubUrl = sanitizeExternalUrl(
    actionLinks[1]?.getAttribute("href") || "#",
  );
  const githubUsername = getGithubUsername(githubUrl);
  const title = cleanText($(".project__title", card)?.textContent);
  const image = $(".project-card__image img", card);
  const imageSrc = normalizeProjectAssetUrl(
    image?.getAttribute("src") || image?.getAttribute("data-src") || "",
  );

  return {
    id: card.dataset.projectId,
    card,
    avatar: cleanText($(".student__avatar", card)?.textContent) || "SP",
    studentName: cleanText($(".student__name", card)?.textContent) || "Student",
    date: cleanText($(".project__date", card)?.textContent) || "Project",
    title: title || "Student Project",
    description:
      cleanText($(".project__desc", card)?.textContent) ||
      "A student-built project from the showcase gallery.",
    tags: humanizeTags(card.dataset.tags),
    techTags,
    liveUrl,
    githubUrl,
    githubUsername,
    githubAvatarUrl: githubUsername
      ? `https://github.com/${githubUsername}.png?size=120`
      : "",
    previewIcon:
      cleanText($(".placeholder__icon", card)?.textContent) || "\u2605",
    previewLabel:
      cleanText($(".placeholder__label", card)?.textContent) || title,
    imageSrc,
    imageAlt: image?.getAttribute("alt") || title || "Project image",
  };
}

function getGithubUsername(url) {
  if (!url || url === "#") return "";

  try {
    const parsed = new URL(url, window.location.href);
    if (!/(^|\.)github\.com$/i.test(parsed.hostname)) return "";

    return parsed.pathname.split("/").filter(Boolean)[0] || "";
  } catch (err) {
    return "";
  }
}

function normalizeProjectAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("/assets/")) return url.slice(1);
  return url;
}

function applyGithubAvatar(card, project) {
  const avatar = $(".student__avatar", card);
  if (!avatar || !project.githubAvatarUrl) return;

  avatar.classList.add("student__avatar--image");
  avatar.innerHTML = `
    <img src="${escapeHtml(project.githubAvatarUrl)}" alt="${escapeHtml(project.studentName)} GitHub profile" loading="lazy" />
  `;
}

function prepareProjectImagePreview(card, projectId) {
  const imageArea = $(".project-card__image", card);
  if (!imageArea || imageArea.dataset.previewReady === "true") return;

  imageArea.dataset.previewReady = "true";
  imageArea.setAttribute("role", "button");
  imageArea.setAttribute("tabindex", "0");
  imageArea.setAttribute("aria-label", "View project image");

  let overlay = $(".project-card__overlay", imageArea);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "project-card__overlay";
    imageArea.append(overlay);
  }

  overlay.innerHTML = `
    <button type="button" class="overlay__btn project-image-trigger">
      View Image
    </button>
  `;

  on(imageArea, "click", (event) => {
    if (
      event.target.closest(
        ".project-card__overlay, img, .project-card__placeholder",
      )
    ) {
      openProjectImageModal(projectId, event.currentTarget);
    }
  });

  on(imageArea, "keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openProjectImageModal(projectId, event.currentTarget);
  });
}

function ensureProjectTitleRating(card, projectId) {
  const title = $(".project__title", card);
  if (!title || $(".project-title-rating", title)) return;

  const badge = document.createElement("span");
  badge.className = "project-title-rating mono";
  badge.setAttribute("aria-live", "polite");
  badge.textContent = "0.0";
  title.append(badge);

  updateTitleRating(projectId);
}

function ensureRatingUi(card, projectId) {
  if ($(".project-rate-btn", card)) return;

  const actions = $(".project-card__actions", card);
  if (!actions) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "card__btn card__btn--ghost project-rate-btn";
  button.innerHTML = `
    <span class="project-rate-btn__icon">&#9733;</span>
    <span class="project-rate-btn__text">Rate</span>
    <span class="project-rate-btn__meta mono">0.0</span>
  `;

  on(button, "click", () => openRatingModal(projectId, button));
  actions.append(button);

  updateRatingDisplay(projectId);
}

function updateTitleRating(projectId) {
  const card = getProjectCard(projectId);
  if (!card) return;

  const stats = getProjectStats(projectId);
  const badge = $(".project-title-rating", card);
  if (!badge) return;

  badge.textContent = stats.count
    ? `\u2605 ${formatRating(stats.average)}`
    : "\u2605 0.0";
  badge.title = stats.count
    ? `${formatRating(stats.average)} average from ${pluralize(stats.count, "vote")}`
    : "No ratings yet";
}

function renderFeaturedPreview(project) {
  if (project.imageSrc) {
    return `
      <img
        class="featured__image"
        src="${escapeHtml(project.imageSrc)}"
        alt="${escapeHtml(project.imageAlt || project.title)}"
      />
    `;
  }

  return `
    <div class="featured__placeholder">
      <span class="featured__icon">${escapeHtml(project.previewIcon)}</span>
      <span class="featured__label">${escapeHtml(project.previewLabel || project.title)}</span>
      <span class="featured__sublabel mono">${escapeHtml(project.techTags.join(" / ") || "Student Project")}</span>
    </div>
  `;
}

function getProjectCard(projectId) {
  return $$(".project-card").find(
    (card) => card.dataset.projectId === projectId,
  );
}

function getProjectStats(projectId) {
  return (
    ratingState.votes.get(projectId) || {
      average: 0,
      count: 0,
      total: 0,
      userRating: null,
    }
  );
}

function setRatingControls(projectId, enabled) {
  const modal = $("#projectModal");
  if (
    modal?.dataset.view !== "rating" ||
    modal.dataset.projectId !== projectId
  ) {
    return;
  }

  $$(".rating-star", modal).forEach((button) => {
    button.disabled = !enabled;
  });
}

function updateRatingDisplay(projectId) {
  const card = getProjectCard(projectId);
  if (!card) return;

  const stats = getProjectStats(projectId);
  const hasUserRating = Boolean(stats.userRating);

  const button = $(".project-rate-btn", card);
  const buttonText = $(".project-rate-btn__text", card);
  const buttonMeta = $(".project-rate-btn__meta", card);

  if (button) {
    button.classList.toggle("is-rated", hasUserRating);
    button.setAttribute(
      "aria-label",
      hasUserRating
        ? `This browser rated ${stats.userRating} out of ${RATING_MAX}`
        : `Rate ${ratingState.projects.get(projectId)?.title || "project"}`,
    );
  }

  if (buttonText) buttonText.textContent = hasUserRating ? "Rated" : "Rate";
  if (buttonMeta)
    buttonMeta.textContent = stats.count ? formatRating(stats.average) : "New";

  updateTitleRating(projectId);
  updateRatingModal(projectId);
}

function updateAllRatingDisplays() {
  ratingState.projects.forEach((project) => updateRatingDisplay(project.id));
}

function getRatingStatusText(projectId) {
  const stats = getProjectStats(projectId);

  if (!isFirebaseConfigured()) return "Add Firebase config to enable ratings.";
  if (ratingState.error) return ratingState.error;
  if (stats.userRating) {
    return `This browser rated ${stats.userRating}/${RATING_MAX}.`;
  }
  if (ratingState.ready) return "Choose a star rating to vote.";

  return "Connecting ratings...";
}

function openRatingModal(projectId, trigger) {
  const project = ratingState.projects.get(projectId);
  if (!project) return;

  const stats = getProjectStats(projectId);
  const content = `
    <div class="rating-modal" data-project-id="${escapeHtml(projectId)}">
      <p class="project-modal__eyebrow mono">Project Rating</p>
      <h3 class="project-modal__title" id="projectModalTitle">${escapeHtml(project.title)}</h3>
      <p class="project-modal__subtitle">${escapeHtml(project.studentName)}</p>

      <div class="rating-modal__score">
        <strong class="rating-modal__average">${stats.count ? formatRating(stats.average) : "0.0"} / ${RATING_MAX}</strong>
        <span class="rating-modal__count mono">${pluralize(stats.count, "vote")}</span>
      </div>

      <div class="rating-modal__stars" role="group" aria-label="Rate this project">
        ${Array.from(
          { length: RATING_MAX },
          (_, idx) =>
            `<button type="button" class="rating-star rating-star--large" data-rating-value="${idx + 1}" aria-label="Rate ${idx + 1} out of ${RATING_MAX}">&#9733;</button>`,
        ).join("")}
      </div>

      <p class="rating-modal__status mono">${escapeHtml(getRatingStatusText(projectId))}</p>
    </div>
  `;

  openProjectModal(content, trigger);

  const modal = getProjectModal();
  modal.dataset.view = "rating";
  modal.dataset.projectId = projectId;

  $$(".rating-star", modal).forEach((button) => {
    on(button, "click", () => {
      submitProjectRating(projectId, Number(button.dataset.ratingValue));
    });
  });

  updateRatingModal(projectId);
  initializeFirebaseRatings();
}

function updateRatingModal(projectId) {
  const modal = $("#projectModal");
  if (
    !modal ||
    modal.hidden ||
    modal.dataset.view !== "rating" ||
    modal.dataset.projectId !== projectId
  ) {
    return;
  }

  const stats = getProjectStats(projectId);
  const fillUntil = stats.userRating || Math.round(stats.average);
  const readyToRate = ratingState.ready && !stats.userRating;

  const average = $(".rating-modal__average", modal);
  const count = $(".rating-modal__count", modal);
  const status = $(".rating-modal__status", modal);

  if (average) {
    average.textContent = `${stats.count ? formatRating(stats.average) : "0.0"} / ${RATING_MAX}`;
  }
  if (count) count.textContent = pluralize(stats.count, "vote");
  if (status) status.textContent = getRatingStatusText(projectId);

  $$(".rating-star", modal).forEach((button) => {
    const value = Number(button.dataset.ratingValue);
    button.classList.toggle("is-filled", value <= fillUntil);
    button.classList.toggle("is-selected", stats.userRating === value);
    button.disabled = !readyToRate;
  });
}

function openProjectImageModal(projectId, trigger) {
  const project = ratingState.projects.get(projectId);
  if (!project) return;

  const visual = project.imageSrc
    ? `<img class="project-image-modal__img" src="${escapeHtml(project.imageSrc)}" alt="${escapeHtml(project.imageAlt)}" />`
    : `
      <div class="project-image-modal__placeholder">
        <span class="project-image-modal__icon">${escapeHtml(project.previewIcon)}</span>
        <span class="project-image-modal__label mono">${escapeHtml(project.previewLabel || project.title)}</span>
      </div>
    `;

  openProjectModal(
    `
      <div class="project-image-modal" data-project-id="${escapeHtml(projectId)}">
        <p class="project-modal__eyebrow mono">Project Image</p>
        <h3 class="project-modal__title" id="projectModalTitle">${escapeHtml(project.title)}</h3>
        <p class="project-modal__subtitle">${escapeHtml(project.studentName)}</p>
        <div class="project-image-modal__frame">${visual}</div>
      </div>
    `,
    trigger,
  );

  const modal = getProjectModal();
  modal.dataset.view = "image";
  modal.dataset.projectId = projectId;
}

function waitForAuthReady(auth) {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

function initializeFirebaseAppCheck() {
  if (!isAppCheckConfigured() || !firebase.appCheck) return;

  const appCheck = firebase.appCheck();
  appCheck.activate(firebaseConfig.appCheckSiteKey, true);
}

async function initializeFirebaseRatings() {
  if (firebaseRatingsPromise) return firebaseRatingsPromise;

  firebaseRatingsPromise = (async () => {
    if (!ratingState.projects.size) return false;

    if (!isFirebaseConfigured()) {
      ratingState.ready = false;
      ratingState.error = "";
      updateAllRatingDisplays();
      return false;
    }

    if (!window.firebase) {
      ratingState.ready = false;
      ratingState.error = "Firebase SDK did not load.";
      updateAllRatingDisplays();
      return false;
    }

    try {
      const app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(getFirebaseAppConfig());

      initializeFirebaseAppCheck();

      ratingState.auth = firebase.auth(app);
      ratingState.db = firebase.firestore(app);

      if (firebase.auth.Auth?.Persistence?.LOCAL) {
        await ratingState.auth.setPersistence(
          firebase.auth.Auth.Persistence.LOCAL,
        );
      }

      const existingUser = await waitForAuthReady(ratingState.auth);
      const credential = existingUser
        ? { user: existingUser }
        : await ratingState.auth.signInAnonymously();

      ratingState.user = credential.user;
      ratingState.ready = true;
      ratingState.error = "";

      ratingState.projects.forEach((project) => {
        listenToProjectVotes(project.id);
        updateRatingDisplay(project.id);
      });

      updateFeaturedProject();
      return true;
    } catch (err) {
      console.error("Firebase ratings failed:", err);
      ratingState.ready = false;
      ratingState.error = "Enable Anonymous Auth and Firestore rules.";
      updateAllRatingDisplays();
      return false;
    }
  })();

  return firebaseRatingsPromise;
}

function listenToProjectVotes(projectId) {
  if (!ratingState.db || ratingState.listeners.has(projectId)) return;

  const votesRef = ratingState.db
    .collection(RATING_COLLECTION)
    .doc(projectId)
    .collection("votes");

  const unsubscribe = votesRef.onSnapshot(
    (snapshot) => {
      let total = 0;
      let count = 0;
      let userRating = null;

      snapshot.forEach((doc) => {
        const value = Number(doc.data().rating);
        if (!Number.isFinite(value)) return;

        total += value;
        count += 1;

        if (ratingState.user && doc.id === ratingState.user.uid) {
          userRating = value;
        }
      });

      ratingState.votes.set(projectId, {
        total,
        count,
        average: count ? total / count : 0,
        userRating,
      });

      updateRatingDisplay(projectId);
      updateFeaturedProject();
    },
    (err) => {
      console.error(`Could not load ratings for ${projectId}:`, err);
      ratingState.error = "Check Firestore rules for ratings.";
      updateRatingDisplay(projectId);
    },
  );

  ratingState.listeners.set(projectId, unsubscribe);
}

async function submitProjectRating(projectId, rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > RATING_MAX) return;

  if (!ratingState.ready) {
    await initializeFirebaseRatings();
    if (!ratingState.ready) {
      updateRatingDisplay(projectId);
      return;
    }
  }

  const stats = getProjectStats(projectId);
  if (stats.userRating) {
    updateRatingDisplay(projectId);
    return;
  }

  const card = getProjectCard(projectId);
  if (card) {
    setRatingControls(projectId, false);
    const status = $(".rating-modal__status", $("#projectModal"));
    if (status) status.textContent = "Saving rating...";
  }

  try {
    const voteRef = ratingState.db
      .collection(RATING_COLLECTION)
      .doc(projectId)
      .collection("votes")
      .doc(ratingState.user.uid);

    const existingVote = await voteRef.get();
    if (existingVote.exists) {
      const existingRating = Number(existingVote.data()?.rating);
      if (Number.isInteger(existingRating)) {
        ratingState.votes.set(projectId, {
          ...getProjectStats(projectId),
          userRating: existingRating,
        });
      }

      const modalStatus = $(".rating-modal__status", $("#projectModal"));
      if (modalStatus) {
        modalStatus.textContent = "This browser already rated this project.";
      }
      updateRatingDisplay(projectId);
      return;
    }

    await voteRef.set({
      projectId,
      rating,
    });
  } catch (err) {
    console.error(`Could not save rating for ${projectId}:`, err);

    const status = $(".rating-modal__status", $("#projectModal"));
    if (status) {
      status.textContent =
        err.code === "permission-denied"
          ? "Permission denied. Publish the Firestore rules in README."
          : "Could not save rating. Try again.";
    }

    updateRatingDisplay(projectId);
  }
}

function getTopRatedProject() {
  const projects = [...ratingState.projects.values()];
  const rated = projects
    .map((project) => ({
      project,
      stats: getProjectStats(project.id),
    }))
    .filter((entry) => entry.stats.count > 0)
    .sort((a, b) => {
      if (b.stats.average !== a.stats.average) {
        return b.stats.average - a.stats.average;
      }
      if (b.stats.count !== a.stats.count) return b.stats.count - a.stats.count;
      return a.project.studentName.localeCompare(b.project.studentName);
    });

  return (
    rated[0] ||
    (projects[0]
      ? { project: projects[0], stats: getProjectStats(projects[0].id) }
      : null)
  );
}

function updateFeaturedProject() {
  const featured = $(".featured__card");
  const top = getTopRatedProject();
  if (!featured || !top) return;

  const { project, stats } = top;
  const ratingText = stats.count
    ? `${formatRating(stats.average)} / ${RATING_MAX}`
    : `0.0 / ${RATING_MAX}`;
  const featuredMedia = getFeaturedMedia(featured);

  const badge = $(".featured__badge", featured);
  const browserUrl = $(".browser__url", featured);
  const avatar = $(".featured__avatar", featured);
  const studentName = $(".featured__student-name", featured);
  const studentDesc = $(".featured__student-desc", featured);
  const title = $(".featured__title", featured);
  const desc = $(".featured__desc", featured);
  const highlights = $(".featured__highlights", featured);
  const tags = $(".featured__details .tech__tags", featured);
  const actions = $$(".featured__actions a", featured);

  if (badge) {
    badge.textContent = stats.count
      ? `Highest Rated - ${ratingText} from ${pluralize(stats.count, "vote")}`
      : "Waiting for viewer ratings";
  }

  if (browserUrl) browserUrl.textContent = getProjectHost(project.liveUrl);
  if (featuredMedia) featuredMedia.innerHTML = renderFeaturedPreview(project);
  if (avatar) {
    avatar.classList.toggle(
      "featured__avatar--image",
      Boolean(project.githubAvatarUrl),
    );
    avatar.innerHTML = project.githubAvatarUrl
      ? `<img src="${escapeHtml(project.githubAvatarUrl)}" alt="${escapeHtml(project.studentName)} GitHub profile" loading="lazy" />`
      : escapeHtml(project.avatar);
  }
  if (studentName) studentName.textContent = project.studentName;
  if (studentDesc) {
    studentDesc.textContent = stats.count
      ? `${ratingText} average - ${pluralize(stats.count, "vote")}`
      : `${project.date} - no ratings yet`;
  }
  if (title) title.textContent = project.title;
  if (desc) desc.textContent = project.description;

  if (highlights) {
    highlights.innerHTML = [
      ["&#9733;", `${ratingText} average rating`],
      ["#", pluralize(stats.count, "viewer vote")],
      ["ID", project.tags || "Project"],
      ["</>", project.techTags.slice(0, 2).join(" + ") || "Student build"],
    ]
      .map(
        ([highlightIcon, text]) => `
          <div class="highlight">
            <span class="highlight__icon">${highlightIcon}</span>
            <span>${escapeHtml(text)}</span>
          </div>
        `,
      )
      .join("");
  }

  if (tags) {
    tags.innerHTML = project.techTags
      .map(
        (tag) =>
          `<span class="tech__tag" data-tech="${escapeHtml(tag.toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(tag)}</span>`,
      )
      .join("");
  }

  syncFeaturedLink(actions[0], project.liveUrl, "View Live Project");
  syncFeaturedLink(actions[1], project.githubUrl, "View GitHub");
}

function getFeaturedMedia(featured) {
  let media = $(".featured__media", featured);
  if (media) return media;

  const screenshot = $(".featured__screenshot", featured);
  const existingContent = $(".featured__placeholder", screenshot);
  if (!screenshot || !existingContent) return null;

  media = document.createElement("div");
  media.className = "featured__media";
  existingContent.replaceWith(media);
  return media;
}

function syncFeaturedLink(link, url, label) {
  if (!link) return;

  const safeUrl = sanitizeExternalUrl(url);
  const hasUrl = Boolean(safeUrl && safeUrl !== "#");
  link.href = hasUrl ? safeUrl : "#projects";
  link.classList.toggle("is-disabled", !hasUrl);
  link.toggleAttribute("aria-disabled", !hasUrl);
  link.setAttribute("rel", "noopener noreferrer");
  link.setAttribute("referrerpolicy", "no-referrer");

  const labelEl = $("span", link);
  if (labelEl) labelEl.textContent = label;
  else link.textContent = label;
}

// Load projects on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadProjects);
} else {
  loadProjects();
}

/* ──────────────────────────────────────
   LOADING SCREEN
────────────────────────────────────── */
(function initLoader() {
  const loader = $("#loader");
  if (!loader) return;

  document.body.classList.add("loading");

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hidden");
      document.body.classList.remove("loading");

      // Trigger initial reveals after load
      setTimeout(() => {
        $$(".reveal").forEach((el) => observer.observe(el));
      }, 100);
    }, 900);
  });
})();

/* ──────────────────────────────────────
   STICKY NAVBAR
────────────────────────────────────── */
(function initNavbar() {
  const navbar = $("#navbar");
  if (!navbar) return;

  const handleScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  };

  on(window, "scroll", handleScroll, { passive: true });
  handleScroll(); // run once on init
})();

/* ──────────────────────────────────────
   MOBILE NAVIGATION TOGGLE
────────────────────────────────────── */
(function initMobileNav() {
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");
  if (!hamburger || !navLinks) return;

  const toggle = () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
    hamburger.setAttribute(
      "aria-expanded",
      navLinks.classList.contains("open"),
    );
  };

  const close = () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  on(hamburger, "click", toggle);

  // Close on link click
  $$(".nav__link", navLinks).forEach((link) => {
    on(link, "click", close);
  });

  // Close on outside click
  on(document, "click", (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      close();
    }
  });
})();

/* ──────────────────────────────────────
   DARK / LIGHT MODE TOGGLE
────────────────────────────────────── */
(function initThemeToggle() {
  const btn = $("#themeToggle");
  const icon = btn?.querySelector(".theme-toggle__icon");
  const html = document.documentElement;

  if (!btn) return;

  // Load saved preference
  const saved = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", saved);
  if (icon) icon.textContent = saved === "dark" ? "☀️" : "🌙";

  on(btn, "click", () => {
    const current = html.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (icon) icon.textContent = next === "dark" ? "☀️" : "🌙";
  });
})();

/* ──────────────────────────────────────
   HERO PARTICLE CANVAS
────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = $("#heroCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W,
    H,
    particles = [],
    animId;

  const PARTICLE_COUNT = 60;
  const MAX_DIST = 130;
  const PARTICLE_SPEED = 0.4;

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * PARTICLE_SPEED;
      this.vy = (Math.random() - 0.5) * PARTICLE_SPEED;
      this.r = Math.random() * 2 + 1;
      this.a = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      const isDark =
        document.documentElement.getAttribute("data-theme") !== "light";
      const baseColor = isDark ? "59, 130, 246" : "59, 130, 246";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor}, ${this.a * (isDark ? 1 : 0.5)})`;
      ctx.fill();
    }
  }

  function connect() {
    const isDark =
      document.documentElement.getAttribute("data-theme") !== "light";
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * (isDark ? 0.15 : 0.08);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    connect();
    animId = requestAnimationFrame(loop);
  }

  resize();
  loop();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Pause when not visible
  on(document, "visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else loop();
  });
})();

/* ──────────────────────────────────────
   SCROLL REVEAL (IntersectionObserver)
────────────────────────────────────── */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Stagger sibling cards
        const siblings = $$(".reveal", entry.target.parentElement);
        const i = siblings.indexOf(entry.target);
        const delay = (i % 3) * 80; // 80ms stagger per column

        setTimeout(() => {
          entry.target.classList.add("visible");
        }, delay);

        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  },
);

// Observe all .reveal elements (called after load)
function observeRevealElements() {
  $$(".reveal").forEach((el) => observer.observe(el));
}

// If page loads without loader, still observe
document.addEventListener("DOMContentLoaded", () => {
  hardenOutboundLinks();
  setTimeout(observeRevealElements, 300);
});

/* ──────────────────────────────────────
   ANIMATED COUNTERS
────────────────────────────────────── */
(function initCounters() {
  const counters = $$(".counter, .hero__stat-num[data-target]");

  function animateCounter(el) {
    const target = parseInt(el.getAttribute("data-target"), 10);
    const duration = 1800; // ms
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);

      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((el) => counterObserver.observe(el));
})();

/* ──────────────────────────────────────
   PROJECTS SEARCH & FILTER WITH PAGINATION
────────────────────────────────────── */
(function initProjectsFilter() {
  const searchInput = $("#searchInput");
  const searchClear = $("#searchClear");
  const filterPills = $$(".filter__pill");
  const noResults = $("#noResults");
  const clearFilters = $("#clearFilters");
  const pagination = $("#pagination");
  const paginationPrev = $("#paginationPrev");
  const paginationNext = $("#paginationNext");
  const paginationCurrent = $("#paginationCurrent");
  const paginationTotal = $("#paginationTotal");

  if (!searchInput) return;

  let activeFilter = "all";
  let currentPage = 1;
  const itemsPerPage = 6;
  let filteredCards = [];
  let totalPages = 1;

  function normalize(str) {
    return str.toLowerCase().trim();
  }

  function getFilteredCards() {
    const query = normalize(searchInput.value);
    const projectCards = $$(".project-card");
    const filtered = [];

    projectCards.forEach((card) => {
      const name = normalize(
        card.querySelector(".student__name")?.textContent || "",
      );
      const title = normalize(
        card.querySelector(".project__title")?.textContent || "",
      );
      const desc = normalize(
        card.querySelector(".project__desc")?.textContent || "",
      );
      const tags = normalize(card.getAttribute("data-tags") || "");

      const matchesSearch =
        !query ||
        name.includes(query) ||
        title.includes(query) ||
        desc.includes(query) ||
        tags.includes(query);

      const matchesFilter =
        activeFilter === "all" || tags.includes(activeFilter);

      if (matchesSearch && matchesFilter) {
        filtered.push(card);
      }
    });

    return filtered;
  }

  function updatePagination() {
    filteredCards = getFilteredCards();
    totalPages = Math.max(1, Math.ceil(filteredCards.length / itemsPerPage));

    // Reset to page 1 if current page exceeds total pages
    if (currentPage > totalPages) {
      currentPage = 1;
    }

    // Calculate which cards to show
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const projectCards = $$(".project-card");

    projectCards.forEach((card) => {
      const isVisible = filteredCards.includes(card);
      const isOnCurrentPage =
        isVisible &&
        filteredCards.indexOf(card) >= startIdx &&
        filteredCards.indexOf(card) < endIdx;
      card.classList.toggle("hidden", !isOnCurrentPage);
    });

    // Update pagination controls - show only if there are more than itemsPerPage results
    if (filteredCards.length > itemsPerPage) {
      pagination.style.display = "flex";
      paginationPrev.disabled = currentPage === 1;
      paginationNext.disabled = currentPage === totalPages;
      paginationCurrent.textContent = currentPage;
      paginationTotal.textContent = totalPages;
      // Hide no-results when showing pagination
      if (noResults) {
        noResults.style.display = "none";
      }
    } else {
      pagination.style.display = "none";
      // Show no-results only if there are 0 filtered results
      if (noResults) {
        noResults.style.display = filteredCards.length === 0 ? "flex" : "none";
      }
    }
  }

  // Search input
  on(searchInput, "input", () => {
    const hasVal = searchInput.value.length > 0;
    if (searchClear) searchClear.classList.toggle("visible", hasVal);
    currentPage = 1;
    updatePagination();
  });

  // Clear search
  on(searchClear, "click", () => {
    searchInput.value = "";
    searchClear.classList.remove("visible");
    currentPage = 1;
    updatePagination();
    searchInput.focus();
  });

  // Filter pills
  filterPills.forEach((pill) => {
    on(pill, "click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilter = pill.getAttribute("data-filter");
      currentPage = 1;
      updatePagination();
    });
  });

  // Clear all filters
  on(clearFilters, "click", () => {
    searchInput.value = "";
    if (searchClear) searchClear.classList.remove("visible");
    activeFilter = "all";
    currentPage = 1;
    filterPills.forEach((p) => p.classList.remove("active"));
    filterPills[0]?.classList.add("active");
    updatePagination();
  });

  // Pagination controls
  on(paginationPrev, "click", () => {
    if (currentPage > 1) {
      currentPage--;
      updatePagination();
      // Scroll to projects section
      const projectsSection = $("#projects");
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  on(paginationNext, "click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      updatePagination();
      // Scroll to projects section
      const projectsSection = $("#projects");
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // Export function to initialize pagination after projects are loaded
  window.initPaginationDisplay = function () {
    updatePagination();
  };
})();

/* ──────────────────────────────────────
   ACTIVE NAV LINK (SCROLL SPY)
────────────────────────────────────── */
(function initScrollSpy() {
  const sections = $$("section[id]");
  const navLinks = $$(".nav__link");

  if (!sections.length || !navLinks.length) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            const matches = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", matches);
          });
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: `-${70}px 0px -40% 0px`,
    },
  );

  sections.forEach((s) => sectionObserver.observe(s));
})();

/* ──────────────────────────────────────
   SCROLL TO TOP BUTTON
────────────────────────────────────── */
(function initScrollTop() {
  const btn = $("#scrollTop");
  if (!btn) return;

  on(
    window,
    "scroll",
    () => {
      btn.classList.toggle("visible", window.scrollY > 400);
    },
    { passive: true },
  );

  on(btn, "click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

/* ──────────────────────────────────────
   SMOOTH SCROLL (fallback for older browsers)
────────────────────────────────────── */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach((link) => {
    on(link, "click", (e) => {
      const href = link.getAttribute("href");
      if (href === "#") return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const navHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-height",
          ),
        ) || 70;
      const top =
        target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
})();

/* ──────────────────────────────────────
   DYNAMIC COPYRIGHT YEAR
────────────────────────────────────── */
(function initYear() {
  const el = $("#currentYear");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ──────────────────────────────────────
   PROJECT CARD TILT EFFECT (subtle)
────────────────────────────────────── */
function attachTiltEffect(cards) {
  cards.forEach((card) => {
    if (card.dataset.tiltReady === "true") return;
    card.dataset.tiltReady = "true";

    on(card, "mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotX = (-(e.clientY - centerY) / rect.height) * 5;
      const rotY = ((e.clientX - centerX) / rect.width) * 5;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });

    on(card, "mouseleave", () => {
      card.style.transform = "";
    });
  });
}

(function initCardTilt() {
  attachTiltEffect($$(".project-card, .stat-card, .timeline__card"));
})();

/* ──────────────────────────────────────
   HERO BADGE TYPEWRITER (optional flair)
────────────────────────────────────── */
(function initTypingFlair() {
  // Nothing active — hook ready for future use
})();

/* ──────────────────────────────────────
   KEYBOARD ACCESSIBILITY
────────────────────────────────────── */
(function initA11y() {
  // Trap focus in mobile menu when open
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const hamburger = $("#hamburger");
      const navLinks = $("#navLinks");
      if (navLinks?.classList.contains("open")) {
        hamburger?.classList.remove("open");
        navLinks?.classList.remove("open");
        hamburger?.focus();
      }
    }
  });
})();

/* ──────────────────────────────────────
   CONSOLE EASTER EGG
────────────────────────────────────── */
console.log(
  "%c🎓 Student Project Showcase\n%c Built to celebrate every deployed project.\n Every bug fixed. Every system built from scratch.",
  "font-size:18px; font-weight:bold; color:#3B82F6;",
  "font-size:12px; color:#94A3B8;",
);
