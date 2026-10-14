document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const boton = form.querySelector('button[type="submit"]');
    const aviso = document.getElementById("acceso-error");
    boton.disabled = true; aviso.hidden = true;
    try {
      const email = document.getElementById("correo").value;
      const clave = document.getElementById("clave").value;
      const nombre = document.getElementById("nombre");
      if (nombre) {
        await CafeAuth.pedir("/api/auth/registro", {method:"POST", body:JSON.stringify({nombre:nombre.value,email,clave})});
      }
      const perfil = await CafeAuth.pedir("/api/auth/login", {method:"POST", body:JSON.stringify({email,clave})});
      if (document.body.dataset.admin === "true" && perfil.rol !== "ADMIN") {
        await CafeAuth.salir(); throw new Error("Este acceso es exclusivo del administrador.");
      }
      location.href = perfil.rol === "ADMIN" ? "/admin/panel.html" : perfil.rol === "EMPLEADO" ? "/empleado/index.html" : "/";
    } catch (error) { aviso.textContent = error.message; aviso.hidden = false; }
    finally { boton.disabled = false; }
  });
});
