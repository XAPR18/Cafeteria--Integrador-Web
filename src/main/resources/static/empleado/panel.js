document.addEventListener("DOMContentLoaded", async () => {
  const aviso = document.getElementById("aviso");
  const actualizar = document.getElementById("actualizar");
  const filtro = document.getElementById("filtro");
  const lista = document.getElementById("lista");
  let mesas = [];
  try {
    const perfil = await CafeAuth.me();
    if (perfil.rol !== "EMPLEADO") {
      location.replace(perfil.rol === "ADMIN" ? "/admin/panel.html" : "/");
      return;
    }
    document.getElementById("perfil").textContent = `Bienvenido, ${perfil.nombre} · Empleado`;
  } catch { location.replace("/login.html"); return; }
  function mostrar() {
    lista.replaceChildren();
    const visibles = mesas.filter(m => !filtro.value || m.estado === filtro.value);
    for (const mesa of visibles) {
      const tarjeta = document.createElement("article");
      tarjeta.className = "mesa";
      const nombre = document.createElement("h3");
      nombre.textContent = `Mesa ${mesa.numero}`;
      const estado = document.createElement("span");
      estado.className = "estado";
      if (["DISPONIBLE", "OCUPADA", "RESERVADA"].includes(mesa.estado)) estado.classList.add(mesa.estado.toLowerCase());
      estado.textContent = mesa.estado;
      const detalle = document.createElement("p");
      detalle.textContent = `${mesa.capacidad} plazas · ${mesa.zona}`;
      tarjeta.append(nombre, estado, detalle);
      lista.append(tarjeta);
    }
    if (!visibles.length) lista.textContent = "No hay mesas para este estado.";
  }
  async function cargar() {
    actualizar.disabled = true;
    aviso.textContent = "Consultando mesas…";
    try {
      mesas = await CafeAuth.pedir("/api/mesas");
      document.getElementById("total").textContent = mesas.length;
      document.getElementById("disponibles").textContent = mesas.filter(m => m.estado === "DISPONIBLE").length;
      document.getElementById("plazas").textContent = mesas.reduce((s,m) => s + m.capacidad, 0);
      mostrar();
      aviso.textContent = "Mesas actualizadas desde la base de datos.";
    } catch (error) {
      mesas = [];
      lista.replaceChildren();
      for (const id of ["total", "disponibles", "plazas"]) document.getElementById(id).textContent = "—";
      if (error.status === 401) { location.replace("/login.html"); return; }
      aviso.textContent = error.message;
    }
    finally { actualizar.disabled = false; }
  }
  actualizar.addEventListener("click", cargar);
  filtro.addEventListener("change", mostrar);
  document.getElementById("salir").addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    try { await CafeAuth.salir(); location.replace("/login.html"); }
    catch (error) { aviso.textContent = error.message; document.getElementById("salir").disabled = false; }
  });
  await cargar();
});
