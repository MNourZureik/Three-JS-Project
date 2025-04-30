import * as THREE from "three";
import Main from "../Main";

export default class Boat_Class {
  constructor(island) {
    //! Setup :
    this.main = new Main();
    this.island = island;
    this.camera = this.main.camera;
    this.debug = this.main.debug;
    this.resources = this.main.resources;
    this.scene = this.main.scene;
    this.resource = this.resources.items.speed_boat;
    this.deltaTime = this.main.time.delta;
    this.time = this.main.time;
    this.splash = null;

    //! booleans for movement :

    this.is_back = false;
    this.is_stop = true;
    this.is_right = false;
    this.is_left = false;
    this.is_stopping = false;
    this.is_end_stopping = false;
    this.is_orbit = false;

    //! Physics Variables set :
    this.vector_position = new THREE.Vector3(0, 75, 0);
    this.vector_velocity = new THREE.Vector3(0, 0, 1);
    this.vector_acceleration = new THREE.Vector3(0, 0, 0);
    this.angular_velocity = new THREE.Vector3();

    //! CONSTANT variables FOR LINEAR MOTION:
    this.Drag_Coefficient = 0.35;
    this.Air_Density = 1.225;
    this.Frontal_air_Area = 16.7573;
    this.Water_Density = 1000;
    this.Frontal_water_Area = 1.1137;
    this.water_outer_space_radius = 1;
    this.water_outer_space =
      Math.PI * Math.pow(this.water_outer_space_radius, 2);
    this.engine_force = 500;
    this.jet_boat = {
      mass: 2306, // in kg
      length: 8, // in meters
      width: 2.5, // in meters
      gravity: 9.81, // m/s^2
      density_of_water: 1000, // kg/m^3
      volume: 2.306, // Bouyancy
      velocity: new THREE.Vector3(0, 0, 0), // velocity of gravity.
      position: new THREE.Vector3(0, 75, 0), // position of boat after calculating wieght and bouyancy of boat.
    };

    //! CONSTANT variables FOR ROTATIONAL MOTION:
    this.moment_of_inertia =
      (1 / 12) *
      this.jet_boat.mass *
      (Math.pow(this.jet_boat.length, 2) + Math.pow(this.jet_boat.width, 2)); // I delta for boat .
    this.angular_acceleration = new THREE.Vector3();
    this.steeringForce = 0.8;
    this.heading = 0; // storing the current angle of the boat
    this.steeringSpeed = 0.02;
    this.moveSpeed = 0.2;

    //! adding boat model to the scene .
    this.set_boat_model();

    //! GUI debug section :
    if (this.debug.active) {
      this.Boat = this.debug.ui.addFolder("BOAT");
      this.Boat.add(this.jet_boat, "mass", 0, 50000, 1).name("Mass");
      this.Boat.add(this.jet_boat, "volume", 0, 50, 1).name("Buoyancy");
      this.Boat.add(this, "engine_force", 0, 5000, 1).name("speed");
      this.Boat.close();
    }

    //! creating splash :
    this.splashParticles = [];
    this.particleMaterial = new THREE.MeshBasicMaterial({ color: 0x1e90ff });

    //! Setting Keys :
    document.addEventListener("keydown", this.onKeyDown.bind(this), false);
    document.addEventListener("keyup", this.onKeyUp.bind(this), false);
  }
  createSplash() {
    const splashGeometry = new THREE.BufferGeometry();
    const splashVertices = [];
    const splashVelocities = [];

    for (let i = 0; i < 200; i++) {
      // Use spherical distribution for more realistic effect
      const theta = ((Math.random() * Math.PI) / 2) * 2; // Angle around the y-axis
      const phi = (Math.random() * Math.PI) / 2 / 2; // Angle from the y-axis down

      const radius = Math.random() * 150; // Adjust the range for splash radius
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      splashVertices.push(x, y, z);

      // Random velocity vector for each particle
      const velocity = new THREE.Vector3(x, y, z)
        .normalize()
        .multiplyScalar(Math.random() * 0.5);
      splashVelocities.push(velocity);
    }

    splashGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(splashVertices, 3)
    );

    const splash = new THREE.Points(splashGeometry);
    //splash.material.color.r = 115;
    splash.material.color.g = 196;
    splash.material.color.b = 250;
    splash.position
      .copy(this.vector_position)
      .add(new THREE.Vector3(0, -75, 330));
    // .add(
    //   new THREE.Vector3(
    //     Math.sin(this.vector_velocity),
    //     0,
    //     Math.cos(this.vector_velocity)
    //   )
    //);

    // Add velocity data as a property of splash
    splash.userData.velocities = splashVelocities;

    this.scene.add(splash);
    this.splashParticles.push(splash);

