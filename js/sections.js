/**
 * Quiz . de partida — UBÍCATE → DAME UN MATCH → MI TOP 3
 * Referencia: https://pablomonteserin.com/curso/javascript/como-hacer-un-trivial/
 */
document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================================================
     1. Configuración y referencias DOM
     ========================================================================== */

  const STORAGE_KEY = "punto-de-partida-quiz-v1";   // sirve para guardar los datos de una sesion
  const DATA_URL = "./data/base-de-datos.json";     // en este archivo se encuentran las categorias, subcategorias y referentes
  const HERO_DURATION = 0.45;                       // duracion de las animaciones del hero con GSAP

  // como se encuentran los elementos al cargar la pagina
  const state = {
    step: 1,
    sliders: {},
    categoryScores: [],
    filteredCategoryIds: [],
    matchPage: 0,
    matchItems: [],
    subcategoryVotes: {},
    database: [],
  };

  const sectionUbicate = document.querySelector(".ubicate .sections-content");
  const sectionMatch = document.querySelector(".dame-un-match .sections-content");
  const sectionResults = document.querySelector(".resultados .sections-content");
  const sectionEls = document.querySelectorAll(".sections section");
  const btnHeroMore = document.getElementById("btnHeroMore");

  let heroCompact = false;
  let heroTl = null;

  /* ==========================================================================
     2. Helpers de layout (CSS vars y viewport)
     ========================================================================== */

  // lee una variable del CSS y la convierte en un numero
  function readCssPx(varName, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getLogoCompactWidth() { return readCssPx("--logo-compact-w", 130); }
  function getLogoCompactTop() { return readCssPx("--logo-compact-top", 45); }
  function getLogoCompactLeft() { return readCssPx("--page-gutter", 20); }
  function getHeroExitY() { return readCssPx("--hero-exit-y", -430); }

  function isMobileView() { return window.matchMedia("(max-width: 900px)").matches; }       // detecta si está en abriendose en un movil (ayuda en las animaciones)
  function isMobileResults() { return window.matchMedia("(max-width: 900px)").matches; }

  function getMatchPageSize() { return isMobileView() ? 9 : MATCH_PAGE_SIZE; }              // tamaño del grid dependiendo del dispositivo
  
  function referenteImgSrc(slug) { return `./www-assets/img/${slug}.jpg`; }                 // las rutas de imagen de los referentes  

  /* ==========================================================================
     3. Transiciones del hero (index)
     ========================================================================== */

  // si ya está compactado o GSAP no existe, no hace nada
  function enterHeroTransition() {
    if (heroCompact || typeof gsap === "undefined") return;

    const memes = document.querySelector(".hero-logo .memes-animation");
    const heroContent = document.querySelector(".hero-content");
    const heroLogoWrap = document.querySelector(".hero-logo");
    const logo = document.querySelector(".intro-logo");

    if (!memes || !heroContent || !logo || !heroLogoWrap) return;

    // si habia una animacion previa la cancela
    heroTl?.kill();

    if (isMobileView()) {
      heroTl = gsap.timeline({
        defaults: { duration: HERO_DURATION },
        onComplete: () => {
          heroCompact = true;
        },
      });
      heroTl.to(heroContent, { y: getHeroExitY(), opacity: 0, duration: HERO_DURATION }, 0);
      return;
    }

    const startRect = logo.getBoundingClientRect();
    const compactWidth = getLogoCompactWidth();
    const compactLeft = getLogoCompactLeft();

    gsap.set(logo, {
      position: "fixed",
      zIndex: 1100,
      top: startRect.top,
      left: startRect.left,
      width: startRect.width,
      margin: 0,
    });

    heroTl = gsap.timeline({
      defaults: { duration: HERO_DURATION },
      onComplete: () => {
        heroCompact = true;
        heroLogoWrap.classList.add("is-collapsed");
        gsap.set(logo, {
          top: getLogoCompactTop(),
          left: compactLeft,
          width: compactWidth,
        });
      },
    });

    heroTl
      .to(memes, { y: -460, opacity: 1, duration: HERO_DURATION }, 0)
      .to(heroContent, { y: getHeroExitY(), opacity: 0, duration: HERO_DURATION }, 0)
      .to(
        logo,
        {
          top: getLogoCompactTop(),
          left: compactLeft,
          width: compactWidth,
          duration: HERO_DURATION,
        },
        0
      );
  }

  function exitHeroTransition(onComplete) {
    if (!heroCompact || typeof gsap === "undefined") {
      onComplete?.();
      return;
    }

    const memes = document.querySelector(".hero-logo .memes-animation");
    const heroContent = document.querySelector(".hero-content");
    const heroLogoWrap = document.querySelector(".hero-logo");
    const logo = document.querySelector(".intro-logo");

    if (!memes || !heroContent || !logo || !heroLogoWrap) {
      heroCompact = false;
      onComplete?.();
      return;
    }

    heroTl?.kill();

    if (isMobileView()) {
      gsap.set(heroContent, { clearProps: "all" });
      heroCompact = false;
      onComplete?.();
      return;
    }

    heroLogoWrap.classList.remove("is-collapsed");
    gsap.set(logo, { clearProps: "all" });
    void heroLogoWrap.offsetHeight;

    const targetRect = logo.getBoundingClientRect();
    const compactWidth = getLogoCompactWidth();

    gsap.set(logo, {
      position: "fixed",
      zIndex: 1100,
      top: getLogoCompactTop(),
      left: getLogoCompactLeft(),
      width: compactWidth,
      margin: 0,
    });

    heroTl = gsap.timeline({
      defaults: { duration: HERO_DURATION },
      onComplete: () => {
        gsap.set(logo, { clearProps: "all" });
        gsap.set([memes, heroContent], { clearProps: "all" });
        heroCompact = false;
        onComplete?.();
      },
    });

    heroTl
      .to(
        logo,
        {
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          duration: HERO_DURATION,
        },
        0
      )
      .to(memes, { y: 0, opacity: 1, duration: HERO_DURATION }, 0)
      .to(heroContent, { y: 0, opacity: 1, duration: HERO_DURATION }, 0);
  }

  /* ==========================================================================
     4. Estado — sessionStorage
     ========================================================================== */

  function loadStoredState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);    // recupera el estado guardado
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.assign(state, {                              // mezcla el estado guardado con el actual
        step: saved.step || 1,
        sliders: saved.sliders || {},
        subcategoryVotes: saved.subcategoryVotes || {},
        matchPage: saved.matchPage || 0,
      });
    } catch (_) {
      /* ignorar */
    }
  }

  // guarda el estado actual
  function persistState() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: state.step,
        sliders: state.sliders,
        subcategoryVotes: state.subcategoryVotes,
        matchPage: state.matchPage,
      })
    );
  }

  // resetea todo
  function resetQuizState() {
    sessionStorage.removeItem(STORAGE_KEY);
    state.step = 1;
    state.sliders = {};
    state.categoryScores = [];
    state.filteredCategoryIds = [];
    state.matchPage = 0;
    state.matchItems = [];
    state.subcategoryVotes = {};
    renderUbicate();
    setStep(1);
  }

  /* ==========================================================================
     5. Puntuación y datos del match
     ========================================================================== */

  function normalizeSlider(value) {
    return (Number(value) - 50) / 50;
  }

  // para cada categoria busca su perfil
  function scoreCategories() {
    return state.database
      .map((cat) => {
        const profile = CATEGORY_PROFILES[cat.id];
        if (!profile) return { id: cat.id, score: 0 };

        let score = 0;
        QUIZ_AXES.forEach((axis) => {
          const user = normalizeSlider(state.sliders[axis.id] ?? 50);
          const catVal = profile[axis.id] ?? 0;
          score += user * catVal;
        });

        return { id: cat.id, categoria: cat.categoria, score };
      })
      // ordena de mayor afinidad a menor
      .sort((a, b) => b.score - a.score);
  }

  function getFilteredSubcategories() {
    const ids = new Set(state.filteredCategoryIds);
    const list = [];

    state.database.forEach((cat) => {
      if (!ids.has(cat.id)) return;
      cat.subcategorias.forEach((sub) => {
        list.push({
          subId: sub.id,
          subNombre: sub.nombre,
          catId: cat.id,
          catNombre: cat.categoria,
          referentes: sub.referentes || [],
          thumbSlug: (sub.referentes && sub.referentes[0]?.slug) || sub.id,
        });
      });
    });

    return list;
  }

  function shuffleArray(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function prepareMatchItems() {
    state.matchItems = shuffleArray(getFilteredSubcategories());
    state.matchPage = 0;
  }

  function preloadReferenteImages(database) {
    const slugs = new Set();

    database.forEach((cat) => {
      cat.subcategorias?.forEach((sub) => {
        sub.referentes?.forEach((ref) => {
          if (ref.slug) slugs.add(ref.slug);
        });
      });
    });

    slugs.forEach((slug) => {
      const img = new Image();
      img.src = referenteImgSrc(slug);
    });
  }

  function getTopSubcategories(limit = 3) {
    const subs = getFilteredSubcategories();
    const subMap = new Map(subs.map((s) => [s.subId, s]));

    return Object.entries(state.subcategoryVotes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([subId, votes], index) => {
        const data = subMap.get(subId);
        return {
          rank: index + 1,
          votes,
          subId,
          subNombre: data?.subNombre || subId,
          catNombre: data?.catNombre || "",
          referentes: data?.referentes || [],
        };
      });
  }

  function collectArtistsFromRanks(topSubs, ranks) {
    const seen = new Set();
    const artists = [];

    ranks.forEach((rank) => {
      const sub = topSubs.find((item) => item.rank === rank);
      (sub?.referentes || []).forEach((ref) => {
        if (seen.has(ref.slug)) return;
        seen.add(ref.slug);
        artists.push(ref);
      });
    });

    return artists;
  }

  function getResultsArtistRanks() {
    return isMobileResults() ? [1] : [1, 2];
  }

  /* ==========================================================================
     6. UI de secciones
     ========================================================================== */

  function applySectionUI(step) {
    sectionEls.forEach((el, i) => {
      const index = i + 1;
      el.classList.toggle("is-open", step > 0 && index === step);
      el.classList.toggle("is-done", step > 0 && index < step);
    });

    if (step > 0) {
      document.body.dataset.quizStep = String(step);
      const isFirstStart = !document.body.classList.contains("quiz-started");
      document.body.classList.add("quiz-started");
      if (isFirstStart) enterHeroTransition();
      return;
    }

    if (document.body.classList.contains("quiz-started") || heroCompact) {
      exitHeroTransition(() => {
        document.body.classList.remove("quiz-started");
        delete document.body.dataset.quizStep;
      });
      return;
    }

    delete document.body.dataset.quizStep;
  }

  function setStep(step) {
    state.step = step;
    persistState();
    applySectionUI(step);
  }

  function openQuizFromHero() {
    setStep(Math.max(1, state.step));
  }

  function updateSliderFill(input) {
    input.style.setProperty("--value", `${input.value}%`);
  }

  /* ==========================================================================
     7. Render — UBÍCATE
     ========================================================================== */

  // genera cada uno de los sliders (el contenido)
  function renderUbicate() {
    const slidersHtml = QUIZ_AXES.map(
      (axis) => `
      <div class="quiz-slider" data-axis="${axis.id}">
        <div class="quiz-slider__track">
          <input
            type="range"
            min="0"
            max="100"
            value="${state.sliders[axis.id] ?? 50}"
            aria-label="${axis.left} — ${axis.right}"
          />
        </div>
        <div class="quiz-slider__labels">
          <span class="p inter-regular">${axis.left}</span>
          <span class="p inter-regular" style="text-align:right">${axis.right}</span>
        </div>
      </div>
    `
    ).join("");

    sectionUbicate.innerHTML = `
      <div class="quiz-panel quiz-panel--ubicate">
        <p class="quiz-panel__hint arial-regular h3">
          <span>¿Dónde te ves más?</span>
          <span>Mueve los sliders según tu instinto.</span>
        </p>
        <div class="quiz-sliders">${slidersHtml}</div>
        <div class="quiz-panel__actions">
          <button type="button" class="quiz-btn quiz-btn--primary" id="btnUbicateNext">Siguiente</button>
        </div>
      </div>
    `;

    sectionUbicate.querySelectorAll('input[type="range"]').forEach((input) => {
      const axisId = input.closest(".quiz-slider").dataset.axis;
      updateSliderFill(input);

      // guarda cada movimiento del slider
      input.addEventListener("input", () => {
        state.sliders[axisId] = input.value;
        updateSliderFill(input);
        persistState();
      });
    });

    // calcula categorías → filtra → prepara match → pasa a fase 2
    document.getElementById("btnUbicateNext").addEventListener("click", () => {
      state.categoryScores = scoreCategories();
      state.filteredCategoryIds = state.categoryScores
        .slice(0, TOP_CATEGORIES_FOR_MATCH)
        .map((c) => c.id);
      prepareMatchItems();
      renderMatch();
      setStep(2);
    });
  }

  /* ==========================================================================
     8. Render — DAME UN MATCH
     ========================================================================== */

  function renderMatch() {
    const subs = state.matchItems.length ? state.matchItems : getFilteredSubcategories();     // usa las subcategorías mezcladas o las originales
    const totalPages = Math.max(1, Math.ceil(subs.length / getMatchPageSize()));

    if (state.matchPage >= totalPages) state.matchPage = totalPages - 1;
    if (state.matchPage < 0) state.matchPage = 0;

    const pageSize = getMatchPageSize();
    const pageItems = subs.slice(             // corta la pagina actual
      state.matchPage * pageSize,
      state.matchPage * pageSize + pageSize
    );

    // genera cada tarjeta de imagen
    const gridHtml = pageItems
      .map((item) => {
        const selected = (state.subcategoryVotes[item.subId] || 0) > 0;
        return `
        <button
          type="button"
          class="match-card ${selected ? "is-selected" : ""}"
          data-sub-id="${item.subId}"
          aria-pressed="${selected}"
        >
          <img
            src="${referenteImgSrc(item.thumbSlug)}"
            alt="${item.subNombre}"
            loading="lazy"
            class="match-card__img"
          />
        </button>
      `;
      })
      .join("");

    sectionMatch.innerHTML = `
      <div class="quiz-panel quiz-panel--match">
        <div class="quiz-panel--match__grid-wrap">
          <div class="match-intro">
            <p class="match-intro__title arial-regular h3">
              <span>Selecciona todas las imágenes</span><span class="blue">que te inspiren</span>
            </p>
            <div class="match-pagination inter-regular p-mini" aria-label="Página de imágenes">
              <button type="button" class="match-pagination__btn arial-regular" id="matchPrev" ${state.matchPage === 0 ? "disabled" : ""}>&lt;</button>
              <span class="arial-regular">${state.matchPage + 1}</span>
              <button type="button" class="match-pagination__btn arial-regular" id="matchNext" ${state.matchPage >= totalPages - 1 ? "disabled" : ""}>&gt;</button>
            </div>
          </div>
          <div class="match-grid">${gridHtml || '<p class="inter-regular p-mini">No hay subcategorías para tus categorías filtradas.</p>'}</div>
        </div>
        <div class="match-aside inter-regular p-mini">
          <p style="display:flex;flex-direction:column;gap:20px;">Elige las imágenes que te enciendan algo — da igual si no sabes por qué. Tu instinto sabe más de lo que crees.</p>
          <div class="quiz-panel__actions">
            <button type="button" class="quiz-btn quiz-btn--blue-outline js-restart-btn">Volver a empezar</button>
            <button type="button" class="quiz-btn quiz-btn--primary" id="btnMatchFinish">Finalizar</button>
          </div>
        </div>
      </div>
    `;

    sectionMatch.querySelectorAll(".match-card__img").forEach((img) => {
      img.addEventListener("error", () => img.classList.add("is-placeholder"));
    });

    sectionMatch.querySelectorAll(".match-card").forEach((card) => {
      // marca/desmarca votos
      card.addEventListener("click", () => {
        const id = card.dataset.subId;
        if (state.subcategoryVotes[id]) {
          delete state.subcategoryVotes[id];
        } else {
          state.subcategoryVotes[id] = (state.subcategoryVotes[id] || 0) + 1;
        }
        persistState();
        renderMatch();
      });
    });

    document.getElementById("matchPrev")?.addEventListener("click", () => {
      state.matchPage -= 1;
      persistState();
      renderMatch();
    });

    document.getElementById("matchNext")?.addEventListener("click", () => {
      state.matchPage += 1;
      persistState();
      renderMatch();
    });

    document.getElementById("btnMatchFinish").addEventListener("click", () => {
      renderResults();
      setStep(3);
    });

    bindRestart();
  }

  /* ==========================================================================
     9. Render — MI TOP 3
     ========================================================================== */

  function renderResults() {
    // guarda las 3 categorias mas votadas
    const topSubs = getTopSubcategories(3);

    if (topSubs.length === 0) {
      sectionResults.innerHTML = `
        <div class="quiz-panel quiz-panel--results">
          <p class="results-thanks-sub inter-regular">No seleccionaste imágenes en la segunda sección. Vuelve atrás o empieza de nuevo.</p>
          <button type="button" class="quiz-btn quiz-btn--outline js-restart-btn last-button">Volver a empezar</button>
        </div>
      `;
      bindRestart();
      return;
    }

    const podiumOrder = [3, 2, 1];
    // creamos el podium
    const podiumHtml = podiumOrder
      .map((rank) => {
        const item = topSubs.find((t) => t.rank === rank);
        if (!item) return "";
        const heightClass =
          rank === 1 ? "podium-card--first" : rank === 2 ? "podium-card--second" : "podium-card--third";
        return `
        <article class="podium-card ${heightClass}">
          <span class="podium-card__rank">Top ${rank}</span>
          <h3 class="podium-card__title">${item.subNombre}</h3>
          <p class="podium-card__cat">${item.catNombre}</p>
        </article>
      `;
      })
      .join("");

    // recoge referentes de las subcategorías ganadoras
    const artists = collectArtistsFromRanks(topSubs, getResultsArtistRanks());
    const artistsHtml = artists
      .map(
        (ref) => `
      <li class="artist-row">
        <img
          class="artist-row__photo"
          src="${referenteImgSrc(ref.slug)}"
          alt=""
          width="200"
          height="auto"
          loading="lazy"
          data-fallback="${ref.nombre.charAt(0).replace(/"/g, "")}"
        />
        <a
          class="artist-row__name"
          href="${ref.url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${ref.nombre}
        </a>
      </li>
    `
      )
      .join("");

    sectionResults.innerHTML = `
      <div class="quiz-panel quiz-panel--results">
        <div class="results-col results-col--thanks">
          <h3 class="results-thanks arial-regular h3">Ya tienes tu . de partida</h3>
          <p class="results-thanks-sub inter-regular p-mini">
            <span>Esperamos que te haya</span><span>servido de ayuda.</span>
          </p>
        </div>
        <div class="results-graphics">
          <div class="results-col results-col--podium">
            <div class="podium">${podiumHtml}</div>
          </div>
          <div class="results-col results-col--artists">
            <h2 class="results-artists-title arial-regular h3">Referentes que vale la pena conocer:</h2>
            <ul class="results-artists-list">${artistsHtml}</ul>
            <div class="results-actions">
              <a class="quiz-btn quiz-btn--outline" href="www.html">Explorar la biblioteca</a>
              <button type="button" class="quiz-btn quiz-btn--outline js-restart-btn">Volver a empezar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    sectionResults.querySelectorAll(".artist-row__photo").forEach((img) => {
      img.addEventListener("error", () => {
        const span = document.createElement("span");
        span.className = "artist-row__fallback";
        span.textContent = img.dataset.fallback || "?";
        img.replaceWith(span);
      });
    });

    bindRestart();
  }

  /* ==========================================================================
     10. Reinicio e inicialización
     ========================================================================== */

  function bindRestart() {
    document.querySelectorAll(".js-restart-btn:not([data-restart-bound])").forEach((btn) => {
      btn.dataset.restartBound = "1";
      btn.addEventListener("click", resetQuizState);
    });
  }

  // carga el estado, la base de datos, pre-carga las imagenes (??) y renderiza la seccion correcta segun el estado guardado
  async function init() {
    loadStoredState();

    QUIZ_AXES.forEach((axis) => {
      if (state.sliders[axis.id] == null) state.sliders[axis.id] = 50;
    });

    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(res.status);
      state.database = await res.json();
      preloadReferenteImages(state.database);
    } catch (err) {
      console.error("No se pudo cargar la base de datos:", err);
      sectionUbicate.innerHTML =
        '<p class="quiz-error">Error al cargar data/base-de-datos.json</p>';
      return;
    }

    renderUbicate();

    if (state.step >= 2) {
      state.categoryScores = scoreCategories();
      state.filteredCategoryIds = state.categoryScores
        .slice(0, TOP_CATEGORIES_FOR_MATCH)
        .map((c) => c.id);
      prepareMatchItems();
      renderMatch();
    }

    if (state.step >= 3) renderResults();

    applySectionUI(0);
  }

  if (btnHeroMore) {
    btnHeroMore.addEventListener("click", openQuizFromHero);
  }

  window.addEventListener("resize", () => {
    if (state.step === 2) renderMatch();
    if (state.step === 3) renderResults();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
});
