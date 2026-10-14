(function () {
  "use strict";

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById("preloader");
  const inicio = Date.now();
  function ocultarPreloader() {
    const restante = Math.max(0, 600 - (Date.now() - inicio));
    setTimeout(() => preloader && preloader.classList.add("oculto"), restante);
  }
  window.addEventListener("load", ocultarPreloader);
  setTimeout(ocultarPreloader, 3500);

  document.addEventListener("DOMContentLoaded", () => {

    /* ---------- Navbar: fondo al hacer scroll ---------- */
    const nav = document.getElementById("nav");
    const marcarNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
    marcarNav();
    window.addEventListener("scroll", marcarNav, { passive: true });

    /* ---------- Menú móvil ---------- */
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    toggle.addEventListener("click", () => {
      const abierto = menu.classList.toggle("abierto");
      toggle.setAttribute("aria-expanded", String(abierto));
      toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
      toggle.innerHTML = abierto
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        menu.classList.remove("abierto");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menú");
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });

    /* ---------- Scroll reveal ---------- */
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    const observar = () => document.querySelectorAll("[data-reveal]:not(.visible)").forEach((el) => io.observe(el));
    observar();
    document.addEventListener("menu:listo", observar);

    /* ---------- Slider del hero ---------- */
    (function slider() {
      const slides = [...document.querySelectorAll(".hero__slide")];
      const dots = document.getElementById("heroDots");
      const prev = document.getElementById("heroPrev");
      const next = document.getElementById("heroNext");
      if (slides.length < 2) return;

      let i = 0;
      let timer;

      slides.forEach((_, idx) => {
        const d = document.createElement("button");
        d.setAttribute("aria-label", "Ir a la imagen " + (idx + 1));
        if (idx === 0) d.classList.add("is-active");
        d.addEventListener("click", () => ir(idx, true));
        dots.appendChild(d);
      });

      function ir(n, reinicia) {
        slides[i].classList.remove("is-active");
        dots.children[i].classList.remove("is-active");
        i = (n + slides.length) % slides.length;
        slides[i].classList.add("is-active");
        dots.children[i].classList.add("is-active");
        if (reinicia) arrancar();
      }
      function arrancar() {
        clearInterval(timer);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => ir(i + 1), 5500);
      }

      prev.addEventListener("click", () => ir(i - 1, true));
      next.addEventListener("click", () => ir(i + 1, true));
      const hero = document.querySelector(".hero");
      hero.addEventListener("mouseenter", () => clearInterval(timer));
      hero.addEventListener("mouseleave", arrancar);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearInterval(timer);
        else arrancar();
      });
      arrancar();
    })();

    /* ---------- Carrusel de destacados ---------- */
    (function carrusel() {
      const pista = document.getElementById("carruselDestacados");
      const prev = document.getElementById("carPrev");
      const next = document.getElementById("carNext");
      if (!pista) return;
      const paso = () => Math.min(pista.clientWidth * 0.8, 640);
      prev.addEventListener("click", () => pista.scrollBy({ left: -paso(), behavior: "smooth" }));
      next.addEventListener("click", () => pista.scrollBy({ left: paso(), behavior: "smooth" }));
    })();

    /* ---------- Volver arriba ---------- */
    const arriba = document.getElementById("volverArriba");
    window.addEventListener("scroll", () => {
      arriba.classList.toggle("visible", window.scrollY > 600);
    }, { passive: true });
    arriba.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  });
})();
