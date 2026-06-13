// Hotbar: DOM view of the inventory's first row. Number keys 1–9 and the mouse
// wheel change the selected slot; refresh() repaints swatches + counts each frame.
import { Inventory, HOTBAR_SIZE } from "../item/Inventory";
import { itemDef } from "../item/Item";

interface Slot {
  el: HTMLElement;
  swatch: HTMLElement;
  count: HTMLElement;
}

export class Hotbar {
  private readonly slots: Slot[] = [];

  constructor(parent: HTMLElement, private readonly inv: Inventory) {
    const bar = document.createElement("div");
    bar.className = "hotbar";
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const el = document.createElement("div");
      el.className = "hotbar-slot";
      const swatch = document.createElement("div");
      swatch.className = "hotbar-swatch";
      const count = document.createElement("span");
      count.className = "hotbar-count";
      const key = document.createElement("span");
      key.className = "hotbar-key";
      key.textContent = String(i + 1);
      el.append(swatch, count, key);
      bar.appendChild(el);
      this.slots.push({ el, swatch, count });
    }
    parent.appendChild(bar);

    window.addEventListener("keydown", (e) => {
      if (!e.code.startsWith("Digit")) return;
      const n = Number(e.code.slice(5));
      if (n >= 1 && n <= HOTBAR_SIZE) this.inv.selected = n - 1;
    });
    window.addEventListener("wheel", (e) => {
      const step = e.deltaY > 0 ? 1 : -1;
      this.inv.selected = (this.inv.selected + step + HOTBAR_SIZE) % HOTBAR_SIZE;
    });
  }

  refresh(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.slots[i];
      const stack = this.inv.slots[i];
      slot.el.classList.toggle("selected", i === this.inv.selected);
      if (stack) {
        const def = itemDef(stack.item);
        slot.swatch.style.background = def.color;
        slot.swatch.style.visibility = "visible";
        slot.el.title = def.name;
        slot.count.textContent = stack.count > 1 ? String(stack.count) : "";
      } else {
        slot.swatch.style.visibility = "hidden";
        slot.el.title = "";
        slot.count.textContent = "";
      }
    }
  }
}
