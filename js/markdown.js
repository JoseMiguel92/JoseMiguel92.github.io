/*
 * Pure markdown-to-HTML renderer for the small subset used by the CV page.
 *
 * The function is pure: same input always yields the same output. It has no
 * state, no clock, no network, no disk access and never touches the DOM.
 *
 * Exposed in two ways without ES modules:
 *   - Node:    require('./js/markdown.js').renderMarkdown(markdown)
 *   - Browser: the global MarkdownRenderer = { renderMarkdown }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MarkdownRenderer = factory();
  }
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Null character delimits internal placeholders; it never appears in HTML output.
  var MARK = '\u0000';

  // Escape every HTML-sensitive character coming from the input (RF-4).
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // A destination only becomes a link when it is http(s), mailto or a relative path (RF-5).
  function isSafeUrl(url) {
    if (!url) return false;
    if (/^https?:\/\//i.test(url)) return true;
    if (/^mailto:/i.test(url)) return true;
    // Anchors and protocol-relative destinations are not part of the subset.
    if (url.charAt(0) === '#') return false;
    if (url.slice(0, 2) === '//') return false;
    // Any other explicit scheme (javascript:, data:, tel:, ftp:, ...) is rejected.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return false;
    // No scheme left: it is a relative path.
    return true;
  }

  // Inline level: code, links, bold, italic. Returns HTML built only by this renderer.
  function renderInline(text) {
    var store = [];

    function stash(html) {
      store.push(html);
      return MARK + (store.length - 1) + MARK;
    }

    // 1. Pull inline code out first so its interior is never reformatted.
    var withCode = String(text).replace(/`([^`]+)`/g, function (match, code) {
      return stash('<code>' + escapeHtml(code) + '</code>');
    });

    // 2. Escape the remaining HTML of the input.
    var escaped = escapeHtml(withCode);

    // 3. Images are outside the subset: keep the literal text, never emit an <img>.
    escaped = escaped.replace(/!\[[^\]]*\]\([^)]*\)/g, function (match) {
      return stash(match);
    });

    // 4. Links. Only safe destinations yield an anchor; anything else stays literal.
    // The destination is stashed too: it is already escaped and must never be
    // touched by the emphasis rules below (a URL with two or more "_" used to
    // become <em> inside href). The label stays in place so it keeps receiving
    // bold/italic/code.
    escaped = escaped.replace(/\[([^\]]*)\]\(([^)]*)\)/g, function (match, label, url) {
      if (!isSafeUrl(url)) return stash(match);
      return '<a href="' + stash(url) + '">' + label + '</a>';
    });

    // 5. Bold before italic so ** does not get eaten by the single-asterisk rule.
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');

    // 6. Restore the stashed code and literal fragments.
    return escaped.replace(new RegExp(MARK + '(\\d+)' + MARK, 'g'), function (match, index) {
      return store[Number(index)];
    });
  }

  // Does this line open a block? Used to end the current paragraph.
  function startsBlock(line) {
    return (
      /^```/.test(line) ||
      /^(#{1,3}) /.test(line) ||
      /^-{3,}\s*$/.test(line) ||
      /^>/.test(line) ||
      /^[-*] /.test(line) ||
      /^\d+\. /.test(line)
    );
  }

  // Block level: headings, rules, quotes, lists, fenced code and paragraphs.
  function renderMarkdown(markdown) {
    if (typeof markdown !== 'string') return '';
    var normalized = markdown.replace(/\r\n?/g, '\n');
    if (normalized.trim() === '') return '';

    var lines = normalized.split('\n');
    var blocks = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (line.trim() === '') {
        i += 1;
        continue;
      }

      // Fenced code block: ``` ... ```, content kept verbatim (escaped).
      if (/^```/.test(line)) {
        var codeLines = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i])) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1; // Skip the closing fence.
        blocks.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        continue;
      }

      // Headings, levels 1 to 3 only.
      var heading = /^(#{1,3}) (.*)$/.exec(line);
      if (heading) {
        var level = heading[1].length;
        blocks.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
        i += 1;
        continue;
      }

      // Horizontal rule.
      if (/^-{3,}\s*$/.test(line)) {
        blocks.push('<hr>');
        i += 1;
        continue;
      }

      // Blockquote: consecutive lines sharing the quote marker.
      if (/^>/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^>/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i += 1;
        }
        blocks.push('<blockquote>' + renderInline(quoteLines.join(' ')) + '</blockquote>');
        continue;
      }

      // Root-level lists (unordered and ordered). Nesting is not part of the subset.
      if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
        var ordered = /^\d+\. /.test(line);
        var items = [];
        while (i < lines.length) {
          var item = ordered ? /^\d+\. (.*)$/.exec(lines[i]) : /^[-*] (.*)$/.exec(lines[i]);
          if (!item) break;
          items.push('<li>' + renderInline(item[1]) + '</li>');
          i += 1;
        }
        var tag = ordered ? 'ol' : 'ul';
        blocks.push('<' + tag + '>\n' + items.join('\n') + '\n</' + tag + '>');
        continue;
      }

      // Paragraph: consecutive lines until a blank line or the start of a block.
      var paragraph = [];
      while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      blocks.push('<p>' + renderInline(paragraph.join(' ')) + '</p>');
    }

    return blocks.join('\n');
  }

  return { renderMarkdown: renderMarkdown };
});
