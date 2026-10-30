import { describe, expect, it } from 'vitest';
import { bboxContains, tileBbox, tilesForBbox, type Bbox } from '../src/cache/tiles';

const downtownPelotas: Bbox = [-52.35, -31.775, -52.33, -31.76];

describe('map tiles', () => {
  it('covers the bbox with tiles whose bounds contain it', () => {
    const tiles = tilesForBbox(downtownPelotas, 13, 64)!;
    expect(tiles.length).toBeGreaterThan(0);

    const [minLng, minLat, maxLng, maxLat] = downtownPelotas;
    const covered = (lng: number, lat: number) =>
      tiles.some((t) => bboxContains(tileBbox(t), lng, lat));
    expect(covered(minLng, minLat)).toBe(true);
    expect(covered(maxLng, maxLat)).toBe(true);
  });

  it('maps slightly different viewports to the same tiles', () => {
    const shifted: Bbox = [-52.349, -31.774, -52.331, -31.761];
    expect(tilesForBbox(shifted, 13, 64)).toEqual(tilesForBbox(downtownPelotas, 13, 64));
  });

  it('gives up when the bbox needs too many tiles', () => {
    expect(tilesForBbox([-180, -85, 180, 85], 13, 64)).toBeNull();
  });
});
