// Chunk index math and world-coordinate access (incl. negative coords).
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { Chunk, CHUNK_X, CHUNK_Y, CHUNK_Z } from "../src/world/Chunk";
import { World } from "../src/world/World";
import { WorldGen } from "../src/world/WorldGen";
import { STONE } from "../src/world/Block";

describe("Chunk", () => {
  it("round-trips set/get across the full volume", () => {
    const chunk = new Chunk(0, 0);
    for (let x = 0; x < CHUNK_X; x++) {
      for (let y = 0; y < CHUNK_Y; y++) {
        for (let z = 0; z < CHUNK_Z; z++) {
          chunk.set(x, y, z, ((x + y + z) % 7) + 1);
        }
      }
    }
    for (let x = 0; x < CHUNK_X; x++) {
      for (let y = 0; y < CHUNK_Y; y++) {
        for (let z = 0; z < CHUNK_Z; z++) {
          expect(chunk.get(x, y, z)).toBe(((x + y + z) % 7) + 1);
        }
      }
    }
  });

  it("maps every coordinate to a unique index", () => {
    const seen = new Set<number>();
    for (let x = 0; x < CHUNK_X; x++) {
      for (let y = 0; y < CHUNK_Y; y++) {
        for (let z = 0; z < CHUNK_Z; z++) {
          seen.add(Chunk.index(x, y, z));
        }
      }
    }
    expect(seen.size).toBe(CHUNK_X * CHUNK_Y * CHUNK_Z);
  });

  it("reads air out of bounds and ignores out-of-bounds writes", () => {
    const chunk = new Chunk(0, 0);
    chunk.set(-1, 0, 0, 5);
    chunk.set(0, CHUNK_Y, 0, 5);
    expect(chunk.get(-1, 0, 0)).toBe(0);
    expect(chunk.get(0, CHUNK_Y, 0)).toBe(0);
  });
});

describe("World coordinates", () => {
  const makeWorld = () =>
    new World(new WorldGen(7), new THREE.Scene(), {
      solid: new THREE.MeshBasicMaterial(),
      water: new THREE.MeshBasicMaterial(),
    });

  it("get/set works at negative world coordinates", () => {
    const world = makeWorld();
    world.getOrCreateChunk(-1, -1);
    world.setBlock(-1, 50, -1, STONE);
    expect(world.getBlock(-1, 50, -1)).toBe(STONE);
  });

  it("reads air from missing chunks and out-of-range y", () => {
    const world = makeWorld();
    expect(world.getBlock(1000, 10, 1000)).toBe(0);
    world.getOrCreateChunk(0, 0);
    expect(world.getBlock(0, -1, 0)).toBe(0);
    expect(world.getBlock(0, CHUNK_Y, 0)).toBe(0);
  });
});
