# Guía de la API y del CRUD — Café Catorce (Primer Avance)

Explicación para el equipo: qué es Swagger, cómo está organizada la API por carpetas,
qué hace cada archivo y cómo fluye una petición desde el navegador hasta los datos.

---

## 1. `http://localhost:8080/swagger-ui.html` — ¿qué es y para qué sirve?

**Swagger UI** es una **página web de documentación interactiva** de la API que se genera
**sola** a partir de las anotaciones del código. No la programamos nosotros: la crea la
dependencia `springdoc-openapi` leyendo los controladores.

### ¿Para qué sirve?

| Uso | Detalle |
|---|---|
| **Ver todos los endpoints** | Lista agrupada por recurso: Secciones, Productos, Mesas. Muestra método (GET/POST/PUT/DELETE), ruta, parámetros y qué devuelve. |
| **Probar la API sin Postman** | Botón **"Try it out"** → escribes el JSON → **"Execute"** → ves la respuesta real, el código HTTP y las cabeceras. |
| **Contrato para el frontend** | Angular (más adelante) sabe exactamente qué enviar y qué recibir mirando esta página. |
| **Demostración en la exposición** | Abrir Swagger y ejecutar un `POST /api/productos` en vivo es la forma más rápida de mostrar que "la API funciona". |

### ¿De dónde sale?

- Dependencia en `pom.xml`: `springdoc-openapi-starter-webmvc-ui`.
- Al arrancar, Spring expone dos rutas automáticamente:
  - `http://localhost:8080/v3/api-docs` → la especificación en **JSON** (OpenAPI). Es para máquinas.
  - `http://localhost:8080/swagger-ui.html` → la **página visual** que lee ese JSON. Es para personas.
- El texto del título y la descripción sale de nuestra clase
  [`config/ConfiguracionOpenApi.java`](src/main/java/com/cafeteria/backend/config/ConfiguracionOpenApi.java):

```java
@Configuration
public class ConfiguracionOpenApi {
    @Bean
    public OpenAPI apiCafeteria() {
        return new OpenAPI().info(new Info()
            .title("API - Cafe Catorce")
            .description("Sistema web de gestion integral para una cafeteria...")
            .version("v1 - Primer avance"));
    }
}
```

- Los nombres de cada grupo ("Secciones", "Productos", "Mesas") y el texto de cada operación
  salen de las anotaciones `@Tag` y `@Operation` en los **controladores**:

```java
@RestController
@RequestMapping("/api/secciones")
@Tag(name = "Secciones", description = "Categorias del menu de la cafeteria")
public class SeccionControlador {

    @GetMapping
    @Operation(summary = "Listar todas las secciones")
    public List<SeccionRespuesta> listar() { ... }
}
```

> Resumen: **la API son las rutas `/api/...` que devuelven JSON. Swagger es una página que
> las lista y te deja probarlas.** Si borras Swagger, la API sigue funcionando igual.

---

## 2. Dependencias que hacen posible el CRUD (`pom.xml`)

| Dependencia | Para qué |
|---|---|
| `spring-boot-starter-web` | Servidor web (Tomcat embebido) + Spring MVC (`@RestController`, `@GetMapping`, ...). Convierte objetos Java ⇄ JSON automáticamente (Jackson). |
| `spring-boot-starter-validation` | Validaciones con anotaciones (`@NotBlank`, `@Positive`, ...) + `@Valid`. |
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI. |
| `spring-boot-starter-test` | JUnit 5, MockMvc, AssertJ, Mockito (para las pruebas). |

**No hay base de datos** en este avance: los datos se guardan en memoria (un `Map`).

---

## 3. Estructura de carpetas

Todo el backend está en:

