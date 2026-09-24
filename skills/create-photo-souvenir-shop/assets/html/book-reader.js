// Keep the iframe alive between visits so the reader keeps its current page.
export function createBookReader({
  dialog,
  frame,
  loading,
  closeButton,
  collection,
  collectionButton,
  fallbackFocus,
  beforeOpen,
  afterClose,
}) {
  let ready = false;
  let returnFocus = null;
  const close = () => {
    if (dialog.open) dialog.close();
  };
  frame.addEventListener("load", () => {
    if (!frame.hasAttribute("src")) return;
    ready = true;
    loading.hidden = true;
    if (dialog.open) frame.contentWindow.focus();
  });
  closeButton.onclick = close;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("close", () => {
    afterClose();
    (returnFocus?.isConnected ? returnFocus : fallbackFocus).focus({
      preventScroll: true,
    });
  });
  window.addEventListener("message", (event) => {
    if (
      event.origin === location.origin &&
      event.source === frame.contentWindow &&
      event.data?.type === "travel-book-close"
    )
      close();
  });
  return {
    open(url) {
      if (dialog.open) return;
      returnFocus = collection.contains(document.activeElement)
        ? collectionButton
        : document.activeElement;
      if (collection.open) collection.close();
      beforeOpen();
      const changed = frame.getAttribute("src") !== url;
      if (changed) ready = false;
      loading.hidden = ready;
      dialog.showModal();
      closeButton.focus();
      if (changed) frame.src = url;
      else if (ready)
        requestAnimationFrame(() => {
          if (!dialog.open) return;
          frame.contentWindow.dispatchEvent(
            new frame.contentWindow.Event("resize"),
          );
          frame.contentWindow.focus();
        });
    },
    close,
  };
}
