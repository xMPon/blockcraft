// Engine: Three.js scene/camera/renderer setup and the main loop.
import * as THREE from "three";

export class Engine {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement, viewDistance: number) {
    this.scene = new THREE.Scene();
    const sky = new THREE.Color(0x87ceeb);
    this.scene.background = sky;
    // Fog fades terrain into the sky just inside the streamed chunk radius,
    // hiding chunk pop-in at the edge of the world.
    this.scene.fog = new THREE.Fog(sky, viewDistance * 0.55, viewDistance * 0.95);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      viewDistance * 2,
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start(update: (dt: number) => void): void {
    let last = performance.now();
    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab or load hitch can't blow up physics.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
