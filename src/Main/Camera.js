import Main from "./Main";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export default class Camera {
  constructor() {
    this.main = new Main();
    this.renderer = this.main.renderer;
    this.sizes = this.main.sizes;
    this.scene = this.main.scene;
    this.canvas = this.main.canvas;
    this.debug = this.main.debug;

    this.setInstance();
    if (!this.debug.active) {
      this.setOrbitControls();
    }
  }

  setInstance() {
    this.object = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      1,
      200000
    );
    this.object.position.set(0, 600, 1000);
    this.object.lookAt(0, 0, -10);
    this.scene.add(this.object);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.object, this.canvas);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 1000.0;
    this.controls.maxDistance = 5000.0;
  }

  resize() {
    this.object.aspect = this.sizes.width / this.sizes.height;
    this.object.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
