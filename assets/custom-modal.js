// MODAL LOGIC
function showModal(modalElement) {
  if (!modalElement) return;
  if (modalElement.parentNode !== document.body) {
    document.body.appendChild(modalElement);
  }
  document.body.style.overflow = 'hidden';
  modalElement.style.zIndex = '1500';
  modalElement.classList.add('active');
  requestAnimationFrame(() => modalElement.classList.add('visible'));
}

function hideModal(modalElement) {
  if (!modalElement) return;
  document.body.style.overflow = '';
  modalElement.classList.remove('visible');
  setTimeout(() => modalElement.classList.remove('active'), 350);
}

export function initCustomModal(sectionId, { handleOpen, openRoot, modalId } = {}) {
  const container = document.querySelector(`[data-section-id="${sectionId}"]`);
  if (!container) return;
  const modalElement = container.querySelector('[data-custom-modal]');
  if (!modalElement) return;

  const root = openRoot || container;
  root.addEventListener('click', e => {
    // open
    const openBtn = e.target.closest('[data-custom-modal-open]');
    if (!openBtn) return;
    
    // If modalId is specified, only handle buttons that match this modal
    if (modalId && !openBtn.hasAttribute(`data-${modalId}`)) return;
    
    e.preventDefault();
    if (handleOpen) handleOpen(openBtn, modalElement);
    showModal(modalElement);
  });
  
  modalElement.addEventListener('click', e => {
    // close
    if ( e.target.closest('[data-overlay], [data-close]') ) {
      e.preventDefault();
      hideModal(modalElement);
    }
  });

  // escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalElement.classList.contains('active')) {
      hideModal(modalElement);
    }
  });

  return modalElement;
}

