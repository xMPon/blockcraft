// InventoryScreen: the modal inventory + crafting grid. E opens a personal 2×2
// grid; opening at a crafting table gives the full 3×3. Items left in the grid
// (or on the cursor) are returned to the inventory on close.
import { Inventory } from "../item/Inventory";
import { craft } from "../item/Recipes";
import type { ItemStack } from "../item/ItemStack";
import { Cursor, SlotGrid, arraySource } from "./ItemSlots";

export class InventoryScreen {
  isOpen = false;
  private readonly overlay: HTMLElement;
  private readonly cursor: Cursor;
  private readonly craftHost: HTMLElement;
  private readonly outputHost: HTMLElement;
  private readonly title: HTMLElement;

  private craftArr: (ItemStack | null)[] = [];
  private craftOut: ItemStack | null = null;
  private size = 2;
  private craftGrid: SlotGrid | null = null;
  private outputGrid: SlotGrid | null = null;
  private readonly invGrid: SlotGrid;
  private readonly hotbarGrid: SlotGrid;

  constructor(parent: HTMLElement, private readonly inv: Inventory) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal";
    this.overlay.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "inv-panel";
    this.overlay.appendChild(panel);

    this.title = document.createElement("div");
    this.title.className = "panel-title";
    panel.appendChild(this.title);

    const craftArea = document.createElement("div");
    craftArea.className = "craft-area";
    this.craftHost = document.createElement("div");
    const arrow = document.createElement("span");
    arrow.className = "craft-arrow";
    arrow.textContent = "→";
    this.outputHost = document.createElement("div");
    craftArea.append(this.craftHost, arrow, this.outputHost);
    panel.appendChild(craftArea);

    const mainWrap = document.createElement("div");
    panel.appendChild(mainWrap);
    const hotbarWrap = document.createElement("div");
    hotbarWrap.className = "hotbar-row";
    panel.appendChild(hotbarWrap);

    this.cursor = new Cursor(this.overlay);
    const onChange = () => this.refresh();
    this.invGrid = new SlotGrid(mainWrap, 27, arraySource(inv.slots, 9), this.cursor, onChange, { cols: 9 });
    this.hotbarGrid = new SlotGrid(hotbarWrap, 9, arraySource(inv.slots, 0), this.cursor, onChange, { cols: 9 });

    parent.appendChild(this.overlay);
  }

  private rebuildCraft(): void {
    this.craftHost.innerHTML = "";
    this.outputHost.innerHTML = "";
    this.craftArr = new Array(this.size * this.size).fill(null);
    const onChange = () => this.refresh();
    this.craftGrid = new SlotGrid(this.craftHost, this.size * this.size, arraySource(this.craftArr), this.cursor, onChange, { cols: this.size });
    this.outputGrid = new SlotGrid(
      this.outputHost, 1,
      { get: () => this.craftOut, set: () => {} },
      this.cursor, onChange,
      { computed: { onTake: () => this.takeCraft() } },
    );
  }

  open(table: boolean): void {
    this.size = table ? 3 : 2;
    this.title.textContent = table ? "Crafting Table" : "Inventory";
    this.rebuildCraft();
    this.overlay.style.display = "flex";
    this.isOpen = true;
    this.refresh();
  }

  close(): void {
    for (const s of this.craftArr) if (s) this.inv.add(s.item, s.count);
    if (this.cursor.stack) { this.inv.add(this.cursor.stack.item, this.cursor.stack.count); this.cursor.stack = null; }
    this.craftArr.fill(null);
    this.overlay.style.display = "none";
    this.isOpen = false;
  }

  private takeCraft(): void {
    for (let i = 0; i < this.craftArr.length; i++) {
      const s = this.craftArr[i];
      if (s) { s.count -= 1; if (s.count <= 0) this.craftArr[i] = null; }
    }
  }

  refresh(): void {
    this.craftOut = craft(this.craftArr.map((s) => (s ? s.item : null)), this.size);
    this.craftGrid?.refresh();
    this.outputGrid?.refresh();
    this.invGrid.refresh();
    this.hotbarGrid.refresh();
    this.cursor.refresh();
  }
}
