// PauseMenu: the Esc menu — resume, save, or start a fresh world. Also serves
// as the title/landing surface (it shows the world seed).
export interface PauseHooks {
  seed: number;
  onResume: () => void;
  onSave: () => void;
  onNewWorld: () => void;
}

export class PauseMenu {
  isOpen = false;
  private readonly overlay: HTMLElement;
  private readonly status: HTMLElement;

  constructor(parent: HTMLElement, hooks: PauseHooks) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal";
    this.overlay.style.display = "none";

    const panel = document.createElement("div");
    panel.className = "menu-panel";
    panel.innerHTML = `<h1>Blockcraft</h1><p class="seed">Seed: ${hooks.seed}</p>`;

    const resume = button("Resume", () => hooks.onResume());
    const save = button("Save World", () => { hooks.onSave(); this.status.textContent = "World saved."; });
    const fresh = button("New World", () => hooks.onNewWorld());
    this.status = document.createElement("p");
    this.status.className = "menu-status";

    panel.append(resume, save, fresh, this.status);
    this.overlay.appendChild(panel);
    parent.appendChild(this.overlay);
  }

  open(): void {
    this.status.textContent = "";
    this.overlay.style.display = "flex";
    this.isOpen = true;
  }

  close(): void {
    this.overlay.style.display = "none";
    this.isOpen = false;
  }
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = "menu-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
