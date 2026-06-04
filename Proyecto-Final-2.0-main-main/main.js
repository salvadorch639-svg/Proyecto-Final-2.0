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
  color: '#070b12',
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
  detective = false,
  hatColor = null
) {

  const person = new THREE.Group();

  const skin = 0xf0c7a1;

  const uniformColor = detective
    ? 0x2b1f1a
    : 0x0b2d6b;

  const pantsColor = 0x111111;

  const materialUniform = new THREE.MeshStandardMaterial({
    color: uniformColor,
    roughness: 0.8
  });

  const materialSkin = new THREE.MeshStandardMaterial({
    color: skin,
    roughness: 0.6
  });

  const materialDark = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.9
  });

  // =====================
  // TORSO (mejor forma)
  // =====================
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 0.8, 6, 10),
    materialUniform
  );
  torso.position.y = 1.1;
  torso.castShadow = true;
  person.add(torso);

  // =====================
  // CUELLO (nuevo)
  // =====================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.25, 10),
    materialSkin
  );
  neck.position.y = 1.75;
  person.add(neck);

  // =====================
  // CABEZA (mejor proporción)
  // =====================
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.33, 16, 16),
    materialSkin
  );
  head.position.set(0, 2.05, 0);
  head.castShadow = true;
  person.add(head);

  // ojos simples (detalle clave)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    eyeMat
  );
  eyeL.position.set(-0.12, 2.1, 0.28);

  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;

  person.add(eyeL);
  person.add(eyeR);

  // =====================
  // BRAZOS articulados
  // =====================
  function createArm(xSide) {

    const arm = new THREE.Group();

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.55, 10),
      materialUniform
    );

    upper.position.y = -0.25;

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.55, 10),
      materialUniform
    );

    lower.position.y = -0.85;

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      materialSkin
    );

    hand.position.y = -1.25;

    arm.add(upper);
    arm.add(lower);
    arm.add(hand);

    arm.position.set(xSide, 1.55, 0);

    return arm;
  }

  const leftArm = createArm(-0.75);
  const rightArm = createArm(0.75);

  person.add(leftArm);
  person.add(rightArm);

  // =====================
  // PIERNAS articuladas
  // =====================
  function createLeg(xSide) {

    const leg = new THREE.Group();

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.6, 10),
      materialDark
    );

    upper.position.y = -0.3;

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.6, 10),
      materialDark
    );

    lower.position.y = -0.95;

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.4),
      materialDark
    );

    foot.position.y = -1.35;

    leg.add(upper);
    leg.add(lower);
    leg.add(foot);

    leg.position.set(xSide, 0.9, 0);

    return leg;
  }

  const leftLeg = createLeg(-0.22);
  const rightLeg = createLeg(0.22);

  person.add(leftLeg);
  person.add(rightLeg);

  // =====================
  // SOMBRERO (mejor detective/policía)
  // =====================
  const useHat = detective || hatColor !== null;

  if (useHat) {

    const hatMat = new THREE.MeshStandardMaterial({
      color: detective ? 0x111111 : hatColor,
      roughness: 0.6
    });

    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.45, 0.22, 12),
      hatMat
    );

    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.58, 0.05, 12),
      hatMat
    );

    hatTop.position.y = 2.35;
    hatBrim.position.y = 2.2;

    const hat = new THREE.Group();
    hat.add(hatTop);
    hat.add(hatBrim);

    person.add(hat);
  }

  // =====================
  // DATA PARA ANIMACIÓN
  // =====================
  person.userData = {
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  };

  person.position.set(x, 0, z);

  scene.add(person);

  return person;
}

const officer1 =
  createPerson(
    -3,
    5,
    false,
    0x0033cc
  );

const officer2 =
  createPerson(
    3,
    5,
    false,
    0x0033cc
  );

const detective =
  createPerson(
    1.8,
    -0.5,
    true
  );

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

  u.head.rotation.y = Math.sin(t * 0.8) * 1.0;
  u.torso.rotation.y = Math.sin(t * 0.8) * 0.25;

  u.leftArm.rotation.x = -0.3;
  u.rightArm.rotation.x = -0.3;

  u.torso.position.y = 1.7 + Math.sin(t * 2) * 0.01;
  p.position.x = 3 + Math.sin(t * 1.5) * 0.08;
}

function animateDetective(p, t) {
  const u = p.userData;

  p.position.x = Math.sin(t * 0.25) * 2;
  p.position.z = -1 + Math.cos(t * 0.25) * 1.2;

  p.lookAt(0, 0, -1);

  u.torso.rotation.x = 0.15;

  u.rightArm.rotation.x = -1.2 + Math.sin(t * 2) * 0.03;
  u.leftArm.rotation.x = -0.8;

  u.head.rotation.y = Math.sin(t * 0.4) * 0.2;
  u.head.rotation.x = 0.1 + Math.sin(t * 0.6) * 0.05;
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