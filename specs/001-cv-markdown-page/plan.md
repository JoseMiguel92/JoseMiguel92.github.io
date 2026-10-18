# Plan 001 — Página de CV desde markdown

Referencia: `specs/001-cv-markdown-page/spec.md` (aprobada). Cada parte del plan
rastrea a RF/RN/CF. Solo se crean ficheros nuevos; `index.html` no se toca.

## Enfoque técnico

Web estática sin dependencias, sin frameworks, sin CDN y sin build. El
renderizador markdown→HTML es código propio, puro y separado de la interfaz.
El contenido vive en un único markdown del repositorio (`cv-data/cv.md`) que la
página carga con `fetch` relativo a sí misma. Consecuencia aceptada: la página
**no** funciona en `file://`; se sirve como web estática (RF-2, RN-1).

## Estructura de ficheros

Nuevos (raíz y carpetas existentes):
- `cv.html` — estructura de la página del CV. Scripts **clásicos**, sin
  `type="module"`, en este orden y al final del `<body>`:
  1. `<script src="js/markdown.js"></script>` (define el renderizador).
  2. `<script src="js/cv-page.js"></script>` (carga y pinta).
  Sin `<style>`, sin `style="…"` y sin `<script>` inline (RF-8, CF-10).
- `styles-cv.css` (raíz, exclusivo de esta página) — todos los estilos, claro y
  oscuro (RF-7, RF-10); `cv.html` lo referencia con
  `<link rel="stylesheet" href="styles-cv.css">` (RF-8).
- `js/markdown.js` — renderizador puro; no toca `document` ni `window`
  (RF-4, RF-5, RF-6, RN-2, CF-12).
- `js/cv-page.js` — interfaz: `fetch('cv-data/cv.md')`, llama al renderizador y
  lo inserta; gestiona el error (RF-1, RF-3).
- `cv-data/cv.md` — markdown de origen, única fuente de verdad (RF-2).
- `tests/markdown.test.js` + `tests/fixtures/*.md` — pruebas de la conversión
  (RN-4, CF-13).

Modificados: `MEMORY.md` (solo en la última tarea). **No se modifica**
`index.html` (CF-14).

## Diseño del renderizador (`js/markdown.js`)

**API pública:** `renderMarkdown(markdown) -> string` (HTML). Función pura: misma
entrada, misma salida; sin estado, sin DOM, sin red.

**Exposición dual sin módulos ES** (esqueleto orientativo):
```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MarkdownRenderer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // ... return { renderMarkdown };
});
```
En el navegador expone el global `MarkdownRenderer`; en Node funciona con
`require('./js/markdown.js')`. No usa `window` ni `document` (CF-12).

**Reglas de parseo (subconjunto soportado, RF-1):**
- Recorrido por líneas; primero se extraen los bloques de código cercados
  (``` … ```) para que su interior no se interprete.
- Bloque: `# `/`## `/`### ` → `h1`/`h2`/`h3`. `---` en línea propia → `hr`.
  `> ` → `blockquote` (agrupa líneas consecutivas). Líneas en blanco separan
  párrafos. Listas: `- `/`* ` (desordenadas) y `1. ` (ordenadas) a nivel raíz.
- Inline: primero los `code` inline, luego se **escapa el HTML** del texto y por
  último negrita `**…**`, cursiva `*…*`/`_…_` y enlaces `[texto](destino)`.
- **No soportado → texto plano (RF-6):** `####`+ (se emite el texto literal),
  tablas (`|`), imágenes (`![…](…)`, se emite el literal, no un `<img>`) y
  listas anidadas (líneas indentadas se tratan como párrafo).

## Seguridad (RF-4, RF-5)

- Todo texto de entrada se escapa (`&`, `<`, `>`, `"`, `'`) antes de insertarse;
  solo se emiten etiquetas generadas por el renderizador (RF-4).
- Destino de enlace: se convierte en `<a href="…">` **solo** si pasa la
  allowlist: `http://`, `https://`, `mailto:` o ruta relativa (sin esquema y sin
  empezar por `#`). En cualquier otro caso (`javascript:`, `data:`, `tel:`,
  `ftp:`, anclas `#…`, destinos sin esquema inválidos) se deja el texto literal
  sin enlace (RF-5). El valor de `href` se escapa siempre.

## Estilos (`styles-cv.css`) (RF-7, RF-9, RF-10, RF-11)

- Variables CSS (`--`) para la paleta y `@media (prefers-color-scheme: dark)`,
  replicando la paleta gris de `index.html`: página `gray-200`/`gray-900`,
  tarjetas `gray-900`/`gray-700`, títulos `gray-400`/`gray-700`, textos
  `gray-700`/`gray-300`.
- Responsive: ancho fluido, sin scroll horizontal a 360 px; tamaño base de fuente
  ≥ 16 px (CF-8).
- Estilos para todo lo que genera el renderizador: `h1`–`h3`, `p`, `ul`/`ol`/`li`,
  `a`, `strong`, `em`, `code`, `pre`, `blockquote`, `hr` y el contenedor del CV.

## Errores (RF-3, CF-7)

Si `fetch` falla o el markdown viene vacío, `js/cv-page.js` muestra en la página
un mensaje en castellano dentro de un contenedor visible (no se deja en blanco ni
se limita a la consola).

## Cómo se verifica

1. **Tests:** `node --test` en verde (CF-13, RN-4).
2. **Servir en local sin añadir nada al repo** (desde la raíz del proyecto; usa
   el Node que ya exige `node --test`, no instala dependencias):
   ```
   node -e "const h=require('http'),f=require('fs'),p=require('path');const m={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.md':'text/plain;charset=utf-8'};h.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/cv.html';const fp=p.join(process.cwd(),u);f.readFile(fp,(e,d)=>{if(e){s.writeHead(404);s.end('404');return}s.writeHead(200,{'Content-Type':m[p.extname(fp)]||'application/octet-stream'});s.end(d)})}).listen(8080)"
   ```
   Abrir `http://localhost:8080/cv.html` con Chrome DevTools MCP (CF-1, CF-9,
   CF-11). Alternativa si hay Python: `python -m http.server 8080`.
3. **Modo móvil y oscuro:** DevTools a 360 px y emulación de `prefers-color-scheme`
   (CF-8).
4. **CF-10:** `cv.html` no debe contener `<style` ni `style="`.
5. **CF-12:** `js/markdown.js` no debe contener `document` ni `window`.
6. **CF-14:** `git diff master -- index.html` debe estar vacío.

## Riesgos y decisiones abiertas

- **`file://` no funciona** (consecuencia aceptada de `fetch`): documentarlo; en
  local se usa el servidor del punto 2.
- **Ruta del `fetch`**: se usa `cv-data/cv.md` relativo a `cv.html`; funciona
  tanto en raíz de dominio como en GitHub Pages de proyecto (subruta).
- **HTML generado y `innerHTML`**: seguro solo si el renderizador siempre escapa;
  por eso RF-4/RF-5 tienen tests propios.
- **CV extenso**: parseo en una sola pasada; sin problema esperado.
- **Paleta de `index.html`**: en modo claro mezcla fondo claro con tarjetas
  oscuras; se replica tal cual para mantener coherencia visual.
