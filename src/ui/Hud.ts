// Hud: crosshair, FPS/position debug readout, and the click-to-play overlay
// that captures the pointer.
export class Hud {
  private readonly debug: HTMLElement;
  private readonly overlay: HTMLElement;
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

    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";
    this.overlay.innerHTML = `
      <h1>Blockcraft</h1>
      <p>Click to play</p>
      <p class="controls">WASD move &middot; Space jump &middot; Mouse look<br>
      Left click break &middot; Right click place &middot; 1&ndash;6 / wheel select block &middot; Esc release mouse</p>`;
    this.overlay.addEventListener("click", onClickPlay);
    parent.appendChild(this.overlay);
  }

  setOverlayVisible(visible: boolean): void {
    this.overlay.style.display = visible ? "flex" : "none";
  }

  update(x: number, y: number, z: number): void {
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
