import { initCustomModal } from './custom-modal.js';

const EngravingModal = {
  sectionId: null,
  modalElement: null,
  currentKey: null,
  existingProps: {},
  productQuantity: null,

  /**
   * Initializes the engraving modal:
   * - Gets section ID and modal element
   * - Binds input validation
   * - Prepares save/remove functionality
   */
  init() {
    this.sectionId = this.getSectionID();
    if (!this.sectionId) {
      console.warn('engraving init: no sectionId found');
      return;
    }

    // Use shared modal logic from custom-modal.js
    initCustomModal(this.sectionId, {
      openRoot: document.getElementById('main'),
      modalId: 'engraving-key',
      handleOpen: (openBtn, modalElement) => {

        // Store modal reference and opener key
        this.modalElement = modalElement;
        this.currentKey = openBtn.dataset.engravingKey;

        // Prefill modal fields with existing props
        const { props, productQuantity } = this.fillModal(openBtn);
        this.existingProps = props;
        this.productQuantity = parseInt(productQuantity, 10);

        // Bind engraving interactions
        this.initInputValidation('engraving-line-2');
        this.initInputValidation('engraving-line-3');
        this.initSaveAndRemove();
        this.initLiveFieldWatcher();

        console.log("Engraving modal initialized");
      },
    });
  },

  /**
   * Retrieves the section ID from the engraving modal element.
   */
  getSectionID() {
    const modal = document.getElementById('engraving-modal-cart');
    if (!modal) return null;
    const container = modal.closest('[data-section-id]');
    return container ? container.getAttribute('data-section-id') : null;
  },

    /**
   * Filters user input to only allow specific characters
   * suitable for engraving (e.g., letters, numbers, punctuation).
   */
  sanitizeInput(str) {
    const ALLOWED = /[A-Za-z0-9 !./%?&\-]/g;
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
   * Pre-fills the modal fields with existing engraving values
   * extracted from the data-properties attribute of the opener element.
   */
  fillModal(opener) {
    const instructions = this.modalElement.querySelector('#engraving-modal-instructions');
    const phraseSelect = this.modalElement.querySelector('#engraving-line-1');
    const customInputLine2 = this.modalElement.querySelector('#engraving-line-2');
    const customInputLine3 = this.modalElement.querySelector('#engraving-line-3');
    const saveBtn = this.modalElement.querySelector('#engraving-save');
    const countDisplayLine2 = this.modalElement.querySelector('#engraving-line-2-counter');
    const countDisplayLine3 = this.modalElement.querySelector('#engraving-line-3-counter');

    const wrapperSelect = phraseSelect.closest('.engraving-modal__select-wrapper');
    const wrapperLine3 = customInputLine3.closest('.engraving-modal__input-wrapper');

    const props = this.parseProperties(opener.getAttribute('data-properties'));
    const productQuantity = opener.getAttribute('data-product-quantity');
    phraseSelect.value = props.engraving_line_1 || '';
    customInputLine2.value = props.engraving_line_2 || '';
    customInputLine3.value  = props.engraving_line_3 || '';

    const has1 = phraseSelect.value.trim() !== '';
    const has2 = customInputLine2.value.trim() !== '';
    const has3 = customInputLine3.value.trim() !== '';
    saveBtn.disabled = !(has1 || has2 || has3);

    const engravingOption = opener.dataset.engravingOption;
    wrapperSelect.style.display = (engravingOption === '2 Lines' || engravingOption === '3 Lines') ? '' : 'none';
    instructions.style.display = (engravingOption === '2 Lines' || engravingOption === '3 Lines') ? '' : 'none';
    wrapperLine3.style.display = (engravingOption === '3 Lines') ? '' : 'none';

    countDisplayLine2.textContent = `${customInputLine2.value.length}/${customInputLine2.getAttribute('maxlength')}`;
    countDisplayLine3.textContent = `${customInputLine3.value.length}/${customInputLine3.getAttribute('maxlength')}`;

    if (has1) phraseSelect.classList.remove('has-placeholder');
    else phraseSelect.classList.add('has-placeholder');

    return { props, productQuantity };
  },

  /**
   * Sends a request to Shopify's cart API to update a cart item's properties.
   * Used for saving or removing engraving.
   */
  updateEngravingAPI({ id, props }) {
    if (!this.productQuantity) return Promise.reject(new Error('Product quantity is not set'));
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        quantity: this.productQuantity,
        properties: props
      })
    }).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  },

  /**
   * Sets up event listeners on save and remove buttons:
   * - Save button updates engraving values
   * - Remove button clears engraving values
   * - Both trigger a cart update via API and reload the page
   */
  initSaveAndRemove() {
    const saveBtn = this.modalElement.querySelector('[data-save]');
    const removeBtn = this.modalElement.querySelector('[data-remove]');
    const phraseInput = this.modalElement.querySelector('#engraving-line-1');
    const customInputLine2 = this.modalElement.querySelector('#engraving-line-2');
    const customInputLine3 = this.modalElement.querySelector('#engraving-line-3');

    saveBtn.addEventListener('click', () => {
      const l1 = phraseInput.value.trim();
      const l2 = customInputLine2.value.trim();
      const l3 = customInputLine3.value.trim();
      const newProps = { ...this.existingProps, _placeholder: '' };

      l1 ? newProps.engraving_line_1 = l1 : delete newProps.engraving_line_1;
      l2 ? newProps.engraving_line_2 = l2 : delete newProps.engraving_line_2;
      l3 ? newProps.engraving_line_3 = l3 : delete newProps.engraving_line_3;

      this.updateEngravingAPI({ id: this.currentKey, props: newProps })
        .then(() => location.reload())
        .catch(console.error);
    });

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const newProps = { ...this.existingProps };
      delete newProps.engraving_line_1;
      delete newProps.engraving_line_2;
      delete newProps.engraving_line_3;
      newProps._placeholder = '';

      this.updateEngravingAPI({ id: this.currentKey, props: newProps })
        .then(() => location.reload())
        .catch(console.error);
    });
  },

  /**
   * Sets up event listeners on live field changes:
   * - Updates the save button state based on values in the select or input fields
   */
  initLiveFieldWatcher() {
    const phraseInput = this.modalElement.querySelector('#engraving-line-1');
    const customInputLine2 = this.modalElement.querySelector('#engraving-line-2');
    const customInputLine3 = this.modalElement.querySelector('#engraving-line-3');
    const saveBtn = this.modalElement.querySelector('#engraving-save');
    const countDisplayLine2 = this.modalElement.querySelector('#engraving-line-2-counter');
    const countDisplayLine3 = this.modalElement.querySelector('#engraving-line-3-counter');

    const updateState = () => {
      const has1 = phraseInput.value.trim() !== '';
      const has2 = customInputLine2.value.trim() !== '';
      const has3 = customInputLine3.value.trim() !== '';
      saveBtn.disabled = !(has1 || has2 || has3);

      if (has1) {
        phraseInput.classList.remove('has-placeholder');
      } else {
        phraseInput.classList.add('has-placeholder');
      }
    };

    const updateCountLine2 = () => {
      const len = customInputLine2.value.length;
      const MAX_LENGTH = customInputLine2.getAttribute('maxlength') || 10;
      countDisplayLine2.textContent = `${len}/${MAX_LENGTH}`;
    };

    const updateCountLine3 = () => {
      const len = customInputLine3.value.length;
      const MAX_LENGTH = customInputLine3.getAttribute('maxlength') || 10;
      countDisplayLine3.textContent = `${len}/${MAX_LENGTH}`;
    };
  
  
    phraseInput.addEventListener('change', updateState);
    customInputLine2.addEventListener('input', (e) => {
      updateState();
      updateCountLine2();
    });
    customInputLine3.addEventListener('input', (e) => {
      updateState();
      updateCountLine3();
    });

    updateState();
    updateCountLine2();
    updateCountLine3();
  },
};

EngravingModal.init();