/* ==========================================================================
   1. Botones — relleno izquierda → derecha (GSAP)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof gsap === "undefined") return;

  const DURATION = 0.45;
  const EASE = "power2.inOut";
  const BTN_SELECTOR = ".quiz-btn";
  const MOBILE_MQ = window.matchMedia("(max-width: 768px)");
  const buttonControllers = new WeakMap();

  function isMobileView() {
    return MOBILE_MQ.matches;
  }

  function resolveCssColor(el, customProp) {
    const raw = getComputedStyle(el).getPropertyValue(customProp).trim();
    if (!raw) return "";
    const probe = document.createElement("span");
    probe.style.color = raw;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }

  function deactivateButton(btn) {
    if (typeof btn._btnAnimate !== "function") return;
    btn._btnAnimate(false);
    btn.dataset.btnActive = "0";
  }

  document.addEventListener("click", (e) => {
    if (!isMobileView()) return;
    document.querySelectorAll(`${BTN_SELECTOR}[data-btn-active='1']`).forEach((btn) => {
      if (!btn.contains(e.target)) deactivateButton(btn);
    });
  });

  function bindButtonInteractions(btn, animateButton) {
    const prev = buttonControllers.get(btn);
    if (prev) prev.abort();

    const controller = new AbortController();
    buttonControllers.set(btn, controller);
    const opts = { signal: controller.signal };

    if (isMobileView()) {
      btn.addEventListener(
        "click",
        () => {
          document.querySelectorAll(`${BTN_SELECTOR}[data-btn-active='1']`).forEach((other) => {
            if (other !== btn) deactivateButton(other);
          });
          animateButton(true);
          btn.dataset.btnActive = "1";
        },
        opts
      );
    } else {
      btn.addEventListener("mouseenter", () => animateButton(true), opts);
      btn.addEventListener("mouseleave", () => animateButton(false), opts);
    }
  }

  function enhanceButton(btn) {
    if (btn.dataset.btnFillInit) {
      bindButtonInteractions(btn, btn._btnAnimate);
      return;
    }
    btn.dataset.btnFillInit = "1";

    let fill = btn.querySelector(".quiz-btn__fill");
    let label = btn.querySelector(".quiz-btn__label");
    const icon = btn.querySelector(".quiz-btn__icon");

    if (!label) {
      const text = btn.textContent.trim();
      btn.textContent = "";
      fill = document.createElement("span");
      fill.className = "quiz-btn__fill";
      fill.setAttribute("aria-hidden", "true");
      label = document.createElement("span");
      label.className = "quiz-btn__label";
      label.textContent = text;
      btn.append(fill, label);
    } else if (!fill) {
      fill = document.createElement("span");
      fill.className = "quiz-btn__fill";
      fill.setAttribute("aria-hidden", "true");
      btn.prepend(fill);
    }

    function getFillRestWidth() {
      return icon ? icon.offsetWidth : 0;
    }

    function setRestingState() {
      gsap.set(fill, { width: getFillRestWidth() });
      gsap.set(label, { clearProps: "color" });
      btn.dataset.btnActive = "0";
    }

    setRestingState();

    const colors = {
      rest: getComputedStyle(label).color,
      hover: resolveCssColor(btn, "--btn-text-hover"),
    };

    function animateButton(hovering) {
      gsap.killTweensOf([fill, label]);

      if (hovering) {
        gsap.to(fill, { width: "100%", duration: DURATION, ease: EASE });
        gsap.to(label, {
          color: colors.hover,
          duration: DURATION * 0.75,
          ease: EASE,
          delay: 0.08,
        });
      } else {
        gsap.to(fill, {
          width: getFillRestWidth(),
          duration: DURATION,
          ease: EASE,
        });
        gsap.to(label, {
          color: colors.rest,
          duration: DURATION * 0.75,
          ease: EASE,
          delay: 0.06,
        });
      }
    }

    btn._btnAnimate = animateButton;
    btn._btnSetResting = setRestingState;

    bindButtonInteractions(btn, animateButton);

    window.addEventListener("resize", () => {
      if (isMobileView()) {
        if (btn.dataset.btnActive !== "1") setRestingState();
      } else if (!btn.matches(":hover")) {
        setRestingState();
      }
      bindButtonInteractions(btn, animateButton);
    });
  }

  function scanButtons(root = document) {
    root.querySelectorAll(BTN_SELECTOR).forEach(enhanceButton);
  }

  scanButtons();

  MOBILE_MQ.addEventListener("change", () => {
    document.querySelectorAll(BTN_SELECTOR).forEach((btn) => {
      if (btn._btnSetResting) btn._btnSetResting();
      if (btn._btnAnimate) bindButtonInteractions(btn, btn._btnAnimate);
    });
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(BTN_SELECTOR)) enhanceButton(node);
        node.querySelectorAll?.(BTN_SELECTOR).forEach(enhanceButton);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

/* ==========================================================================
   2. Memes — rotación en el hero (index)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const mobileQuery = window.matchMedia("(max-width: 768px)");
  let intervalId = null;
  let resizeHandler = null;
  let activeIndex = 0;
  let activeContainer = null;
  let activeMemes = [];

  function getMemeContainer() {
    return mobileQuery.matches
      ? document.getElementById("heroMemesMobile")
      : document.getElementById("heroMemesDesktop");
  }

  function getMemeHeight() {
    return mobileQuery.matches ? 150 : 200;
  }

  function getMemeWidth(img, memeHeight) {
    if (!img.naturalWidth || !img.naturalHeight) return 0;
    return (img.naturalWidth / img.naturalHeight) * memeHeight;
  }

  function getMaxMemeWidth(container) {
    if (mobileQuery.matches) {
      const parent = container.closest(".intro-texts") || container.parentElement;
      return parent ? parent.clientWidth : Math.max(0, window.innerWidth - 40);
    }

    const heroRow = container.closest(".hero-logo");
    const logo = heroRow?.querySelector(".intro-logo");
    const MIN_GAP = 30;
    if (!heroRow || !logo) return Infinity;
    return Math.max(0, heroRow.clientWidth - logo.offsetWidth - MIN_GAP);
  }

  function resizeMemeBox(container, img) {
    if (!container || !img) return;
    const memeHeight = getMemeHeight();
    const naturalWidth = getMemeWidth(img, memeHeight);
    const maxWidth = getMaxMemeWidth(container);
    const width = naturalWidth ? Math.min(naturalWidth, maxWidth) : 0;

    container.style.width = mobileQuery.matches ? "100%" : `${width}px`;
    container.style.height = `${memeHeight}px`;
  }

  function showMeme(nextIndex) {
    if (!activeMemes.length) return;

    const next = activeMemes[nextIndex];
    resizeMemeBox(activeContainer, next);

    activeIndex = nextIndex;
    activeMemes.forEach((m) => m.classList.remove("active"));
    next.classList.add("active");
  }

  function stopMemeRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    activeMemes.forEach((img) => img.classList.remove("active"));
    activeContainer = null;
    activeMemes = [];
    activeIndex = 0;
  }

  function startMemeRotation() {
    stopMemeRotation();

    const container = getMemeContainer();
    if (!container) return;

    const memes = [...container.querySelectorAll("img")];
    if (!memes.length) return;

    activeContainer = container;
    activeMemes = memes;

    memes.forEach((img) => {
      const onReady = () => {
        if (img.classList.contains("active")) resizeMemeBox(container, img);
      };

      if (img.complete) onReady();
      else img.addEventListener("load", onReady, { once: true });
    });

    showMeme(0);

    intervalId = setInterval(() => {
      showMeme((activeIndex + 1) % memes.length);
    }, 2000);

    resizeHandler = () => {
      if (activeMemes[activeIndex]) resizeMemeBox(activeContainer, activeMemes[activeIndex]);
    };
    window.addEventListener("resize", resizeHandler);
  }

  startMemeRotation();
  mobileQuery.addEventListener("change", startMemeRotation);
});

/* ==========================================================================
   3. Cursor personalizado
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const dot = document.querySelector(".cursor-dot");
  if (!dot) return;

  let mouseX = 0;
  let mouseY = 0;
  let dotX = 0;
  let dotY = 0;
  let activated = false;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!activated) {
      dot.style.opacity = "1";
      activated = true;
    }
  });

  function animate() {
    dotX += (mouseX - dotX) * 0.15;
    dotY += (mouseY - dotY) * 0.15;
    dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
    requestAnimationFrame(animate);
  }

  animate();
});

/* ==========================================================================
   4. Menú desplegable
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menuButton");
  const menuPanel = document.getElementById("menuPanel");
  const dots = document.querySelectorAll(".menu-button .dot");

  if (!menuButton || !menuPanel) return;

  let menuOpen = false;
  let menuTween = null;

  function setDotsActive(active) {
    dots.forEach((dot) => dot.classList.toggle("white", active));
  }

  function setMenuOpen(open) {
    if (open === menuOpen) return;

    menuOpen = open;
    menuTween?.kill();
    setDotsActive(open);

    const menuItems = menuPanel.querySelectorAll("li");

    if (typeof gsap !== "undefined") {
      if (open) {
        menuPanel.style.pointerEvents = "auto";
        menuTween = gsap.timeline();
        menuTween
          .fromTo(
            menuPanel,
            { opacity: 0, x: 18 },
            { opacity: 1, x: 0, duration: 0.55, ease: "power2.out" }
          )
          .fromTo(
            menuItems,
            { opacity: 0, x: 10 },
            {
              opacity: 1,
              x: 0,
              duration: 0.4,
              stagger: 0.055,
              ease: "power2.out",
            },
            "-=0.32"
          );
        return;
      }

      menuTween = gsap.timeline({
        onComplete: () => {
          gsap.set(menuItems, { clearProps: "opacity,transform" });
          menuPanel.style.pointerEvents = "none";
        },
      });
      menuTween
        .to(menuItems, {
          opacity: 0,
          x: 6,
          duration: 0.18,
          stagger: 0.025,
          ease: "power2.in",
        })
        .to(
          menuPanel,
          { opacity: 0, x: 14, duration: 0.38, ease: "power2.inOut" },
          "-=0.05"
        );
      return;
    }

    menuPanel.classList.toggle("active", open);
  }

  if (typeof gsap !== "undefined") {
    gsap.set(menuPanel, { opacity: 0, x: 18, pointerEvents: "none" });
  }

  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  });

  menuPanel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    if (menuOpen) setMenuOpen(false);
  });
});

/* ==========================================================================
   5. WWW — columnas de categorías y preview de referentes
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const colCats = document.getElementById("col-cats");
  if (!colCats) return;

  let DATA = [];
  let activeCat = null;
  let activeSub = null;

  function referenteImgSrc(slug) {
    return `./www-assets/img/${slug}.jpg`;
  }

  function isMobileWww() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function hasWwwImagePreview() {
    return window.matchMedia("(min-width: 1200px)").matches;
  }

  function colHeading(text) {
    return isMobileWww() ? `<p class="col-label">${text}</p>` : "";
  }

  function syncEmptyCols() {
    document.querySelectorAll(".wrap .col").forEach((col) => {
      col.classList.toggle("is-empty", col.childElementCount === 0);
    });
  }

  function scrollToWwwCol(id) {
    if (!isMobileWww()) return;
    const el = document.getElementById(id);
    if (!el || el.classList.contains("is-empty")) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCats() {
    const el = document.getElementById("col-cats");
    if (!el) return;

    el.innerHTML =
      colHeading("Categorías") +
      DATA.map(
        (cat) => `
      <div class="item ${activeCat === cat.id ? "active" : ""}" data-cat="${cat.id}">
        ${cat.categoria}
      </div>
    `
      ).join("");

    el.querySelectorAll(".item").forEach((item) => {
      item.addEventListener("click", () => {
        activeCat = item.dataset.cat;
        activeSub = null;
        renderCats();
        renderSubs();
        renderRefs();
        scrollToWwwCol("col-subs");
      });
    });

    syncEmptyCols();
  }

  function renderSubs() {
    const el = document.getElementById("col-subs");
    if (!el) return;

    if (!activeCat) {
      el.innerHTML = "";
      syncEmptyCols();
      return;
    }

    const cat = DATA.find((c) => c.id === activeCat);

    el.innerHTML =
      colHeading("Subcategorías") +
      cat.subcategorias
        .map(
          (sub) => `
      <div class="item ${activeSub === sub.id ? "active" : ""}" data-sub="${sub.id}">
        ${sub.nombre}
      </div>
    `
        )
        .join("");

    el.querySelectorAll(".item").forEach((item) => {
      item.addEventListener("click", () => {
        activeSub = item.dataset.sub;
        renderSubs();
        renderRefs();
        scrollToWwwCol("col-refs");
      });
    });

    syncEmptyCols();
  }

  function renderRefs() {
    const el = document.getElementById("col-refs");
    const imgCol = document.getElementById("col-img");
    if (!el) return;

    if (!activeCat || !activeSub) {
      el.innerHTML = "";
      if (imgCol) imgCol.innerHTML = "";
      syncEmptyCols();
      return;
    }

    const cat = DATA.find((c) => c.id === activeCat);
    const sub = cat.subcategorias.find((s) => s.id === activeSub);

    el.innerHTML =
      colHeading("Referentes") +
      sub.referentes
        .map(
          (ref) => `
      <div class="referente-row" data-ref="${ref.slug}" data-url="${ref.url}">
        <span class="referente-name">${ref.nombre}</span>
      </div>
    `
        )
        .join("");

    el.querySelectorAll(".referente-row").forEach((row) => {
      row.addEventListener("click", () => {
        const url = row.dataset.url;
        if (url) window.open(url, "_blank");
      });
    });

    syncEmptyCols();
  }

  function showReferentePreview(row) {
    if (!hasWwwImagePreview()) return;

    const imgCol = document.getElementById("col-img");
    if (!imgCol) return;

    const slug = row.dataset.ref;
    const current = imgCol.querySelector("img");
    if (current && current.dataset.slug === slug) return;

    imgCol.innerHTML = "";
    const img = document.createElement("img");
    img.dataset.slug = slug;
    img.src = referenteImgSrc(slug);
    img.alt = slug;
    imgCol.appendChild(img);

    const reveal = () => {
      requestAnimationFrame(() => img.classList.add("is-visible"));
    };

    if (img.complete) reveal();
    else img.addEventListener("load", reveal, { once: true });

    syncEmptyCols();
  }

  function bindRefsPreview() {
    const el = document.getElementById("col-refs");
    const imgCol = document.getElementById("col-img");
    if (!el || !imgCol || el.dataset.previewBound) return;

    el.dataset.previewBound = "1";
    let hidePreviewTimer;

    el.addEventListener("mouseover", (e) => {
      if (!hasWwwImagePreview()) return;
      const row = e.target.closest(".referente-row");
      if (!row || !el.contains(row)) return;
      clearTimeout(hidePreviewTimer);
      showReferentePreview(row);
    });

    el.addEventListener("mouseout", (e) => {
      if (!hasWwwImagePreview()) return;
      const related = e.relatedTarget;
      if (related instanceof Node && el.contains(related)) return;

      hidePreviewTimer = setTimeout(() => {
        imgCol.innerHTML = "";
        syncEmptyCols();
      }, 40);
    });
  }

  async function loadData() {
    try {
      const response = await fetch("./data/base-de-datos.json");
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      DATA = await response.json();
      bindRefsPreview();
      renderCats();
    } catch (error) {
      console.error("Error cargando la base de datos:", error);
    }
  }

  loadData();
});

/* ==========================================================================
   6. Ayuda — formulario de colaboración
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const colabForm = document.getElementById("colabForm");
  if (!colabForm) return;

  colabForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!colabForm.reportValidity()) return;

    colabForm.hidden = true;
    const thanks = document.getElementById("colabThanks");
    if (thanks) thanks.hidden = false;
  });
});
