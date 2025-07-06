const formulario = document.getElementById("formulario");
let articuloEditandoId = null;
const articulosDiv = document.getElementById("articulos-container");
const buscador = document.getElementById("buscador");
let categoriaActiva = "";

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  document.querySelectorAll(".error").forEach(el => el.textContent = "");
  ["autor", "categoria", "titulo", "contenido"].forEach(id => {
    document.getElementById(id).style.border = "";
  });

  const titulo = document.getElementById("titulo").value.trim();
  const contenido = document.getElementById("contenido").value.trim();
  const categoria = document.getElementById("categoria").value;
  const autor = document.getElementById("autor").value.trim();
  const imagen = document.getElementById("imagen").value.trim();

  let errores = false;
  if (!autor) {
    document.getElementById("error-autor").textContent = "El nombre es obligatorio";
    document.getElementById("autor").style.border = "2px solid red";
    errores = true;
  }
  if (!categoria) {
    document.getElementById("error-categoria").textContent = "Selecciona una categoría";
    document.getElementById("categoria").style.border = "2px solid red";
    errores = true;
  }
  if (!titulo) {
    document.getElementById("error-titulo").textContent = "El título es obligatorio";
    document.getElementById("titulo").style.border = "2px solid red";
    errores = true;
  }
  if (!contenido) {
    document.getElementById("error-contenido").textContent = "El contenido no puede estar vacío";
    document.getElementById("contenido").style.border = "2px solid red";
    errores = true;
  }
  if (errores) return;

  const url    = articuloEditandoId
    ? `https://implantes-dentales-hoy.onrender.com/articulos/${articuloEditandoId}`
    : "https://implantes-dentales-hoy.onrender.com/publicar";
  const method = articuloEditandoId ? "PUT" : "POST";

  const res  = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, contenido, categoria, autor, imagen })
  });
  const data = await res.json();
  alert(data.mensaje || data.error);

  formulario.reset();
  articuloEditandoId = null;
  formulario.querySelector("button").textContent = "Publicar";
  cargarArticulos(categoriaActiva);
});

function renderArticulo(a) {
  const div = document.createElement("div");
  div.className = "post";

  const header = document.createElement("div");
  header.innerHTML = `
    <h3>${a.titulo}</h3>
    <p><strong>Autor:</strong> ${a.autor}</p>
    <p><strong>Categoría:</strong> ${a.categoria}</p>
    <p><strong>Fecha:</strong> ${a.fecha}</p>
  `;
  div.append(header);

  if (a.imagen) {
    const img = document.createElement("img");
    img.src = a.imagen;
    img.alt = "Imagen del artículo";
    img.className = "imagen-articulo";
    div.append(img);
  }

  const pContenido = document.createElement("p");
  pContenido.textContent = a.contenido;
  div.append(pContenido);

  const acciones = document.createElement("div");
  acciones.className = "acciones";

  const btnEditar = document.createElement("button");
  btnEditar.textContent = "✏️ Editar";
  btnEditar.addEventListener("click", () => editarArticulo(
    a._id, a.titulo, a.contenido, a.categoria, a.autor, a.imagen || ""
  ));

  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "🗑️ Eliminar";
  btnEliminar.addEventListener("click", () => eliminarArticulo(a._id));

  acciones.append(btnEditar, btnEliminar);
  div.append(acciones);

  const likesDiv = document.createElement("div");
  likesDiv.className = "likes";

  const btnLike = document.createElement("button");
  btnLike.textContent = `👍 ${a.likes || 0}`;
  btnLike.addEventListener("click", () => darLike(a._id, btnLike));

  const btnDislike = document.createElement("button");
  btnDislike.textContent = `👎 ${a.dislikes || 0}`;
  btnDislike.addEventListener("click", () => darDislike(a._id, btnDislike));

  likesDiv.append(btnLike, btnDislike);
  div.append(likesDiv);

  return div;
}

async function cargarArticulos(filtroCategoria = "", filtroBusqueda = "") {
  categoriaActiva = filtroCategoria;

  const res      = await fetch("https://implantes-dentales-hoy.onrender.com/articulos");
  const articulos = await res.json();

  const conteosRes = await fetch("https://implantes-dentales-hoy.onrender.com/categorias-contador");
  const conteos    = await conteosRes.json();

  articulosDiv.innerHTML = "";
  document.querySelectorAll("#filtros-categorias button").forEach(boton => {
    const cat     = boton.dataset.cat;
    const emoji   = boton.dataset.emoji || "🦷";
    const cantidad = cat ? (conteos[cat] || 0) : articulos.length;
    boton.textContent = `${emoji} ${cat || "Todos"} (${cantidad})`;
  });

  const filtrados = articulos.filter(a =>
    (!filtroCategoria || a.categoria === filtroCategoria) &&
    (!filtroBusqueda || a.titulo.toLowerCase().includes(filtroBusqueda.toLowerCase()))
  );

  filtrados.forEach(a => {
    articulosDiv.appendChild(renderArticulo(a));
  });
}

function editarArticulo(id, titulo, contenido, categoria, autor, imagen) {
  console.log("Edición iniciada para:", id);
  document.getElementById("titulo").value    = titulo;
  document.getElementById("contenido").value = contenido;
  document.getElementById("categoria").value = categoria;
  document.getElementById("autor").value     = autor;
  document.getElementById("imagen").value    = imagen;

  articuloEditandoId = id;
  formulario.querySelector("button").textContent = "Actualizar artículo";
  formulario.scrollIntoView({ behavior: "smooth" });
}

async function eliminarArticulo(id) {
  if (!confirm("¿Estás segur@ de que quieres borrar este artículo?")) return;
  const res  = await fetch(`https://implantes-dentales-hoy.onrender.com/articulos/${id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.mensaje || data.error);
  cargarArticulos(categoriaActiva);
}

async function darLike(id, btn) {
  const res  = await fetch(`https://implantes-dentales-hoy.onrender.com/articulos/${id}/like`, { method: "POST" });
  const data = await res.json();
  if (data.likes !== undefined) {
    btn.textContent = `👍 ${data.likes}`;
  }
}

async function darDislike(id, btn) {
  const res  = await fetch(`https://implantes-dentales-hoy.onrender.com/articulos/${id}/dislike`, { method: "POST" });
  const data = await res.json();
  if (data.dislikes !== undefined) {
    btn.textContent = `👎 ${data.dislikes}`;
  }
}

function filtrarPorCategoria(cat) {
  cargarArticulos(cat);
}

buscador.addEventListener("input", (e) => {
  cargarArticulos(categoriaActiva, e.target.value);
});

cargarArticulos();