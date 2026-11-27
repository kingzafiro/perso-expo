/**
 * Pure TypeScript ISO/IEC 18004 QR Code encoder (Byte mode, Error Correction Level M, Versions 1–6).
 * Supports up to 106 UTF-8 bytes — ideal for unforgeable Perso interview pass tokens.
 */

interface VersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  ecPerBlock: number;
  numBlocks: number;
  alignmentCenters: number[];
}

// ISO/IEC 18004 Table 9 for Error Correction Level M (versions 1..6)
const VERSION_SPECS: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 16, ecPerBlock: 10, numBlocks: 1, alignmentCenters: [] },
  { version: 2, size: 25, dataCodewords: 28, ecPerBlock: 16, numBlocks: 1, alignmentCenters: [6, 18] },
  { version: 3, size: 29, dataCodewords: 44, ecPerBlock: 26, numBlocks: 1, alignmentCenters: [6, 22] },
  { version: 4, size: 33, dataCodewords: 64, ecPerBlock: 18, numBlocks: 2, alignmentCenters: [6, 26] },
  { version: 5, size: 37, dataCodewords: 86, ecPerBlock: 24, numBlocks: 2, alignmentCenters: [6, 30] },
  { version: 6, size: 41, dataCodewords: 108, ecPerBlock: 16, numBlocks: 4, alignmentCenters: [6, 34] },
];

// GF(256) log/exp tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildRsGenerator(degree: number): Uint8Array {
  let poly: number[] = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return Uint8Array.from(poly);
}

function computeRsEcc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = buildRsGenerator(ecCount);
  const msg = new Uint8Array(data.length + ecCount);
  msg.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function utf8Bytes(text: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text);
  }
  const encoded = unescape(encodeURIComponent(text));
  const out = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    out[i] = encoded.charCodeAt(i);
  }
  return out;
}

function buildCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100) + 8-bit length (versions 1..9)
  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const maxBits = spec.dataCodewords * 8;
  const terminatorLen = Math.min(4, maxBits - bits.length);
  pushBits(0, terminatorLen);

  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes = new Uint8Array(spec.dataCodewords);
  const byteLen = bits.length / 8;
  for (let i = 0; i < byteLen; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  const padBytes = [0xec, 0x11];
  for (let i = byteLen; i < spec.dataCodewords; i++) {
    dataBytes[i] = padBytes[(i - byteLen) % 2];
  }

  const blockDataLen = spec.dataCodewords / spec.numBlocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < spec.numBlocks; b++) {
    const slice = dataBytes.slice(b * blockDataLen, (b + 1) * blockDataLen);
    dataBlocks.push(slice);
    ecBlocks.push(computeRsEcc(slice, spec.ecPerBlock));
  }

  const totalLen = spec.dataCodewords + spec.ecPerBlock * spec.numBlocks;
  const out = new Uint8Array(totalLen);
  let idx = 0;

  for (let i = 0; i < blockDataLen; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      out[idx++] = dataBlocks[b][i];
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      out[idx++] = ecBlocks[b][i];
    }
  }

  return out;
}

function computeFormatBits(mask: number): number {
  // Error Correction Level M = 0b00
  const data = (0b00 << 3) | (mask & 0x7);
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function computePenalty(matrix: Uint8Array[], size: number): number {
  let penalty = 0;

  // N1: adjacent same-color modules in rows & cols
  for (let r = 0; r < size; r++) {
    let runColor = matrix[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let c = 0; c < size; c++) {
    let runColor = matrix[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = matrix[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  // N2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r][c];
      if (
        v === matrix[r][c + 1] &&
        v === matrix[r + 1][c] &&
        v === matrix[r + 1][c + 1]
      ) {
        penalty += 3;
      }
    }
  }

  // N4: dark/light balance
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) dark++;
    }
  }
  const ratio = (dark * 100) / (size * size);
  penalty += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return penalty;
}

function drawFormatBits(matrix: Uint8Array[], size: number, mask: number) {
  const format = computeFormatBits(mask);
  const bit = (i: number) => (format >>> i) & 1;

  // Copy 1: around top-left finder
  const coords1: [number, number][] = [
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [7, 8],
    [8, 8],
    [8, 7],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = coords1[i];
    matrix[r][c] = bit(i);
  }

  // Copy 2: top-right horizontal (bits 0..7) + bottom-left vertical (bits 8..14)
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 1 - i] = bit(i);
  }
  for (let i = 8; i < 15; i++) {
    matrix[size - 15 + i][8] = bit(i);
  }
}

export interface QrMatrixResult {
  size: number;
  modules: boolean[][];
}

export function encodeQrMatrix(text: string): QrMatrixResult {
  const bytes = utf8Bytes(text);
  const spec = VERSION_SPECS.find((s) => bytes.length <= s.dataCodewords - 2);
  if (!spec) {
    throw new Error("El contenido del código QR excede la longitud máxima soportada.");
  }

  const { size } = spec;
  const codewords = buildCodewords(bytes, spec);

  const isFunction = Array.from({ length: size }, () => new Uint8Array(size));
  const baseMatrix = Array.from({ length: size }, () => new Uint8Array(size));

  const setFn = (r: number, c: number, dark: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    isFunction[r][c] = 1;
    baseMatrix[r][c] = dark ? 1 : 0;
  };

  // Finder patterns + separators
  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || c < 0 || r >= size || c >= size) continue;
        const inside = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const dark =
          inside &&
          (dr === 0 ||
            dr === 6 ||
            dc === 0 ||
            dc === 6 ||
            (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        setFn(r, c, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const centers = spec.alignmentCenters;
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      const cr = centers[i];
      const cc = centers[j];
      const overlapsFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === centers.length - 1) ||
        (i === centers.length - 1 && j === 0);
      if (overlapsFinder) continue;

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(cr + dr, cc + dc, dist === 2 || dist === 0);
        }
      }
    }
  }

  // Reserve format info modules
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFn(8, i, false);
      setFn(i, 8, false);
    }
  }
  for (let i = size - 8; i < size; i++) {
    setFn(8, i, false);
  }
  for (let i = size - 7; i < size; i++) {
    setFn(i, 8, false);
  }
  // Dark module
  setFn(4 * spec.version + 9, 8, true);

  // Place data bits in zigzag order
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset++) {
        const c = col - offset;
        if (isFunction[row][c]) continue;
        let bitVal = 0;
        if (bitIdx < totalBits) {
          bitVal = (codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
          bitIdx++;
        }
        baseMatrix[row][c] = bitVal;
      }
    }
    upward = !upward;
  }

  // Pick best mask (0..7)
  let bestMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestMatrix: Uint8Array[] | null = null;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = baseMatrix.map((row) => Uint8Array.from(row));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunction[r][c] && maskCondition(mask, r, c)) {
          candidate[r][c] ^= 1;
        }
      }
    }
    drawFormatBits(candidate, size, mask);
    const score = computePenalty(candidate, size);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  const finalMatrix = bestMatrix ?? baseMatrix;
  void bestMask;

  return {
    size,
    modules: finalMatrix.map((row) => Array.from(row, (v) => v === 1)),
  };
}
