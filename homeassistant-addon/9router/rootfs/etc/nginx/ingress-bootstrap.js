/*
 * Runs before any other script in <head>. 9Router (decolua/9router) is a
 * prebuilt Next.js standalone app with basePath "" — every href, fetch(),
 * EventSource and WebSocket it constructs is root-absolute ("/dashboard",
 * "/api/..."), because basePath is inlined at build time and can't be
 * changed at runtime (https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath).
 *
 * Since we can't rebuild the upstream image with a dynamic basePath (the
 * Ingress token differs per install and isn't known at image build time),
 * we patch every browser API that can initiate a network request or a
 * history change, so any root-absolute URL is transparently rewritten to
 * live under the current Ingress prefix ($http_x_ingress_path, exposed via
 * the injected <base> tag). HTML attributes (href=/src=/action=/url()) are
 * rewritten server-side by nginx; this script is the runtime safety net for
 * everything constructed dynamically inside JS bundles, which we deliberately
 * do NOT text-rewrite (regex-rewriting minified JS/JSON risks corrupting
 * unrelated string literals).
 */
(function () {
  var baseEl = document.querySelector("base[data-ingress]");
  if (!baseEl) return;

  var prefix = new URL(baseEl.href, location.origin).pathname.replace(/\/$/, "");
  if (!prefix) return;

  function isRootAbsolute(url) {
    return typeof url === "string" && url.charAt(0) === "/" && url.charAt(1) !== "/";
  }

  function toPrefixed(url) {
    if (!isRootAbsolute(url)) return url;
    if (url === prefix || url.indexOf(prefix + "/") === 0) return url;
    return prefix + url;
  }

  // history: covers Next.js router.push()/replace() (SPA navigation)
  var pushState = history.pushState.bind(history);
  var replaceState = history.replaceState.bind(history);
  history.pushState = function (state, title, url) {
    return pushState(state, title, toPrefixed(url));
  };
  history.replaceState = function (state, title, url) {
    return replaceState(state, title, toPrefixed(url));
  };

  // location.assign/replace: covers manual redirects some apps use
  var locAssign = location.assign.bind(location);
  var locReplace = location.replace.bind(location);
  location.assign = function (url) {
    return locAssign(toPrefixed(url));
  };
  location.replace = function (url) {
    return locReplace(toPrefixed(url));
  };

  // fetch: covers RSC payload fetches, API calls, Next data requests
  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === "string") {
      input = toPrefixed(input);
    } else if (input instanceof Request && isRootAbsolute(input.url)) {
      input = new Request(toPrefixed(input.url), input);
    }
    return nativeFetch(input, init);
  };

  // XMLHttpRequest: legacy/library calls not using fetch
  var xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (isRootAbsolute(url)) arguments[1] = toPrefixed(url);
    return xhrOpen.apply(this, arguments);
  };

  // EventSource: usage/stream, translator/console-logs/stream (SSE)
  if (window.EventSource) {
    var NativeEventSource = window.EventSource;
    window.EventSource = function (url, options) {
      return new NativeEventSource(toPrefixed(url), options);
    };
    window.EventSource.prototype = NativeEventSource.prototype;
  }

  // WebSocket: mitm tooling. Only rewrite same-origin root-absolute paths;
  // leave ws(s):// absolute URLs (e.g. tunnels) untouched.
  var NativeWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    if (isRootAbsolute(url)) {
      var wsProto = location.protocol === "https:" ? "wss:" : "ws:";
      url = wsProto + "//" + location.host + toPrefixed(url);
    }
    return protocols !== undefined
      ? new NativeWebSocket(url, protocols)
      : new NativeWebSocket(url);
  };
  window.WebSocket.prototype = NativeWebSocket.prototype;

  // Safety net: anchors added client-side after hydration that weren't
  // covered by the server-side HTML rewrite. Real navigation (not just
  // pushState) so Next.js loads that route's data normally.
  document.addEventListener(
    "click",
    function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var anchor = event.target.closest && event.target.closest("a[href]");
      if (!anchor || anchor.target === "_blank") return;

      var href = anchor.getAttribute("href");
      if (!isRootAbsolute(href)) return;

      var next = toPrefixed(href);
      if (next === href) return;

      event.preventDefault();
      location.href = next;
    },
    true
  );

  // If we ever land on an un-prefixed URL directly (e.g. a hard navigation
  // that slipped through before this script loaded), fix it up in place.
  var path = location.pathname;
  if (isRootAbsolute(path) && path !== prefix && path.indexOf(prefix + "/") !== 0) {
    replaceState(null, "", prefix + path + location.search + location.hash);
  }
})();
