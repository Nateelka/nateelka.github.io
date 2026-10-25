(() => {
  const viewer = document.querySelector('.image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('.viewer-image');
  const title = viewer.querySelector('#viewer-title');
  const stage = viewer.querySelector('.viewer-stage');
  const zoom = viewer.querySelector('.viewer-zoom');
  let opener;
  const resetZoom = () => {
    stage.classList.remove('is-zoomed');
    zoom.textContent = 'Увеличить';
    zoom.setAttribute('aria-pressed', 'false');
    stage.scrollTo(0, 0);
  };
  document.querySelectorAll('.screenshot-link').forEach(link => {
    link.addEventListener('click', event => {
      // Preserve normal browser actions such as opening a new tab.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      const thumbnail = link.querySelector('img');
      image.src = link.href;
      image.alt = thumbnail.alt;
      title.textContent = thumbnail.alt;
      resetZoom();
      viewer.showModal();
      document.documentElement.classList.add('viewer-open');
    });
  });
  zoom.addEventListener('click', () => {
    const enlarged = stage.classList.toggle('is-zoomed');
    zoom.textContent = enlarged ? 'Уменьшить' : 'Увеличить';
    zoom.setAttribute('aria-pressed', String(enlarged));
    stage.scrollTo(0, 0);
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    resetZoom();
    opener?.focus({ preventScroll: true });
  });
})();
