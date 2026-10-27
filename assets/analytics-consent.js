/* Natəlka: analytics are disabled until the visitor explicitly opts in. */
(function () {
  "use strict";

  var KEY = "natelka_analytics_consent_v1";
  var COUNTER_ID = 113833393;
  var consent = null;
  var started = false;
  var panel = null;

  try {
    consent = window.localStorage.getItem(KEY);
  } catch (error) {
    // If storage is unavailable, ask again on the next visit.
  }

  function startAnalytics() {
    if (started) return;
    started = true;

    // Queue the Yandex.Metrika initialization until its script loads.
    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = window.ym.l || 1 * new Date();
    window.ym(COUNTER_ID, "init", {
      ssr: true,
      clickmap: true,
      referrer: document.referrer,
      url: window.location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js?id=" + COUNTER_ID;
    document.head.appendChild(script);
  }

  // No connection to Yandex is made by this script without permission.
  if (consent === "yes") startAnalytics();

  function saveChoice(next) {
    try {
      window.localStorage.setItem(KEY, next);
    } catch (error) {
      // The choice applies to the current page even if it cannot be saved.
    }
    consent = next;
  }

  function dismissPanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
  }

  function choose(next) {
    var wasRunning = started;
    saveChoice(next);
    dismissPanel();
    if (next === "yes") {
      startAnalytics();
    } else if (wasRunning) {
      // An already loaded third-party script cannot safely be unloaded.
      // Reload the page with tracking disabled.
      window.location.reload();
    }
  }

  function showPanel() {
    if (panel) return;
    panel = document.createElement("section");
    panel.className = "nc-consent";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Управление аналитикой сайта");

    panel.innerHTML =
      '<div class="nc-consent__content">' +
        '<p>Яндекс Метрика помогает оценивать посещения сайта. Разрешить аналитику? <a href="/site-privacy/">Подробнее</a></p>' +
      '</div>' +
      '<div class="nc-consent__actions">' +
        '<button type="button" class="nc-consent__button nc-consent__button--deny" data-nc-no>Отклонить</button>' +
        '<button type="button" class="nc-consent__button nc-consent__button--allow" data-nc-yes>Разрешить</button>' +
      '</div>';
    panel.querySelector("[data-nc-yes]").addEventListener("click", function () {
      choose("yes");
    });
    panel.querySelector("[data-nc-no]").addEventListener("click", function () {
      choose("no");
    });

    document.body.appendChild(panel);
  }

  function ready() {
    document.querySelectorAll("[data-analytics-preferences]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        showPanel();
      });
    });
    if (consent !== "yes" && consent !== "no") {
      showPanel();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
