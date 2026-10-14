window.CafeAuth = (() => {
  async function pedir(ruta, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    if (opciones.body) headers.set("Content-Type", "application/json");
    if (opciones.method && opciones.method !== "GET") {
      const csrf = await fetch("/api/auth/csrf", {credentials: "same-origin"});
      if (!csrf.ok) throw new Error("No se pudo validar la sesión. Reintenta.");
      headers.set("X-XSRF-TOKEN", (await csrf.json()).token);
    }
    const res = await fetch(ruta, {...opciones, headers, credentials: "same-origin"});
    if (res.status === 204) return null;
    const texto = await res.text();
    let datos; try { datos = JSON.parse(texto); } catch { datos = {}; }
    if (!res.ok) {
      const mensaje = datos.mensaje || (res.status === 401 ? "Correo o contraseña incorrectos, o sesión expirada." : res.status === 403 ? "No tienes permiso para esta operación." : "No se pudo completar la operación.");
      const detalles = Array.isArray(datos.detalles) ? "\n" + datos.detalles.join("\n") : "";
      const error = new Error(mensaje + detalles);
      error.status = res.status;
      throw error;
    }
    return datos;
  }
  return {pedir, me: () => pedir("/api/auth/me"), salir: () => pedir("/api/auth/logout", {method: "POST"})};
})();
