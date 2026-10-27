import { blockiePaths, createBlockie } from '@/ui/utils/blockies';

const ADDRESS = '0xC6cD4F327EBDA9a78cC52414aA5101c211B5e4D9';

describe('createBlockie', () => {
  it('is deterministic and ignores address case', () => {
    const a = createBlockie(ADDRESS);
    const b = createBlockie(ADDRESS.toLowerCase());
    expect(b).toEqual(a);
    expect(createBlockie(ADDRESS)).toEqual(a);
  });

  it('draws an 8x8 grid mirrored left to right', () => {
    const { size, cells } = createBlockie(ADDRESS);
    expect(size).toBe(8);
    expect(cells).toHaveLength(64);
    for (let y = 0; y < size; y++) {
      const row = cells.slice(y * size, (y + 1) * size);
      expect(row).toEqual([...row].reverse());
    }
    expect(cells.every((c) => c === 0 || c === 1 || c === 2)).toBe(true);
  });

  it('gives different addresses different icons', () => {
    const a = createBlockie(ADDRESS);
    const b = createBlockie('0xd8da6bf26964af9d7eed9e03e53415d37aa96045');
    expect(b).not.toEqual(a);
  });

  it('uses hsl colours with saturation of at least 40%', () => {
    const { color, bgcolor, spotcolor } = createBlockie(ADDRESS);
    [color, bgcolor, spotcolor].forEach((c) => {
      const match = /^hsl\((\d+),([\d.]+)%,([\d.]+)%\)$/.exec(c);
      expect(match).not.toBeNull();
      expect(Number(match![2])).toBeGreaterThanOrEqual(40);
    });
  });
});

describe('blockiePaths', () => {
  it('draws one square per filled cell, split by colour', () => {
    const blockie = createBlockie(ADDRESS);
    const { color, spot } = blockiePaths(blockie);
    const count = (d: string) => (d.match(/M/g) || []).length;
    expect(count(color)).toBe(blockie.cells.filter((c) => c === 1).length);
    expect(count(spot)).toBe(blockie.cells.filter((c) => c === 2).length);
  });
});
