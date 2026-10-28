// Portada: espera la materia del seed y da paso al campo.
// No hay carga bloqueante: el pozo puede llenarse mientras se lee la portada.

export function initEntry({ stage, ready, onEnter }) {
  const entry = document.querySelector('#entry');
  const button = document.querySelector('#enter');
  const status = document.querySelector('#entry-status');

  if (!entry || !button || !status) return;

  let busy = false;

  button.addEventListener('click', async () => {
    if (busy) return;
    busy = true;

    button.disabled = true;
    entry.classList.add('is-loading');
    status.textContent = 'el pozo se está llenando…';

    try {
      await ready;

      // La ubicación y el clima se resuelven antes de retirar la portada.
      await onEnter();

      status.textContent = '';
      entry.classList.add('is-gone');
      stage.setAttribute('aria-hidden', 'false');

      window.setTimeout(() => {
        entry.hidden = true;
      }, 900);

      stage.focus({ preventScroll: true });
    } catch (error) {
      console.error(error);
      status.textContent = 'no se pudo abrir el pozo. recargá la página.';
      button.disabled = false;
      entry.classList.remove('is-loading');
      busy = false;
    }
  });
}
