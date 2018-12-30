function $(selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelector(selector);
}

function $$(selector, scope) {
  scope = scope ? scope : document;
  return scope.querySelectorAll(selector);
}
function hasChinese(word) {
  return /[\u4e00-\u9fa5]/.test(word)
}
function canTranslate(word) {
  return /^[a-z]+(\'|\'s)?$/i.test(word)
}
function isEmptyObject (e) {
  var t;  
  for (t in e)  
    return !1;  
  return !0  
}
