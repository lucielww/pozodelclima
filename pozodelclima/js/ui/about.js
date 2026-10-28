// Overlay "acerca de": se abre sobre la portada o sobre el campo.
// Accesible con teclado: Esc cierra, Tab queda atrapado dentro del panel.

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function initAbout() {
  const overlay = document.querySelector('#about');
  const panel = overlay?.querySelector('.about__panel');
  const openers = document.querySelectorAll('[data-about-open]');
  const closers = document.querySelectorAll('[data-about-close]');

  if (!overlay || !panel) return;

  let previousFocus = null;

  function open() {
    if (!overlay.hidden) return;

    previousFocus = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('about-open');

    const first = panel.querySelector(FOCUSABLE);
    (first ?? panel).focus({ preventScroll: true });
  }

  function close() {
    if (overlay.hidden) return;

    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('about-open');

    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }
  }

  openers.forEach((button) => button.addEventListener('click', open));
  closers.forEach((button) => button.addEventListener('click', close));

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;

    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((node) => {
        return node.offsetParent !== null && !node.disabled;
      });

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}
