// FurnaceUI: the modal furnace screen — input over fuel on the left, a flame +
// progress arrow, and a take-only output on the right. The furnace itself ticks
// in the world loop; this just views/edits the open furnace's slots.
import { Inventory } from "../item/Inventory";
import { FurnaceState } from "../block/Furnace";
import { COOK_TIME } from "../item/Recipes";
import { Cursor, SlotGrid } from "./ItemSlots";

export class FurnaceUI {
  isOpen = false;
  private readonly overlay: HTMLElement;
  private readonly cursor: Cursor;
  private readonly flame: HTMLElement;
  private readonly arrow: HTMLElement;
  private readonly inputGrid: SlotGrid;
  private readonly fuelGrid: SlotGrid;
  private readonly outputGrid: SlotGrid;
  private state: FurnaceState | null = null;

  constructor(parent: HTMLElement, private readonly inv: Inventory) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal";
    this.overlay.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "furnace-panel";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Furnace";
    panel.appendChild(title);

    const area = document.createElement("div");
    area.className = "furnace-area";
    const left = document.createElement("div");
    left.className = "furnace-left";
    const inputHost = document.createElement("div");
    this.flame = document.createElement("div");
    this.flame.className = "furnace-flame";
    this.flame.textContent = "🔥";
    const fuelHost = document.createElement("div");
    left.append(inputHost, this.flame, fuelHost);

    const arrowWrap = document.createElement("div");
    arrowWrap.className = "furnace-arrow";
    this.arrow = document.createElement("div");
    this.arrow.className = "furnace-arrow-fill";
    arrowWrap.appendChild(this.arrow);

    const outputHost = document.createElement("div");
    area.append(left, arrowWrap, outputHost);
    panel.appendChild(area);
    this.overlay.appendChild(panel);

    this.cursor = new Cursor(this.overlay);
    const onChange = () => this.refresh();
    this.inputGrid = new SlotGrid(inputHost, 1,
      { get: () => this.state?.input ?? null, set: (_, s) => { if (this.state) this.state.input = s; } },
      this.cursor, onChange);
    this.fuelGrid = new SlotGrid(fuelHost, 1,
      { get: () => this.state?.fuel ?? null, set: (_, s) => { if (this.state) this.state.fuel = s; } },
      this.cursor, onChange);
    this.outputGrid = new SlotGrid(outputHost, 1,
      { get: () => this.state?.output ?? null, set: (_, s) => { if (this.state) this.state.output = s; } },
      this.cursor, onChange, { takeOnly: true });

    parent.appendChild(this.overlay);
  }

  open(state: FurnaceState): void {
    this.state = state;
    this.overlay.style.display = "flex";
    this.isOpen = true;
    this.refresh();
  }

  close(): void {
    if (this.cursor.stack) { this.inv.add(this.cursor.stack.item, this.cursor.stack.count); this.cursor.stack = null; }
    this.overlay.style.display = "none";
    this.isOpen = false;
    this.state = null;
  }

  refresh(): void {
    this.inputGrid.refresh();
    this.fuelGrid.refresh();
    this.outputGrid.refresh();
    const s = this.state;
    this.flame.style.opacity = s && s.burn > 0 ? "1" : "0.2";
    this.arrow.style.width = s ? `${Math.min(1, s.cook / COOK_TIME) * 100}%` : "0%";
    this.cursor.refresh();
  }
}
