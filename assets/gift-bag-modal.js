import { initCustomModal } from './custom-modal.js';

const GiftBagModal = {
    sectionId: null,
    modalElement: null,
    currentKey: null,
    existingProps: {},
    selections: {},

    /**
     * Initializes the gift bag modal:
     * - Gets section ID and modal element
     * - Hooks into shared modal logic (custom-modal.js)
     * - Prepares input validation and save/remove behavior on open
     */
    init() {
      this.sectionId = this.getSectionID();
      if (!this.sectionId) {
        console.warn('gift bag init: no sectionId found');
        return;
      }

      // Use shared modal logic
      initCustomModal(this.sectionId, {
        openRoot: document.getElementById('main'),
        modalId: 'gift-bag-key',
        handleOpen: (openButton, modalElement) => {

          // Store modal + opener info
          this.modalElement = modalElement;
          this.currentKey = openButton.dataset.giftBagKey;
          this.existingProps = this.fillModal(openButton);

          // Bind interactions that depend on the modal DOM
          this.initInputValidation('gift-bag-line-2');
          this.initSaveAndRemove();

          console.log('Gift bag modal initialized');
        },
      });
    },
  
    /**
     * Retrieves the section ID from the gift bag modal element.
     */
    getSectionID() {
      const modal = document.getElementById('gift-bag-modal-cart');
      if (!modal) return null;
      const container = modal.closest('[data-section-id]');
      return container ? container.getAttribute('data-section-id') : null;
    },
  
    /**
     * Filters user input to only allow specific characters
     * suitable for gift bag (e.g., letters, numbers, punctuation).
     */
    sanitizeInput(str) {
      const ALLOWED = /[A-Za-z0-9 !\.\/%?\-&]/g;
      return (str.match(ALLOWED) || []).join('');
    },
  
    /**
     * Adds real-time validation and sanitization to an input field.
     * Prevents invalid characters during composition or input.
     */
    initInputValidation(id) {
      const input = document.getElementById(id);
      if (!input) return;
      let isComposing = false;
  
      input.addEventListener('compositionstart', () => isComposing = true);
      input.addEventListener('compositionend', () => {
        isComposing = false;
        input.value = this.sanitizeInput(input.value);
      });
      input.addEventListener('input', (e) => {
        if (isComposing || e.isComposing) return;
        input.value = this.sanitizeInput(input.value);
      });
    },
  
    /**
     * Parses a properties JSON string (can be an object or array of entries).
     */
    parseProperties(str) {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? Object.fromEntries(parsed) : parsed;
      } catch {
        return {};
      }
    },
  
    /**
     * Pre-fills the modal fields with existing gift bag values
     * extracted from the data-properties attribute of the opener element.
     */
    fillModal(opener) {
      const props = this.parseProperties(opener.getAttribute('data-properties'));
  
      return props;
    },
  
    /**
     * Sends a request to Shopify's cart API to update a cart item's properties.
     * Used for saving or removing gift bag.
     */
    updateGiftBagAPI({ id, props }) {
      return fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          quantity: 1,
          properties: props
        })
      }).then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    },
  
    /**
     * Sets up event listeners on save and remove buttons:
     * - Save button updates gift bag values
     * - Remove button clears gift bag values
     * - Both trigger a cart update via API and reload the page
     */
    initSaveAndRemove() {
      if (!this.modalElement) return;

      const saveBtn = this.modalElement.querySelector('[data-save]');
      const removeBtn = this.modalElement.querySelector('[data-remove]');

      if (saveBtn && !saveBtn.dataset.giftBagBound) {
        saveBtn.dataset.giftBagBound = 'true';

        saveBtn.addEventListener('click', () => {
          const newProps = { ...this.existingProps, _placeholder: '' };
    
          this.updateGiftBagAPI({ id: this.currentKey, props: newProps })
            .then(() => location.reload())
            .catch(console.error);
        });
      }

      if (removeBtn && !removeBtn.dataset.giftBagBound) {
        removeBtn.dataset.giftBagBound = 'true';

        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const newProps = { ...this.existingProps };
          newProps._placeholder = '';
    
          this.updateGiftBagAPI({ id: this.currentKey, props: newProps })
            .then(() => location.reload())
            .catch(console.error);
        });
      }
    },
  };

  GiftBagModal.init();