(function () {
  const STORAGE_KEY = "punto-de-partida-intro-done";
  const CAPTCHA_ANSWERS = [".de partida", ". de partida"];
  const INTRO_HOLD_MS = 2200;

  const loader = document.getElementById("siteLoader");
  if (!loader) return;

  let introStarted = false;

  function normalizeAnswer(value) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isCorrectAnswer(value) {
    const normalized = normalizeAnswer(value);
    return CAPTCHA_ANSWERS.some((answer) => normalizeAnswer(answer) === normalized);
  }

  function removeLoader() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    loader.remove();
    document.body.classList.remove("is-loading");
  }

  function finishLoading() {
    if (typeof gsap !== "undefined") {
      gsap.to(loader, {
        opacity: 0,
        duration: 0.85,
        ease: "power2.inOut",
        onComplete: removeLoader,
      });
      return;
    }

    loader.style.transition = "opacity 0.85s ease";
    loader.style.opacity = "0";
    loader.addEventListener("transitionend", removeLoader, { once: true });
  }

  function showIntro() {
    if (introStarted) return;
    introStarted = true;

    const captchaPanel = document.getElementById("loaderCaptcha");
    const introPanel = document.getElementById("loaderIntro");

    if (!captchaPanel || !introPanel) {
      removeLoader();
      return;
    }

    const revealIntro = () => {
      captchaPanel.hidden = true;
      introPanel.hidden = false;

      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          introPanel,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            onComplete: () => setTimeout(finishLoading, INTRO_HOLD_MS),
          }
        );
        return;
      }

      introPanel.style.opacity = "1";
      introPanel.style.transform = "none";
      setTimeout(finishLoading, INTRO_HOLD_MS);
    };

    if (typeof gsap !== "undefined") {
      gsap.to(captchaPanel, {
        opacity: 0,
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: revealIntro,
      });
      return;
    }

    captchaPanel.style.opacity = "0";
    setTimeout(revealIntro, 550);
  }

  function initLoader() {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      removeLoader();
      return;
    }

    const form = document.getElementById("captchaForm");
    const input = document.getElementById("captchaInput");
    const error = document.getElementById("captchaError");

    if (!form || !input) {
      removeLoader();
      return;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (isCorrectAnswer(input.value)) {
        if (error) error.hidden = true;
        showIntro();
        return;
      }

      if (error) error.hidden = false;
      input.focus();
      input.select();

      if (typeof gsap !== "undefined") {
        gsap.fromTo(input, { x: -6 }, { x: 0, duration: 0.35, ease: "power2.out" });
      }
    });

    input.focus();
  }

  initLoader();
})();