```
cafeteria-backend/
└── src/main/java/com/cafeteria/backend/
    │
    ├── CafeteriaBackendApplication.java   ← arranca la aplicación (main)
    │
    ├── config/                            ← configuración transversal
    │   ├── ConfiguracionOpenApi.java      · título/descripción de Swagger
    │   └── ConfiguracionWeb.java          · redirección /admin → /admin/
    │
    ├── common/                            ← utilidades compartidas por todos los módulos
    │   ├── RecursoNoEncontradoException.java   · excepción → HTTP 404
    │   ├── ReglaNegocioException.java          · excepción → HTTP 400
    │   ├── RespuestaError.java                 · forma del JSON de error
    │   └── ManejadorGlobalErrores.java         · atrapa las excepciones y arma la respuesta
    │
    ├── seccion/                           ← MÓDULO 1  (una carpeta por recurso)
    │   ├── Seccion.java                        · el modelo (los campos)
    │   ├── SeccionRepositorio.java             · interfaz: qué operaciones de guardado hay
    │   ├── SeccionRepositorioEnMemoria.java    · implementación con un HashMap
    │   ├── SeccionServicio.java                · lógica de negocio (validaciones, reglas)
    │   ├── SeccionControlador.java             · expone /api/secciones (HTTP)
    │   └── dto/
    │       ├── SeccionSolicitud.java           · lo que ENTRA (request) + validaciones
    │       └── SeccionRespuesta.java           · lo que SALE (response)
    │
    ├── producto/                          ← MÓDULO 2  (misma estructura)
    │   ├── Producto.java
    │   ├── ProductoRepositorio.java  ·  ProductoRepositorioEnMemoria.java
    │   ├── ProductoServicio.java     ·  ProductoControlador.java
    │   └── dto/ ProductoSolicitud.java · ProductoRespuesta.java
    │
    ├── mesa/                              ← MÓDULO 3  (misma estructura + enums)
    │   ├── Mesa.java
    │   ├── TipoMesa.java · ZonaMesa.java · EstadoMesa.java   (los valores fijos)
    │   ├── MesaRepositorio.java · MesaRepositorioEnMemoria.java
    │   ├── MesaServicio.java · MesaControlador.java
    │   └── dto/ MesaSolicitud.java · MesaRespuesta.java
    │
    └── seed/
        └── CargadorDatosIniciales.java   ← carga 4 secciones, 17 productos, 10 mesas al arrancar
```

**Idea clave:** la estructura es **por funcionalidad** (una carpeta por recurso), no por
tipo de clase. Cada módulo (`seccion`, `producto`, `mesa`) es igual y contiene sus **6 piezas**.

---

## 4. Las 6 piezas de un módulo CRUD (con el ejemplo de `seccion`)

### 4.1 El modelo — `Seccion.java`

Una clase normal con los campos y sus getters/setters. Representa "una sección" tal como
existe dentro del programa.

```java
public class Seccion {
    private Long id;
    private String nombre;
    private String slug;          // identificador corto: "cafes", "dulces"...
    private String descripcion;
    private boolean activa;
    // + constructor(es) + getters + setters
}
```

### 4.2 La interfaz de repositorio — `SeccionRepositorio.java`

Un **contrato**: dice *qué* operaciones de guardado existen, sin decir *cómo*.

```java
public interface SeccionRepositorio {
    List<Seccion> listar();
    Optional<Seccion> buscarPorId(Long id);
    boolean existePorSlug(String slug);
    Seccion guardar(Seccion seccion);   // sirve para crear y para actualizar
    void eliminar(Long id);
    boolean existePorId(Long id);
}
```

> Gracias a esta interfaz, el día que usemos MySQL solo creamos otra clase que la
> implemente con JPA. El servicio y el controlador **no cambian**.

### 4.3 La implementación en memoria — `SeccionRepositorioEnMemoria.java`

El *cómo* de este avance: guarda todo en un `ConcurrentHashMap`.

```java
@Repository
public class SeccionRepositorioEnMemoria implements SeccionRepositorio {

    private final Map<Long, Seccion> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuenciaId = new AtomicLong(0);

    public Seccion guardar(Seccion s) {
        if (s.getId() == null) s.setId(secuenciaId.incrementAndGet()); // id nuevo
        datos.put(s.getId(), s);
        return s;
    }
    public Optional<Seccion> buscarPorId(Long id) { return Optional.ofNullable(datos.get(id)); }
    public void eliminar(Long id) { datos.remove(id); }
    // ...
}
```

- `@Repository` → Spring crea **un único objeto** de esta clase y lo inyecta donde haga falta.
- `AtomicLong` → genera ids 1, 2, 3, ... de forma segura.
- Al reiniciar la app, el `Map` vuelve a empezar vacío (por eso existe `seed/`).

