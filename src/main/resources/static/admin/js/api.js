window.API = (function () {
  "use strict";
  const BASE = (window.CAFE14_API || "http://localhost:8080") + "/api";

  async function pedir(metodo, ruta, cuerpo) {
    const opciones = { method: metodo, headers: {} };
    if (cuerpo !== undefined) {
      opciones.headers["Content-Type"] = "application/json";
      opciones.body = JSON.stringify(cuerpo);
    }

    let res;
    try {
      res = await fetch(BASE + ruta, opciones);
    } catch (e) {
      throw new Error("No hay conexión con el backend (" + BASE + "). ¿Está encendido?");
    }

    if (res.status === 204) return null;

    let datos = null;
    const texto = await res.text();
    if (texto) {
      try { datos = JSON.parse(texto); } catch { datos = texto; }
    }

    if (!res.ok) {
      const msg =
        (datos && (datos.mensaje || datos.message)) ||
        "Error " + res.status;
      const detalles = datos && datos.detalles ? "\n- " + datos.detalles.join("\n- ") : "";
      throw new Error(msg + detalles);
    }
    return datos;
  }

  const recurso = (nombre) => ({
    listar: () => pedir("GET", "/" + nombre),
    obtener: (id) => pedir("GET", "/" + nombre + "/" + id),
    crear: (datos) => pedir("POST", "/" + nombre, datos),
    actualizar: (id, datos) => pedir("PUT", "/" + nombre + "/" + id, datos),
    eliminar: (id) => pedir("DELETE", "/" + nombre + "/" + id),
  });

  return {
    base: BASE,
    secciones: recurso("secciones"),
    productos: recurso("productos"),
    mesas: recurso("mesas"),
  };
})();
