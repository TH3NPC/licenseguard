/*!
 * LicenseGuard SDK v1.0.0
 * Reusable website preview protection. Renders a watermark + preview
 * restrictions whenever a project's license is NOT active, based entirely on
 * server-controlled state.
 *
 * IMPORTANT (honest security note): this is client-side code. A developer with
 * source access can remove it, edit CSS, or screenshot the page. It deters
 * casual use of unpaid work; it is NOT a DRM guarantee. For strong enforcement,
 * serve the site through the LicenseGuard hosted preview (see SECURITY.md).
 *
 * Integration:
 *   <script src="https://YOUR-HOST/sdk/v1/licenseguard.js"
 *           data-project-id="lg_pub_xxx" defer></script>
 * or:
 *   LicenseGuard.init({ projectId: "lg_pub_xxx", apiBase: "https://YOUR-HOST" });
 */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var STATE_KEY = "__licenseguard_state__";
  var DOM_ID = "__licenseguard_root__";
  var DEFAULT_TIMEOUT = 4000; // never block the page forever
  var CACHE_PREFIX = "lg_cache_";

  // Prevent duplicate initialization across multiple script includes.
  if (window[STATE_KEY] && window[STATE_KEY].initialized) {
    return;
  }

  var state = (window[STATE_KEY] = window[STATE_KEY] || {
    initialized: false,
    clickHandler: null,
    rootEl: null,
    config: null,
  });

  function currentScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf("licenseguard") !== -1) {
        return scripts[i];
      }
    }
    return null;
  }

  function readConfigFromScript() {
    var el = currentScript();
    if (!el) return {};
    var apiBase = el.getAttribute("data-api");
    if (!apiBase && el.src) {
      try {
        apiBase = new URL(el.src).origin;
      } catch (e) {
        apiBase = null;
      }
    }
    return {
      projectId: el.getAttribute("data-project-id"),
      apiBase: apiBase,
      timeout: parseInt(el.getAttribute("data-timeout"), 10) || DEFAULT_TIMEOUT,
      cache: el.getAttribute("data-cache") !== "off",
    };
  }

  function getCached(projectId) {
    try {
      var raw = sessionStorage.getItem(CACHE_PREFIX + projectId);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (obj.expires && obj.expires > Date.now()) return obj.data;
    } catch (e) {}
    return null;
  }

  function setCached(projectId, data, ttlSeconds) {
    try {
      sessionStorage.setItem(
        CACHE_PREFIX + projectId,
        JSON.stringify({
          data: data,
          expires: Date.now() + (ttlSeconds || 60) * 1000,
        })
      );
    } catch (e) {}
  }

  function fetchStatus(cfg) {
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () {
          controller.abort();
        }, cfg.timeout)
      : null;

    var url =
      cfg.apiBase +
      "/api/v1/license?projectId=" +
      encodeURIComponent(cfg.projectId);

    return fetch(url, {
      method: "GET",
      signal: controller ? controller.signal : undefined,
      credentials: "omit",
      mode: "cors",
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) return null;
        return res.json();
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        return null; // fail safe: never break the host page
      });
  }

  // ---- Rendering -----------------------------------------------------------

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  function buildWatermark(wm, preview) {
    var text = esc(wm.text || "UNPAID PREVIEW");
    var opacity = typeof wm.opacity === "number" ? wm.opacity : 0.16;
    var style = wm.style || "diagonal";
    var sizeMap = { sm: 18, md: 28, lg: 42 };
    var fontSize = sizeMap[wm.size] || sizeMap.md;

    var root = document.createElement("div");
    root.id = DOM_ID;
    root.setAttribute("aria-hidden", "true");
    root.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483646",
      "pointer-events:none",
      "overflow:hidden",
      "font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    ].join(";");

    // White text + mix-blend-mode:difference keeps the watermark visible on any
    // background (dark or light) — it always renders as a contrasting tone.
    var textCss =
      "color:rgba(255,255,255," +
      opacity +
      ");font-weight:800;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;";

    if (style === "banner") {
      var place = wm.placement === "top" ? "top:0" : "bottom:0";
      var bar = document.createElement("div");
      bar.style.cssText = [
        "position:absolute",
        "left:0;right:0",
        place,
        "pointer-events:auto",
        "background:rgba(17,17,17,.92)",
        "color:#fff",
        "padding:10px 16px",
        "font-size:13px;font-weight:600;letter-spacing:.02em",
        "display:flex;align-items:center;justify-content:center;gap:12px",
        "box-shadow:0 0 0 1px rgba(255,255,255,.08)",
      ].join(";");
      bar.innerHTML = "<span>" + text + "</span>";
      appendContactLink(bar, wm);
      root.appendChild(bar);
      return root;
    }

    if (style === "center") {
      var center = document.createElement("div");
      center.style.cssText =
        "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;mix-blend-mode:difference;";
      var span = document.createElement("div");
      span.style.cssText =
        textCss + "font-size:" + fontSize * 1.8 + "px;transform:rotate(-18deg);";
      span.textContent = wm.text || "UNPAID PREVIEW";
      center.appendChild(span);
      root.appendChild(center);
      return root;
    }

    // "layer" and "diagonal" use a tiled SVG pattern.
    var svg = tiledSvg(wm.text || "UNPAID PREVIEW", fontSize, opacity, style);
    var layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute;inset:0;background-image:url(\"" +
      svg +
      "\");background-repeat:repeat;mix-blend-mode:difference;" +
      (style === "layer" ? "background-color:rgba(245,245,244,.04);" : "");
    root.appendChild(layer);
    return root;
  }

  function tiledSvg(text, fontSize, opacity, style) {
    var tile = style === "layer" ? 360 : 300;
    var rot = style === "layer" ? 0 : -30;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      tile +
      '" height="' +
      tile / 2 +
      '">' +
      '<text x="50%" y="50%" fill="rgba(255,255,255,' +
      opacity +
      ')" font-family="sans-serif" font-size="' +
      fontSize +
      '" font-weight="800" letter-spacing="2" text-anchor="middle" dominant-baseline="middle" transform="rotate(' +
      rot +
      " " +
      tile / 2 +
      " " +
      tile / 4 +
      ')">' +
      esc(text) +
      "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function appendContactLink(container, wm) {
    if (wm.showContactLink === false) return;
    if (!wm.contactUrl) return;
    var a = document.createElement("a");
    a.href = wm.contactUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Contact to purchase";
    a.setAttribute("data-lg-allow", "1");
    a.style.cssText =
      "color:#fff;text-decoration:underline;font-weight:700;pointer-events:auto;";
    container.appendChild(a);
  }

  function showNotice(message) {
    var existing = document.getElementById(DOM_ID + "_notice");
    if (existing) return;
    var n = document.createElement("div");
    n.id = DOM_ID + "_notice";
    n.setAttribute("role", "status");
    n.style.cssText = [
      "position:fixed",
      "left:50%;bottom:24px;transform:translateX(-50%)",
      "z-index:2147483647",
      "background:rgba(17,17,17,.95);color:#fff",
      "padding:12px 18px;border-radius:8px;font:600 13px system-ui",
      "box-shadow:0 8px 30px rgba(0,0,0,.25);max-width:90vw",
    ].join(";");
    n.textContent = message || "This is an unpaid preview. Contact to purchase.";
    document.body.appendChild(n);
    setTimeout(function () {
      if (n.parentNode) n.parentNode.removeChild(n);
    }, 4000);
  }

  // ---- Preview interaction -------------------------------------------------

  var SAFE_TAGS = { INPUT: 1, TEXTAREA: 1, SELECT: 1, OPTION: 1, LABEL: 1 };

  function makeClickHandler(preview, wm) {
    var mode = (preview && preview.mode) || "links";
    var redirect = (preview && preview.redirectUrl) || wm.contactUrl || "";
    var notice =
      (preview && preview.notice) ||
      "This is an unpaid preview. Contact to purchase.";
    var selector = (preview && preview.selector) || "";
    var allowSelector = (preview && preview.allowSelector) || "[data-lg-allow]";

    return function (e) {
      if (mode === "off") return;
      var t = e.target;
      if (!t || !t.closest) return;

      // Never interfere with form controls or explicitly-allowed elements.
      if (SAFE_TAGS[t.tagName]) return;
      if (t.closest(allowSelector)) return;
      if (t.closest("[contenteditable='true']")) return;

      var shouldIntercept = false;
      if (mode === "links") {
        shouldIntercept = !!t.closest("a[href]");
      } else if (mode === "selected") {
        shouldIntercept = selector ? !!t.closest(selector) : false;
      } else if (mode === "strict") {
        shouldIntercept = !!t.closest("a[href],button,[role='button']");
      }

      if (!shouldIntercept) return;

      e.preventDefault();
      e.stopPropagation();
      if (redirect) {
        window.open(redirect, "_blank", "noopener");
      } else {
        showNotice(notice);
      }
    };
  }

  // ---- Lifecycle -----------------------------------------------------------

  function applyUnlicensed(data) {
    var cfg = data.preview || {};
    var wm = cfg.watermark || {};
    var preview = cfg.preview || {};

    removeDom();
    var root = buildWatermark(wm, preview);
    (document.body || document.documentElement).appendChild(root);
    state.rootEl = root;

    if (!state.clickHandler) {
      state.clickHandler = makeClickHandler(preview, wm);
      document.addEventListener("click", state.clickHandler, true);
    }
  }

  function removeDom() {
    var el = document.getElementById(DOM_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    var n = document.getElementById(DOM_ID + "_notice");
    if (n && n.parentNode) n.parentNode.removeChild(n);
    state.rootEl = null;
  }

  function destroy() {
    removeDom();
    if (state.clickHandler) {
      document.removeEventListener("click", state.clickHandler, true);
      state.clickHandler = null;
    }
    state.initialized = false;
  }

  function render(data) {
    if (!data) return; // fetch failed → fail safe, do nothing
    if (data.licensed === true) {
      destroy(); // licensed: ensure no watermark remains
      return;
    }
    applyUnlicensed(data);
  }

  function init(userConfig) {
    var cfg = Object.assign(
      { timeout: DEFAULT_TIMEOUT, cache: true },
      readConfigFromScript(),
      userConfig || {}
    );

    if (!cfg.projectId) {
      // No project id → nothing to protect. Silent (no console spam).
      return;
    }
    if (!cfg.apiBase) {
      cfg.apiBase = window.location.origin;
    }

    if (state.initialized) return;
    state.initialized = true;
    state.config = cfg;

    var start = function () {
      var cached = cfg.cache ? getCached(cfg.projectId) : null;
      if (cached) {
        render(cached);
        return;
      }
      fetchStatus(cfg).then(function (data) {
        if (data && cfg.cache) setCached(cfg.projectId, data, data.ttl);
        render(data);
      });
    };

    if (document.body) {
      start();
    } else {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  }

  // Public API.
  window.LicenseGuard = {
    version: VERSION,
    init: init,
    destroy: destroy,
    _refresh: function () {
      if (state.config) {
        try {
          sessionStorage.removeItem(CACHE_PREFIX + state.config.projectId);
        } catch (e) {}
        state.initialized = false;
        init(state.config);
      }
    },
  };

  // Auto-init when loaded via <script data-project-id>.
  var auto = readConfigFromScript();
  if (auto.projectId) init(auto);
})();
