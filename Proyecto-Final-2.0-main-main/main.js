import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b12);
scene.fog = new THREE.FogExp2(0x070b12, 0.02);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(30, 18, 30);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

document.body.appendChild(
  renderer.domElement
);

const controls =
  new OrbitControls(
    camera,
    renderer.domElement
  );

controls.enableDamping = true;

const fogSettings = {
  color: '#264e92',
  density: 0.02
};

function updateFog() {
  scene.fog.color.set(fogSettings.color);
  scene.background.set(fogSettings.color);
  scene.fog.density = fogSettings.density;
}

const gui = new dat.GUI({ width: 310 });
const fogFolder = gui.addFolder('Fog');
fogFolder.addColor(fogSettings, 'color').name('Color').onChange(updateFog);
fogFolder.add(fogSettings, 'density', 0, 0.2, 0.005).name('Densidad').onChange(updateFog);
fogFolder.open();

updateFog();

const audioTrackData = [
  { label: 'Ambiente de ciudad', src: 'Sonidos/audio/city_ambience.wav' },
  { label: 'Sirena policial', src: 'Sonidos/audio/police_siren.wav' },
  { label: 'Lluvia realista', src: 'Sonidos/audio/storm_rain_realistic.wav' },
  { label: 'Trueno', src: 'Sonidos/audio/thunder.wav' }
];

const audioTracks = audioTrackData.map(track => {
  const audio = new Audio(track.src);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.7;
  return { ...track, audio, enabled: true };
});

const trackList = document.getElementById('audio-track-list');
const playPauseButton = document.getElementById('play-pause');
const muteButton = document.getElementById('mute-button');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');
const audioStatus = document.getElementById('audio-status');

let isPlayingAll = false;
let isMuted = false;

function updateAudioStatus() {
  const playingCount = audioTracks.filter(track => !track.audio.paused && track.enabled).length;
  if (!playPauseButton || !muteButton || !audioStatus || !volumeValue) {
    return;
  }
  playPauseButton.textContent = isPlayingAll ? 'Pausar' : 'Reproducir';
  muteButton.textContent = isMuted ? 'Activar sonido' : 'Silenciar';
  audioStatus.textContent = playingCount > 0 ? `Reproduciendo ${playingCount} pista(s)` : 'Pausado';
  volumeValue.textContent = `${Math.round(audioTracks[0].audio.volume * 100)}%`;
}

async function playAll() {
  const promises = audioTracks.map(async track => {
    if (track.enabled) {
      try {
        await track.audio.play();
      } catch (error) {
        // El navegador puede requerir interacción del usuario.
      }
    }
  });
  await Promise.all(promises);
  isPlayingAll = true;
  updateAudioStatus();
}

function pauseAll() {
  audioTracks.forEach(track => track.audio.pause());
  isPlayingAll = false;
  updateAudioStatus();
}

function setAllVolume(value) {
  audioTracks.forEach(track => {
    track.audio.volume = value;
  });
}

function setAllMuted(value) {
  audioTracks.forEach(track => {
    track.audio.muted = value;
  });
}

if (trackList) {
  trackList.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      audioTracks[index].enabled = checkbox.checked;
      if (!checkbox.checked) {
        audioTracks[index].audio.pause();
      } else if (isPlayingAll) {
        audioTracks[index].audio.play().catch(() => {
          // no-op
        });
      }
      updateAudioStatus();
    });
  });
}

if (playPauseButton) {
  playPauseButton.addEventListener('click', async () => {
    if (!isPlayingAll) {
      await playAll();
    } else {
      pauseAll();
    }
  });
}

if (muteButton) {
  muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    setAllMuted(isMuted);
    updateAudioStatus();
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', () => {
    const volume = Number(volumeSlider.value);
    setAllVolume(volume);
    if (volume === 0) {
      isMuted = true;
    } else {
      isMuted = false;
    }
    setAllMuted(isMuted);
    updateAudioStatus();
  });
}

updateAudioStatus();

// ILUMINACIÓN

const ambient =
  new THREE.AmbientLight(
    0xffffff,
    0.25
  );

scene.add(ambient);

const moon =
  new THREE.DirectionalLight(
    0xbcd7ff,
    1.5
  );

moon.position.set(
  40,
  60,
  20
);

moon.castShadow = true;

moon.shadow.mapSize.width = 2048;
moon.shadow.mapSize.height = 2048;

scene.add(moon);

// SUELO

