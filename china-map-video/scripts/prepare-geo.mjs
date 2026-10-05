// Bakes src/data/china-provinces.json from the cn-atlas province boundaries
// (derived from shengshixian.com, 2023 edition).
//
//   node scripts/prepare-geo.mjs
//
// - keeps only the Chinese name and the 6-digit division code per province
// - rounds coordinates to 3 decimals (~100 m) and drops repeated points
// - rewinds rings so d3-geo treats every polygon as the small area, not its complement

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoArea } from "d3-geo";

const require = createRequire(import.meta.url);
const source = JSON.parse(
  readFileSync(require.resolve("cn-atlas/provinces.json"), "utf8"),
);

const round = (n) => Math.round(n * 1000) / 1000;

const cleanRing = (ring) => {
  const out = [];
  for (const [x, y] of ring) {
    const p = [round(x), round(y)];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) {
      out.push(p);
    }
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    out.push([...first]);
  }
  return out;
};

const cleanPolygon = (polygon) => {
  const rings = polygon.map(cleanRing).filter((r) => r.length >= 4);
  if (rings.length === 0) {
    return null;
  }
  // d3-geo uses spherical winding: an exterior ring must enclose less than a hemisphere.
  const asFeature = { type: "Polygon", coordinates: rings };
  if (geoArea(asFeature) > 2 * Math.PI) {
    return rings.map((r) => [...r].reverse());
  }
  return rings;
};

const features = source.features.map((f) => {
  const polygons =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
  const cleaned = polygons.map(cleanPolygon).filter(Boolean);
  return {
    type: "Feature",
    properties: {
      name: f.properties["地名"],
      adcode: f.properties["区划码"],
    },
    geometry: { type: "MultiPolygon", coordinates: cleaned },
  };
});

features.sort((a, b) => a.properties.adcode.localeCompare(b.properties.adcode));

const out = { type: "FeatureCollection", features };
writeFileSync(
  new URL("../src/data/china-provinces.json", import.meta.url),
  JSON.stringify(out),
);

const points = features.reduce(
  (sum, f) =>
    sum +
    f.geometry.coordinates.reduce(
      (s, poly) => s + poly.reduce((t, ring) => t + ring.length, 0),
      0,
    ),
  0,
);
console.log(`${features.length} provinces, ${points} points`);
