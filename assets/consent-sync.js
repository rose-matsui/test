(function () {
  let isShopifyReady = false;

  // Shopify標準バナーを非表示にするスタイルを適用
  (function applyHideBannerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #shopify-section-cookie-banner,
      .shopify-cookie-banner,
      #shopify-pc__banner {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
      .cookie_consent-toggle {
        display: flex !important;
      }
    `;
    document.head.appendChild(style);
  })();

  // カテゴリマッピング
  const categoryMap = {
    'C94a00': 'analytics',
    'Cee000': 'marketing',
    'C4b300': 'preferences',
  };

  // Shopify APIのロード待ち関数
  function waitForShopifyPrivacy(callback) {
    if (window.Shopify && window.Shopify.loadFeatures) {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (error) {
        if (error) {
          console.error('[Consent Sync] Shopify API ロードエラー:', error);
          return;
        }
        isShopifyReady = true;
        callback();
      });
    } else {
      setTimeout(function () {
        waitForShopifyPrivacy(callback);
      }, 500);
    }
  }

  // cookieConsentオブジェクトの待機関数
  function waitForCookieConsent(callback) {
    if (window.cookieConsent && window.cookieConsent.settingObject) {
      callback();
    } else {
      setTimeout(function () {
        waitForCookieConsent(callback);
      }, 500);
    }
  }

  // getCookie()から同意データを取得する関数
  function getConsentData() {
    try {
      let cookieData = window.cookieConsent.settingObject.getCookie();
      if (typeof cookieData === 'string') {
        cookieData = JSON.parse(cookieData);
      }
      if (!cookieData || !cookieData.data || !cookieData.data.cat_status) {
        return null;
      }
      return cookieData.data.cat_status;
    } catch (e) {
      console.error('[Consent Sync] 同意データ取得エラー:', e.message);
      return null;
    }
  }

  // cat_statusからShopify同意設定を構築する関数
  function buildConsentSettings(catStatus) {
    const consentSettings = {
      analytics: false,
      marketing: false,
      preferences: false,
      sale_of_data: false
    };

    catStatus.forEach(function (item) {
      const categoryCode = item[0];
      const consentValue = item[2];
      const isConsented = consentValue === 1;

      if (categoryMap[categoryCode]) {
        consentSettings[categoryMap[categoryCode]] = isConsented;
      }
    });

    return consentSettings;
  }

  // Shopify同意設定を同期する関数
  function syncConsentToShopify() {
    if (!isShopifyReady) {
      return;
    }

    const catStatus = getConsentData();

    // cat_statusがない場合は何もしない（Shopifyの既存状態を維持）
    if (!catStatus) {
      return;
    }

    const consentSettings = buildConsentSettings(catStatus);
    window.Shopify.customerPrivacy.setTrackingConsent(consentSettings, function () {});
  }

  // dataLayer.push をオーバーライドしてCmpGroupsイベントを検知
  function setupDataLayerListener() {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
    const originalPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function (obj) {
      const result = originalPush(obj);
      if (obj && obj.event === 'CmpGroups') {
        syncConsentToShopify();
      }
      return result;
    };
  }

  // メイン処理
  setupDataLayerListener();

  waitForShopifyPrivacy(function () {
    waitForCookieConsent(function () {
      syncConsentToShopify();
    });
  });
})();