const ground =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      200,
      200
    ),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      roughness: 0.15,
      clearcoat: 1
    })
  );

ground.rotation.x =
  -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

// CARRETERA

const road =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      140,
      16
    ),
    new THREE.MeshStandardMaterial({
      color: 0x232323
    })
  );

road.rotation.x =
  -Math.PI / 2;

road.position.y = 0.01;

scene.add(road);

for (let i = -65; i < 65; i += 8) {

  const line =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        4,
        0.05,
        0.4
      ),
      new THREE.MeshStandardMaterial({
        color: 0xffffff
      })
    );

  line.position.set(
    i,
    0.05,
    0
  );

  scene.add(line);
}

// EDIFICIOS

for (let i = 0; i < 35; i++) {

  const h =
    5 + Math.random() * 18;

  const building =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        6,
        h,
        6
      ),
      new THREE.MeshStandardMaterial({
        color: 0x30353d
      })
    );

  building.position.set(
    (Math.random() - 0.5) * 180,
    h / 2,
    Math.random() > 0.5
      ? 25 + Math.random() * 40
      : -25 - Math.random() * 40
  );

  building.castShadow = true;
  building.receiveShadow = true;

  scene.add(building);
}

// FAROLAS

for (
  let i = -60;
  i <= 60;
  i += 20
) {

  const pole =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.15,
        0.15,
        8
      ),
      new THREE.MeshStandardMaterial({
        color: 0x666666
      })
    );

  pole.position.set(
    i,
    4,
    10
  );

  scene.add(pole);

  const lamp =
    new THREE.PointLight(
      0xffeecc,
      1.8,
      25
    );

  lamp.position.set(
    i,
    8,
    10
  );

  scene.add(lamp);
}

function createPoliceCar(x, z) {

  const car = new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        1.2,
        2.4
      ),
      new THREE.MeshStandardMaterial({
        color: 0xffffff
      })
    );

  const cabin =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        2.5,
        1.1,
        2.1
      ),
      new THREE.MeshStandardMaterial({
        color: 0x222222
      })
    );

  cabin.position.y = 1;

  car.add(body);
  car.add(cabin);

  for (let a of [-1.8, 1.8]) {

    for (let b of [-1.2, 1.2]) {

      const wheel =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.45,
            0.45,
            0.4,
            12
          ),
          new THREE.MeshStandardMaterial({
            color: 0x111111
          })
        );

      wheel.rotation.z =
        Math.PI / 2;

        wheel.rotation.y =
        Math.PI / 2;

      wheel.position.set(
        a,
        -0.5,
        b
      );

      car.add(wheel);
    }
  }

  const red =
    new THREE.PointLight(
      0xff0000,
      2,
      25
    );

  const blue =
    new THREE.PointLight(
      0x0044ff,
      2,
      25
    );

  red.position.set(
    -0.3,
    1.8,
    0
  );

  blue.position.set(
    0.3,
    1.8,
    0
  );

  car.add(red);
  car.add(blue);

  car.position.set(
    x,
    1,
    z
  );

  scene.add(car);

  return {
    red,
    blue
  };
}

const patrolA =
  createPoliceCar(
    -10,
    -2
  );

const patrolB =
  createPoliceCar(
    10,
    2
  );

  // ==========================================
// PERSONAJES
// ==========================================

