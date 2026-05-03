(function () {
  'use strict';

  function parseVariants(root) {
    var script = root.querySelector('[data-oos-variants-json]');
    if (!script || !script.textContent) return [];
    try {
      return JSON.parse(script.textContent);
    } catch (_e) {
      return [];
    }
  }

  function availabilityById(variants) {
    var map = Object.create(null);
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      if (v && v.id != null) map[String(v.id)] = Boolean(v.available);
    }
    return map;
  }

  function isAvailable(map, variantId) {
    var key = String(variantId);
    if (!Object.prototype.hasOwnProperty.call(map, key)) return true;
    return map[key];
  }

  function setRootVisible(root, visible) {
    if (visible) {
      root.removeAttribute('hidden');
    } else {
      root.setAttribute('hidden', '');
    }
  }

  function clearFieldError(email, errorEl) {
    if (!email || !errorEl) return;
    email.setAttribute('aria-invalid', 'false');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  function showFieldError(email, errorEl, message) {
    if (!email || !errorEl) return;
    email.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function resetSuccessState(root) {
    var formWrap = root.querySelector('[data-oos-form-wrap]');
    var success = root.querySelector('[data-oos-success]');
    var form = root.querySelector('[data-oos-form]');
    var email = root.querySelector('[data-oos-email]');
    var errorEl = root.querySelector('[data-oos-error]');
    if (formWrap) formWrap.hidden = false;
    if (success) success.hidden = true;
    if (form) form.reset();
    if (email) email.disabled = false;
    clearFieldError(email, errorEl);
    var submit = root.querySelector('[data-oos-submit]');
    if (submit) submit.disabled = false;
  }

  function wireForm(root) {
    var form = root.querySelector('[data-oos-form]');
    if (!form) return;
    var email = root.querySelector('[data-oos-email]');
    if (!email) return;
    var submit = root.querySelector('[data-oos-submit]');
    var errorEl = root.querySelector('[data-oos-error]');
    var formWrap = root.querySelector('[data-oos-form-wrap]');
    var success = root.querySelector('[data-oos-success]');

    email.addEventListener('input', function () {
      if (email.getAttribute('aria-invalid') === 'true') {
        clearFieldError(email, errorEl);
      }
    });

    email.addEventListener('blur', function () {
      if (!email.value) return;
      if (typeof email.checkValidity === 'function' && !email.checkValidity()) {
        showFieldError(
          email,
          errorEl,
          email.validationMessage || 'Enter a valid email address.',
        );
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      clearFieldError(email, errorEl);

      if (typeof email.checkValidity !== 'function' || !email.checkValidity()) {
        showFieldError(
          email,
          errorEl,
          email.validationMessage || 'Enter a valid email address.',
        );
        email.focus();
        return;
      }

      if (submit) submit.disabled = true;
      email.disabled = true;
      if (formWrap) formWrap.hidden = true;
      if (success) {
        success.hidden = false;
        if (typeof success.focus === 'function') {
          success.focus();
        }
      }
    });
  }

  function applyVariant(root, map, variantId) {
    var available = isAvailable(map, variantId);
    setRootVisible(root, !available);
    if (available) {
      resetSuccessState(root);
    } else {
      var email = root.querySelector('[data-oos-email]');
      var errorEl = root.querySelector('[data-oos-error]');
      clearFieldError(email, errorEl);
    }
  }

  function readVariantIdFromTarget(target) {
    if (!target) return null;
    if (target.name !== 'id') return null;
    if (target.matches && target.matches('select')) return target.value;
    if (
      target.matches &&
      (target.matches('input[type="radio"]') ||
        target.matches('input[type="hidden"]'))
    ) {
      return target.value;
    }
    return null;
  }

  function init() {
    var roots = document.querySelectorAll('[data-oos-notify-root]');
    var entries = [];
    Array.prototype.forEach.call(roots, function (root) {
      var variants = parseVariants(root);
      var map = availabilityById(variants);
      var initialId = root.getAttribute('data-initial-variant-id');
      entries.push({ root: root, map: map });

      wireForm(root);

      if (initialId != null) applyVariant(root, map, initialId);
    });

    if (!entries.length) return;

    document.addEventListener(
      'change',
      function (e) {
        var id = readVariantIdFromTarget(e.target);
        if (id == null) return;
        entries.forEach(function (entry) {
          applyVariant(entry.root, entry.map, id);
        });
      },
      false,
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
