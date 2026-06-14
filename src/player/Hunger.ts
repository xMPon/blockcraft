// Hunger: a 0–20 food bar. Activity adds exhaustion which drains it; eating
// refills it. A full bar heals the player slowly; an empty bar starves them.
// Pure of three/DOM (tick takes a minimal player interface) for unit testing.

export const MAX_HUNGER = 20;
const EXHAUST_PER_POINT = 4; // exhaustion units to drop one hunger point
const REGEN_THRESHOLD = 18; // hunger at/above this heals
const REGEN_INTERVAL = 4; // seconds per 1 HP healed
const STARVE_INTERVAL = 4; // seconds per 1 HP lost while starving

export interface Healable {
  health: number;
  readonly maxHealth: number;
  heal(n: number): void;
  hurt(n: number): void;
}

export class Hunger {
  value = MAX_HUNGER;
  readonly max = MAX_HUNGER;
  private exhaustion = 0;
  private regenTimer = 0;
  private starveTimer = 0;

  /** Accumulate activity; each EXHAUST_PER_POINT units costs one hunger point. */
  addExhaustion(n: number): void {
    this.exhaustion += n;
    while (this.exhaustion >= EXHAUST_PER_POINT && this.value > 0) {
      this.exhaustion -= EXHAUST_PER_POINT;
      this.value -= 1;
    }
  }

  eat(food: number): void {
    if (food > 0) this.value = Math.min(this.max, this.value + food);
  }

  /** Drive regen (when well-fed) or starvation (when empty) on the player. */
  tick(dt: number, player: Healable): void {
    if (this.value >= REGEN_THRESHOLD && player.health < player.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= REGEN_INTERVAL) {
        this.regenTimer -= REGEN_INTERVAL;
        player.heal(1);
        this.addExhaustion(3); // healing burns food
      }
    } else {
      this.regenTimer = 0;
    }

    if (this.value <= 0) {
      this.starveTimer += dt;
      if (this.starveTimer >= STARVE_INTERVAL) {
        this.starveTimer -= STARVE_INTERVAL;
        player.hurt(1);
      }
    } else {
      this.starveTimer = 0;
    }
  }
}
