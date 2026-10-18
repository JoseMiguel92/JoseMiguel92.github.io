# Tareas 001 — Página de CV desde markdown

Plan: `specs/001-cv-markdown-page/plan.md`. Spec:
`specs/001-cv-markdown-page/spec.md`.

## Reglas globales (aplican a todas las tareas)

- No se modifica `index.html` ni ningún otro fichero existente, salvo `MEMORY.md`
  en la última tarea.
- Sin dependencias, sin frameworks, sin CDN y sin build; sin módulos ES
  (`type="module"`).
- La lógica de `js/markdown.js` no toca `document` ni `window`.
- Identificadores y comentarios de código en inglés; textos de interfaz en
  castellano.
- Verificación con Chrome DevTools MCP en las tareas que afecten a la interfaz.
- Cualquier fichero nuevo no contemplado en el plan requiere preguntar antes de
  crearlo (`AGENTS.md`).

## Tareas

- [x] **T1. Renderizador markdown→HTML puro.** RF-1, RF-4, RF-5, RF-6, RN-2, RN-3, CF-12
  - Crea: `js/markdown.js`.
  - No toca: `index.html`, `cv-data/`, `styles-cv.css`, `cv.html`.
  - Hecho cuando: `node -e "console.log(require('./js/markdown.js').renderMarkdown('# h'))"` imprime `<h1>h</h1>`, y `js/markdown.js` no contiene las palabras `document` ni `window`.

- [x] **T2. Tests del renderizador + fixtures.** CF-3, CF-4, CF-5, CF-6, CF-13, RN-4
  - Crea: `tests/markdown.test.js`, `tests/fixtures/*.md` (uno con todo el
    subconjunto; casos de HTML incrustado; esquemas de enlace).
  - No toca: ningún fichero fuera de `tests/`.
  - Hecho cuando: `node --test` pasa en verde e incluye aserciones para: subconjunto completo (CF-3), `<script>alert(1)</script>` como texto (CF-4), `javascript:`/`data:`/`tel:`/`ftp:`/ancla/sin esquema como texto y `http`/`https`/`mailto`/relativa como enlace (CF-5), y tablas/imágenes/`####`+/listas anidadas como texto plano (CF-6).

- [x] **T3. Markdown de origen transcrito desde `index.html`.** RF-2, CF-2
  - Crea: `cv-data/cv.md`.
  - No toca: `index.html` (solo se lee como fuente).
  - Hecho cuando: `cv-data/cv.md` recoge las secciones del CV actual (descripción, experiencia, formación, proyectos personales, stack tecnológico, contacto, idiomas) usando solo el subconjunto soportado, sin imágenes, sin tablas y sin listas anidadas.

- [x] **T4. Página `cv.html` + glue de interfaz.** RF-1, RF-3, RF-8, RF-11, CF-1, CF-7, CF-9, CF-10, CF-11
  - Crea: `cv.html`, `js/cv-page.js`.
  - No toca: `index.html`, `styles-cv.css`, `js/markdown.js`, `cv-data/cv.md`.
  - Hecho cuando: servida la página, se ve el CV renderizado y la consola queda limpia (CF-1, CF-9); sin `cv-data/cv.md` se ve un mensaje en castellano y la página no queda en blanco (CF-7); el título de pestaña es propio y los textos están en castellano (CF-11); `cv.html` no contiene `<style` ni `style="` (CF-10).

- [x] **T5. Estilos de la página del CV.** RF-7, RF-9, RF-10, CF-8
  - Crea: `styles-cv.css`.
  - No toca: `index.html` (no lo referencia), `cv.html` (solo se enlaza con `<link rel="stylesheet" href="styles-cv.css">`), `js/`.
  - Hecho cuando: con DevTools a 360 px no hay scroll horizontal, la fuente base es ≥ 16 px, y el modo claro y oscuro (`prefers-color-scheme`) se ven correctamente y coherentes con la paleta gris de `index.html` (CF-8); y `cv.html` referencia `styles-cv.css` con `<link rel="stylesheet" href="styles-cv.css">`.

- [x] **T6. Verificación final CF-1…CF-14 y `MEMORY.md`.** CF-1…CF-14
  - Crea: nada. Modifica: `MEMORY.md`.
  - No toca: el resto de ficheros existentes.
  - Hecho cuando: recorridos CF-1…CF-14 con Chrome DevTools MCP y `node --test` en verde (CF-13); `git diff master -- index.html` vacío (CF-14); `MEMORY.md` actualizado con el estado y las decisiones.

## Dependencias

- T2 depende de T1. T3 es independiente (puede hacerse tras T2). T4 depende de
  T1 y T3. T5 depende de T4. T6 depende de todas.

## Nota de coherencia

Cualquier fichero nuevo no contemplado en el plan requiere preguntar antes de
crearlo (`AGENTS.md`). Si aparece una decisión nueva, se refleja primero en la
spec, luego aquí y por último en el código.
