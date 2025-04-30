import Sky_Class from "./Sky.js";
import Water_Class from "./Water.js";
import Boat_Class from "./Boat.js";
import Island from "./Island.js";

export default class World {
  constructor() {
    this.island = new Island();
    this.boat = new Boat_Class(this.island);
    this.sky = new Sky_Class();
    this.water = new Water_Class();
  }

  update() {
    this.water.update();
    this.boat.update();
  }
}
