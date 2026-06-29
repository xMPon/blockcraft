// ChestUI: the modal chest screen — the chest's 27 slots over the player's
// inventory + hotbar, all sharing one drag cursor (reuses the slot toolkit).
import { Inventory } from "../item/Inventory";
import { ChestState } from "../block/Chest";
import { Cursor, SlotGrid, arraySource } from "./ItemSlots";

export class ChestUI {
  isOpen = false;
  private readonly overlay: HTMLElement;
  private readonly cursor: Cursor;
  private readonly chestGrid: SlotGrid;
  private readonly invGrid: SlotGrid;
  private readonly hotbarGrid: SlotGrid;
  private state: ChestState | null = null;

  constructor(parent: HTMLElement, private readonly inv: Inventory) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal";
    this.overlay.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "inv-panel";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Chest";
    panel.appendChild(title);

    const chestHost = document.createElement("div");
    const mainHost = document.createElement("div");
    const hotbarHost = document.createElement("div");
    hotbarHost.className = "hotbar-row";
    panel.append(chestHost, mainHost, hotbarHost);
    this.overlay.appendChild(panel);

    this.cursor = new Cursor(this.overlay);
    const onChange = () => this.refresh();
    this.chestGrid = new SlotGrid(chestHost, 27,
      { get: (i) => this.state?.slots[i] ?? null, set: (i, s) => { if (this.state) this.state.slots[i] = s; } },
      this.cursor, onChange, { cols: 9 });
    this.invGrid = new SlotGrid(mainHost, 27, arraySource(inv.slots, 9), this.cursor, onChange, { cols: 9 });
    this.hotbarGrid = new SlotGrid(hotbarHost, 9, arraySource(inv.slots, 0), this.cursor, onChange, { cols: 9 });

    parent.appendChild(this.overlay);
  }

  open(state: ChestState): void {
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
    this.chestGrid.refresh();
    this.invGrid.refresh();
    this.hotbarGrid.refresh();
    this.cursor.refresh();
  }
}
