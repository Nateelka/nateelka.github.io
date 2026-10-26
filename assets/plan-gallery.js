(() => {
  const viewer = document.querySelector('.image-viewer');
  const links = [...document.querySelectorAll('.screenshot-link')];
  if (!viewer || !links.length || typeof viewer.showModal !== 'function') return;
  const stage = viewer.querySelector('.viewer-stage');
  const image = viewer.querySelector('.viewer-image');
  const counter = viewer.querySelector('.viewer-counter');
  const pointers = new Map();
  let index = 0, opener, scale = 1, x = 0, y = 0;
  let startX = 0, startY = 0, dragX = 0, dragY = 0, pinchDistance = 0, pinchScale = 1, gesture = false, moved = false;

  function render() {
    const available = stage.getBoundingClientRect();
    const limitX = Math.max(0, (image.offsetWidth * scale - available.width) / 2);
    const limitY = Math.max(0, (image.offsetHeight * scale - available.height) / 2);
    x = Math.max(-limitX, Math.min(limitX, x));
    y = Math.max(-limitY, Math.min(limitY, y));
    image.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
    stage.classList.toggle('is-zoomed', scale > 1.01);
  }
  function reset() { scale = 1; x = y = 0; render(); }
  function show(next) {
    index = (next + links.length) % links.length;
    image.src = links[index].href;
    image.alt = links[index].querySelector('img').alt;
    counter.textContent = (index + 1) + ' / ' + links.length;
    reset();
  }
  image.addEventListener('load', render);
  image.addEventListener('dragstart', event => event.preventDefault());
  links.forEach((link, position) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(position);
      viewer.showModal();
      document.documentElement.classList.add('viewer-open');
      render();
    });
  });
  viewer.querySelector('.viewer-prev').addEventListener('click', () => show(index - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => show(index + 1));
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
  });
  viewer.addEventListener('click', event => {
    const bounds = image.getBoundingClientRect();
    const outsideImage = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (!moved && outsideImage && (event.target === viewer || event.target === stage)) viewer.close();
    moved = false;
  });
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const previous = scale;
    scale = Math.max(1, Math.min(3.5, scale * Math.exp(-event.deltaY * 0.0015)));
    const bounds = stage.getBoundingClientRect();
    const pointX = event.clientX - bounds.left - bounds.width / 2;
    const pointY = event.clientY - bounds.top - bounds.height / 2;
    x = pointX - (pointX - x) * scale / previous;
    y = pointY - (pointY - y) * scale / previous;
    if (scale === 1) x = y = 0;
    render();
  }, { passive: false });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      startX = event.clientX; startY = event.clientY; dragX = x; dragY = y; gesture = false; moved = false;
    } else if (pointers.size === 2) {
      const points = [...pointers.values()];
      pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      pinchScale = scale; gesture = true;
    }
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const points = [...pointers.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (pinchDistance > 0) scale = Math.max(1, Math.min(3.5, pinchScale * distance / pinchDistance));
      moved = true; render();
    } else if (!gesture) {
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (Math.hypot(dx, dy) > 8) moved = true;
      if (scale > 1.01) { x = dragX + dx; y = dragY + dy; render(); }
    }
  });
  function release(event, cancelled) {
    if (!pointers.has(event.pointerId)) return;
    const dx = event.clientX - startX, dy = event.clientY - startY;
    pointers.delete(event.pointerId);
    if (!cancelled && !gesture && scale <= 1.01 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      show(index + (dx < 0 ? 1 : -1)); moved = true;
    }
  }
  stage.addEventListener('pointerup', event => release(event, false));
  stage.addEventListener('pointercancel', event => release(event, true));
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    pointers.clear(); reset(); opener?.focus({ preventScroll: true });
  });
  window.addEventListener('resize', render);
})();