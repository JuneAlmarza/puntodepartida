// ANIMACIÓN MEMES
document.addEventListener("DOMContentLoaded", () => {
    const memes = document.querySelectorAll(".memes-animation img");
    let index = 0;

    // Oculta todos
    memes.forEach(m => m.classList.remove("active"));

    // Muestra el primero
    memes[0].classList.add("active");

    setInterval(() => {
        // Oculta el actual
        memes[index].classList.remove("active");

        // Avanza al siguiente
        index = (index + 1) % memes.length;

        // Muestra el nuevo
        memes[index].classList.add("active");

    }, 1000); // cambia cada 2 segundos (ajusta si quieres)
});

// ANIMACIÓN DEL CURSOR
document.addEventListener("DOMContentLoaded", () => {
    const dot = document.querySelector(".cursor-dot");

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;

    let activated = false;

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!activated) {
            dot.style.opacity = 1;
            activated = true;
        }
    });

    function animate() {
        // Movimiento suave (lerp)
        dotX += (mouseX - dotX) * 0.15;
        dotY += (mouseY - dotY) * 0.15;

        dot.style.transform = `translate(${dotX}px, ${dotY}px)`;

        requestAnimationFrame(animate);
    }

    animate();
});

// ANIMACIÓN DEL MENÚ DESPLEGABLE
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("menuButton");
    const menuPanel = document.getElementById("menuPanel");
    const dots = document.querySelectorAll(".menu-button .dot");

    menuButton.addEventListener("click", () => {
        menuPanel.classList.toggle("active");

        // Cambiar color de los dots
        dots.forEach(dot => {
            dot.classList.toggle("white");
        });
    });
});

// COLUMNAS DE CATEGORIAS
document.addEventListener("DOMContentLoaded", () => {
  let DATA = [];

  let activeCat = null;
  let activeSub = null;

  async function loadData() {
    const colCats = document.getElementById("col-cats");
    if (!colCats) return;

    try {
      const response = await fetch("./data/base-de-datos.json");

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      DATA = await response.json();

      bindRefsPreview();
      renderCats();
    } catch (error) {
      console.error("Error cargando la base de datos:", error);
    }
  }

  function renderCats() {
    const el = document.getElementById("col-cats");
    if (!el) return;

    el.innerHTML = DATA.map(cat => `
      <div
        class="item ${activeCat === cat.id ? "active" : ""}"
        data-cat="${cat.id}"
      >
        ${cat.categoria}
      </div>
    `).join("");

    el.querySelectorAll(".item").forEach(item => {
      item.addEventListener("click", () => {
        activeCat = item.dataset.cat;
        activeSub = null;

        renderCats();
        renderSubs();
        renderRefs();
      });
    });
  }

  function renderSubs() {
    const el = document.getElementById("col-subs");
    if (!el) return;

    if (!activeCat) {
      el.innerHTML = "";
      return;
    }

    const cat = DATA.find(c => c.id === activeCat);

    el.innerHTML = cat.subcategorias.map(sub => `
      <div
        class="item ${activeSub === sub.id ? "active" : ""}"
        data-sub="${sub.id}"
      >
        ${sub.nombre}
      </div>
    `).join("");

    el.querySelectorAll(".item").forEach(item => {
      item.addEventListener("click", () => {
        activeSub = item.dataset.sub;

        renderSubs();
        renderRefs();
      });
    });
  }

  function renderRefs() {
      const el = document.getElementById("col-refs");
      const imgCol = document.getElementById("col-img");
      if (!el || !imgCol) return;

      if (!activeCat || !activeSub) {
          el.innerHTML = "";
          imgCol.innerHTML = "";
          return;
      }

      const cat = DATA.find(c => c.id === activeCat);
      const sub = cat.subcategorias.find(s => s.id === activeSub);

      el.innerHTML = sub.referentes.map(ref => `
          <div class="referente-row"
              data-ref="${ref.slug}"
              data-url="${ref.url}">
              <span class="referente-name">${ref.nombre}</span>
          </div>
      `).join("");

      el.querySelectorAll(".referente-row").forEach((row) => {
          row.addEventListener("click", () => {
              const url = row.dataset.url;
              if (url) window.open(url, "_blank");
          });
      });
  }

  function bindRefsPreview() {
      const el = document.getElementById("col-refs");
      const imgCol = document.getElementById("col-img");
      if (!el || !imgCol || el.dataset.previewBound) return;

      el.dataset.previewBound = "1";
      let hidePreviewTimer;

      function showPreview(row) {
          clearTimeout(hidePreviewTimer);
          const slug = row.dataset.ref;
          const src = `./www-assets/img/${slug}.jpg`;

          const current = imgCol.querySelector("img");
          if (current && current.dataset.slug === slug) return;

          imgCol.innerHTML = "";
          const img = document.createElement("img");
          img.dataset.slug = slug;
          img.src = src;
          img.alt = slug;
          imgCol.appendChild(img);

          const reveal = () => {
              requestAnimationFrame(() => img.classList.add("is-visible"));
          };

          if (img.complete) {
              reveal();
          } else {
              img.addEventListener("load", reveal, { once: true });
          }
      }

      el.addEventListener("mouseover", (e) => {
          const row = e.target.closest(".referente-row");
          if (!row || !el.contains(row)) return;
          showPreview(row);
      });

      el.addEventListener("mouseout", (e) => {
          const related = e.relatedTarget;
          if (related instanceof Node && el.contains(related)) return;

          hidePreviewTimer = setTimeout(() => {
              imgCol.innerHTML = "";
          }, 40);
      });
}

const colabForm = document.getElementById("colabForm");
if (colabForm) {
  colabForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!colabForm.reportValidity()) return;

    colabForm.hidden = true;
    const thanks = document.getElementById("colabThanks");
    if (thanks) thanks.hidden = false;
  });
}

loadData();
});