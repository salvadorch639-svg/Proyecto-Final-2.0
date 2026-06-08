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

camera.position.set(0, 30, 45);
camera.lookAt(0, 1, 0);

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
controls.target.set(0, 1, 0);
controls.update();

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
  audio.volume = 0.1;
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

const pavementMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f2f2f,
  roughness: 0.8,
  metalness: 0.05
});

const sidewalkWidth = 4;
[10, -10].forEach(z => {
  const sidewalk = new THREE.Mesh(
    new THREE.PlaneGeometry(140, sidewalkWidth),
    pavementMaterial
  );
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0.02, z);
  scene.add(sidewalk);
});

const pavementTileSize = 7;
const pavementTileSpacing = 7.2;
const pavementZones = [12, 40];
pavementZones.forEach(zone => {
  for (let x = -78; x <= 78; x += pavementTileSpacing) {
    for (let z = zone; z <= 42; z += pavementTileSpacing) {
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(pavementTileSize, pavementTileSize),
        pavementMaterial
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(x, 0.02, z);
      scene.add(tile);
    }
    for (let z = -zone; z >= -42; z -= pavementTileSpacing) {
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(pavementTileSize, pavementTileSize),
        pavementMaterial
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(x, 0.02, z);
      scene.add(tile);
    }
  }
});

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
  const width = 4 + Math.random() * 6;
  const depth = 4 + Math.random() * 6;
  const height = 6 + Math.random() * 22;
  const baseHue = 0.52 + Math.random() * 0.16;
  const baseColor = new THREE.Color().setHSL(baseHue, 0.2, 0.12 + Math.random() * 0.12);
  const buildingGroup = new THREE.Group();

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.34,
      metalness: 0.07
    })
  );
  building.castShadow = true;
  building.receiveShadow = true;
  buildingGroup.add(building);

  const windowOn = new THREE.MeshStandardMaterial({
    color: 0xdceeff,
    emissive: 0x7bb2ff,
    emissiveIntensity: 0.35 + Math.random() * 0.15,
    roughness: 0.18
  });
  const windowOff = new THREE.MeshStandardMaterial({
    color: 0x1f2736,
    roughness: 0.55
  });

  const floors = Math.max(2, Math.round(height / 2.2));
  const cols = Math.max(2, Math.round(width / 1.3));
  const sideCols = Math.max(1, Math.round(depth / 1.5));
  const rowHeight = height / (floors + 1);

  function addFaceWindows(sideZ) {
    for (let y = 0; y < floors; y++) {
      for (let x = 0; x < cols; x++) {
        const isLit = Math.random() > 0.3;
        const windowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.4, 0.06),
          isLit ? windowOn : windowOff
        );
        windowMesh.position.set(
          (x - (cols - 1) / 2) * 0.92,
          -height / 2 + 1 + y * rowHeight,
          sideZ
        );
        buildingGroup.add(windowMesh);
      }
    }
  }

  function addSideWindows(sideX) {
    for (let y = 0; y < floors - 1; y++) {
      for (let z = 0; z < sideCols; z++) {
        const isLit = Math.random() > 0.4;
        const windowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.36, 0.06),
          isLit ? windowOn : windowOff
        );
        windowMesh.position.set(
          sideX,
          -height / 2 + 1 + y * rowHeight,
          (z - (sideCols - 1) / 2) * 0.82
        );
        buildingGroup.add(windowMesh);
      }
    }
  }

  addFaceWindows(depth / 2 + 0.03);
  addFaceWindows(-depth / 2 - 0.03);
  addSideWindows(width / 2 + 0.03);
  addSideWindows(-width / 2 - 0.03);

  const baseBandMaterial = new THREE.MeshStandardMaterial({
    color: baseColor.clone().offsetHSL(0, 0, 0.08),
    roughness: 0.25,
    metalness: 0.02
  });
  const bandCount = Math.max(1, Math.floor(height / 6));
  for (let j = 1; j <= bandCount; j++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.95, 0.08, depth * 0.95),
      baseBandMaterial
    );
    band.position.set(0, -height / 2 + j * (height / (bandCount + 1)), 0);
    buildingGroup.add(band);
  }

  const entrance = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.35, 1.4, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.4, metalness: 0.05 })
  );
  entrance.position.set(0, -height / 2 + 0.7, depth / 2 + 0.08);
  buildingGroup.add(entrance);

  const doorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.2, 0.9, 0.04),
    windowOn
  );
  doorGlass.position.set(0, -height / 2 + 0.7, depth / 2 + 0.1);
  buildingGroup.add(doorGlass);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.45, 0.08, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1f2732, roughness: 0.45 })
  );
  canopy.position.set(0, -height / 2 + 1.15, depth / 2 + 0.26);
  buildingGroup.add(canopy);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.72, 0.08, depth * 0.72),
    new THREE.MeshStandardMaterial({
      color: 0x1d242f,
      roughness: 0.6,
      metalness: 0.08
    })
  );
  roof.position.set(0, height / 2 + 0.04, 0);
  buildingGroup.add(roof);

  if (Math.random() > 0.45) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.8, 10),
      new THREE.MeshStandardMaterial({ color: 0x505a70, roughness: 0.3 })
    );
    tank.position.set(-width * 0.2, height / 2 + 0.5, -depth * 0.2);
    buildingGroup.add(tank);
  }

  if (Math.random() > 0.7) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x3d4651, roughness: 0.35 })
    );
    vent.position.set(width * 0.25, height / 2 + 0.18, depth * -0.25);
    buildingGroup.add(vent);
  }

  const sideIndex = i < 18 ? i : i - 18;
  const sideSign = i < 18 ? 1 : -1;
  const xOffset = -76 + sideIndex * 9 + (Math.random() - 0.5) * 2;
  const zOffset = sideSign * (18 + Math.random() * 10);

  const pavementBase = new THREE.Mesh(
    new THREE.PlaneGeometry(width + 1, depth + 1),
    pavementMaterial
  );
  pavementBase.rotation.x = -Math.PI / 2;
  pavementBase.position.set(xOffset, 0.02, zOffset);
  scene.add(pavementBase);

  buildingGroup.position.set(
    xOffset,
    height / 2,
    zOffset
  );
  buildingGroup.castShadow = true;
  buildingGroup.receiveShadow = true;
  scene.add(buildingGroup);
}

