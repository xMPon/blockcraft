// Hud: crosshair, FPS/position debug, click-to-play overlay, and the survival
// status bars (air bubbles, health hearts, hunger drumsticks) + a damage flash.
const HEARTS = 10; // each heart = 2 HP
const HUNGER = 10; // each drumstick = 2 hunger
const BUBBLES = 10;

export class Hud {
  private readonly debug: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly flash: HTMLElement;
  private readonly hearts: HTMLElement[] = [];
  private readonly drumsticks: HTMLElement[] = [];
  private readonly bubbleRow: HTMLElement;
  private readonly bubbles: HTMLElement[] = [];
  private frames = 0;
  private lastFpsAt = performance.now();

  constructor(parent: HTMLElement, onClickPlay: () => void) {
    const crosshair = document.createElement("div");
    crosshair.className = "crosshair";
    crosshair.textContent = "+";
    parent.appendChild(crosshair);

    this.debug = document.createElement("div");
    this.debug.className = "debug";
    parent.appendChild(this.debug);

    this.flash = document.createElement("div");
    this.flash.className = "hurt-flash";
    parent.appendChild(this.flash);

    // Status: air bubbles on top, then hearts (left) and hunger (right).
    const status = document.createElement("div");
    status.className = "status";
    this.bubbleRow = document.createElement("div");
    this.bubbleRow.className = "stat-row";
    for (let i = 0; i < BUBBLES; i++) {
      const bubble = document.createElement("span");
      bubble.className = "bubble";
      bubble.textContent = "●";
      this.bubbleRow.appendChild(bubble);
      this.bubbles.push(bubble);
    }
    const vitals = document.createElement("div");
    vitals.className = "vitals";
    const heartRow = document.createElement("div");
    heartRow.className = "stat-row";
    for (let i = 0; i < HEARTS; i++) {
      const heart = document.createElement("span");
      heart.className = "heart";
      heart.innerHTML = `<span class="heart-bg">♥</span><span class="heart-clip"><span class="heart-fg">♥</span></span>`;
      heartRow.appendChild(heart);
      this.hearts.push(heart.querySelector(".heart-clip") as HTMLElement);
    }
    const hungerRow = document.createElement("div");
    hungerRow.className = "stat-row hunger-row";
    for (let i = 0; i < HUNGER; i++) {
      const d = document.createElement("span");
      d.className = "drumstick";
      d.textContent = "🍗";
      hungerRow.appendChild(d);
      this.drumsticks.push(d);
    }
    vitals.append(heartRow, hungerRow);
    status.append(this.bubbleRow, vitals);
    parent.appendChild(status);

    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";
    this.overlay.innerHTML = `
      <h1>Blockcraft</h1>
      <p>Click to play</p>
      <p class="controls">WASD move (double-tap W to sprint) &middot; Space jump/swim &middot; Mouse look<br>
      Hold left click mine / click to attack &middot; Right click place &middot; E inventory &middot; Esc release</p>`;
    this.overlay.addEventListener("click", onClickPlay);
    parent.appendChild(this.overlay);
  }

  setOverlayVisible(visible: boolean): void {
    this.overlay.style.display = visible ? "flex" : "none";
  }

  update(
    x: number, y: number, z: number,
    health: number, air: number, maxAir: number,
    hunger: number, hurtFlash: number,
  ): void {
    for (let i = 0; i < HEARTS; i++) {
      const v = health - i * 2;
      this.hearts[i].style.width = v >= 2 ? "100%" : v === 1 ? "50%" : "0%";
    }
    for (let i = 0; i < HUNGER; i++) {
      const v = hunger - i * 2;
      this.drumsticks[i].style.opacity = v >= 2 ? "1" : v === 1 ? "0.5" : "0.15";
    }
    if (air >= maxAir) {
      this.bubbleRow.style.visibility = "hidden";
    } else {
      this.bubbleRow.style.visibility = "visible";
      const filled = Math.ceil((air / maxAir) * BUBBLES);
      for (let i = 0; i < BUBBLES; i++) this.bubbles[i].style.opacity = i < filled ? "1" : "0.15";
    }
    this.flash.style.opacity = String(Math.min(0.55, hurtFlash * 1.5));

    this.frames++;
    const now = performance.now();
    if (now - this.lastFpsAt >= 500) {
      const fps = Math.round((this.frames * 1000) / (now - this.lastFpsAt));
      this.frames = 0;
      this.lastFpsAt = now;
      this.debug.textContent = `${fps} fps · x ${x.toFixed(1)} y ${y.toFixed(1)} z ${z.toFixed(1)}`;
    }
  }
}
