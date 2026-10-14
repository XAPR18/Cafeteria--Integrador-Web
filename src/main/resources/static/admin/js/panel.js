(async function () {
  "use strict";

  try {
    const perfil = await CafeAuth.me();
    if (perfil.rol !== "ADMIN") { location.replace("/admin/"); return; }
  } catch { location.replace("/admin/"); return; }

  const $ = (sel) => document.querySelector(sel);
  const esc = (t) => {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
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
    cuentas: {
      recurso: () => API.cuentas, titulo: "Cuentas y permisos", sub: "Accesos de administradores, empleados y clientes.", nuevoTxt: "Crear acceso", singular: "cuenta", permitirEliminar: false,
      columnas: [
        {th:"Nombre",celda:r => `<strong>${esc(r.nombre)}</strong>`},
        {th:"Correo",celda:r => esc(r.email)},
        {th:"Rol",celda:r => `<span class="chip info">${esc(r.rol)}</span>`},
        {th:"Acceso",celda:r => chipBool(r.activa,"Activo")}
      ],
      kpis: items => [{n:items.length,t:"Cuentas"},{n:items.filter(r => r.activa).length,t:"Accesos activos"},{n:items.filter(r => r.rol === "EMPLEADO").length,t:"Empleados"}],
      campos: () => editandoId != null ? [{name:"activa",label:"Permitir acceso a la cuenta",tipo:"checkbox"}] : [
        {name:"nombre",label:"Nombre completo",tipo:"text",requerido:true},
        {name:"email",label:"Correo",tipo:"email",requerido:true},
        {name:"clave",label:"Contraseña inicial (12 a 72 caracteres)",tipo:"password",requerido:true},
        {name:"rol",label:"Permisos",tipo:"select",requerido:true,opciones:[{valor:"EMPLEADO",texto:"Empleado"},{valor:"ADMIN",texto:"Administrador"}]}
      ],
      aFormulario: r => ({activa:r.activa}),
      aPayload: d => editandoId != null ? {activa:d.activa} : {nombre:d.nombre.trim(),email:d.email.trim(),clave:d.clave,rol:d.rol}
    },
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
            `<div class="producto-celda"><img class="tabla-miniatura" src="${esc(r.imagenUrl || "/Image/Producto 1.jpg")}" alt="" loading="lazy"><div><strong>${esc(r.nombre)}</strong><br><span class="mini">${esc((r.descripcion || "").slice(0, 60))}${
              (r.descripcion || "").length > 60 ? "…" : ""
            }</span></div></div>`,
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
        { name: "precio", label: "Precio (S/)", tipo: "number", paso: "0.01", minimo: "0.01", maximo: "9999.99", requerido: true },
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
        { name: "numero", label: "Número de mesa", tipo: "number", minimo: "1", maximo: "999", paso: "1", requerido: true },
        { name: "capacidad", label: "Capacidad (sillas)", tipo: "number", minimo: "1", maximo: "20", paso: "1", requerido: true },
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
  let versionCarga = 0;
  let cargandoVista = false;
  let guardando = false;
  let versionModal = 0;

  // ----- Render de tabla -----
  async function cargarVista(clave) {
    const version = ++versionCarga;
    versionModal++;
    $("#modal-fondo").hidden = true;
    vistaActual = clave;
    filas = [];
    cargandoVista = true;
    $("#btn-nuevo").disabled = true;
    $("#busqueda").value = "";
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
    $("#kpis").innerHTML = "";
    $("#resumen-tabla").textContent = "";
    $("#vacio").hidden = true;
    $("#cargando").hidden = false;
    ocultarError();

    try {
      const datos = await v.recurso().listar();
      if (version !== versionCarga) return;
      filas = datos;
      pintarKpis(v.kpis(filas));
      pintarTabla(v);
    } catch (e) {
      if (version === versionCarga) mostrarError(e.message);
    } finally {
      if (version === versionCarga) {
        cargandoVista = false;
        $("#cargando").hidden = true;
        $("#btn-nuevo").disabled = false;
      }
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
      $("#resumen-tabla").textContent = "0 registros";
      $("#vacio").hidden = false;
      $("#tbody").innerHTML = "";
      return;
    }
    $("#vacio").hidden = true;
    const consulta = $("#busqueda").value.trim().toLocaleLowerCase("es");
    const visibles = filas.filter((r) => Object.values(r).some((v) => String(v ?? "").toLocaleLowerCase("es").includes(consulta)));
    $("#resumen-tabla").textContent = `${visibles.length} de ${filas.length} registros`;
    $("#vacio").hidden = visibles.length > 0;
    $("#tbody").innerHTML = visibles
      .map((r) => {
        const celdas = v.columnas.map((c) => `<td>${c.celda(r)}</td>`).join("");
        return `<tr data-id="${r.id}">${celdas}
          <td>
            <div class="acciones">
              <button class="icono-btn" data-accion="editar" data-id="${r.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
              ${v.permitirEliminar === false ? "" : `<button class="icono-btn peligro" data-accion="eliminar" data-id="${r.id}" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`}
            </div>
          </td></tr>`;
      })
      .join("");
  }

  // ----- Modal -----
  async function abrirModal(id) {
    if (cargandoVista || guardando) return;
    const version = ++versionModal;
    const clave = vistaActual;
    const v = VISTAS[clave];
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

    if (version !== versionModal || vistaActual !== clave) return;
    const registro = id != null ? filas.find((f) => String(f.id) === String(id)) : null;
    if (id != null && !registro) { mostrarError("El registro ya no esta disponible. Recarga la lista."); return; }
    const valores = registro ? v.aFormulario(registro) : {};

    $("#modal-titulo").textContent = id != null ? "Editar " + v.singular : v.nuevoTxt;

    $("#modal-campos").innerHTML = v.campos().map((c) => campoHtml(c, valores)).join("");
    $("#modal-error").hidden = true;
    $("#modal-fondo").hidden = false;
    $("#modal-campos input, #modal-campos select, #modal-campos textarea")?.focus();
  }

  function campoHtml(c, valores) {
    const val = valores[c.name] !== undefined ? valores[c.name] : c.valorDefecto;
    if (c.tipo === "checkbox") {
      return `<label class="check"><input type="checkbox" name="${c.name}" ${val ? "checked" : ""}> ${esc(c.label)}</label>`;
    }
    if (c.tipo === "textarea") {
      return `<div class="campo"><label for="campo-${c.name}">${esc(c.label)}</label>
        <textarea id="campo-${c.name}" name="${c.name}" rows="2" ${c.requerido ? "required" : ""}>${esc(val || "")}</textarea></div>`;
    }
    if (c.tipo === "select") {
      const ops = (c.opciones || [])
        .map((o) => `<option value="${esc(o.valor)}" ${String(val) === String(o.valor) ? "selected" : ""}>${esc(o.texto)}</option>`)
        .join("");
      return `<div class="campo"><label for="campo-${c.name}">${esc(c.label)}</label>
        <select id="campo-${c.name}" name="${c.name}" ${c.requerido ? "required" : ""}><option value="">— elegir —</option>${ops}</select></div>`;
    }
    return `<div class="campo"><label for="campo-${c.name}">${esc(c.label)}</label>
      <input id="campo-${c.name}" type="${c.tipo}" name="${c.name}" ${c.paso ? `step="${c.paso}"` : ""} ${c.minimo ? `min="${c.minimo}"` : ""} ${c.maximo ? `max="${c.maximo}"` : ""} ${c.requerido ? "required" : ""}
             value="${esc(val ?? "")}"></div>`;
  }

  function cerrarModal() {
    if (guardando) return;
    versionModal++;
    $("#modal-fondo").hidden = true;
    editandoId = null;
    $("#btn-nuevo").focus();
  }

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    const clave = vistaActual;
    const v = VISTAS[clave];
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

    guardando = true;
    $("#modal-error").hidden = true;
    $("#modal-guardar").disabled = true;
    try {
      if (editandoId != null) {
        await v.recurso().actualizar(editandoId, payload);
      } else {
        await v.recurso().crear(payload);
      }
      guardando = false;
      cerrarModal();
      await cargarVista(clave);
    } catch (err) {
      mostrarError(err.message);
    } finally {
      guardando = false;
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
    const b = $("#modal-fondo").hidden ? $("#error-barra") : $("#modal-error");
    b.textContent = msg;
    b.hidden = false;
  }
  function ocultarError() {
    $("#error-barra").hidden = true;
    $("#modal-error").hidden = true;
  }

  // ----- Eventos -----
  $("#nav").addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (item) { e.preventDefault(); if (guardando) return; cargarVista(item.dataset.vista); }
  });
  $("#busqueda").addEventListener("input", () => { if (!cargandoVista) pintarTabla(VISTAS[vistaActual]); });
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

  document.querySelector(".salir").addEventListener("click", async (e) => {
    e.preventDefault();
    try { await CafeAuth.salir(); location.href = "/admin/"; }
    catch (err) { mostrarError(err.message); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal-fondo").hidden) cerrarModal();
    if (e.key === "Tab" && !$("#modal-fondo").hidden) {
      const campos = [...$("#modal-fondo").querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      const primero = campos[0], ultimo = campos[campos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  cargarVista("secciones");
})();