function createPerson(
  x,
  z,
  type = "civil", // "police" | "detective"
  hatColor = null
) {

  const person = new THREE.Group();
  const skin = 0xf0c7a1;

  const colors = {
    police: {
      uniform: 0x0b2f6b,
      pants: 0x111827,
      accent: 0xffffff,
      trim: 0xcfd8ff
    },
    detective: {
      uniform: 0x2d2520,
      pants: 0x111827,
      shirt: 0xcfc1a6,
      accent: 0x4f3626,
      tie: 0x553a28
    }
  };

  const cfg = colors[type] || colors.police;

  const uniformMat = new THREE.MeshStandardMaterial({
    color: cfg.uniform,
    roughness: 0.75,
    metalness: 0.05
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: cfg.pants,
    roughness: 0.92,
    metalness: 0.02
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skin,
    roughness: 0.55
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: cfg.accent || 0xffffff,
    roughness: 0.5,
    metalness: 0.2
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: cfg.shirt || 0x2a1f1a,
    roughness: 0.85
  });

  const tieMat = new THREE.MeshStandardMaterial({
    color: cfg.tie || 0x1b2631,
    roughness: 0.7
  });

  // =========================
  // CUERPO (más cuadrado)
  // =========================
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.0, 0.9),
    uniformMat
  );
  torso.position.y = 1.05;
  torso.castShadow = true;
  person.add(torso);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.14, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.35,
      metalness: 0.2
    })
  );
  belt.position.set(0, 0.85, 0.25);
  person.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.08, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0xd6c66f,
      roughness: 0.25,
      metalness: 0.9
    })
  );
  buckle.position.set(0, 0.85, 0.35);
  person.add(buckle);

  const leftPouch = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.16, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.35,
      metalness: 0.1
    })
  );
  leftPouch.position.set(-0.27, 0.85, 0.35);
  person.add(leftPouch);

  const rightPouch = leftPouch.clone();
  rightPouch.position.x = 0.27;
  person.add(rightPouch);

  if (type === "police") {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.25, 0.05),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    badge.position.set(0.25, 1.35, 0.45);
    person.add(badge);

    const shoulderPatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xcfd8ff,
        roughness: 0.4
      })
    );
    shoulderPatch.position.set(-0.45, 1.35, 0.32);
    person.add(shoulderPatch);

    const shoulderPatchR = shoulderPatch.clone();
    shoulderPatchR.position.x = 0.45;
    person.add(shoulderPatchR);

    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.75, 0.25),
      uniformMat
    );
    vest.position.set(0, 1.05, 0.2);
    vest.rotation.x = 0.03;
    person.add(vest);

    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.25, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.35,
        metalness: 0.2
      })
    );
    radio.position.set(-0.38, 1.35, 0.3);
    person.add(radio);
  }

  if (type === "detective") {
    const shirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.55, 0.05),
      shirtMat
    );
    shirt.position.set(0, 1.15, 0.24);
    person.add(shirt);

    const tie = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.5, 0.05),
      tieMat
    );
    tie.position.set(0, 0.95, 0.26);
    person.add(tie);

    const lapelLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.5, 0.05),
      new THREE.MeshStandardMaterial({
        color: cfg.accent,
        roughness: 0.78
      })
    );
    lapelLeft.position.set(-0.22, 1.5, 0.24);
    lapelLeft.rotation.z = -0.2;
    person.add(lapelLeft);

    const lapelRight = lapelLeft.clone();
    lapelRight.position.x = 0.22;
    lapelRight.rotation.z = 0.2;
    person.add(lapelRight);

    const coatFlapL = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.8, 0.05),
      uniformMat
    );
    coatFlapL.position.set(-0.28, 0.7, 0.24);
    coatFlapL.rotation.z = -0.08;
    person.add(coatFlapL);

    const coatFlapR = coatFlapL.clone();
    coatFlapR.position.x = 0.28;
    coatFlapR.rotation.z = 0.08;
    person.add(coatFlapR);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22150f,
        roughness: 0.6
      })
    );
    hair.scale.y = 0.65;
    hair.position.set(0, 2.72, 0);
    person.add(hair);

    const coatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.3, 0.1),
      uniformMat
    );
    coatBack.position.set(0, 0.8, -0.2);
    person.add(coatBack);
  }

  // =========================
  // CABEZA + CUELLO
  // =========================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.18, 10),
    skinMat
  );
  neck.position.y = 1.9;
  person.add(neck);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    skinMat
  );
  head.position.y = 2.25;
  head.castShadow = true;
  person.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 10),
    eyeMat
  );
  eyeL.position.set(-0.13, 0.22, 0.42);

  const eyeR = eyeL.clone();
  eyeR.position.x = 0.13;

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.14, 8),
    skinMat
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.06, 0.44);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.03, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x772222, roughness: 0.7 })
  );
  mouth.position.set(0, -0.08, 0.45);
  mouth.rotation.x = 0.02;

  const earL = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    skinMat
  );
  earL.position.set(-0.45, 0.02, 0);

  const earR = earL.clone();
  earR.position.x = 0.45;

  head.add(eyeL, eyeR, nose, mouth, earL, earR);

  // =========================
  // BRAZOS (más naturales)
  // =========================
  function arm(xSide, offset = 1.55) {
    const g = new THREE.Group();

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.45, 10),
      uniformMat
    );

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.45, 10),
      uniformMat
    );

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.12),
      skinMat
    );

    upper.position.y = -0.25;
    lower.position.y = -0.75;
    hand.position.y = -1.05;

    g.add(upper, lower, hand);
    g.position.set(xSide, offset, 0);
    return g;
  }

  const leftArm = arm(-0.75);
  const rightArm = arm(0.75);

  if (type === "police") {
    leftArm.position.y = 1.45;
    leftArm.position.z = -0.1;
    leftArm.rotation.x = -0.65;
    leftArm.rotation.z = 0.12;

    rightArm.position.y = 1.45;
    rightArm.position.z = -0.1;
    rightArm.rotation.x = -0.85;
    rightArm.rotation.z = -0.12;
  }

  person.add(leftArm, rightArm);

  if (type === "detective") {
    const cameraGroup = new THREE.Group();
    cameraGroup.position.set(0.08, -0.92, -0.18);
    cameraGroup.rotation.set(-0.15, 0.18, -0.18);

    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.16, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.35,
        metalness: 0.25
      })
    );

    const cameraLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16),
      new THREE.MeshStandardMaterial({
        color: 0x88c0ff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.6
      })
    );
    cameraLens.rotation.x = -Math.PI / 2;
    cameraLens.position.set(0, 0, -0.08);

    const cameraFlash = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xf8f1a0,
        roughness: 0.3,
        metalness: 0.8
      })
    );
    cameraFlash.position.set(0.09, 0.05, -0.02);

    cameraGroup.add(cameraBody, cameraLens, cameraFlash);
    rightArm.add(cameraGroup);
  }

  // =========================
  // PIERNAS (mejor proporción)
  // =========================
  function leg(xSide) {
    const g = new THREE.Group();

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.7, 10),
      pantsMat
    );

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.7, 10),
      pantsMat
    );

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.14, 0.42),
      pantsMat
    );

    upper.position.y = -0.35;
    lower.position.y = -1.05;
    foot.position.y = -1.55;

    g.add(upper, lower, foot);
    g.position.set(xSide, 0.95, 0);

    return g;
  }

  const leftLeg = leg(-0.22);
  const rightLeg = leg(0.22);
  person.add(leftLeg, rightLeg);

  // =========================
  // SOMBRERO / DETALLE IDENTIDAD
  // =========================
  const useHat = type === "police" || type === "detective" || hatColor;

  if (useHat) {
    const hatColorFinal =
      type === "detective"
        ? 0x111111
        : hatColor || cfg.uniform;

    const hatMat = new THREE.MeshStandardMaterial({
      color: hatColorFinal,
      roughness: 0.45,
      metalness: 0.1
    });

    const hat = new THREE.Group();
    hat.position.y = 2.55;

    if (type === "police") {
      const hatTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.45, 0.22, 16),
        hatMat
      );
      hatTop.position.y = 0.08;

      const hatBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.05, 16),
        hatMat
      );
      hatBrim.position.y = 0;

      const hatFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.18, 0.22),
        hatMat
      );
      hatFront.position.set(0, 0.10, 0.22);

      const badgePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      badgePlate.rotation.x = Math.PI / 2;
      badgePlate.position.set(0, 0.08, 0.26);

      hat.add(hatTop, hatBrim, hatFront, badgePlate);
    } else {
      hat.position.y = 2.7;

      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.38, 0.3, 16),
        hatMat
      );
      crown.position.y = 0.18;

      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 0.05, 16),
        hatMat
      );
      brim.position.y = 0.02;

      const crease = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.06, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1c1612, roughness: 0.7 })
      );
      crease.position.set(0, 0.18, 0);
      crease.rotation.x = 0.1;

      hat.add(crown, brim, crease);
    }

    person.add(hat);
  }

  person.userData = {
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  };

  person.position.set(x, 0.6, z);

  scene.add(person);
  return person;
}

