(function () {
  var baseEl = document.querySelector("base");
  if (!baseEl) return;

  var b = new URL(baseEl.href, location.origin).pathname.replace(/\/$/, "");
  if (!b || b === "/") return;

  function prefixUrl(url) {
    if (typeof url !== "string") return url;
    if (url.startsWith(b + "/") || url === b) return url;
    if (url.startsWith("/") && !url.startsWith("//")) return b + url;
    return url;
  }

  var pushState = history.pushState.bind(history);
  var replaceState = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    return pushState(state, title, prefixUrl(url));
  };

  history.replaceState = function (state, title, url) {
    return replaceState(state, title, prefixUrl(url));
  };

  var assign = location.assign.bind(location);
  var replace = location.replace.bind(location);

  location.assign = function (url) {
    return assign(prefixUrl(url));
  };

  location.replace = function (url) {
    return replace(prefixUrl(url));
  };

  var fetchFn = window.fetch.bind(window);
  window.fetch = function (input, init) {
    if (typeof input === "string") {
      input = prefixUrl(input);
    } else if (input instanceof Request) {
      var nextUrl = prefixUrl(input.url);
      if (nextUrl !== input.url) input = new Request(nextUrl, input);
    }
    return fetchFn(input, init);
  };

  var xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    arguments[1] = prefixUrl(url);
    return xhrOpen.apply(this, arguments);
  };

  document.addEventListener(
    "click",
    function (event) {
      var anchor = event.target.closest("a[href]");
      if (!anchor) return;

      var href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;

      var next = prefixUrl(href);
      if (next === href) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      pushState(null, "", next);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    true
  );

  var path = location.pathname;
  if (path.startsWith("/") && !path.startsWith(b + "/") && path !== b) {
    replaceState(null, "", b + path + location.search + location.hash);
  }
})();
