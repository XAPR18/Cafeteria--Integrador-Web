document.addEventListener("DOMContentLoaded", async () => {
  const enlace = document.querySelector('a[href="/login.html"]');
  if (!enlace) return;
  try {
    const perfil = await CafeAuth.me();
    if (perfil.rol === "EMPLEADO") {
      enlace.href = "/empleado/index.html";
      enlace.textContent = "Mi panel";
    } else if (perfil.rol === "ADMIN") {
      enlace.textContent = "Sesión iniciada";
      enlace.removeAttribute("href");
    } else {
      enlace.textContent = `Hola, ${perfil.nombre}`;
      enlace.removeAttribute("href");
    }
    const salir = document.createElement("button");
    salir.type = "button";
    salir.className = "btn btn--ghost";
    salir.textContent = "Cerrar sesión";
    salir.addEventListener("click", async () => {
      salir.disabled = true;
      try { await CafeAuth.salir(); location.reload(); }
      catch (error) { salir.textContent = error.message; salir.disabled = false; }
    });
    enlace.after(salir);
  } catch { /* Sesión de invitado */ }
});
