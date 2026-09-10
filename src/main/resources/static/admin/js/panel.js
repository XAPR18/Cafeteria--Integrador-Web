(function () {
  "use strict";

  if (sessionStorage.getItem("cafe14-admin") !== "1") {
    window.location.replace("index.html");
    return;
  }

  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  };
  const soles = (n) =>
    "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chipBool = (v, siOk) =>
    v ? `<span class="chip ok">${siOk}</span>` : `<span class="chip no">No</span>`;

  const estadoChip = {
    DISPONIBLE: '<span class="chip ok">Disponible</span>',
    OCUPADA: '<span class="chip no">Ocupada</span>',
    RESERVADA: '<span class="chip warn">Reservada</span>',
  };

  let seccionesCache = [];

  const VISTAS = {
    secciones: {
      recurso: () => API.secciones,
      titulo: "Secciones",
      sub: "Categorías del menú de la cafetería.",
      nuevoTxt: "Nueva sección",
      singular: "sección",
      columnas: [
        { th: "ID", celda: (r) => `<span class="mini">#${r.id}</span>` },
        { th: "Nombre", celda: (r) => `<strong>${esc(r.nombre)}</strong>` },
        { th: "Slug", celda: (r) => `<span class="chip info">${esc(r.slug)}</span>` },
        { th: "Descripción", celda: (r) => `<span class="mini">${esc(r.descripcion || "—")}</span>` },
        { th: "Estado", celda: (r) => chipBool(r.activa, "Activa") },
      ],
      kpis: (items) => [
        { n: items.length, t: "Secciones" },
        { n: items.filter((s) => s.activa).length, t: "Activas" },
        { n: items.filter((s) => !s.activa).length, t: "Inactivas" },
      ],
      campos: () => [
        { name: "nombre", label: "Nombre", tipo: "text", requerido: true },
        { name: "slug", label: "Slug (minúsculas, sin espacios)", tipo: "text", requerido: true },
        { name: "descripcion", label: "Descripción", tipo: "textarea" },
        { name: "activa", label: "Sección activa (se muestra en el menú)", tipo: "checkbox", valorDefecto: true },
      ],
      aFormulario: (r) => ({
        nombre: r.nombre, slug: r.slug, descripcion: r.descripcion || "", activa: r.activa,
      }),
      aPayload: (d) => ({
        nombre: d.nombre.trim(),
        slug: d.slug.trim().toLowerCase(),
        descripcion: d.descripcion.trim() || null,
        activa: d.activa,
      }),
    },

    productos: {
      recurso: () => API.productos,
      titulo: "Productos",
      sub: "Items del menú. Cada producto pertenece a una sección.",
      nuevoTxt: "Nuevo producto",
      singular: "producto",
      prepararModal: async () => {
        seccionesCache = await API.secciones.listar();
      },
      columnas: [
        { th: "ID", celda: (r) => `<span class="mini">#${r.id}</span>` },
        {
          th: "Producto",
          celda: (r) =>
            `<strong>${esc(r.nombre)}</strong><br><span class="mini">${esc((r.descripcion || "").slice(0, 60))}${
              (r.descripcion || "").length > 60 ? "…" : ""
            }</span>`,
        },
        { th: "Sección", celda: (r) => `<span class="chip info">${esc(r.seccionNombre || "—")}</span>` },
        { th: "Precio", celda: (r) => `<strong>${soles(r.precio)}</strong>` },
        { th: "Disponible", celda: (r) => chipBool(r.disponible, "Sí") },
        { th: "Etiqueta", celda: (r) => (r.etiqueta ? `<span class="chip warn">${esc(r.etiqueta)}</span>` : "—") },
      ],
      kpis: (items) => [
        { n: items.length, t: "Productos" },
        { n: items.filter((p) => p.disponible).length, t: "Disponibles" },
        { n: new Set(items.map((p) => p.seccionId)).size, t: "Secciones con productos" },
        {
          n: items.length ? soles(items.reduce((a, p) => a + Number(p.precio), 0) / items.length).replace("S/ ", "S/") : "—",
          t: "Precio promedio",
        },
      ],
      campos: () => [
        { name: "nombre", label: "Nombre", tipo: "text", requerido: true },
        { name: "descripcion", label: "Descripción", tipo: "textarea" },
        { name: "precio", label: "Precio (S/)", tipo: "number", paso: "0.10", requerido: true },
        {
          name: "seccionId",
          label: "Sección",
          tipo: "select",
          requerido: true,
          opciones: seccionesCache.map((s) => ({ valor: s.id, texto: s.nombre })),
        },
        { name: "imagenUrl", label: "URL de imagen (opcional)", tipo: "text" },
        { name: "etiqueta", label: "Etiqueta (opcional, ej. NUEVO)", tipo: "text" },
        { name: "disponible", label: "Disponible hoy", tipo: "checkbox", valorDefecto: true },
      ],
      aFormulario: (r) => ({
        nombre: r.nombre,
        descripcion: r.descripcion || "",
        precio: r.precio,
        seccionId: r.seccionId,
        imagenUrl: r.imagenUrl || "",
        etiqueta: r.etiqueta || "",
        disponible: r.disponible,
      }),
      aPayload: (d) => ({
        nombre: d.nombre.trim(),
        descripcion: d.descripcion.trim() || null,
        precio: Number(d.precio),
        seccionId: Number(d.seccionId),
        imagenUrl: d.imagenUrl.trim() || null,
        etiqueta: d.etiqueta.trim() || null,
        disponible: d.disponible,
      }),
    },

    mesas: {
      recurso: () => API.mesas,
      titulo: "Mesas",
      sub: "Mapa de mesas del local: cuántas hay, de qué tamaño y en qué zona.",
      nuevoTxt: "Nueva mesa",
      singular: "mesa",
      columnas: [
        { th: "ID", celda: (r) => `<span class="mini">#${r.id}</span>` },
        { th: "N°", celda: (r) => `<strong>${r.numero}</strong>` },
        { th: "Capacidad", celda: (r) => `${r.capacidad} pers.` },
        { th: "Tipo", celda: (r) => `<span class="chip">${esc(r.tipo)}</span>` },
        { th: "Zona", celda: (r) => `<span class="chip info">${esc(r.zona)}</span>` },
        { th: "Estado", celda: (r) => estadoChip[r.estado] || esc(r.estado) },
      ],
      kpis: (items) => [
        { n: items.length, t: "Mesas" },
        { n: items.filter((m) => m.estado === "DISPONIBLE").length, t: "Disponibles" },
        { n: items.filter((m) => m.estado === "OCUPADA").length, t: "Ocupadas" },
        { n: items.reduce((a, m) => a + Number(m.capacidad || 0), 0), t: "Aforo total" },
      ],
      campos: () => [
        { name: "numero", label: "Número de mesa", tipo: "number", requerido: true },
        { name: "capacidad", label: "Capacidad (sillas)", tipo: "number", requerido: true },
        {
          name: "tipo",
          label: "Tipo",
          tipo: "select",
          requerido: true,
          opciones: ["DOS", "CUATRO", "EXTRA"].map((v) => ({ valor: v, texto: v })),
        },
        {
          name: "zona",
          label: "Zona",
          tipo: "select",
          requerido: true,
          opciones: ["INTERIOR", "VEREDA", "BARRA"].map((v) => ({ valor: v, texto: v })),
        },
        {
          name: "estado",
          label: "Estado",
          tipo: "select",
          opciones: ["DISPONIBLE", "OCUPADA", "RESERVADA"].map((v) => ({ valor: v, texto: v })),
          valorDefecto: "DISPONIBLE",
        },
      ],
      aFormulario: (r) => ({
        numero: r.numero, capacidad: r.capacidad, tipo: r.tipo, zona: r.zona, estado: r.estado,
      }),
      aPayload: (d) => ({
        numero: Number(d.numero),
        capacidad: Number(d.capacidad),
        tipo: d.tipo,
        zona: d.zona,
        estado: d.estado,
      }),
    },
  };

  // ----- Estado -----
  let vistaActual = "secciones";
  let filas = [];
  let editandoId = null;

  // ----- Render de tabla -----
  async function cargarVista(clave) {
    vistaActual = clave;
    const v = VISTAS[clave];
    editandoId = null;

    document.querySelectorAll(".nav-item").forEach((a) =>
      a.classList.toggle("activo", a.dataset.vista === clave)
    );
    $("#titulo-vista").textContent = v.titulo;
    $("#sub-vista").textContent = v.sub;
    $("#btn-nuevo-txt").textContent = v.nuevoTxt;

    $("#thead-fila").innerHTML =
      v.columnas.map((c) => `<th>${c.th}</th>`).join("") + `<th style="text-align:right">Acciones</th>`;
    $("#tbody").innerHTML = "";
    $("#vacio").hidden = true;
    $("#cargando").hidden = false;
    ocultarError();

    try {
      filas = await v.recurso().listar();
      pintarKpis(v.kpis(filas));
      pintarTabla(v);
    } catch (e) {
      mostrarError(e.message);
      $("#cargando").hidden = true;
    }
  }

  function pintarKpis(lista) {
    $("#kpis").innerHTML = lista
      .map((k) => `<div class="kpi"><div class="n">${k.n}</div><div class="t">${esc(k.t)}</div></div>`)
      .join("");
  }

  function pintarTabla(v) {
    $("#cargando").hidden = true;
    if (!filas.length) {
      $("#vacio").hidden = false;
      $("#tbody").innerHTML = "";
      return;
    }
    $("#vacio").hidden = true;
    $("#tbody").innerHTML = filas
      .map((r) => {
        const celdas = v.columnas.map((c) => `<td>${c.celda(r)}</td>`).join("");
        return `<tr data-id="${r.id}">${celdas}
          <td>
            <div class="acciones">
              <button class="icono-btn" data-accion="editar" data-id="${r.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="icono-btn peligro" data-accion="eliminar" data-id="${r.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td></tr>`;
      })
      .join("");
  }

  // ----- Modal -----
  async function abrirModal(id) {
    const v = VISTAS[vistaActual];
    editandoId = id ?? null;
    ocultarError();

    if (v.prepararModal) {
      try {
        await v.prepararModal();
      } catch (e) {
        mostrarError(e.message);
        return;
      }
    }

    const registro = id != null ? filas.find((f) => String(f.id) === String(id)) : null;
    const valores = registro ? v.aFormulario(registro) : {};

    $("#modal-titulo").textContent = id != null ? "Editar " + v.singular : v.nuevoTxt;

    $("#modal-campos").innerHTML = v.campos().map((c) => campoHtml(c, valores)).join("");
    $("#modal-fondo").hidden = false;
  }

  function campoHtml(c, valores) {
    const val = valores[c.name] !== undefined ? valores[c.name] : c.valorDefecto;
    if (c.tipo === "checkbox") {
      return `<label class="check"><input type="checkbox" name="${c.name}" ${val ? "checked" : ""}> ${esc(c.label)}</label>`;
    }
    if (c.tipo === "textarea") {
      return `<div class="campo"><label>${esc(c.label)}</label>
        <textarea name="${c.name}" rows="2" ${c.requerido ? "required" : ""}>${esc(val || "")}</textarea></div>`;
    }
    if (c.tipo === "select") {
      const ops = (c.opciones || [])
        .map((o) => `<option value="${esc(o.valor)}" ${String(val) === String(o.valor) ? "selected" : ""}>${esc(o.texto)}</option>`)
        .join("");
      return `<div class="campo"><label>${esc(c.label)}</label>
        <select name="${c.name}" ${c.requerido ? "required" : ""}><option value="">— elegir —</option>${ops}</select></div>`;
    }
    return `<div class="campo"><label>${esc(c.label)}</label>
      <input type="${c.tipo}" name="${c.name}" ${c.paso ? `step="${c.paso}"` : ""} ${c.requerido ? "required" : ""}
             value="${esc(val ?? "")}"></div>`;
  }

  function cerrarModal() {
    $("#modal-fondo").hidden = true;
    editandoId = null;
  }

  async function guardar(e) {
    e.preventDefault();
    const v = VISTAS[vistaActual];
    const form = e.target;
    const datos = {};
    v.campos().forEach((c) => {
      const el = form.elements[c.name];
      if (!el) return;
      datos[c.name] = c.tipo === "checkbox" ? el.checked : el.value;
    });

    let payload;
    try {
      payload = v.aPayload(datos);
    } catch (err) {
      mostrarError("Revisa los datos del formulario.");
      return;
    }

    $("#modal-guardar").disabled = true;
    try {
      if (editandoId != null) {
        await v.recurso().actualizar(editandoId, payload);
      } else {
        await v.recurso().crear(payload);
      }
      cerrarModal();
      await cargarVista(vistaActual);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      $("#modal-guardar").disabled = false;
    }
  }

  async function eliminar(id) {
    const v = VISTAS[vistaActual];
    const reg = filas.find((f) => String(f.id) === String(id));
    const nombre = reg ? reg.nombre || reg.numero || ("#" + id) : "#" + id;
    if (!confirm(`¿Eliminar ${v.singular} "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await v.recurso().eliminar(id);
      await cargarVista(vistaActual);
    } catch (err) {
      mostrarError(err.message);
    }
  }

  // ----- Errores -----
  function mostrarError(msg) {
    const b = $("#error-barra");
    b.textContent = msg;
    b.hidden = false;
  }
  function ocultarError() {
    $("#error-barra").hidden = true;
  }

  // ----- Eventos -----
  $("#nav").addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (item) cargarVista(item.dataset.vista);
  });
  $("#btn-nuevo").addEventListener("click", () => abrirModal(null));
  $("#tbody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;
    if (btn.dataset.accion === "editar") abrirModal(btn.dataset.id);
    if (btn.dataset.accion === "eliminar") eliminar(btn.dataset.id);
  });
  $("#modal-form").addEventListener("submit", guardar);
  $("#modal-cerrar").addEventListener("click", cerrarModal);
  $("#modal-cancelar").addEventListener("click", cerrarModal);
  $("#modal-fondo").addEventListener("click", (e) => {
    if (e.target === $("#modal-fondo")) cerrarModal();
  });

  cargarVista("secciones");
})();
