(function () {
  "use strict";

  const API = window.CAFE14_API || "";
  const cont = document.getElementById("productos");
  const filtros = document.getElementById("filtros");
  const estado = document.getElementById("menuEstado");
  const carrusel = document.getElementById("carruselDestacados");

  const soles = (n) =>
    "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const esc = (t) => {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  const IMG_FALLBACK =
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80";

  function skeletons(n) {
    let html = "";
    for (let i = 0; i < n; i++) {
      html += `<article class="carta carta--skel">
        <div class="sk sk-foto"></div>
        <div class="sk sk-linea"></div>
        <div class="sk sk-linea"></div>
        <div class="sk sk-linea corta"></div>
        <div class="sk sk-pie"></div>
      </article>`;
    }
    cont.innerHTML = html;
  }

  function tarjeta(p) {
    const img = p.imagenUrl && p.imagenUrl.trim() ? esc(p.imagenUrl) : IMG_FALLBACK;
    const badge = p.etiqueta ? `<span class="carta__badge">${esc(p.etiqueta)}</span>` : "";
    const agotado = p.disponible === false ? `<div class="carta__agotado">Hoy no</div>` : "";
    return `<article class="carta" data-slug="${esc(p.seccionSlug || "")}">
      <div class="carta__foto">
        ${badge}
        <img src="${img}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
        ${agotado}
      </div>
      <div class="carta__cuerpo">
        <span class="carta__seccion">${esc(p.seccionNombre || "")}</span>
        <h3 class="carta__nombre">${esc(p.nombre)}</h3>
        <p class="carta__desc">${esc(p.descripcion || "")}</p>
        <div class="carta__pie">
          <div class="carta__precio"><small>PRECIO</small><strong>${soles(p.precio)}</strong></div>
          <span class="carta__disponibilidad">${p.disponible === false ? "No disponible" : "Disponible"}</span>
        </div>
      </div>
    </article>`;
  }

  function itemCarrusel(p) {
    const img = p.imagenUrl && p.imagenUrl.trim() ? esc(p.imagenUrl) : IMG_FALLBACK;
    return `<div class="carrusel__item">
      <article class="carta" data-slug="${esc(p.seccionSlug || "")}">
        <div class="carta__foto">
          <span class="carta__badge">${esc(p.etiqueta || "TOP")}</span>
          <img src="${img}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
        </div>
        <div class="carta__cuerpo">
          <span class="carta__seccion">${esc(p.seccionNombre || "")}</span>
          <h3 class="carta__nombre">${esc(p.nombre)}</h3>
          <div class="carta__pie">
            <div class="carta__precio"><small>PRECIO</small><strong>${soles(p.precio)}</strong></div>
            <span class="carta__disponibilidad">${p.disponible === false ? "No disponible" : "Disponible"}</span>
          </div>
        </div>
      </article>
    </div>`;
  }

  function pintarFiltros(secciones) {
    secciones
      .filter((s) => s.activa !== false)
      .forEach((s) => {
        const b = document.createElement("button");
        b.className = "filtros__btn";
        b.dataset.slug = s.slug;
        b.textContent = s.nombre;
        b.setAttribute("aria-pressed", "false");
        filtros.appendChild(b);
      });

    filtros.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      filtros.querySelectorAll("button").forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
      b.classList.add("is-active");
      b.setAttribute("aria-pressed", "true");
      const slug = b.dataset.slug;
      cont.querySelectorAll(".carta").forEach((c) => {
        c.style.display = slug === "todos" || c.dataset.slug === slug ? "" : "none";
      });
    });
  }

  function pintarDestacados(productos) {
    let top = productos.filter((p) => /m[aá]s pedido|favorito|top/i.test(p.etiqueta || ""));
    if (top.length < 4) top = productos.slice(0, 8);
    carrusel.innerHTML = top.map(itemCarrusel).join("");
  }

  function mostrarError() {
    estado.className = "menu-estado menu-estado--error";
    estado.innerHTML =
      `<i class="fa-solid fa-triangle-exclamation"></i> No pudimos cargar la carta.` +
      `<br><button type="button" id="reintentar">Reintentar</button>`;
    estado.hidden = false;
    cont.innerHTML = "";
    document.getElementById("reintentar").addEventListener("click", cargar);
  }

  async function cargar() {
    estado.hidden = true;
    carrusel.replaceChildren();
    skeletons(8);
    try {
      const [rSec, rProd] = await Promise.all([
        fetch(`${API}/api/catalogo/secciones`),
        fetch(`${API}/api/catalogo/productos`),
      ]);
      if (!rSec.ok || !rProd.ok) throw new Error("respuesta no válida");
      const secciones = await rSec.json();
      const todosProductos = await rProd.json();
      const activas = new Set(secciones.filter((s) => s.activa).map((s) => s.id));
      const productos = todosProductos.filter((p) => activas.has(p.seccionId));

      if (!filtros.dataset.listo) {
        pintarFiltros(secciones);
        filtros.dataset.listo = "1";
      }

      if (!productos.length) {
        cont.innerHTML = "";
        estado.className = "menu-estado";
        estado.textContent = "Todavía no hay productos en la carta.";
        estado.hidden = false;
        return;
      }

      cont.innerHTML = productos.map(tarjeta).join("");
      pintarDestacados(productos);
      document.dispatchEvent(new CustomEvent("menu:listo"));
    } catch (err) {
      console.error("[menu]", err);
      mostrarError();
    }
  }

  document.addEventListener("DOMContentLoaded", cargar);
})();