### 4.4 El servicio — `SeccionServicio.java`  ← **aquí vive el CRUD de verdad**

Contiene la **lógica de negocio**: validar reglas, normalizar datos, decidir qué excepción
lanzar. No sabe nada de HTTP.

```java
@Service
public class SeccionServicio {

    private final SeccionRepositorio repositorio;
    public SeccionServicio(SeccionRepositorio repositorio) { this.repositorio = repositorio; }

    // READ (todos)
    public List<Seccion> listar() { return repositorio.listar(); }

    // READ (uno)  → 404 si no existe
    public Seccion obtener(Long id) {
        return repositorio.buscarPorId(id)
            .orElseThrow(() -> RecursoNoEncontradoException.de("la seccion", id));
    }

    // CREATE  → 400 si el slug ya existe (regla de negocio)
    public Seccion crear(SeccionSolicitud sol) {
        String slug = sol.slug().trim().toLowerCase();
        if (repositorio.existePorSlug(slug))
            throw new ReglaNegocioException("Ya existe una seccion con el slug '" + slug + "'");
        Seccion s = new Seccion(null, sol.nombre().trim(), slug,
                                sol.descripcion(), sol.activa() == null || sol.activa());
        return repositorio.guardar(s);
    }

    // UPDATE  → 404 si no existe, 400 si el nuevo slug choca con otro
    public Seccion actualizar(Long id, SeccionSolicitud sol) {
        Seccion s = obtener(id);                    // reusa el 404
        // ...revalida el slug, copia los campos...
        return repositorio.guardar(s);
    }

    // DELETE  → 404 si no existe
    public void eliminar(Long id) {
        if (!repositorio.existePorId(id))
            throw RecursoNoEncontradoException.de("la seccion", id);
        repositorio.eliminar(id);
    }
}
```

### 4.5 El controlador — `SeccionControlador.java`  ← **la "cara" HTTP de la API**

Traduce peticiones HTTP en llamadas al servicio y viceversa. Cada método = un endpoint.

```java
@RestController                       // = @Controller + respuestas en JSON
@RequestMapping("/api/secciones")     // ruta base de todo el recurso
@Tag(name = "Secciones", ...)         // nombre del grupo en Swagger
public class SeccionControlador {

    private final SeccionServicio servicio;
    public SeccionControlador(SeccionServicio servicio) { this.servicio = servicio; }

    @GetMapping                                              // GET /api/secciones
    public List<SeccionRespuesta> listar() {
        return servicio.listar().stream().map(SeccionRespuesta::desde).toList();
    }

    @GetMapping("/{id}")                                     // GET /api/secciones/5
    public SeccionRespuesta obtener(@PathVariable Long id) {
        return SeccionRespuesta.desde(servicio.obtener(id));
    }

    @PostMapping                                             // POST /api/secciones
    public ResponseEntity<SeccionRespuesta> crear(@Valid @RequestBody SeccionSolicitud sol) {
        SeccionRespuesta creada = SeccionRespuesta.desde(servicio.crear(sol));
        return ResponseEntity.created(URI.create("/api/secciones/" + creada.id())).body(creada); // 201
    }

    @PutMapping("/{id}")                                     // PUT /api/secciones/5
    public SeccionRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody SeccionSolicitud sol) {
        return SeccionRespuesta.desde(servicio.actualizar(id, sol));
    }

    @DeleteMapping("/{id}")                                  // DELETE /api/secciones/5
    @ResponseStatus(HttpStatus.NO_CONTENT)                   // 204
    public void eliminar(@PathVariable Long id) {
        servicio.eliminar(id);
    }
}
```

| Anotación | Qué hace |
|---|---|
| `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping` | Asocian un método Java a un método HTTP + ruta. |
| `@PathVariable Long id` | Lee el `{id}` de la URL (`/api/secciones/5` → `id = 5`). |
| `@RequestParam` | Lee `?clave=valor` (ej. `GET /api/productos?seccionId=1`). |
| `@RequestBody` | Convierte el JSON del cuerpo en un objeto Java. |
| `@Valid` | Dispara las validaciones del DTO **antes** de entrar al método. |
| `ResponseEntity` | Permite controlar el código de estado (201, cabecera `Location`...). |

