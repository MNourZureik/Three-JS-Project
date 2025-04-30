import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Resources from "./Utils/Resources.js";
import Time from "./Utils/Time.js";
import Sizes from "./Utils/Sizes.js";
import * as THREE from "three";
import sources from "./sources.js";
import World from "./MyWorld/World.js";
import Debug from "./Utils/Debug.js";

let instance = null;

export default class Main {
  constructor(canvas) {
    if (instance) {
      return instance;
    }
    instance = this;

    // canvas and scene:
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Debug ui :
    this.debug = new Debug();

    // Sizes of the screen :
    this.sizes = new Sizes();
    this.sizes.on("resize", () => {
      this.resize();
    });

    // Time :
    this.time = new Time();
    this.time.on("tick", () => {
      this.update();
    });

    // Camera :
    this.camera = new Camera();

    // Renderer :
    this.renderer = new Renderer();

    // Resources take sources :
    this.resources = new Resources(sources);

    // our world :
    this.resources.on("ready", () => {
      this.world = new World();
    });

    // resize for full screen event :
    window.addEventListener("dblclick", () => {
      const fullscreenElement =
        document.fullscreenElement || document.webkitFullscreenElement;

      if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
          canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
          canvas.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    });
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    if(!this.debug.active){
        this.camera.update();
    }
    if (this.world) {
      this.world.update();
    }
    this.renderer.update();
  }
  destroy() {
    this.sizes.off("resize");
    this.time.off("tick");

    // Traverse the whole scene
    this.scene.traverse((child) => {
      // Test if it's a mesh
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key];

          // Test if there is a dispose function
          if (value && typeof value.dispose === "function") {
            value.dispose();
          }
        }
      }
    });

    this.camera.controls.dispose();
    this.renderer.instance.dispose();

    if (this.debug.active) this.debug.ui.destroy();
  }
}
