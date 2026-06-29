// ChunkMaterial: a small ShaderMaterial pair (opaque + water) that bakes voxel
// lighting and a day/night factor into the chunk meshes. Final brightness is
// max(blockLight, skyLight * uDayFactor) so torches stay lit at night while the
// open sky darkens. Fog is applied manually so it matches the sky colour.
import * as THREE from "three";

export interface ChunkMaterials {
  solid: THREE.ShaderMaterial;
  water: THREE.ShaderMaterial;
  /** Shared uniform objects — mutate `.value` each frame to drive day/night. */
  uDayFactor: { value: number };
  uFogColor: { value: THREE.Color };
}

const VERT = /* glsl */ `
  attribute vec3 color;   // per-face directional shade (grayscale)
  attribute vec2 aLight;  // x = skylight 0..1, y = blocklight 0..1
  attribute vec4 aTile;   // atlas tile window [u0, v0, u1, v1]
  varying vec2 vUv;       // tiled coords (may exceed 0..1 on merged quads)
  varying vec4 vTile;
  varying vec3 vShade;
  varying vec2 vLight;
  varying float vFogDepth;
  void main() {
    vUv = uv;
    vTile = aTile;
    vShade = color;
    vLight = aLight;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uDayFactor;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec4 vTile;
  varying vec3 vShade;
  varying vec2 vLight;
  varying float vFogDepth;
  void main() {
    // Repeat the atlas tile across greedy-merged quads (fract wraps each cell).
    vec2 cell = fract(vUv);
    vec2 uvw = mix(vTile.xy, vTile.zw, cell);
    vec4 tex = texture2D(map, uvw);
    if (tex.a < 0.5) discard;               // cutout (torch/glass) transparency
    float light = max(vLight.y, vLight.x * uDayFactor);
    light = clamp(light, 0.06, 1.0);        // never pitch black
    vec3 col = tex.rgb * vShade.r * light;
    float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

export function createChunkMaterials(map: THREE.Texture, viewDistance: number): ChunkMaterials {
  // Shared uniform objects so one update drives both materials.
  const uDayFactor = { value: 1 };
  const uFogColor = { value: new THREE.Color(0x87ceeb) };
  const uFogNear = { value: viewDistance * 0.55 };
  const uFogFar = { value: viewDistance * 0.95 };

  const common = { map: { value: map }, uDayFactor, uFogColor, uFogNear, uFogFar };

  const solid = new THREE.ShaderMaterial({
    uniforms: { ...common, uOpacity: { value: 1 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const water = new THREE.ShaderMaterial({
    uniforms: { ...common, uOpacity: { value: 0.78 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return { solid, water, uDayFactor, uFogColor };
}