const officer1 = createPerson(-3, 5, "police", 0x0033cc);
const officer2 = createPerson(3, 5, "police", 0x0033cc);
const detective = createPerson(1.8, -0.5, "detective");

const paperCubeGeometry = new THREE.BoxGeometry(
  30,
  0.18,
  0.06,
  70,
  16,
  16
);
const paperCubeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffee33,
  roughness: 0.4,
  metalness: 0.05,
  side: THREE.DoubleSide
});

function createPoliceTape(x, z, rotationY) {
  const geometry = paperCubeGeometry.clone();
  const tape = new THREE.Mesh(geometry, paperCubeMaterial);
  tape.position.set(x, 2.1, z);
  tape.rotation.y = rotationY;
  tape.castShadow = true;
  tape.receiveShadow = true;
  scene.add(tape);

  tape.userData = {
    originalPositions: geometry.attributes.position.array.slice()
  };

  return tape;
}

const policeTape = createPoliceTape(0, 7.8, 0); // lado derecho de la carretera
const policeTapeCopy = createPoliceTape(0, -7.8, 0); // lado izquierdo de la carretera

function animatePoliceTape(tape, t) {
  const geometry = tape.geometry;
  const positions = geometry.attributes.position.array;
  const original = tape.userData.originalPositions;
  const count = positions.length / 3;

  for (let i = 0; i < count; i++) {
    const ox = original[i * 3];
    const oy = original[i * 3 + 1];
    const oz = original[i * 3 + 2];
    const phase = i * 0.14;

    positions[i * 3 + 1] = oy + Math.sin(t * 2.0 + ox * 0.5 + oz * 0.6 + phase) * 0.08;
    positions[i * 3] = ox + Math.sin(t * 1.5 + oz * 0.3 + phase) * 0.02;
    positions[i * 3 + 2] = oz + Math.cos(t * 1.5 + ox * 0.3 + phase) * 0.01;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
}

// ==========================================
// CONOS DE TRÁFICO
// ==========================================

for (
  let i = -6;
  i <= 6;
  i += 2
) {

  const cone =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        0.35,
        1,
        10
      ),
      new THREE.MeshStandardMaterial({
        color: 0xff6a00
      })
    );

  cone.position.set(
    i,
    0.5,
    3
  );

  cone.castShadow = true;

  scene.add(cone);
}

