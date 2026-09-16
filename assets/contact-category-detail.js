(function () {
  function init(form) {
    if (form.dataset.detailInit) return; // 二重初期化防止
    form.dataset.detailInit = '1';

    var select = form.querySelector('.contact_custom_sel_triger select');
    var details = form.querySelectorAll('.category_detail');
    if (!select || !details.length) return;

    function showDetail(index) {
      details.forEach(function (detail, i) {
        var isTarget = (i === index - 1);
        detail.style.display = isTarget ? 'block' : 'none';
        detail.querySelectorAll('input[type="radio"]').forEach(function (radio) {
          radio.disabled = !isTarget;
          if (!isTarget) radio.checked = false;
        });
      });
    }

    select.addEventListener('change', function () {
      var idx = select.selectedIndex;
      showDetail(idx < 1 ? 1 : idx);
    });

    showDetail(1); // 初期は1番目の種別詳細のみ表示
    console.log('[category_detail] initialized');
  }

  function scan() {
    document.querySelectorAll('.bcontact-form').forEach(init);
  }

  // すでにあれば即初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // フォームが後から動的生成される場合に備えて監視
  var observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();