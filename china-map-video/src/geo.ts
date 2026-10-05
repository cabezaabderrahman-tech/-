import { geoArea, geoConicConformal, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon } from "geojson";
import rawProvinces from "./data/china-provinces.json";

type ProvinceProperties = {
  readonly name: string;
  readonly adcode: string;
};

export type ProvinceShape = {
  readonly name: string;
  readonly adcode: string;
  /** SVG path in map units (1 unit = 1px of the 1920×1080 overview). */
  readonly d: string;
  /** Bounding box used for framing, ignoring small outlying islands. */
  readonly focus: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
};

export const MAP_WIDTH = 1920;
export const MAP_HEIGHT = 1080;

const collection = rawProvinces as unknown as FeatureCollection<
  MultiPolygon,
  ProvinceProperties
>;

// Lambert conformal conic with standard parallels 25°N / 47°N,
// the projection used for national maps of China.
const projection = geoConicConformal()
  .rotate([-105, 0])
  .parallels([25, 47])
  .fitExtent(
    [
      [160, 70],
      [MAP_WIDTH - 160, MAP_HEIGHT - 50],
    ],
    collection,
  );

const pathGenerator = geoPath(projection).digits(2);

const framingGeometry = (
  feature: Feature<MultiPolygon, ProvinceProperties>,
): MultiPolygon => {
  const polygons = feature.geometry.coordinates;
  const areas = polygons.map((coordinates) =>
    geoArea({ type: "Polygon", coordinates }),
  );
  const largest = Math.max(...areas);
  return {
    type: "MultiPolygon",
    coordinates: polygons.filter((_, i) => areas[i] >= largest * 0.02),
  };
};

export const provinceShapes: ProvinceShape[] = collection.features.map(
  (feature) => {
    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(framingGeometry(feature));
    return {
      name: feature.properties.name,
      adcode: feature.properties.adcode,
      d: pathGenerator(feature) ?? "",
      focus: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
    };
  },
);

const SUFFIX = /(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/;

export const shortProvinceName = (name: string) => name.replace(SUFFIX, "");

/** Accepts "广东", "广东省", "内蒙古", "新疆维吾尔自治区", ... */
export const findProvinceShape = (name: string): ProvinceShape => {
  const wanted = shortProvinceName(name.trim());
  const shape = provinceShapes.find(
    (p) => shortProvinceName(p.name) === wanted,
  );
  if (!shape) {
    throw new Error(
      `找不到省份「${name}」。可用名称：${provinceShapes
        .map((p) => shortProvinceName(p.name))
        .join("、")}`,
    );
  }
  return shape;
};