// FAROLAS

for (
  let i = -60;
  i <= 60;
  i += 20
) {
  [10, -10].forEach(z => {
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
      z
    );
    scene.add(pole);

    const lampHead =
      new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xfff8e1,
          emissive: 0xffe8b8,
          emissiveIntensity: 0.8
        })
      );
    lampHead.position.set(i, 8.2, z);
    scene.add(lampHead);

    const lamp =
      new THREE.PointLight(
        0xffeecc,
        1.8,
        25
      );

    lamp.position.set(
      i,
      8.2,
      z
    );
    scene.add(lamp);
  });
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

function createAmbulance(x, z) {
  const ambulance = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.06
  });

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.9, 2.4),
    bodyMaterial
  );
  hood.position.set(-2.05, 0.52, 0);
  ambulance.add(hood);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.1, 2.4),
    bodyMaterial
  );
  cabin.position.set(-0.6, 0.75, 0);
  ambulance.add(cabin);

  const rearBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.6, 2.4),
    bodyMaterial
  );
  rearBox.position.set(1.35, 0.8, 0);
  ambulance.add(rearBox);

  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(5.7, 0.22, 2.6),
    new THREE.MeshStandardMaterial({
      color: 0xe6e6e6,
      roughness: 0.55,
      metalness: 0.04
    })
  );
  skirt.position.set(0.05, 0.14, 0);
  ambulance.add(skirt);

  const stripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xdd1f1f,
    roughness: 0.5,
    metalness: 0.02
  });

  const roofStripe = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.18, 0.26),
    stripeMaterial
  );
  roofStripe.position.set(0.05, 0.56, 1.1);
  ambulance.add(roofStripe);

  const roofStripeBack = roofStripe.clone();
  roofStripeBack.position.z = -1.1;
  ambulance.add(roofStripeBack);

  const sideStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.26, 5.4),
    stripeMaterial
  );
  sideStripe.position.set(0.05, 0.53, 0);
  sideStripe.rotation.y = Math.PI / 2;
  ambulance.add(sideStripe);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f3245,
    roughness: 0.18,
    metalness: 0.35,
    opacity: 0.78,
    transparent: true
  });

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.72, 0.08),
    windowMaterial
  );
  windshield.position.set(-1.7, 0.88, -1.05);
  ambulance.add(windshield);

  const sideWindowLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.56, 0.9),
    windowMaterial
  );
  sideWindowLeft.position.set(-2.3, 0.88, 0.72);
  ambulance.add(sideWindowLeft);

  const sideWindowRight = sideWindowLeft.clone();
  sideWindowRight.position.z = -0.72;
  ambulance.add(sideWindowRight);

  const panelWindow = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.72, 0.9),
    windowMaterial
  );
  panelWindow.position.set(2.45, 0.92, 0);
  ambulance.add(panelWindow);

  const frontLightL = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.14),
    new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffbb,
      emissiveIntensity: 0.9
    })
  );
  frontLightL.position.set(-2.55, 0.52, 0.85);
  ambulance.add(frontLightL);

  const frontLightR = frontLightL.clone();
  frontLightR.position.z = -0.85;
  ambulance.add(frontLightR);

  const indicatorL = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xffa800, roughness: 0.5 })
  );
  indicatorL.position.set(-2.55, 0.52, 1.15);
  ambulance.add(indicatorL);

  const indicatorR = indicatorL.clone();
  indicatorR.position.z = -1.15;
  ambulance.add(indicatorR);

  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.22, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0x242424,
      roughness: 0.5,
      metalness: 0.45
    })
  );
  grille.position.set(-2.45, 0.44, 0);
  ambulance.add(grille);

  const bumper = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.2, 0.34),
    new THREE.MeshStandardMaterial({
      color: 0x2f2f2f,
      roughness: 0.45,
      metalness: 0.28
    })
  );
  bumper.position.set(-2.35, 0.2, 0);
  ambulance.add(bumper);

  const sirenBar = new THREE.Group();

  const sirenBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.18, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.65,
      metalness: 0.2
    })
  );
  sirenBase.position.set(-0.95, 1.32, 0);
  sirenBar.add(sirenBase);

  const sirenRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.2, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0xff2f2f,
      emissive: 0xff5f5f,
      emissiveIntensity: 1.5
    })
  );
  sirenRed.position.set(-0.4, 1.35, 0.18);
  sirenBar.add(sirenRed);

  const sirenBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.2, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0x2f7bff,
      emissive: 0x5f9dff,
      emissiveIntensity: 1.5
    })
  );
  sirenBlue.position.set(-0.4, 1.35, -0.18);
  sirenBar.add(sirenBlue);

  const lightL = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0xff2f2f,
      emissive: 0xff7f7f,
      emissiveIntensity: 2
    })
  );
  lightL.position.set(-0.4, 1.45, 0.35);
  sirenBar.add(lightL);

  const lightR = lightL.clone();
  lightR.material = lightL.material.clone();
  lightR.material.color.set(0x2f7bff);
  lightR.material.emissive.set(0x7fbfff);
  lightR.position.z = -0.35;
  sirenBar.add(lightR);

  const sirenCover = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.14, 0.7),
    new THREE.MeshStandardMaterial({
      color: 0xadd8ff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1
    })
  );
  sirenCover.position.set(-0.95, 1.33, 0);
  sirenBar.add(sirenCover);

  ambulance.add(sirenBar);

  const crossMaterial = new THREE.MeshStandardMaterial({
    color: 0xdd1f1f,
    roughness: 0.45
  });
  const crossHoriz = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.14, 0.14),
    crossMaterial
  );
  crossHoriz.position.set(1.0, 1.0, 0);
  ambulance.add(crossHoriz);

  const crossVert = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 0.6),
    crossMaterial
  );
  crossVert.position.set(1.0, 1.0, 0);
  ambulance.add(crossVert);

  const doorLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.54, 1.0),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.1
    })
  );
  doorLine.position.set(0.6, 0.82, -1.0);
  ambulance.add(doorLine);

  const detailLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.16, 0.68),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.6,
      metalness: 0.1
    })
  );
  detailLine.position.set(0.6, 0.7, 0.0);
  ambulance.add(detailLine);

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.42,
    metalness: 0.2
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a6a6a,
    roughness: 0.2,
    metalness: 0.55
  });

  for (let wx of [-1.8, 1.8]) {
    for (let wz of [-1.15, 1.15]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16),
        tireMaterial
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(wx, -0.5, wz);
      ambulance.add(wheel);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12),
        rimMaterial
      );
      rim.rotation.z = Math.PI / 2;
      rim.rotation.y = Math.PI / 2;
      rim.position.set(wx, -0.5, wz);
      ambulance.add(rim);
    }
  }

  ambulance.position.set(x, 1, z);
  ambulance.castShadow = true;
  ambulance.receiveShadow = true;

  scene.add(ambulance);
  return ambulance;
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

