document.addEventListener("DOMContentLoaded", function () {
    const observer = new MutationObserver(function (mutations, obs) {
      const banner = document.getElementById('shopify-pc__banner');
      if (banner) {
        const acceptButton = banner.querySelector('.shopify-pc__banner__btn-accept');
        const declineButton = banner.querySelector('.shopify-pc__banner__btn-decline');
        acceptButton.classList.add('btn', 'btn--secondary', 'btn--small', 'btn--secondary');
        declineButton.classList.add('btn', 'btn--secondary', 'btn--small', 'btn--secondary');   
        obs.disconnect(); 
      }
    });

    const observer2 = new MutationObserver(function (mutations, obs) {
        const prefsDialog = document.getElementById('shopify-pc__prefs__dialog');
        if (prefsDialog) {
          const acceptButton = prefsDialog.querySelector('#shopify-pc__prefs__header-accept');
          const declineButton = prefsDialog.querySelector('#shopify-pc__prefs__header-decline');
          const saveButton = prefsDialog.querySelector('#shopify-pc__prefs__header-save');
      
          [acceptButton, declineButton, saveButton].forEach(button => {
            button.classList.add('btn', 'btn--secondary', 'btn--small', 'btn--secondary');
          });
      
          const saveButtonObserver = new MutationObserver(() => {
            const requiredClasses = ['btn', 'btn--secondary', 'btn--small'];
          
            const missingClasses = requiredClasses.filter(c => !saveButton.classList.contains(c));
            if (missingClasses.length > 0) {
              saveButton.classList.add(...missingClasses);
            }
          });
          
          saveButtonObserver.observe(saveButton, { attributes: true, attributeFilter: ['class'] });
          
          obs.disconnect();
        }
      });


    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    observer2.observe(document.body, {
      childList: true,
      subtree: true
    });
});