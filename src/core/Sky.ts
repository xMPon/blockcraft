// Sky: the day/night clock. Advances a 0–1 time-of-day, and from the sun's
// elevation derives the sky colour, a day-light factor (how bright skylight is),
// and the sun direction. A full cycle is DAY_SECONDS long.
import * as THREE from "three";

const DAY_SECONDS = 600; // 10-minute full day/night cycle
const TWO_PI = Math.PI * 2;

const NIGHT = new THREE.Color(0x05080f);
const DAY = new THREE.Color(0x87ceeb);
const DUSK = new THREE.Color(0xe9824a);

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export class Sky {
  /** 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. */
  time = 0.32; // start mid-morning
  readonly color = new THREE.Color();
  readonly sunDirection = new THREE.Vector3();
  dayFactor = 1;

  update(dt: number): void {
    this.time = (this.time + dt / DAY_SECONDS) % 1;
    const elevation = Math.sin((this.time - 0.25) * TWO_PI); // -1 (midnight) .. 1 (noon)

    // Daylight: dark floor at night, ramps up as the sun clears the horizon.
    this.dayFactor = 0.12 + 0.88 * smoothstep(-0.2, 0.25, elevation);

    // Sky colour: night → day, with a warm dusk tint near the horizon.
    const dayMix = smoothstep(-0.1, 0.3, elevation);
    this.color.copy(NIGHT).lerp(DAY, dayMix);
    const horizon = 1 - smoothstep(0, 0.22, Math.abs(elevation));
    this.color.lerp(DUSK, horizon * 0.5 * dayMix);

    // Sun direction on a fixed azimuth, elevation following the clock.
    const ang = (this.time - 0.25) * TWO_PI;
    this.sunDirection.set(Math.cos(ang) * 0.4, Math.sin(ang), 0.3).normalize();
  }
}