const ambulance = createAmbulance(-10, -6);

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
    hair.position.set(0, 2.62, 0);
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
  neck.position.y = 1.7;
  person.add(neck);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    skinMat
  );
  head.position.y = 2.1;
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

  const leftArm = arm(-0.55, 1.45);
  const rightArm = arm(0.55, 1.45);

  leftArm.position.z = -0.08;
  rightArm.position.z = -0.08;
  leftArm.rotation.set(-0.25, 0, 0.16);
  rightArm.rotation.set(-0.25, 0, -0.16);

  if (type === "police") {
    leftArm.position.x = -0.55;
    rightArm.position.x = 0.55;
    leftArm.rotation.set(-0.65, 0, 0.12);
    rightArm.rotation.set(-0.85, 0, -0.12);
  } else if (type === "civil") {
    leftArm.position.set(-0.6, 1.45, -0.15);
    leftArm.rotation.set(-0.45, 0, 0.18);

    rightArm.position.set(0.6, 1.45, -0.15);
    rightArm.rotation.set(-0.45, 0, -0.18);
  } else if (type === "detective") {
    leftArm.position.set(-0.55, 1.45, -0.15);
    leftArm.rotation.set(-0.55, 0, 0.14);

    rightArm.position.set(0.55, 1.45, -0.15);
    rightArm.rotation.set(-1.0, 0, -0.10);
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
    hat.position.y = 2.45;

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
      hat.position.y = 2.6;

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

const citizenGroups = [];

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

function createTapePost(x, z) {
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.65 })
  );

  post.position.set(x, 2, z);
  post.castShadow = true;
  post.receiveShadow = true;
  scene.add(post);

  return post;
}

