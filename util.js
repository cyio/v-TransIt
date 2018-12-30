function $(selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelector(selector);
}

function $$(selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelectorAll(selector);
}

function addListenerMulti (el, s, fn) {
  s.split().forEach(e => el.addEventListener(e, fn, false));
}
