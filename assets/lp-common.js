/* LP common — ua_check + target-link smooth scroll + inview */
var device = 0; // pc

function lpSafeTop(sel) {
  try {
    var $el = sel && sel.jquery ? sel : window.jQuery(sel);
    if (!$el || !$el.length) return 0;
    var o = $el.offset();
    return o ? o.top : 0;
  } catch (e) {
    return 0;
  }
}

function ua_check() {
  if (
    (navigator.userAgent.indexOf('iPhone') > 0 &&
      navigator.userAgent.indexOf('iPad') == -1) ||
    navigator.userAgent.indexOf('iPod') > 0 ||
    navigator.userAgent.indexOf('Android') > 0 ||
    navigator.userAgent.indexOf('Mobile') > 0 ||
    navigator.userAgent.indexOf('Windows Phone') > 0
  ) {
    device = 1;
  } else if (window.innerWidth <= 960) {
    device = 1;
  }
}

/**
 * IntersectionObserver ベースの inview。
 * jquery.inview は $(window).off('scroll') で死ぬ／Shopify sticky でズレるため、
 * ここを正とする（各 LP の .one('inview') は bind 時に外す）。
 */
(function (window, document) {
  var observer = null;
  var bindTimer = null;

  function isShown(el) {
    return !!(el && el.offsetParent !== null);
  }

  function fadeIn(el) {
    if (!el || el.getAttribute('data-lp-inview-done') === '1') return;
    el.setAttribute('data-lp-inview-done', '1');
    if (window.jQuery) {
      window
        .jQuery(el)
        .stop(true, false)
        .delay(200)
        .animate({ opacity: 1 }, 500);
    } else {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '1';
    }
    // 入れ子 .inview（親だけ先に出て子が opacity:0 のまま残るのを防ぐ）
    var nested = el.querySelectorAll('.inview');
    Array.prototype.forEach.call(nested, function (child) {
      if (child === el) return;
      if (child.getAttribute('data-lp-inview-done') === '1') return;
      child.setAttribute('data-lp-inview-done', '1');
      if (window.jQuery) {
        window.jQuery(child).stop(true, true).css('opacity', 1);
      } else {
        child.style.opacity = '1';
      }
      if (observer) {
        try {
          observer.unobserve(child);
        } catch (e) {}
      }
    });
  }

  function disconnect() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function bind(scope, options) {
    var soft = !!(options && options.soft);
    var root =
      scope && scope.nodeType === 1
        ? scope
        : document.querySelector('.lp-content') || document.body;
    if (!root) return;

    if (!soft) {
      disconnect();
    }

    var els = root.querySelectorAll('.inview');
    if (!els.length) return;

    if (!soft) {
      // 各 LP が付けた jquery.inview ハンドラは無効化し、こちらで制御する
      if (window.jQuery) {
        window.jQuery(els).off('inview').css('opacity', 0);
      } else {
        Array.prototype.forEach.call(els, function (el) {
          el.style.opacity = '0';
        });
      }
      Array.prototype.forEach.call(els, function (el) {
        el.removeAttribute('data-lp-inview-done');
      });
    }

    var pending = [];
    Array.prototype.forEach.call(els, function (el) {
      if (el.getAttribute('data-lp-inview-done') === '1') return;
      if (!isShown(el)) return;
      pending.push(el);
    });
    if (!pending.length) return;

    if (!('IntersectionObserver' in window)) {
      pending.forEach(fadeIn);
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            fadeIn(entry.target);
            if (observer) observer.unobserve(entry.target);
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -5% 0px',
          threshold: 0.01
        }
      );
    }

    pending.forEach(function (el) {
      observer.observe(el);
    });

    requestAnimationFrame(function () {
      var vh = window.innerHeight || 0;
      pending.forEach(function (el) {
        if (el.getAttribute('data-lp-inview-done') === '1') return;
        var rect = el.getBoundingClientRect();
        if (rect.bottom > 40 && rect.top < vh - 20) fadeIn(el);
      });
    });
  }

  function scheduleBind(scope) {
    clearTimeout(bindTimer);
    bindTimer = setTimeout(function () {
      // リサイズ時は表示済みを消さない
      bind(scope, { soft: true });
    }, 120);
  }

  window.lpBindInview = function (scope) {
    bind(scope, { soft: false });
  };
  window.lpDestroyInview = disconnect;
  window.lpScheduleInview = scheduleBind;

  window.addEventListener(
    'resize',
    function () {
      scheduleBind(document.querySelector('.lp-content'));
    },
    { passive: true }
  );
})(window, document);

(function ($) {
  $(function () {
    ua_check();

    $(window).on('resize.lpCommon', function () {
      if (window.innerWidth <= 960) {
        device = 1;
      } else {
        device = 0;
      }
    });

    $(document).on('click.lpCommon', 'a.target-link', function () {
      var speed = 500;
      var href = $(this).attr('href-an');
      var target = $(href == '#' || href == '' ? 'html' : href);
      var position = 0;
      var offset = target[0] ? target.offset() : null;
      if (offset) {
        position = offset.top;
      }
      if (position < 0) {
        position = 0;
      }
      $('body,html').animate({ scrollTop: position }, speed, 'swing');
      return false;
    });

    // Shopify 単体表示でも .lp-content 内の inview を拾う
    if (document.querySelector('.lp-content .inview')) {
      window.lpScheduleInview(document.querySelector('.lp-content'));
    }
  });
})(jQuery);
