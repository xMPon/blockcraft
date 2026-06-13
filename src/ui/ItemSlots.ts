// Item-slot UI toolkit: a shared drag Cursor and a SlotGrid that renders item
// stacks and handles the standard pick-up / place / merge / split clicks. Used
// by the inventory screen and the furnace UI.
import { itemDef } from "../item/Item";
import { maxStack, type ItemStack } from "../item/ItemStack";

export function paintSlot(swatch: HTMLElement, count: HTMLElement, stack: ItemStack | null): void {
  if (stack) {
    swatch.style.visibility = "visible";
    swatch.style.background = itemDef(stack.item).color;
    swatch.title = itemDef(stack.item).name;
    count.textContent = stack.count > 1 ? String(stack.count) : "";
  } else {
    swatch.style.visibility = "hidden";
    swatch.title = "";
    count.textContent = "";
  }
}

/** The stack held on the cursor while rearranging, with a DOM element tracking the pointer. */
export class Cursor {
  stack: ItemStack | null = null;
  private readonly el: HTMLElement;
  private readonly swatch: HTMLElement;
  private readonly count: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "cursor-item";
    this.swatch = document.createElement("div");
    this.swatch.className = "slot-swatch";
    this.count = document.createElement("span");
    this.count.className = "slot-count";
    this.el.append(this.swatch, this.count);
    parent.appendChild(this.el);
    window.addEventListener("mousemove", (e) => {
      this.el.style.left = e.clientX + "px";
      this.el.style.top = e.clientY + "px";
    });
  }

  refresh(): void {
    this.el.style.display = this.stack ? "block" : "none";
    paintSlot(this.swatch, this.count, this.stack);
  }
}

export interface SlotSource {
  get(i: number): ItemStack | null;
  set(i: number, s: ItemStack | null): void;
}

export interface SlotOpts {
  cols?: number;
  /** Computed output slot (crafting): clicking takes one craft via onTake. */
  computed?: { onTake: () => void };
  /** Furnace output: can be taken from but not deposited into. */
  takeOnly?: boolean;
}

export class SlotGrid {
  private readonly swatches: HTMLElement[] = [];
  private readonly counts: HTMLElement[] = [];

  constructor(
    parent: HTMLElement,
    private readonly count: number,
    private readonly source: SlotSource,
    private readonly cursor: Cursor,
    private readonly onChange: () => void,
    private readonly opts: SlotOpts = {},
  ) {
    const grid = document.createElement("div");
    grid.className = "slot-grid";
    if (opts.cols) grid.style.gridTemplateColumns = `repeat(${opts.cols}, 40px)`;
    for (let i = 0; i < count; i++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      const swatch = document.createElement("div");
      swatch.className = "slot-swatch";
      const cnt = document.createElement("span");
      cnt.className = "slot-count";
      slot.append(swatch, cnt);
      slot.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.handle(i, e.button);
        this.onChange();
      });
      grid.appendChild(slot);
      this.swatches.push(swatch);
      this.counts.push(cnt);
    }
    parent.appendChild(grid);
  }

  refresh(): void {
    for (let i = 0; i < this.count; i++) paintSlot(this.swatches[i], this.counts[i], this.source.get(i));
  }

  private handle(i: number, button: number): void {
    const cur = this.cursor.stack;
    const slot = this.source.get(i);

    // Crafting output: take one craft into the cursor (whole stack only).
    if (this.opts.computed) {
      if (!slot) return;
      if (!cur) this.cursor.stack = { item: slot.item, count: slot.count };
      else if (cur.item === slot.item && cur.count + slot.count <= maxStack(cur.item)) cur.count += slot.count;
      else return;
      this.opts.computed.onTake();
      return;
    }

    if (this.opts.takeOnly) {
      if (!slot) return;
      if (button === 2) {
        const half = Math.ceil(slot.count / 2);
        if (cur && (cur.item !== slot.item || cur.count + half > maxStack(cur.item))) return;
        if (cur) cur.count += half;
        else this.cursor.stack = { item: slot.item, count: half };
        slot.count -= half;
        this.source.set(i, slot.count > 0 ? slot : null);
      } else {
        if (cur && (cur.item !== slot.item || cur.count + slot.count > maxStack(cur.item))) return;
        if (cur) cur.count += slot.count;
        else this.cursor.stack = slot;
        this.source.set(i, null);
      }
      return;
    }

    if (button === 2) {
      // Right click: drop one (cursor → slot) or pick up half (slot → cursor).
      if (cur) {
        if (!slot) this.source.set(i, { item: cur.item, count: 1 });
        else if (slot.item === cur.item && slot.count < maxStack(slot.item)) { slot.count += 1; this.source.set(i, slot); }
        else return;
        cur.count -= 1;
        if (cur.count <= 0) this.cursor.stack = null;
      } else if (slot) {
        const half = Math.ceil(slot.count / 2);
        this.cursor.stack = { item: slot.item, count: half };
        slot.count -= half;
        this.source.set(i, slot.count > 0 ? slot : null);
      }
      return;
    }

    // Left click: pick up, place, merge, or swap.
    if (!cur && slot) {
      this.cursor.stack = slot;
      this.source.set(i, null);
    } else if (cur && !slot) {
      this.source.set(i, cur);
      this.cursor.stack = null;
    } else if (cur && slot) {
      if (slot.item === cur.item) {
        const room = maxStack(slot.item) - slot.count;
        const moved = Math.min(room, cur.count);
        slot.count += moved;
        cur.count -= moved;
        this.source.set(i, slot);
        if (cur.count <= 0) this.cursor.stack = null;
      } else {
        this.source.set(i, cur);
        this.cursor.stack = slot;
      }
    }
  }
}

/** A SlotSource view over a slice of an array of stacks. */
export function arraySource(arr: (ItemStack | null)[], offset = 0): SlotSource {
  return {
    get: (i) => arr[offset + i],
    set: (i, s) => { arr[offset + i] = s; },
  };
}
