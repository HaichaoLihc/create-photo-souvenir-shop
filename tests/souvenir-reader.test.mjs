import assert from "node:assert/strict";
import test from "node:test";
import { createBookReader } from "../skills/create-photo-souvenir-shop/assets/html/book-reader.js";

test("reader loads lazily, preserves pages, restores focus and validates messages", () => {
  class Element extends EventTarget {
    open = false;
    hidden = false;
    isConnected = true;
    focusCount = 0;
    attrs = new Map();
    focus() {
      this.focusCount++;
    }
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    }
    getAttribute(k) {
      return this.attrs.get(k) ?? null;
    }
    hasAttribute(k) {
      return this.attrs.has(k);
    }
    set src(v) {
      this.attrs.set("src", v);
    }
    contains(o) {
      return o === selected;
    }
  }
  const dialog = new Element(),
    frame = new Element(),
    loading = new Element(),
    closeButton = new Element(),
    collection = new Element(),
    collectionButton = new Element(),
    fallbackFocus = new Element(),
    selected = new Element();
  let resize = 0,
    before = 0,
    after = 0;
  frame.contentWindow = new Element();
  frame.contentWindow.Event = Event;
  frame.contentWindow.addEventListener("resize", () => resize++);
  globalThis.window = new EventTarget();
  globalThis.location = { origin: "http://localhost:4173" };
  globalThis.document = { activeElement: selected };
  globalThis.requestAnimationFrame = (cb) => cb();
  const reader = createBookReader({
    dialog,
    frame,
    loading,
    closeButton,
    collection,
    collectionButton,
    fallbackFocus,
    beforeOpen() {
      before++;
    },
    afterClose() {
      after++;
    },
  });
  assert(!frame.hasAttribute("src"));
  collection.open = true;
  reader.open("./book/index.html");
  assert(dialog.open);
  assert(!collection.open);
  assert.equal(frame.getAttribute("src"), "./book/index.html");
  assert.equal(loading.hidden, false);
  frame.dispatchEvent(new Event("load"));
  assert.equal(loading.hidden, true);
  function message(origin, source) {
    const event = new Event("message");
    Object.assign(event, {
      origin,
      source,
      data: { type: "travel-book-close" },
    });
    window.dispatchEvent(event);
  }
  message("https://example.com", frame.contentWindow);
  assert(dialog.open);
  message(location.origin, {});
  assert(dialog.open);
  message(location.origin, frame.contentWindow);
  assert(!dialog.open);
  assert.equal(collectionButton.focusCount, 1);
  reader.open("./book/index.html");
  assert.equal(resize, 1);
  assert.equal(loading.hidden, true);
  const cancel = new Event("cancel", { cancelable: true });
  dialog.dispatchEvent(cancel);
  assert(cancel.defaultPrevented);
  assert(!dialog.open);
  reader.open("./book-2/index.html");
  assert.equal(loading.hidden, false);
  assert.equal(frame.getAttribute("src"), "./book-2/index.html");
  reader.close();
  assert.equal(before, 3);
  assert.equal(after, 3);
});
