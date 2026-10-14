window.API = (function () {
  "use strict";
  const BASE = (window.CAFE14_API || window.location.origin) + "/api";

  async function pedir(metodo, ruta, cuerpo) {
    const opciones = { method: metodo, headers: {} };
    if (cuerpo !== undefined) {
      opciones.headers["Content-Type"] = "application/json";
      opciones.body = JSON.stringify(cuerpo);
    }

    return CafeAuth.pedir(BASE + ruta, opciones);
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
    cuentas: {
      listar: () => pedir("GET", "/cuentas"),
      crear: datos => pedir("POST", "/cuentas", datos),
      actualizar: (id, datos) => pedir("PATCH", "/cuentas/" + id + "/estado", datos)
    },
  };
})();
