import type { BoundingBox, DetectionConfig, Polygon, TextRegion } from './types';

export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  threshold: 0.2,
  boxThreshold: 0.4,
  unclipRatio: 1.4,
  maxCandidates: 1000,
  minSize: 3
};

interface ComponentInfo {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
  points: [number, number][];
}

/**
 * DBNet Post-processing implementation in pure TypeScript:
 * 1. Binarizes the probability map at config.threshold (0.2).
 * 2. Extracts connected components (blobs).
 * 3. Finds bounding quads/boxes for each component.
 * 4. Filters boxes below minSize or boxThreshold (0.4).
 * 5. Expands boxes using DBNet unclip ratio (1.4).
 * 6. Scales coordinates back to original image space.
 */
export function postprocessDBNet(
  probMap: Float32Array,
  mapHeight: number,
  mapWidth: number,
  destWidth: number,
  destHeight: number,
  config: DetectionConfig = DEFAULT_DETECTION_CONFIG
): TextRegion[] {
  const { threshold, boxThreshold, unclipRatio, minSize = 3, maxCandidates = 1000 } = config;

  // Step 1: Binarize
  const binaryMap = new Uint8Array(mapWidth * mapHeight);
  for (let i = 0; i < probMap.length; i++) {
    binaryMap[i] = probMap[i] >= threshold ? 1 : 0;
  }

  // Step 2: Connected Component Labeling using Union-Find
  const labels = new Int32Array(mapWidth * mapHeight);
  const parent: number[] = [0];
  let nextLabel = 1;

  function find(i: number): number {
    let root = i;
    while (root < parent.length && parent[root] !== root) {
      root = parent[root];
    }
    let curr = i;
    while (curr < parent.length && curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  // First pass
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const idx = y * mapWidth + x;
      if (binaryMap[idx] === 0) continue;

      const left = x > 0 && binaryMap[idx - 1] === 1 ? labels[idx - 1] : 0;
      const top = y > 0 && binaryMap[idx - mapWidth] === 1 ? labels[idx - mapWidth] : 0;

      if (left === 0 && top === 0) {
        labels[idx] = nextLabel;
        parent.push(nextLabel);
        nextLabel++;
      } else if (left !== 0 && top === 0) {
        labels[idx] = left;
      } else if (left === 0 && top !== 0) {
        labels[idx] = top;
      } else {
        labels[idx] = left;
        if (left !== top) {
          union(left, top);
        }
      }
    }
  }

  // Second pass: gather components
  const components = new Map<number, ComponentInfo>();
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const idx = y * mapWidth + x;
      if (labels[idx] === 0) continue;

      const root = find(labels[idx]);
      labels[idx] = root;

      let comp = components.get(root);
      if (!comp) {
        comp = {
          minX: x,
          maxX: x,
          minY: y,
          maxY: y,
          area: 0,
          points: []
        };
        components.set(root, comp);
      }

      comp.area++;
      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;
      comp.points.push([x, y]);
    }
  }

  const results: TextRegion[] = [];

  // Step 3 & 4: Process components
  for (const comp of components.values()) {
    const w = comp.maxX - comp.minX + 1;
    const h = comp.maxY - comp.minY + 1;
    const minDim = Math.min(w, h);

    if (minDim < minSize || comp.area < minSize * minSize) {
      continue;
    }

    // Calculate box score (mean probability within the bounding box)
    let scoreSum = 0;
    let count = 0;
    for (let y = comp.minY; y <= comp.maxY; y++) {
      const rowOffset = y * mapWidth;
      for (let x = comp.minX; x <= comp.maxX; x++) {
        scoreSum += probMap[rowOffset + x];
        count++;
      }
    }
    const score = count > 0 ? scoreSum / count : 0;
    if (score < boxThreshold) {
      continue;
    }

    // Step 5: Unclip box
    // DBNet unclip formula: distance = (area * unclip_ratio) / perimeter
    const perimeter = 2 * (w + h);
    const distance = (comp.area * unclipRatio) / Math.max(1, perimeter);

    // Expand bounding box by distance
    const unclippedMinX = Math.max(0, comp.minX - distance);
    const unclippedMaxX = Math.min(mapWidth - 1, comp.maxX + distance);
    const unclippedMinY = Math.max(0, comp.minY - distance);
    const unclippedMaxY = Math.min(mapHeight - 1, comp.maxY + distance);

    const unclippedW = unclippedMaxX - unclippedMinX;
    const unclippedH = unclippedMaxY - unclippedMinY;

    if (unclippedW < minSize + 2 || unclippedH < minSize + 2) {
      continue;
    }

    // Step 6: Scale back to original destination image dimensions
    const scaleX = destWidth / mapWidth;
    const scaleY = destHeight / mapHeight;

    const finalX = Math.round(unclippedMinX * scaleX);
    const finalY = Math.round(unclippedMinY * scaleY);
    const finalW = Math.round(unclippedW * scaleX);
    const finalH = Math.round(unclippedH * scaleY);

    const bbox: BoundingBox = {
      x: Math.max(0, finalX),
      y: Math.max(0, finalY),
      width: Math.min(destWidth - Math.max(0, finalX), finalW),
      height: Math.min(destHeight - Math.max(0, finalY), finalH)
    };

    const polygon: Polygon = [
      [bbox.x, bbox.y],
      [bbox.x + bbox.width, bbox.y],
      [bbox.x + bbox.width, bbox.y + bbox.height],
      [bbox.x, bbox.y + bbox.height]
    ];

    results.push({
      polygon,
      bbox,
      score: Math.round(score * 1000) / 1000
    });

    if (results.length >= maxCandidates) {
      break;
    }
  }

  // Sort in standard reading order: Top-to-Bottom, Left-to-Right
  results.sort((a, b) => {
    // If lines are roughly at the same Y level (within half line height)
    const yThreshold = Math.min(a.bbox.height, b.bbox.height) * 0.6;
    if (Math.abs(a.bbox.y - b.bbox.y) < yThreshold) {
      return a.bbox.x - b.bbox.x;
    }
    return a.bbox.y - b.bbox.y;
  });

  return results;
}