// ==========================================
// EVIDENCIA
// ==========================================

const evidenceOffsets = [
  { x: -1.2, z: -0.8 },
  { x: 1.1, z: -0.9 },
  { x: -0.6, z: 0.7 },
  { x: 0.8, z: 0.6 }
];

for (const offset of evidenceOffsets) {
  const marker =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.5,
        0.5,
        0.1
      ),
      new THREE.MeshStandardMaterial({
        color: 0xfff000
      })
    );

  marker.position.set(
    offset.x,
    0.25,
    offset.z - 1
  );

  marker.castShadow = true;

  scene.add(marker);
}

// ==========================================
// SILUETA FORENSE
// ==========================================

function createForensicSilhouette(x, z) {
  const silhouette = new THREE.Group();

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });

  const head = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 32),
    material
  );
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0.02, 0);
  silhouette.add(head);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 1.2),
    material
  );
  torso.position.set(0, 0.02, -0.9);
  silhouette.add(torso);

  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.75),
    material
  );
  leftArm.rotation.y = Math.PI / 8;
  leftArm.position.set(-0.55, 0.02, -0.45);
  silhouette.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.75),
    material
  );
  rightArm.rotation.y = -Math.PI / 8;
  rightArm.position.set(0.55, 0.02, -0.45);
  silhouette.add(rightArm);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.9),
    material
  );
  leftLeg.position.set(-0.18, 0.02, -1.75);
  silhouette.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.9),
    material
  );
  rightLeg.position.set(0.18, 0.02, -1.75);
  silhouette.add(rightLeg);

  silhouette.position.set(x, 0, z);
  return silhouette;
}

const outline = createForensicSilhouette(0, -1);
scene.add(outline);

// ==========================================
// LLUVIA
// ==========================================

const rainCount = 10000;

const rainGeometry =
  new THREE.BufferGeometry();

const rainVertices = [];

for (
  let i = 0;
  i < rainCount;
  i++
) {

  rainVertices.push(
    (Math.random() - 0.5) * 200
  );

  rainVertices.push(
    Math.random() * 80
  );

  rainVertices.push(
    (Math.random() - 0.5) * 200
  );
}

rainGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    rainVertices,
    3
  )
);

const rainMaterial =
  new THREE.PointsMaterial({
    color: 0xaad4ff,
    size: 0.12,
    transparent: true,
    opacity: 0.65
  });

const rain =
  new THREE.Points(
    rainGeometry,
    rainMaterial
  );

scene.add(rain);

const rainPositions =
  rain.geometry.attributes.position;

// ==========================================
// CHARCOS REFLECTANTES
// ==========================================

for (
  let i = 0;
  i < 12;
  i++
) {

  const puddle =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        1 + Math.random() * 2,
        24
      ),
      new THREE.MeshPhysicalMaterial({
        color: 0x222222,
        roughness: 0.05,
        clearcoat: 1,
        metalness: 0.3
      })
    );

  puddle.rotation.x =
    -Math.PI / 2;

  puddle.position.set(
    (Math.random() - 0.5) * 80,
    0.02,
    (Math.random() - 0.5) * 30
  );

  scene.add(puddle);
}

