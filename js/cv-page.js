/*
 * Interface glue for the CV page.
 *
 * Loads the source markdown, renders it with the pure renderer (global
 * MarkdownRenderer) and injects the result. On any failure it shows a visible
 * message in Spanish instead of leaving the page blank (RF-3, CF-7).
 */
(function () {
  'use strict';

  // Relative to cv.html, so it works both at the domain root and in a subpath.
  var SOURCE_URL = 'cv-data/cv.md';

  function showError(errorElement) {
    errorElement.hidden = false;
  }

  async function loadCv(errorElement, contentElement) {
    try {
      var response = await fetch(SOURCE_URL);

      if (!response.ok) {
        showError(errorElement);
        return;
      }

      var markdown = await response.text();

      if (markdown.trim() === '') {
        showError(errorElement);
        return;
      }

      contentElement.innerHTML = MarkdownRenderer.renderMarkdown(markdown);
    } catch (error) {
      showError(errorElement);
    }
  }

  var errorElement = document.getElementById('cv-error');
  var contentElement = document.getElementById('cv-content');

  loadCv(errorElement, contentElement);
})();
