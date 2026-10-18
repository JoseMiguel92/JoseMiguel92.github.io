# MEMORY.md — Portfolio personal JoseMiguel92

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- `master`: `index.html` + `styles.css` + `app.js`, **sin commitear** (v0).
- Rama `spec/001-cv-markdown-page` (**sin commitear**): spec 001 implementada y
  verificada (CF-1…CF-14). Nuevos: `cv.html`, `js/cv-page.js` (glue de interfaz),
  `js/markdown.js` (renderizador markdown→HTML puro), `styles-cv.css`,
  `cv-data/cv.md` (CV transcrito desde `index.html`) y `tests/markdown.test.js`
  + 4 fixtures.
  - `node --test` → **36 tests, 0 fallos**; `git diff master -- index.html` vacío
    e `index.html` sigue abriéndose con doble clic.

## Decisiones (y por qué)

- `cv-data/cv.md` es la **fuente única de verdad** y `cv.html` la carga con
  `fetch`. Por eso **`cv.html` NO funciona con doble clic (`file://`)**: hay que
  servirla (GitHub Pages o servidor local); la nota antigua "se abre con doble
  clic" sigue valiendo solo para `index.html`.
- Renderizador **propio y puro** (sin `document` ni `window`): se prueba sin
  navegador con `node --test`, sin dependencias, frameworks, CDN ni build.
- `styles-cv.css` es **exclusiva de `cv.html`**; `index.html` ni la referencia.
- Interpretación fijada de **RF-5/CF-5** (redacción autocontradictoria): destino
  `http`/`https`/`mailto` o ruta relativa no vacía → enlace; destino vacío,
  esquema no permitido (`javascript:`, `data:`, `tel:`, `ftp:`) o ancla `#…` →
  texto plano. **Pendiente: que @planner reescriba esa frase de la spec.**
- En `styles-cv.css` hubo que **ajustar los grises del plan** (`gray-700` sobre
  `gray-900` y títulos `gray-700` sobre `gray-700` eran ilegibles): ahora texto
  `gray-300` y títulos `gray-400`/`gray-300`, con contraste ≥ 4,5:1.
- El **mensaje de error vive estático en `cv.html`** (dentro de un `<p hidden>`)
  y el JS solo lo muestra: así existe aunque el JS no cargue.

## Aprendizajes y errores a evitar

- **No dar por bueno un test de URLs con un solo `_`**: el bug real (`<em>`
  dentro del `href`) solo aparecía con **2 o más `_`**; se detectó al abrir la
  página, no con los tests. Corregido (los destinos se reservan con marcadores
  antes de aplicar énfasis) y con tests de regresión.
- **No fiarse del orden del inline que describe el plan** (desactualizado): los
  enlaces se resuelven antes de negrita/cursiva a propósito, para no romper URLs
  con `_`.
- Al hablar de "consola limpia" (CF-9), recordar el **404 de `/favicon.ico`**
  (petición por defecto del navegador; el repo no tiene favicon).
- Ojo con `netstat` en este Windows: sale en español y `grep LISTENING` no
  encuentra nada; buscar por `:puerto`.

## Próximos pasos

- Decidir si se commitea `spec/001-cv-markdown-page` y se fusiona en `master`, y
  que @planner corrija la redacción de RF-5/CF-5 en `spec.md`.
- Valorar añadir un favicon (evitaría el 404 en consola).
