# Spec 001 — Página de CV desde markdown

Estado: borrador

## Contexto y objetivo

Página del portfolio que muestra el CV completo legible a partir de un markdown, para no mantenerlo a mano en HTML. Es la única fuente del contenido: se edita el markdown y la página refleja el cambio.

## Usuarios

- Visitante del portfolio: lee el CV.
- Propietario: escribe y mantiene el CV en markdown.

## Historias de usuario

- HU-1. Como visitante, quiero leer el CV completo legible al abrir la página.
- HU-2. Como propietario, quiero editar un solo markdown y verlo renderizado.

## Definiciones

- **Markdown de origen**: el único documento markdown del repositorio con el contenido del CV; fuente única de verdad.
- **Subconjunto soportado**: títulos `#`/`##`/`###`, párrafos, listas ordenadas y no ordenadas, enlaces, negrita, cursiva, código inline y en bloque, citas y línea horizontal (`---`).
- **Ruta relativa**: destino de enlace sin esquema (p. ej. `carta.pdf`), resuelto respecto a la página.

## Requisitos funcionales

- RF-1: CUANDO el visitante abre la página del CV, EL SISTEMA muestra el CV renderizado a partir del markdown de origen.
- RF-2: EL SISTEMA obtiene el contenido del markdown de origen del repositorio, sin copias ni duplicados; editarlo cambia lo mostrado.
- RF-3: SI el markdown de origen no puede leerse, ENTONCES EL SISTEMA muestra en la página un mensaje de error en castellano y no deja la página en blanco.
- RF-4: EL SISTEMA escapa el HTML presente en la entrada y solo genera HTML propio a partir del subconjunto soportado.
- RF-5: EL SISTEMA solo convierte en enlace destinos con esquema `http`, `https` o `mailto`, o rutas relativas; cualquier otro destino (`javascript:`, `data:`, `tel:`, `ftp:`, anclas `#…` y enlaces sin esquema) se muestra como texto.
- RF-6: SI el markdown usa construcciones fuera del subconjunto (`####` o más, tablas, imágenes, listas anidadas), ENTONCES EL SISTEMA las muestra como texto plano.
- RF-7: EL SISTEMA aplica a la página del CV los estilos de su hoja de estilos externa, propia de esta página.
- RF-8: EL SISTEMA no usa estilos embebidos ni atributos de estilo en el marcado de la página del CV.
- RF-9: CUANDO la página se abre en un móvil, EL SISTEMA adapta el contenido al ancho sin scroll horizontal.
- RF-10: CUANDO el sistema operativo está en modo oscuro, EL SISTEMA aplica la paleta oscura; en caso contrario, la clara.
- RF-11: EL SISTEMA muestra los textos de interfaz en castellano y un título de pestaña propio de la página del CV.

## Requisitos no funcionales

- RN-1: Sin dependencias, frameworks, CDN ni build; se sirve como web estática, sin instalación.
- RN-2: La conversión markdown→HTML es lógica pura, independiente de la interfaz y del navegador.
- RN-3: Textos de interfaz en castellano; identificadores y comentarios de código en inglés.
- RN-4: La conversión markdown→HTML se prueba con `node --test`, sin dependencias, y las pruebas deben pasar.

## Casos límite

- Markdown de origen inexistente o vacío → RF-3.
- Error de lectura del markdown → RF-3 (mensaje en página, no en blanco).
- Markdown con `<script>`, `<div>` u otro HTML incrustado → RF-4.
- Enlaces con esquemas peligrosos, `tel:`, `ftp:`, anclas o sin esquema → RF-5.
- Construcciones fuera del subconjunto → RF-6.
- CV muy extenso sin romper el diseño.

## Fuera de alcance

- Editar o guardar el CV desde la página; cargar un fichero elegido por el visitante.
- Backend o cualquier cómputo en servidor.
- Modificar `index.html` o que este referencie la hoja de estilos del CV.
- Navegación entre secciones del CV (enlaces con ancla).

## Criterios de finalización

- CF-1: Servida la página, se ve el CV renderizado desde el markdown de origen (RF-1, RF-2).
- CF-2: El contenido renderizado coincide con el del markdown de origen (RF-1, RF-2).
- CF-3: Con un markdown de ejemplo que usa todo el subconjunto, cada constructo (títulos, párrafos, listas, enlaces, negrita, cursiva, código inline y en bloque, citas y `---`) se renderiza correctamente (RF-1).
- CF-4: Un markdown con `<script>alert(1)</script>` se muestra como texto y no se ejecuta (RF-4).
- CF-5: Un enlace `javascript:`/`data:`/`tel:`/`ftp:`/ancla/sin esquema se muestra como texto; los `http`/`https`/`mailto` y las rutas relativas funcionan (RF-5).
- CF-6: Tablas, imágenes, listas anidadas y `####`+ se muestran como texto plano (RF-6).
- CF-7: Si el markdown de origen no se puede leer, la página muestra un error en castellano y no queda en blanco (RF-3).
- CF-8: A 360 px de ancho no hay scroll horizontal, el tamaño de fuente es ≥ 16 px y el modo claro y oscuro se comprueban en DevTools (RF-9, RF-10).
- CF-9: La consola del navegador queda limpia al cargar la página (RN-1).
- CF-10: El marcado de la página del CV no contiene `<style>` ni `style="…"` (RF-8).
- CF-11: Los textos visibles están en castellano y la pestaña muestra el título propio de la página (RF-11, RN-3).
- CF-12: Ningún fichero de la lógica de conversión referencia `document` ni `window` (RN-2).
- CF-13: `node --test` pasa en verde para la conversión (RN-4).
- CF-14: El diff de `index.html` respecto a `master` está vacío (fuera de alcance).

## Dudas abiertas

- Ninguna.