    setTimeout(() => {
      this.scene.remove(splash);
      this.splashParticles.splice(this.splashParticles.indexOf(splash), 1);
    }, 100); // Remove splash after 1 second
  }

  updateParticles() {
    this.splashParticles.forEach((splash) => {
      const positions = splash.geometry.attributes.position.array;
      const velocities = splash.userData.velocities;

      for (let i = 0; i < positions.length; i += 3) {
        // Update each particle's position based on its velocity
        positions[i] += velocities[i / 3].x;
        positions[i + 1] += velocities[i / 3].y - 0.05; // Apply gravity-like effect
        positions[i + 2] += velocities[i / 3].z;
      }

      splash.geometry.attributes.position.needsUpdate = true;
    });
  }

  set_boat_model() {
    this.model = this.resource.scene;
    this.model.position.y = 75;
    this.model.rotation.set(0, -Math.PI / 2, 0);
    this.model.scale.set(200, 200, 200);
    this.scene.add(this.model);

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
    this.boundingBox = new THREE.Box3().setFromObject(this.model);
  }

  set_gravity_force() {
    // wieght force w = m * g :
    this.weightForce = this.jet_boat.mass * this.jet_boat.gravity;

    // buoyancy force b = p * v * g :
    this.buoyancy =
      this.jet_boat.density_of_water *
      this.jet_boat.volume *
      this.jet_boat.gravity;

    // if the buoyancy force is less than the weight force, the boat will sink.
    if (this.buoyancy < this.weightForce) {
      this.acceleration = (this.weightForce / this.jet_boat.mass) * 0.1;
      this.jet_boat.velocity.y -= this.acceleration;
      this.jet_boat.position.add(
        this.jet_boat.velocity
          .clone()
          .multiplyScalar(this.jet_boat.mass / 100000000)
      );

      this.model.position.copy(this.jet_boat.position);
      if (this.model.rotation.z > -0.8 && this.is_stop) {
        this.model.rotation.y -= 0.001;
        this.model.rotation.z -= 0.001;
      }
    }
    // else the boat will flow on water :
    else if (this.buoyancy >= this.weightForce) {
      if (this.model.rotation.z <= 0 && this.is_stop) {
        this.model.rotation.y += 0.001;
        this.model.rotation.z += 0.001;
      }
      if (this.model.position.y < 75) {
        this.acceleration = this.weightForce / this.jet_boat.mass;
        this.jet_boat.velocity.y += this.acceleration * 1.5;
        this.jet_boat.position.add(
          this.jet_boat.velocity
            .clone()
            .multiplyScalar(this.jet_boat.mass / 100000000)
        );

        this.model.position.copy(this.jet_boat.position);
      } else {
        this.model.position.y = 75;
        this.jet_boat.velocity = new THREE.Vector3(0, 0, 0);
        this.jet_boat.position.copy(this.vector_position);
      }
    }
  }

  totalForcesLinear() {
    // Sigma F = (F of air_resistance) + (F of water_resistance) + (F of thrusting_power)
    var sigmaF = new THREE.Vector3();

    var air = this.air_resistance_force();
    var water = this.water_resistance_force();
    var thrust = this.thrusting_force();

    sigmaF.z = air.z + water.z + thrust.z;

    return sigmaF;
  }

  air_resistance_force() {
    // F = 0.5 × ϸ × 𝑣2 × 𝐶𝑑 × 𝐴
    var air_resistance =
      0.5 *
      this.Air_Density *
      Math.pow(this.vector_velocity.length(), 2) *
      this.Drag_Coefficient *
      this.Frontal_air_Area;
    var F = new THREE.Vector3(0, 0, air_resistance * 0.01);
    return F;
  }

  water_resistance_force() {
    // F = 0.5 × ϸ × 𝑣2 × 𝐶𝑑 × 𝐴
    var water_resistance =
      0.5 *
      this.Water_Density *
      Math.pow(this.vector_velocity.length(), 2) *
      this.Drag_Coefficient *
      this.Frontal_water_Area;
    var F = new THREE.Vector3(0, 0, water_resistance * 0.01);
    return F;
  }

  thrusting_force() {
    // F = S * P : S = PI*(r^2) // the space of water exit , P = power of boat .
    if (!this.is_stopping) {
      if (this.engine_force != 500) {
        this.engine_force++;
      } else {
        this.engine_force = 500;
        if (!this.is_back) {
          if (Math.abs(this.model.rotation.z) < 0.1) {
            this.model.rotation.z -= 0.0001;
          }
        }
      }
    }
    var thrusting_force =
      this.Water_Density * this.water_outer_space * this.engine_force;

    var F = new THREE.Vector3(0, 0, -thrusting_force * 0.001);
    return F;
  }

  realistic_stop() {
    if (this.engine_force < 0) {
      this.engine_force = 0;
      if (this.is_back) {
        this.is_back = false;
      }
      return;
    }
    if (this.engine_force >= 0) {
      this.engine_force--;
    }
  }

  onKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 87) {
      // W
      if (this.engine_force != 0) {
        this.engine_force = 0;
      }
      this.is_stopping = false;
      this.is_stop = false;
      this.is_back = false;
      this.is_right = false;
      this.is_left = false;
    }
    if (keyCode == 83) {
      // S
      this.is_stopping = false;
      this.is_stop = false;
      this.is_back = true;
      this.is_right = false;
      this.is_left = false;
    }
    if (keyCode == 82) {
      // R
      this.is_stop = true;
      this.is_stopping = true;
      this.is_right = false;
      this.is_left = false;
      this.is_end_stopping = true;
    }
    if (keyCode == 68) {
      // D
      this.is_stopping = false;
      this.is_right = true;
      this.is_stop = false;
      this.is_left = false;
    }
    if (keyCode == 65) {
      // A
      this.is_stopping = false;
      this.is_left = true;
      this.is_stop = false;
      this.is_right = false;
    }

    if (keyCode == 79) {
      this.is_orbit = !this.is_orbit;
    }
  }

  onKeyUp(event) {
    var keyCode = event.which;
    if (
      keyCode == 87 ||
      keyCode == 83 ||
      keyCode == 68 ||
      keyCode == 65 ||
      keyCode == 82
    ) {
      this.angular_acceleration = new THREE.Vector3();
      this.angular_velocity = new THREE.Vector3();
      this.is_right = false;
      this.is_left = false;
    }
  }

  applySteeringTorque(steeringForce) {
    let steeringTorque = new THREE.Vector3();

    steeringTorque.y = steeringForce;

    // angular_acceleration = steering_torque / I (delta).
    this.angular_acceleration = steeringTorque.divideScalar(
      this.moment_of_inertia
    );

    // angular_velocity = ω0(equal to 0 in the begining always) + angular_acceleration * dt .
    this.angular_velocity.add(
      this.angular_acceleration.multiplyScalar(this.deltaTime * 0.08)
    );

    // Apply damping to angular velocity :
    this.angular_velocity.multiplyScalar(0.98); // Damping factor

    // angle  = angle + ω * t .
    this.heading += this.angular_velocity.y * this.deltaTime;

    // update rotational position of the boat :
    this.model.rotation.y += this.angular_velocity.y * this.deltaTime;
  }

  move_forward() {
    var SigmaF = this.totalForcesLinear();

    this.vector_acceleration = SigmaF.divideScalar(this.jet_boat.mass);

    this.vector_velocity = this.vector_velocity.add(
      this.vector_acceleration.multiplyScalar(this.deltaTime * -0.1)
    );

    let forwardMovement = new THREE.Vector3(
      Math.sin(this.heading) * this.vector_velocity.length(),
      0,
      Math.cos(this.heading) * this.vector_velocity.length()
    );

    this.vector_position = this.vector_position.add(
      forwardMovement.multiplyScalar(this.deltaTime * -0.1)
    );
    this.model.position.copy(this.vector_position);
  }

  move_backward() {
    var SigmaF = this.totalForcesLinear();

    this.vector_acceleration = SigmaF.divideScalar(this.jet_boat.mass);

    this.vector_velocity = this.vector_velocity.add(
      this.vector_acceleration.multiplyScalar(-this.deltaTime * -0.01)
    );

    let forwardMovement = new THREE.Vector3(
      Math.sin(this.heading) * this.vector_velocity.length(),
      0,
      Math.cos(this.heading) * this.vector_velocity.length()
    );

    this.vector_position = this.vector_position.add(
      forwardMovement.multiplyScalar(-this.deltaTime * -0.1)
    );
    this.model.position.copy(this.vector_position);
  }

  update() {
    if (!this.is_stop) {
      this.createSplash();
      this.updateParticles();

      if (this.is_back) {
        this.move_backward();
        if (this.is_right) {
          this.applySteeringTorque(-this.steeringForce);
        } else if (this.is_left) {
          this.applySteeringTorque(this.steeringForce);
        }
        if (this.model.rotation.z <= 0) {
          this.model.rotation.z += 0.001;
        }
      } else {
        this.move_forward();
        if (this.is_right) {
          this.applySteeringTorque(-this.steeringForce);
        } else if (this.is_left) {
          this.applySteeringTorque(this.steeringForce);
        }
      }
    }

    if (this.is_stopping && this.is_stop) {
      if (this.engine_force != 0) {
        if (this.is_back) {
          this.move_backward();
          this.realistic_stop();
        } else {
          this.move_forward();
          this.realistic_stop();
        }
      } else {
        if (this.is_end_stopping) {
          this.vector_velocity = new THREE.Vector3(0, 0, 1);
          this.vector_acceleration = new THREE.Vector3(0, 0, 0);
          this.is_end_stopping = false;
        }
      }
    } 
    this.boundingBox.setFromObject(this.model);

    // Check for collision with the island
    if (this.boundingBox.intersectsBox(this.island.boundingBox)) {
      this.is_stop = true;
      this.is_stopping = true;
      console.log(
        "Collision detected with island!",
        this.island.boundingBox.max
      );
    }
    if (this.debug.active) {
      this.camera.object.position
        .copy(this.model.position)
        .add(new THREE.Vector3(0, 700, 1300));
    }
    this.set_gravity_force(); 
  }
}
