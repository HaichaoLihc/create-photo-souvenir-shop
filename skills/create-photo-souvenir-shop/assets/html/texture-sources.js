import { COLLECTION } from "./collection.js";
import { TRIP_ART, artUrl } from "./trip-art.js";
import { BOOK_COVER, BOOK_BACK } from "./trip-book.js";
export const TEXTURE_SOURCES = [
  ...TRIP_ART.map((_, i) => ["art-" + i, artUrl(i)]),
  ...(COLLECTION.ornaments ? [["mobiles", COLLECTION.ornaments.src]] : []),
  ...(COLLECTION.book
    ? [
        ["book-cover", BOOK_COVER],
        ["book-back", BOOK_BACK],
      ]
    : []),
];