// ==========================================
// RELOJ
// ==========================================

const clock =
  new THREE.Clock();

// ==========================================
// ANIMACIÓN
// ==========================================

function breathe(person, t) {
  const b = Math.sin(t * 2) * 0.015;
  person.scale.y = 1 + b;
  person.scale.x = 1 - b * 0.2;
  person.scale.z = 1 - b * 0.2;
}

function animateOfficer1(p, t) {
  const u = p.userData;

  u.head.rotation.x = 0.4;
  u.head.rotation.y = Math.sin(t * 0.5) * 0.2;

  u.rightArm.rotation.x = -1.4 + Math.sin(t * 10) * 0.05;
  u.rightArm.rotation.z = 0.2;

  u.leftArm.rotation.x = -0.6;

  u.torso.rotation.z = Math.sin(t * 0.6) * 0.03;

  p.position.x = -3 + Math.sin(t * 1.2) * 0.05;
}

function animateOfficer2(p, t) {
  const u = p.userData;

  u.head.rotation.x = 0.4;
  u.head.rotation.y = Math.sin(t * 0.5) * 0.2;

  u.rightArm.rotation.x = -1.4 + Math.sin(t * 10) * 0.05;
  u.rightArm.rotation.z = 0.2;

  u.leftArm.rotation.x = -0.6;

  u.torso.rotation.z = Math.sin(t * 0.6) * 0.03;

  p.position.x = 3 + Math.sin(t * 1.2) * 0.05;
}

function animateDetective(p, t) {
  const u = p.userData;

  const radius = 2.2;
  const speed = 0.2;

  p.position.x = Math.cos(t * speed) * radius;
  p.position.z = -1 + Math.sin(t * speed) * radius;
  p.position.y = 0.6;

  p.lookAt(0, 0.6, -1);

  u.torso.rotation.x = 0;

  u.rightArm.rotation.x = -1.2 + Math.sin(t * 2) * 0.03;
  u.leftArm.rotation.x = -0.8;

  u.head.rotation.y = Math.sin(t * 0.4) * 0.2;
  u.head.rotation.x = 0.05 + Math.sin(t * 0.6) * 0.02;
}

function rainReaction(person, t) {
  const wet = 0.02 + Math.sin(t * 3) * 0.01;
  person.traverse(o => {
    if (o.isMesh && o.material) {
      o.material.roughness =
        THREE.MathUtils.lerp(
          o.material.roughness,
          0.85,
          0.01
        );
    }
  });
}

function animate() {

  requestAnimationFrame(
    animate
  );

  const t =
    clock.getElapsedTime();

  breathe(officer1, t);
  breathe(officer2, t);
  breathe(detective, t);

  animateOfficer1(officer1, t);
  animateOfficer2(officer2, t);
  animateDetective(detective, t);

  rainReaction(officer1, t);
  rainReaction(officer2, t);
  rainReaction(detective, t);

  // Luces patrulla A

  patrolA.red.intensity =
    Math.sin(t * 12) > 0
      ? 40
      : 2;

  patrolA.blue.intensity =
    Math.sin(t * 12) < 0
      ? 40
      : 2;

  // Luces patrulla B

  patrolB.red.intensity =
    Math.sin(
      t * 12 + 1
    ) > 0
      ? 40
      : 2;

  patrolB.blue.intensity =
    Math.sin(
      t * 12 + 1
    ) < 0
      ? 40
      : 2;

  // Movimiento policías

  officer1.rotation.y =
    Math.sin(t) * 0.4;

  officer2.rotation.y =
    -Math.sin(t) * 0.4;

  detective.rotation.y =
    Math.sin(
      t * 0.5
    ) * 0.8;

  animatePoliceTape(policeTape, t);
  animatePoliceTape(policeTapeCopy, t);

  // Lluvia

  for (
    let i = 0;
    i < rainCount;
    i++
  ) {

    rainPositions.array[
      i * 3 + 1
    ] -= 0.8;

    if (
      rainPositions.array[
        i * 3 + 1
      ] < 0
    ) {

      rainPositions.array[
        i * 3 + 1
      ] = 80;
    }
  }

  rainPositions.needsUpdate =
    true;

  controls.update();

  renderer.render(
    scene,
    camera
  );
}

animate();

// ==========================================
// RESPONSIVE
// ==========================================

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);