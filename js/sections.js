/**
 * Este video me ha ayudado un poco a saber como funciona un quiz:
 * https://pablomonteserin.com/curso/javascript/como-hacer-un-trivial/
**/

// Encuesta . de partida — UBÍCATE → DAME UN MATCH → MI TOP 3
(function () {

  // aquí creo unas constantes como las variables de un CSS
  const STORAGE_KEY = "punto-de-partida-quiz-v1"; // aqui guardo los valores de cada sesión 
  const DATA_URL = "data/base-de-datos.json";
  const IMG_BASE = "www-assets/img/";

  // guardamos todo lo que haga el usuario
  const state = {
    step: 1,                  // la fase del quiz en la que se encuentra
    sliders: {},
    categoryScores: [],       // puntuacion calculada de cada apartado
    filteredCategoryIds: [],  // categorias seleccionadas para pasar a la segunda fase
    matchPage: 0,             // pagina actual del carrusel de imagenes
    subcategoryVotes: {},     // votos de cada imagen
    database: [],             // datos del json
  };

  const sectionUbicate = document.querySelector(".ubicate .sections-content");
  const sectionMatch = document.querySelector(".dame-un-match .sections-content");
  const sectionResults = document.querySelector(".resultados .sections-content");
  const sectionEls = document.querySelectorAll(".sections section");
  const btnHeroMore = document.getElementById("btnHeroMore");

  let uiStep = 0;
  let heroCompact = false;
  let heroTl = null;

  const HERO_DURATION = 0.45;
  const LOGO_COMPACT_LEFT = 50;

  function getLogoCompactWidth() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--logo-compact-w");
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 130;
  }

  function getLogoCompactTop() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--logo-compact-top");
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 45;
  }

  function getLogoCompactLeft() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--page-gutter");
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 20;
  }

  function getHeroExitY() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--hero-exit-y");
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : -430;
  }

  function isMobileView() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function getMatchPageSize() {
    return isMobileView() ? 9 : MATCH_PAGE_SIZE;
  }

  // compacta el logo, mueve el contenido hacia arriba y crea la transicion inicial
  // lo animamos con un timeline
  function enterHeroTransition() {
    if (heroCompact || typeof gsap === "undefined") return;

    const memes = document.querySelector(".hero-logo .memes-animation");
    const heroContent = document.querySelector(".hero-content");
    const heroLogoWrap = document.querySelector(".hero-logo");
    const logo = document.querySelector(".intro-logo");

    if (!memes || !heroContent || !logo || !heroLogoWrap) return;

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

  // carga el ultimo estado si el usuario recarga la página
  function loadStoredState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      Object.assign(state, {
        step: saved.step || 1,
        sliders: saved.sliders || {},
        subcategoryVotes: saved.subcategoryVotes || {},
        matchPage: saved.matchPage || 0,
      });
    } catch (_) {
      /* ignorar */
    }
  }

  // guarda los parametros que hemos clasificado antes
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

  // los valores de los sliders serán menores o mayores de 50 (la mitad)
  function normalizeSlider(value) {
    return (Number(value) - 50) / 50;
  }

  // utiliza los ejes del usuario para calcular qué categorías encajan mejor
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
      .sort((a, b) => b.score - a.score);
  }

  // devuelve todas las subcategorías pertenecientes a las categorías mejor puntuadas
  function getFilteredSubcategories() {
    // creo un set con las categorias filtradas (los ids) y luego creamos un array con estas
    const ids = new Set(state.filteredCategoryIds);
    const list = [];

    // recorro toda la base de datos
    state.database.forEach((cat) => {
      // filtrar solo las categorias relevantes
      if (!ids.has(cat.id)) return;
      // ahora recorremos las subcategorias de las categorias seleccionadas
      cat.subcategorias.forEach((sub) => {
        // limpiar cada subcategoria para luego completarla con cada respuesta
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

  function referenteImgSrc(slug) {
    return `${IMG_BASE}${slug}.jpg`;
  }

  // precargo las imagenes de la base de datos
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

  function applySectionUI(step) {
    uiStep = step;

    sectionEls.forEach((el, i) => {
      const index = i + 1;
      const shouldOpen = step > 0 && index === step;
      const shouldDone = step > 0 && index < step;

      el.classList.toggle("is-open", shouldOpen);
      el.classList.toggle("is-done", shouldDone);
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

  // --- EMPEZAMOS CON EL QUIZ --- //
  // abrimos el primer apartado del quiz "ubícate"
  function openQuizFromHero() {
    const target = Math.max(1, state.step);
    setStep(target);
  }

  // escribimos el contenido de la primera seccion
  function renderUbicate() {
    const slidersHtml = QUIZ_AXES.map(
      (axis) => `
      <div class="quiz-slider" data-axis="${axis.id}">
        <div class="quiz-slider__labels">
          <span class="h1 arial-regular">${axis.left}</span>
          <span class="h1 arial-regular">${axis.right}</span>
        </div>
        <div class="quiz-slider__track">
          <input
            type="range"
            min="0"
            max="100"
            value="${state.sliders[axis.id] ?? 50}"
            aria-label="${axis.left} — ${axis.right}"
          />
        </div>
      </div>
    `
    ).join("");

    sectionUbicate.innerHTML = `
      <div class="quiz-panel quiz-panel--ubicate">
        <p class="quiz-panel__hint arial-regular h3">¿Qué prefieres…</p>
        <div class="quiz-sliders">${slidersHtml}</div>
        <div class="quiz-panel__actions">
          <button type="button" class="quiz-btn quiz-btn--primary" id="btnUbicateNext">Siguiente</button>
        </div>
      </div>
    `;

    sectionUbicate.querySelectorAll('input[type="range"]').forEach((input) => {
      const axisId = input.closest(".quiz-slider").dataset.axis;
      updateSliderFill(input);

      input.addEventListener("input", () => {
        state.sliders[axisId] = input.value;
        updateSliderFill(input);
        persistState();
      });
    });

    // al hacer flick en finalizar cambiaremos de seccion
    document.getElementById("btnUbicateNext").addEventListener("click", () => {
      state.categoryScores = scoreCategories();
      state.filteredCategoryIds = state.categoryScores
        .slice(0, TOP_CATEGORIES_FOR_MATCH)
        .map((c) => c.id);
      state.matchPage = 0;
      renderMatch();
      setStep(2);
    });
  }

  function updateSliderFill(input) {
    const pct = input.value;
    input.style.setProperty("--value", `${pct}%`);
  }

  // escribimos el contenido de la segunda seccion
  function renderMatch() {
    const subs = getFilteredSubcategories();
    // las paginas de la seccion "dame un match"
    const totalPages = Math.max(1, Math.ceil(subs.length / getMatchPageSize()));
    if (state.matchPage >= totalPages) state.matchPage = totalPages - 1;
    if (state.matchPage < 0) state.matchPage = 0;

    const pageSize = getMatchPageSize();
    const pageItems = subs.slice(
      state.matchPage * pageSize,
      state.matchPage * pageSize + pageSize
    );

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
          <p style="display:flex;flex-direction:column;gap:20px;">Vale, ahora toca ver si nuestras almas visuales hacen clic. Selecciona las imágenes que te enciendan una chispa, te remuevan algo o simplemente te hagan decir «uff, esto soy yo».</span> <span>No hay respuestas correctas, solo tu instinto.</span></p>

          <div class="quiz-panel__actions">
            <button type="button" class="quiz-btn quiz-btn--blue-outline js-restart-btn">Empezar de 0</button>
            <button type="button" class="quiz-btn quiz-btn--primary" id="btnMatchFinish">Finalizar</button>
          </div>
        </div>
      </div>
    `;

    sectionMatch.querySelectorAll(".match-card__img").forEach((img) => {
      img.addEventListener("error", () => img.classList.add("is-placeholder"));
    });

    sectionMatch.querySelectorAll(".match-card").forEach((card) => {
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

    const prev = document.getElementById("matchPrev");
    const next = document.getElementById("matchNext");
    if (prev) {
      prev.addEventListener("click", () => {
        state.matchPage -= 1;
        persistState();
        renderMatch();
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        state.matchPage += 1;
        persistState();
        renderMatch();
      });
    }

    document.getElementById("btnMatchFinish").addEventListener("click", () => {
      renderResults();
      setStep(3);
    });
    bindRestart();
  }

  // guardamos las 3 subcategorias mas votadas para crear el ranking
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

  function isMobileResults() {
    return window.matchMedia("(max-width: 900px)").matches;
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

  // renderizamos los resultados
  function renderResults() {
    const topSubs = getTopSubcategories(3);

    if (topSubs.length === 0) {
      sectionResults.innerHTML = `
        <div class="quiz-panel quiz-panel--results">
          <p class="results-thanks inter-regular">¡Gracias por rellenar la encuesta!</p>
          <p class="results-thanks-sub inter-regular">No seleccionaste imágenes en la segunda sección. Vuelve atrás o empieza de nuevo.</p>
          <button type="button" class="quiz-btn quiz-btn--blue-outline js-restart-btn">Empezar de 0</button>
        </div>
      `;
      bindRestart();
      return;
    }

    const podiumOrder = [3, 2, 1];
    const podiumHtml = podiumOrder
      .map((rank) => {
        const item = topSubs.find((t) => t.rank === rank);
        if (!item) return "";
        const heightClass = rank === 1 ? "podium-card--first" : rank === 2 ? "podium-card--second" : "podium-card--third";
        return `
        <article class="podium-card ${heightClass}">
          <span class="podium-card__rank">Top ${rank}</span>
          <h3 class="podium-card__title">${item.subNombre}</h3>
          <p class="podium-card__cat">${item.catNombre}</p>
        </article>
      `;
      })
      .join("");

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
          <p class="results-thanks arial-regular h1"><span>¡Gracias por rellenar</span><span>la encuesta!</span></p>
          <p class="results-thanks-sub arial-regular h3"><span>Esperamos que te haya</span><span>servido de ayuda.</span></p>
        </div>
        <div class="results-graphics">
          <div class="results-col results-col--podium">
            <div class="podium">${podiumHtml}</div>
          </div>
          <div class="results-col results-col--artists">
            <h2 class="results-artists-title arial-regular h3">Lxs siguientes artistas podrían gustarte:</h2>
            <ul class="results-artists-list">${artistsHtml}</ul>
            <div class="results-actions">
              <a class="quiz-btn quiz-btn--outline" href="www.html">Ver todas las referencias</a>
              <button type="button" class="quiz-btn quiz-btn--outline js-restart-btn">Empezar de 0</button>
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

  // Busca todos los botones .js-restart-btn y limpia todo al hacer click sobre ellos
  function bindRestart() {
    const buttons = document.querySelectorAll(".js-restart-btn");
    
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        sessionStorage.removeItem(STORAGE_KEY);
        state.step = 1;
        state.sliders = {};
        state.categoryScores = [];
        state.filteredCategoryIds = [];
        state.matchPage = 0;
        state.subcategoryVotes = {};
        renderUbicate();
        applySectionUI(0);
        persistState();
      });
    });
  }

  // carga la base de datos y pre-carga las imagenes
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
      renderMatch();
    }
    if (state.step >= 3) renderResults();

    applySectionUI(0);
  }

  // al hacer click sobre el boton del hero, iniciamos el quiz
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
})();
