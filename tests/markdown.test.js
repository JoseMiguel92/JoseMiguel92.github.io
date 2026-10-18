/*
 * Tests for the pure markdown-to-HTML renderer (js/markdown.js).
 *
 * Only built-in Node modules are used: node:test, node:assert/strict, node:fs
 * and node:path. No dependencies, no build step (RN-1, RN-4).
 *
 * The assertions describe what spec 001 requires (RF-1, RF-4, RF-5, RF-6,
 * RN-2, CF-3, CF-4, CF-5, CF-6, CF-12, CF-13) and are written against the real
 * behaviour of the renderer produced by T1.
 *
 * Known accepted discrepancy: the plan ("Diseño del renderizador") lists the
 * inline order as code -> escape -> bold -> italic -> links, but the renderer
 * really runs code -> escape -> images -> links -> bold -> italic. This is
 * intentional: links are resolved before emphasis and the destination of each
 * anchor is stashed as a placeholder, so emphasis can never rewrite the href
 * (the visible label still receives bold/italic/code). See the regression
 * tests below. The plan wording is out of date.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { renderMarkdown } = require(path.join(__dirname, '..', 'js', 'markdown.js'));

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
}

// ---------------------------------------------------------------------------
// Supported subset (RF-1, RF-2, CF-3)
// ---------------------------------------------------------------------------

test('empty or whitespace-only input renders an empty string', () => {
  assert.equal(renderMarkdown(''), '');
  assert.equal(renderMarkdown('   \n  \n'), '');
  assert.equal(renderMarkdown('\n\n'), '');
});

test('headings map to h1, h2 and h3 only', () => {
  assert.equal(renderMarkdown('# Uno'), '<h1>Uno</h1>');
  assert.equal(renderMarkdown('## Dos'), '<h2>Dos</h2>');
  assert.equal(renderMarkdown('### Tres'), '<h3>Tres</h3>');
});

test('paragraphs join consecutive lines with a single space and trim them', () => {
  assert.equal(renderMarkdown('hola\nmundo'), '<p>hola mundo</p>');
  assert.equal(renderMarkdown('  hola  \n  mundo  '), '<p>hola mundo</p>');
});

test('a line that opens a block interrupts the paragraph in progress', () => {
  const cases = [
    ['texto\n# titulo', '<p>texto</p>\n<h1>titulo</h1>'],
    ['texto\n---', '<p>texto</p>\n<hr>'],
    ['texto\n> cita', '<p>texto</p>\n<blockquote>cita</blockquote>'],
    ['texto\n- item', '<p>texto</p>\n<ul>\n<li>item</li>\n</ul>'],
    ['texto\n1. item', '<p>texto</p>\n<ol>\n<li>item</li>\n</ol>'],
    ['texto\n```\nx', '<p>texto</p>\n<pre><code>x</code></pre>'],
  ];
  for (const [input, expected] of cases) {
    assert.equal(renderMarkdown(input), expected, `input: ${JSON.stringify(input)}`);
  }
});

test('unordered lists accept both "- " and "* " markers at root level', () => {
  assert.equal(renderMarkdown('- a\n- b'), '<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
  assert.equal(renderMarkdown('* a\n* b'), '<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
});

test('ordered lists use the "1. " marker at root level', () => {
  assert.equal(renderMarkdown('1. a\n2. b'), '<ol>\n<li>a</li>\n<li>b</li>\n</ol>');
});

test('bold, italic and inline code are rendered', () => {
  assert.equal(renderMarkdown('**fuerte**'), '<p><strong>fuerte</strong></p>');
  assert.equal(renderMarkdown('*cursiva*'), '<p><em>cursiva</em></p>');
  assert.equal(renderMarkdown('_cursiva_'), '<p><em>cursiva</em></p>');
  assert.equal(renderMarkdown('un `code` inline'), '<p>un <code>code</code> inline</p>');
});

test('inline code content is escaped and never reformatted', () => {
  assert.equal(renderMarkdown('`x<y & z`'), '<p><code>x&lt;y &amp; z</code></p>');
  assert.equal(renderMarkdown('`**no negrita**`'), '<p><code>**no negrita**</code></p>');
});

test('fenced code ignores the info string and escapes its content', () => {
  assert.equal(
    renderMarkdown('```js\nconst x = 1 < 2;\n```'),
    '<pre><code>const x = 1 &lt; 2;</code></pre>',
  );
  assert.equal(renderMarkdown('```\nplain\n```'), '<pre><code>plain</code></pre>');
});

test('an unclosed fence consumes the rest of the document', () => {
  assert.equal(renderMarkdown('```\nline a\nline b'), '<pre><code>line a\nline b</code></pre>');
});

test('blockquote joins consecutive lines and has no inner paragraph', () => {
  assert.equal(renderMarkdown('> a\n> b'), '<blockquote>a b</blockquote>');
  assert.equal(renderMarkdown('> solo'), '<blockquote>solo</blockquote>');
});

test('an horizontal rule needs three or more dashes with no indentation', () => {
  assert.equal(renderMarkdown('---'), '<hr>');
  assert.equal(renderMarkdown('-----   '), '<hr>');
  assert.equal(renderMarkdown('  ---'), '<p>---</p>');
  assert.equal(renderMarkdown('--'), '<p>--</p>');
});

test('*** and ___ are plain text, not rules', () => {
  assert.equal(renderMarkdown('***'), '<p>***</p>');
  assert.equal(renderMarkdown('___'), '<p>___</p>');
});

// ---------------------------------------------------------------------------
// Inline order (links before emphasis)
// ---------------------------------------------------------------------------

test('links are resolved before emphasis so URLs with "_" survive intact', () => {
  // If emphasis ran first, `a_b` would become <em>b</em> and break the URL.
  assert.equal(
    renderMarkdown('[t](http://example.com/a_b)'),
    '<p><a href="http://example.com/a_b">t</a></p>',
  );
});

// ---------------------------------------------------------------------------
// Regression: the link destination must never be touched by emphasis
// (RF-5, CF-2). Two or more "_" used to be turned into <em> inside href.
// ---------------------------------------------------------------------------

test('RF-5: a destination with two "_" stays intact inside href', () => {
  const html = renderMarkdown('[x](https://a.com/p_q_r)');
  assert.equal(html, '<p><a href="https://a.com/p_q_r">x</a></p>');
  assert.ok(!html.includes('<em>'), 'the destination must not contain <em>');
});

test('RF-5: a destination with three "_" stays intact inside href', () => {
  const html = renderMarkdown('[x](https://a.com/a_b_c_d)');
  assert.equal(html, '<p><a href="https://a.com/a_b_c_d">x</a></p>');
  assert.ok(!html.includes('<em>'), 'the destination must not contain <em>');
});

test('RF-5: a destination with a query string is escaped but not reformatted', () => {
  const html = renderMarkdown('[x](https://a.com/p?x=1&y=2)');
  assert.equal(html, '<p><a href="https://a.com/p?x=1&amp;y=2">x</a></p>');
  assert.ok(!html.includes('<em>'), 'the destination must not contain <em>');
});

test('RF-5: a relative destination with "_" stays intact inside href', () => {
  const html = renderMarkdown('[x](carpeta/carta_nueva_v2.pdf)');
  assert.equal(html, '<p><a href="carpeta/carta_nueva_v2.pdf">x</a></p>');
  assert.ok(!html.includes('<em>'), 'the destination must not contain <em>');
});

test('RF-5: a mailto destination with "_" stays intact inside href', () => {
  const html = renderMarkdown('[x](mailto:jose_miguel_benayas@example.com)');
  assert.equal(html, '<p><a href="mailto:jose_miguel_benayas@example.com">x</a></p>');
  assert.ok(!html.includes('<em>'), 'the destination must not contain <em>');
});

test('RF-5: the whole href attribute of a "_"-rich URL has no <em>/<strong>/<code>', () => {
  const cases = [
    '[x](https://a.com/p_q_r)',
    '[x](https://a.com/a_b_c_d)',
    '[x](https://a.com/p?x=1&y=2)',
    '[x](carpeta/carta_nueva_v2.pdf)',
    '[x](mailto:jose_miguel_benayas@example.com)',
  ];
  for (const input of cases) {
    const html = renderMarkdown(input);
    const match = /href="([^"]*)"/.exec(html);
    assert.ok(match, `an href was expected for input: ${input}`);
    const href = match[1];
    assert.ok(!href.includes('<em>'), `href must not contain <em> (input: ${input})`);
    assert.ok(!href.includes('<strong>'), `href must not contain <strong> (input: ${input})`);
    assert.ok(!href.includes('<code>'), `href must not contain <code> (input: ${input})`);
    assert.ok(!html.includes('<em>'), `no <em> at all for input: ${input}`);
  }
});

test('RF-5: the real LinkedIn link from cv-data/cv.md keeps its href intact', () => {
  const url =
    'https://www.linkedin.com/posts/josemiguelgarciabenayas_webdevelopment-angular-springboot-share-7416402479044603905-owc2/?utm_source=share&utm_medium=member_desktop&rcm=ACoAABOTm2YBjaCf_4vkUF81B7X1-7p6JTc9qB4';
  const html = renderMarkdown(`- [Leer más](${url})`);
  assert.equal(
    html,
    `<ul>\n<li><a href="${url.replace(/&/g, '&amp;')}">Leer más</a></li>\n</ul>`,
  );
  assert.ok(!html.includes('<em>'), 'the real CV link must not be broken by <em>');
});

test('RF-5: the visible link text still accepts bold, italic and inline code', () => {
  assert.equal(
    renderMarkdown('[**negrita** y _cursiva_ y `code`](https://a.com/p_q_r)'),
    '<p><a href="https://a.com/p_q_r"><strong>negrita</strong> y <em>cursiva</em> y <code>code</code></a></p>',
  );
  // Italic in plain text must keep working (RF-1), even next to a link.
  assert.equal(
    renderMarkdown('_cursiva_ y [x](https://a.com/p_q_r)'),
    '<p><em>cursiva</em> y <a href="https://a.com/p_q_r">x</a></p>',
  );
});

// ---------------------------------------------------------------------------
// CF-3: a markdown using the whole subset renders every construct correctly
// ---------------------------------------------------------------------------

test('CF-3: the full-subset fixture renders each construct correctly', () => {
  const expected = [
    '<h1>Currículum</h1>',
    '<h2>Perfil</h2>',
    '<p>Desarrollador de software con experiencia en aplicaciones web. Le importan el código limpio y los tests.</p>',
    '<h2>Experiencia</h2>',
    '<ul>',
    '<li>Desarrollo de aplicaciones con <strong>JavaScript</strong> y <em>CSS</em>.</li>',
    '<li>Uso de <code>node --test</code> para las pruebas automáticas.</li>',
    '<li>Colaboración con equipos distribuidos.</li>',
    '</ul>',
    '<ol>',
    '<li>Primer puesto</li>',
    '<li>Segundo puesto</li>',
    '</ol>',
    '<blockquote>El código se lee más veces de las que se escribe.</blockquote>',
    '<p><a href="https://example.com/portfolio">Ver portfolio</a> o <a href="mailto:hola@example.com">escribir</a>.</p>',
    '<h3>Código</h3>',
    '<pre><code>const greeting = &quot;hola&quot;;</code></pre>',
    '<hr>',
    '<p>Fin del documento.</p>',
  ].join('\n');

  assert.equal(renderMarkdown(readFixture('full-subset.md')), expected);
});

// ---------------------------------------------------------------------------
// CF-4 / RF-4: embedded HTML is escaped and never executed
// ---------------------------------------------------------------------------

test('CF-4: <script>alert(1)</script> is shown as text, not as markup', () => {
  const html = renderMarkdown('<script>alert(1)</script>');
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.ok(!html.includes('<script'), 'the output must not contain a real <script tag');
});

test('CF-4: the embedded-html fixture escapes script, div and img', () => {
  const html = renderMarkdown(readFixture('embedded-html.md'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('&lt;div class=&quot;caja&quot;&gt;'));
  assert.ok(html.includes('&lt;img src=&quot;x&quot;'));
  assert.ok(!/<script|<div|<img/.test(html), 'no raw HTML tags from the input may survive');
});

test('RF-4: every HTML-sensitive character in the input is escaped', () => {
  assert.equal(renderMarkdown('a & b'), '<p>a &amp; b</p>');
  assert.equal(renderMarkdown('a < b > c'), '<p>a &lt; b &gt; c</p>');
  assert.equal(renderMarkdown('"a" y \'b\''), '<p>&quot;a&quot; y &#39;b&#39;</p>');
});

// ---------------------------------------------------------------------------
// CF-5 / RF-5: link allowlist
// ---------------------------------------------------------------------------

test('CF-5: http, https (case-insensitive), mailto and relative paths become links', () => {
  const safe = [
    ['http://example.com', '<p><a href="http://example.com">t</a></p>'],
    ['HTTPS://example.com', '<p><a href="HTTPS://example.com">t</a></p>'],
    ['mailto:hola@example.com', '<p><a href="mailto:hola@example.com">t</a></p>'],
    ['carta.pdf', '<p><a href="carta.pdf">t</a></p>'],
    ['ruta/a/fichero.pdf', '<p><a href="ruta/a/fichero.pdf">t</a></p>'],
  ];
  for (const [url, expected] of safe) {
    assert.equal(renderMarkdown(`[t](${url})`), expected, `url: ${url}`);
  }
});

test('CF-5: javascript, data, tel, ftp, anchors, empty and protocol-relative stay as text', () => {
  const unsafe = [
    'javascript:alert(1)',
    'data:text/html,x',
    'tel:+34600000000',
    'ftp://example.com/fichero',
    '#seccion',
    '',
    '//example.com/x',
  ];
  for (const url of unsafe) {
    const html = renderMarkdown(`[t](${url})`);
    assert.equal(html, `<p>[t](${url})</p>`, `url: ${url}`);
    assert.ok(!html.includes('<a'), `no anchor expected for url: ${url}`);
  }
});

test('CF-5: the link-schemes fixture keeps unsafe destinations as text', () => {
  const html = renderMarkdown(readFixture('link-schemes.md'));
  for (const literal of [
    '[javascript](javascript:alert(1))',
    '[datos](data:text/html,x)',
    '[telefono](tel:+34600000000)',
    '[ftp](ftp://example.com/fichero)',
    '[ancla](#seccion)',
    '[vacio]()',
    '[protocolo-relativo](//example.com/x)',
  ]) {
    assert.ok(html.includes(literal), `expected literal text: ${literal}`);
  }
  for (const href of [
    'href="http://example.com"',
    'href="https://example.com"',
    'href="mailto:hola@example.com"',
    'href="carta.pdf"',
  ]) {
    assert.ok(html.includes(href), `expected link: ${href}`);
  }
});

// ---------------------------------------------------------------------------
// CF-6 / RF-6: constructions outside the subset are shown as plain text
// ---------------------------------------------------------------------------

test('CF-6: h4 and deeper levels are plain text', () => {
  assert.equal(renderMarkdown('#### Nivel cuatro'), '<p>#### Nivel cuatro</p>');
  assert.equal(renderMarkdown('##### Nivel cinco'), '<p>##### Nivel cinco</p>');
});

test('CF-6: tables and images are plain text, never <table> or <img>', () => {
  assert.equal(
    renderMarkdown('| a | b |\n| - | - |'),
    '<p>| a | b | | - | - |</p>',
  );
  assert.equal(
    renderMarkdown('![Diagrama](images/diagrama.png)'),
    '<p>![Diagrama](images/diagrama.png)</p>',
  );
});

test('CF-6: nested list lines are plain text, not a nested <ul>', () => {
  assert.equal(
    renderMarkdown('- padre\n  - hijo'),
    '<ul>\n<li>padre</li>\n</ul>\n<p>- hijo</p>',
  );
});

test('CF-6: the unsupported fixture renders as plain text', () => {
  const html = renderMarkdown(readFixture('unsupported.md'));
  assert.ok(!/<h4|<h5|<table|<img/.test(html), 'no unsupported element may be emitted');
  assert.ok(html.includes('<p>#### Nivel cuatro</p>'));
  assert.ok(html.includes('<p>##### Nivel cinco</p>'));
  assert.ok(html.includes('<p>| Lenguaje | Nivel | | --- | --- | | JavaScript | Alto |</p>'));
  assert.ok(html.includes('<p>![Diagrama](images/diagrama.png)</p>'));
  assert.ok(html.includes('<ul>\n<li>Elemento padre</li>\n</ul>\n<p>- Elemento anidado</p>'));
});

// ---------------------------------------------------------------------------
// RN-2 / CF-12: the renderer is pure and DOM-free
// ---------------------------------------------------------------------------

test('CF-12: js/markdown.js does not reference document or window', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'markdown.js'), 'utf8');
  assert.ok(!source.includes('document'), 'the renderer must not mention document');
  assert.ok(!source.includes('window'), 'the renderer must not mention window');
});

test('RN-2: the same input always yields the same output', () => {
  const input = readFixture('full-subset.md');
  assert.equal(renderMarkdown(input), renderMarkdown(input));
  assert.equal(renderMarkdown('# h\ntexto'), renderMarkdown('# h\ntexto'));
});

test('RN-2: the renderer tolerates non-string input without throwing', () => {
  assert.equal(renderMarkdown(undefined), '');
  assert.equal(renderMarkdown(null), '');
});
