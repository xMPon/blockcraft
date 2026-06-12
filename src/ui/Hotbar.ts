// Hotbar: DOM block selector — number keys 1–6 and the mouse wheel.
import { BLOCKS, PLACEABLE } from "../world/Block";

export class Hotbar {
  private index = 0;
  private readonly slots: HTMLElement[] = [];

  constructor(parent: HTMLElement) {
    const bar = document.createElement("div");
    bar.className = "hotbar";
    for (let i = 0; i < PLACEABLE.length; i++) {
      const def = BLOCKS[PLACEABLE[i]];
      const slot = document.createElement("div");
      slot.className = "hotbar-slot";
      slot.title = def.name;
      const swatch = document.createElement("div");
      swatch.className = "hotbar-swatch";
      swatch.style.background = def.color;
      const key = document.createElement("span");
      key.className = "hotbar-key";
      key.textContent = String(i + 1);
      slot.append(swatch, key);
      bar.appendChild(slot);
      this.slots.push(slot);
    }
    parent.appendChild(bar);

    window.addEventListener("keydown", (e) => {
      if (!e.code.startsWith("Digit")) return;
      const n = Number(e.code.slice(5));
      if (n >= 1 && n <= PLACEABLE.length) this.select(n - 1);
    });
    window.addEventListener("wheel", (e) => {
      const step = e.deltaY > 0 ? 1 : -1;
      this.select((this.index + step + PLACEABLE.length) % PLACEABLE.length);
    });

    this.select(0);
  }

  get selectedBlockId(): number {
    return PLACEABLE[this.index];
  }

  private select(i: number): void {
    this.slots[this.index].classList.remove("selected");
    this.index = i;
    this.slots[i].classList.add("selected");
  }
}