const policeTape = createPoliceTape(0, 7.8, 0); // lado derecho de la carretera
createTapePost(-15, 7.8);
createTapePost(15, 7.8);
const policeTapeCopy = createPoliceTape(0, -7.8, 0); // lado izquierdo de la carretera
createTapePost(-15, -7.8);
createTapePost(15, -7.8);

function createCitizen(x, z, options = {}) {
  const { behavior = 'watch', pathAxis = 'x' } = options;
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf0c7a1,
    roughness: 0.55
  });

  const clothColor = new THREE.Color().setHSL(0.08 + Math.random() * 0.18, 0.45, 0.45);
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.7,
    metalness: 0.05
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x2b3040,
    roughness: 0.85
  });

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.85, 0.4),
    clothMat
  );
  torso.position.y = 1.05;
  group.add(torso);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.1, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.35,
      metalness: 0.2
    })
  );
  belt.position.set(0, 0.82, 0.17);
  group.add(belt);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.16, 10),
    skinMat
  );
  neck.position.y = 1.35;
  group.add(neck);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    skinMat
  );
  head.position.y = 1.7;
  head.castShadow = true;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    eyeMat
  );
  eyeL.position.set(-0.08, 0.05, 0.2);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.08;
  head.add(eyeL, eyeR);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.14, 8),
    skinMat
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.02, 0.2);
  head.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x772222, roughness: 0.7 })
  );
  mouth.position.set(0, -0.08, 0.18);
  mouth.rotation.x = 0.04;
  head.add(mouth);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x22150f, roughness: 0.6 })
  );
  hair.scale.y = 0.55;
  hair.position.set(0, 0.16, 0);
  head.add(hair);

  const leftLeg = new THREE.Group();
  const leftLegUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.35, 10),
    pantsMat
  );
  leftLegUpper.position.y = 0.25;
  const leftFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.3),
    pantsMat
  );
  leftFoot.position.set(0, -0.23, 0.1);
  leftLeg.add(leftLegUpper, leftFoot);
  leftLeg.position.set(-0.16, 0.25, 0);
  group.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.16;
  group.add(rightLeg);

  const leftArm = new THREE.Group();
  const armLen = 0.35;

  const leftArmUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, armLen, 10),
    clothMat
  );
  leftArmUpper.position.set(0, -armLen / 2, 0);
  leftArmUpper.rotation.set(-1.2, 0, 0);

  const leftElbow = new THREE.Group();
  leftElbow.position.set(0, -armLen, 0);
  leftArmUpper.add(leftElbow);

  const leftLowerGroup = new THREE.Group();
  leftLowerGroup.position.set(0, 0, 0);

  const leftArmLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.06, armLen, 10),
    clothMat
  );
  leftArmLower.position.set(0, -armLen / 2, 0);
  leftLowerGroup.add(leftArmLower);

  const leftHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    skinMat
  );
  leftHand.position.set(0, -armLen - 0.05, 0.25);
  leftLowerGroup.add(leftHand);

  leftElbow.add(leftLowerGroup);
  leftArm.add(leftArmUpper);
  leftArm.position.set(-0.28, 1.25, -0.04);
  leftArm.rotation.set(0, 0.08, 0.08);
  group.add(leftArm);

  const rightArm = new THREE.Group();
  const rightArmUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, armLen, 10),
    clothMat
  );
  rightArmUpper.position.set(0, -armLen / 2, 0);
  rightArmUpper.rotation.set(-1.2, 0, 0);

  const rightElbow = new THREE.Group();
  rightElbow.position.set(0, -armLen, 0);
  rightArmUpper.add(rightElbow);

  const rightLowerGroup = new THREE.Group();
  rightLowerGroup.position.set(0, 0, 0);

  const rightArmLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.06, armLen, 10),
    clothMat
  );
  rightArmLower.position.set(0, -armLen / 2, 0);
  rightLowerGroup.add(rightArmLower);

  const rightHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    skinMat
  );
  rightHand.position.set(0, -armLen - 0.05, 0.25);
  rightLowerGroup.add(rightHand);

  rightElbow.add(rightLowerGroup);
  rightArm.add(rightArmUpper);
  rightArm.position.set(0.28, 1.25, -0.04);
  rightArm.rotation.set(0, -0.08, -0.08);
  group.add(rightArm);

  group.position.set(x, 0.6, z);
  const silhouetteTarget = new THREE.Vector3(0, 0.6, -1);
  const walkDirection = x === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(x);
  const walkSpeed = 6 + Math.random() * 2;
  const walkBoundary = 85;

  group.userData = {
    head,
    behavior,
    pathAxis,
    walkDirection,
    walkSpeed,
    walkBoundary,
    baseX: x,
    baseZ: z
  };

  if (behavior !== 'walk') {
    group.lookAt(silhouetteTarget);
  } else {
    if (pathAxis === 'x') {
      group.rotation.y = walkDirection > 0 ? 0 : Math.PI;
      group.rotation.x = Math.PI; // rotar 180 grados en el eje x para los caminantes
    } else {
      group.rotation.y = walkDirection > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  group.castShadow = true;
  group.receiveShadow = true;
  scene.add(group);
  citizenGroups.push(group);
  return group;
}

const citizen1 = createCitizen(-1.4, 9.5);
const citizen2 = createCitizen(1.2, 9.8);
const citizen3 = createCitizen(-1.2, -9.5);
const citizen4 = createCitizen(1.4, -9.8);
const watcher1 = createCitizen(-8, 9.4, { behavior: 'watch' });
const watcher2 = createCitizen(8, 9.4, { behavior: 'watch' });
const watcher3 = createCitizen(-8, -9.4, { behavior: 'watch' });
const watcher4 = createCitizen(8, -9.4, { behavior: 'watch' });

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
    new THREE.CircleGeometry(0.28, 32),
    material
  );
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0.02, 0);
  silhouette.add(head);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.05, 0.75),
    material
  );
  torso.position.set(0, 0.02, -0.8);
  silhouette.add(torso);

  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.55),
    material
  );
  leftArm.rotation.y = Math.PI / 28;
  leftArm.position.set(-0.45, 0.02, -0.05);
  silhouette.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.55),
    material
  );
  rightArm.rotation.y = -Math.PI / 28;
  rightArm.position.set(0.45, 0.02, -0.05);
  silhouette.add(rightArm);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.7),
    material
  );
  leftLeg.position.set(-0.16, 0.02, -1.55);
  silhouette.add(leftLeg);

  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.7),
    material
  );
  rightLeg.position.set(0.16, 0.02, -1.55);
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

  const size = 1 + Math.random() * 2;
  const puddleGroup = new THREE.Group();

  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(size, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x191f26,
      roughness: 0.04,
      metalness: 0.65,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.96
    })
  );

  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.02;
  puddleGroup.add(puddle);

  const highlight = new THREE.Mesh(
    new THREE.CircleGeometry(size * 0.4, 24),
    new THREE.MeshStandardMaterial({
      color: 0xebf7ff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    })
  );
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.set(0, 0.03, 0);
  highlight.scale.set(1, 0.55, 1);
  highlight.renderOrder = 1;
  puddleGroup.add(highlight);

  puddleGroup.position.set(
    (Math.random() - 0.5) * 80,
    0,
    (Math.random() - 0.5) * 30
  );

  scene.add(puddleGroup);
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

function animateCitizen(person, t) {
  const u = person.userData;

  if (u.behavior === 'walk') {
    if (u.pathAxis === 'x') {
      person.position.x += u.walkSpeed * 0.01 * u.walkDirection;
      if (u.walkDirection > 0 && person.position.x > u.walkBoundary) {
        person.position.x = u.baseX;
      }
      if (u.walkDirection < 0 && person.position.x < -u.walkBoundary) {
        person.position.x = u.baseX;
      }
    } else {
      person.position.z += u.walkSpeed * 0.01 * u.walkDirection;
      if (u.walkDirection > 0 && person.position.z > u.walkBoundary) {
        person.position.z = u.baseZ;
      }
      if (u.walkDirection < 0 && person.position.z < -u.walkBoundary) {
        person.position.z = u.baseZ;
      }
    }
  } else {
    person.lookAt(0, 0.6, -1);
    if (u.head) {
      u.head.rotation.y = Math.sin(t * 0.3) * 0.08;
    }
  }
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

  citizenGroups.forEach(citizen => {
    breathe(citizen, t);
    animateCitizen(citizen, t);
  });

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