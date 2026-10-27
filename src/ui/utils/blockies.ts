/**
 * Ethereum "blockies" identicons, the same 8x8 mirrored mosaic Etherscan and
 * MetaMask draw for an address, so a user can match an account here against
 * a block explorer at a glance.
 *
 * Port of ethereum/blockies (WTFPL). The PRNG quirks (unbounded seeding,
 * dividing by 2^31) are kept on purpose: changing them would change every
 * icon and break that cross-check.
 */

export type Blockie = {
  size: number;
  color: string;
  bgcolor: string;
  spotcolor: string;
  /** row-major, `size * size` cells: 0 = background, 1 = color, 2 = spot */
  cells: number[];
};

const createRandom = (seed: string) => {
  const randseed = [0, 0, 0, 0];
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] =
      (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
  }

  return () => {
    const t = randseed[0] ^ (randseed[0] << 11);
    randseed[0] = randseed[1];
    randseed[1] = randseed[2];
    randseed[2] = randseed[3];
    randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);
    return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
  };
};

const cache = new Map<string, Blockie>();

export const createBlockie = (address: string, size = 8): Blockie => {
  const seed = (address || '').toLowerCase();
  const key = `${size}:${seed}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rand = createRandom(seed);
  const createColor = () => {
    const h = Math.floor(rand() * 360);
    const s = rand() * 60 + 40;
    const l = (rand() + rand() + rand() + rand()) * 25;
    return `hsl(${h},${s}%,${l}%)`;
  };

  // the order of these draws is part of the algorithm
  const color = createColor();
  const bgcolor = createColor();
  const spotcolor = createColor();

  const dataWidth = Math.ceil(size / 2);
  const mirrorWidth = size - dataWidth;
  const cells: number[] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < dataWidth; x++) {
      row[x] = Math.floor(rand() * 2.3);
    }
    const mirrored = row.slice(0, mirrorWidth).reverse();
    cells.push(...row, ...mirrored);
  }

  const blockie = { size, color, bgcolor, spotcolor, cells };
  if (cache.size > 500) cache.clear();
  cache.set(key, blockie);
  return blockie;
};

/** One SVG path per colour, so an avatar is three nodes instead of 64 rects. */
export const blockiePaths = (blockie: Blockie) => {
  const paths = { color: '', spot: '' };
  blockie.cells.forEach((cell, i) => {
    if (!cell) return;
    const x = i % blockie.size;
    const y = Math.floor(i / blockie.size);
    const d = `M${x} ${y}h1v1h-1z`;
    if (cell === 1) paths.color += d;
    else paths.spot += d;
  });
  return paths;
};