### 4.6 Los DTO — `dto/SeccionSolicitud.java` y `dto/SeccionRespuesta.java`

**DTO = Data Transfer Object.** Son objetos "de frontera": lo que viaja por la red.
Se usan `record` (clases inmutables cortas).

**Solicitud (entra):** define qué campos acepta la API y sus reglas de validación.

```java
public record SeccionSolicitud(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 60) String nombre,

    @NotBlank @Pattern(regexp = "[a-z0-9-]+",
        message = "El slug solo admite minusculas, numeros y guiones")
    @Size(max = 40) String slug,

    @Size(max = 200) String descripcion,
    Boolean activa
) {}
```

**Respuesta (sale):** define qué campos devuelve la API (puede ocultar campos internos o
añadir calculados). Tiene un método de fábrica que convierte la entidad en DTO.

```java
public record SeccionRespuesta(Long id, String nombre, String slug,
                               String descripcion, boolean activa) {
    public static SeccionRespuesta desde(Seccion s) {
        return new SeccionRespuesta(s.getId(), s.getNombre(), s.getSlug(),
                                    s.getDescripcion(), s.isActiva());
    }
}
```

> **¿Por qué no exponer la entidad `Seccion` directamente?** Para no acoplar la API a la
> estructura interna, poder validar la entrada por separado y controlar exactamente qué
> sale. Ejemplo real: `ProductoRespuesta` **añade** `seccionNombre` y `seccionSlug`, que
> no están en la entidad `Producto` (solo guarda `seccionId`).

---

## 5. Recorrido completo de una petición: `POST /api/productos`

```
1. NAVEGADOR / Swagger / Postman
   POST http://localhost:8080/api/productos
   Content-Type: application/json
   { "nombre": "Flat White", "precio": 8.5, "seccionId": 1, "etiqueta": "NUEVO" }
        │
        ▼
2. Spring MVC (starter-web)
   - Ve que la ruta y el método coinciden con ProductoControlador.crear(...)
   - Convierte el JSON en un ProductoSolicitud (Jackson)
   - Al llevar @Valid, ejecuta las validaciones del record:
        · nombre @NotBlank  · precio @NotNull @Positive  · seccionId @NotNull
     Si algo falla → NO entra al método → 400 (ver paso 6b)
        │
        ▼
3. ProductoControlador.crear(solicitud)
   - Llama a servicio.crear(solicitud)
        │
        ▼
4. ProductoServicio.crear(solicitud)
   - exigirSeccion(1): busca la sección 1 en el repositorio de secciones.
        · si NO existe → throw ReglaNegocioException  → 400 (paso 6a)
   - Construye un new Producto(...) con los datos ya limpios (trim, disponible=true por defecto)
   - productoRepositorio.guardar(producto)
        │
        ▼
5. ProductoRepositorioEnMemoria.guardar(producto)
   - producto.getId() == null → le asigna id = 18 (AtomicLong)
   - datos.put(18, producto)   (el HashMap)
   - devuelve el producto ya con id
        │
        ▼
   Vuelta atrás: Servicio → aRespuesta(producto)
   - vuelve a mirar la sección para rellenar seccionNombre / seccionSlug
   - devuelve un ProductoRespuesta
        │
        ▼
6. ProductoControlador
   - ResponseEntity.created(URI "/api/productos/18").body(respuesta)
        │
        ▼
   RESPUESTA HTTP 201 Created
   Location: /api/productos/18
   { "id":18, "nombre":"Flat White", "precio":8.5, "seccionId":1,
     "seccionNombre":"Cafes de la Casa", "seccionSlug":"cafes",
     "disponible":true, "etiqueta":"NUEVO" }
```

### 6. ¿Qué pasa cuando algo va mal?

Todas las excepciones las atrapa **un solo sitio**:
[`common/ManejadorGlobalErrores.java`](src/main/java/com/cafeteria/backend/common/ManejadorGlobalErrores.java)
(`@RestControllerAdvice`). Cada tipo de error se traduce a un JSON uniforme
([`RespuestaError`](src/main/java/com/cafeteria/backend/common/RespuestaError.java)):

