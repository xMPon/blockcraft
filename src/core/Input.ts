// Input: pointer lock, keyboard state, accumulated mouse deltas and clicks.
// Deltas/clicks accumulate between frames and are consumed once per tick.
export class Input {
  private keys = new Set<string>();
  private mouse = new Set<number>();
  private dx = 0;
  private dy = 0;
  private clicks: number[] = [];
  locked = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => this.keys.add(e.code));
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) {
        this.keys.clear();
        this.mouse.clear();
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (this.locked) {
        this.dx += e.movementX;
        this.dy += e.movementY;
      }
    });
    window.addEventListener("mousedown", (e) => {
      if (this.locked) {
        this.mouse.add(e.button);
        this.clicks.push(e.button);
      }
    });
    window.addEventListener("mouseup", (e) => this.mouse.delete(e.button));
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  isMouseDown(button: number): boolean {
    return this.mouse.has(button);
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const d = { dx: this.dx, dy: this.dy };
    this.dx = 0;
    this.dy = 0;
    return d;
  }

  consumeClicks(): number[] {
    const c = this.clicks;
    this.clicks = [];
    return c;
  }
}
