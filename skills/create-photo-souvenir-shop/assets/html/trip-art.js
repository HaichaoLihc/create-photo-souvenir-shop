import { COLLECTION } from "./collection.js";
export const TRIP_ART = COLLECTION.artworks;
export const sourceUrl = (id) =>
  COLLECTION.photos.find((p) => p.id === id)?.src;
export const artUrl = (i) => TRIP_ART[i % TRIP_ART.length].src;
export const MOBILE_SOURCE_IDS = Array.from(
  { length: 16 },
  (_, i) =>
    COLLECTION.ornaments?.photos[i] || TRIP_ART[i % TRIP_ART.length].photo,
);
export const MOBILE_TITLES = Array.from(
  { length: 16 },
  (_, i) => TRIP_ART[i % TRIP_ART.length].title,
);
export const artForPhoto = (textures, id) =>
  textures["art-" + TRIP_ART.findIndex((a) => a.photo === id)];
// Greedy ordering avoids adjacent copies of one source/style when alternatives exist.
export function postcardOrder() {
  const remaining = TRIP_ART.map((_, i) => i),
    result = [];
  const columns = Math.min(25, Math.ceil(Math.min(100, remaining.length) / 4));
  while (remaining.length && result.length < 100) {
    const slot = result.length;
    const neighbors = [
      slot % columns ? result[slot - 1] : null,
      result[slot - columns],
    ]
      .filter((i) => i != null)
      .map((i) => TRIP_ART[i]);
    let best = 0,
      penalty = Infinity;
    remaining.forEach((id, i) => {
      const a = TRIP_ART[id];
      const score = neighbors.reduce(
        (n, b) =>
          n + (a.photo === b.photo ? 4 : 0) + (a.style === b.style ? 1 : 0),
        0,
      );
      if (score < penalty) {
        penalty = score;
        best = i;
      }
    });
    result.push(remaining.splice(best, 1)[0]);
  }
  return result;
}