| Situación | Excepción | HTTP | Ejemplo de cuerpo |
|---|---|---|---|
| **6a** Sección inexistente al crear producto | `ReglaNegocioException` | **400** | `{"estado":400,"mensaje":"La seccion con id 999 no existe","ruta":"/api/productos"}` |
| **6b** Falta el nombre / precio negativo | `MethodArgumentNotValidException` (de `@Valid`) | **400** | `{"estado":400,"mensaje":"La solicitud contiene datos invalidos","detalles":["nombre: El nombre es obligatorio","precio: El precio debe ser mayor que 0"]}` |
| Pedir `GET /api/productos/9999` | `RecursoNoEncontradoException` | **404** | `{"estado":404,"mensaje":"No se encontro el producto con id 9999"}` |
| `GET /api/productos/abc` (id no numérico) | `MethodArgumentTypeMismatchException` | **400** | `{"estado":400,"mensaje":"El parametro 'id' con valor 'abc' no es un Long valido."}` |
| Cualquier otro fallo no previsto | `Exception` | **500** | `{"estado":500,"mensaje":"Ocurrio un error inesperado..."}` (+ traza en la consola) |

---

## 7. Tabla completa de endpoints

| Método | Ruta | Qué hace | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/secciones` | Lista todas las secciones | 200 | — |
| GET | `/api/secciones/{id}` | Una sección | 200 | 404 |
| POST | `/api/secciones` | Crea | 201 | 400 (validación / slug repetido) |
| PUT | `/api/secciones/{id}` | Actualiza | 200 | 400, 404 |
| DELETE | `/api/secciones/{id}` | Elimina | 204 | 404 |
| GET | `/api/productos` | Lista todos | 200 | — |
| GET | `/api/productos?seccionId={id}` | Lista los de una sección | 200 | — |
| GET | `/api/productos/{id}` | Un producto | 200 | 404 |
| POST | `/api/productos` | Crea | 201 | 400 (validación / sección inexistente) |
| PUT | `/api/productos/{id}` | Actualiza | 200 | 400, 404 |
| DELETE | `/api/productos/{id}` | Elimina | 204 | 404 |
| GET | `/api/mesas` | Lista todas | 200 | — |
| GET | `/api/mesas/{id}` | Una mesa | 200 | 404 |
| POST | `/api/mesas` | Crea | 201 | 400 (validación / número repetido) |
| PUT | `/api/mesas/{id}` | Actualiza | 200 | 400, 404 |
| DELETE | `/api/mesas/{id}` | Elimina | 204 | 404 |

`Mesa` usa valores fijos (enums): `tipo` = DOS / CUATRO / EXTRA · `zona` = INTERIOR / VEREDA / BARRA · `estado` = DISPONIBLE / OCUPADA / RESERVADA.

---

## 8. Receta: cómo agregar un CRUD nuevo (ej. `Cliente`)

1. Crear la carpeta `cliente/` y dentro:
   1. `Cliente.java` — el modelo con sus campos.
   2. `ClienteRepositorio.java` — la interfaz (`listar`, `buscarPorId`, `guardar`, `eliminar`, `existePorId`...).
   3. `ClienteRepositorioEnMemoria.java` — copia de otro `*EnMemoria`, cambiando el tipo. Lleva `@Repository`.
   4. `dto/ClienteSolicitud.java` — `record` con los campos de entrada + `@NotBlank`, `@Email`, etc.
   5. `dto/ClienteRespuesta.java` — `record` de salida + método `desde(Cliente)`.
   6. `ClienteServicio.java` — `@Service`, recibe el repositorio por constructor, métodos `listar/obtener/crear/actualizar/eliminar` con sus validaciones (lanzar `ReglaNegocioException` / `RecursoNoEncontradoException`).
   7. `ClienteControlador.java` — `@RestController`, `@RequestMapping("/api/clientes")`, un método por operación con su `@GetMapping` / `@PostMapping` / etc.
2. **No hay que tocar nada más.** Spring detecta las clases nuevas por sus anotaciones,
   el manejador de errores ya cubre las excepciones, y Swagger muestra el recurso nuevo solo.
3. (Opcional) Añadir datos de ejemplo en `seed/CargadorDatosIniciales.java`.
4. Añadir pruebas en `src/test/java/.../cliente/`.
```
