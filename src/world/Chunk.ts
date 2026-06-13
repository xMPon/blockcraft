// Chunk: a 16×64×16 voxel column stored as a flat Uint8Array of block ids.
export const CHUNK_X = 16;
export const CHUNK_Y = 128;
export const CHUNK_Z = 16;

export class Chunk {
  readonly data = new Uint8Array(CHUNK_X * CHUNK_Y * CHUNK_Z);

  constructor(
    readonly cx: number,
    readonly cz: number,
  ) {}

  static index(x: number, y: number, z: number): number {
    return (y * CHUNK_Z + z) * CHUNK_X + x;
  }

  static inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < CHUNK_X && y >= 0 && y < CHUNK_Y && z >= 0 && z < CHUNK_Z;
  }

  /** Local-coordinate read; out-of-bounds reads return air. */
  get(x: number, y: number, z: number): number {
    return Chunk.inBounds(x, y, z) ? this.data[Chunk.index(x, y, z)] : 0;
  }

  /** Local-coordinate write; out-of-bounds writes are ignored. */
  set(x: number, y: number, z: number, id: number): void {
    if (Chunk.inBounds(x, y, z)) this.data[Chunk.index(x, y, z)] = id;
  }
}
