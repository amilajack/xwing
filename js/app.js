let container;

let camera;
let scene;
let webglRenderer;
let loader;

const renderGl = 1;
let hasGl = 0;

let delta;
let time;
let oldTime;

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
const sideWays = { state: false, rotation: 0 };

let mouseXpercent = 0;
let mouseYpercent = 0;

let leftIsDown = false;
let upIsDown = false;
let rightIsDown = false;
let downIsDown = false;
let ctrlIsDown = false;
let inFullscreen = false;
let lastTap = 0;

let speed = 0;
let speedMultiplier = 4;
const numOfTrench = 4;
const trenchArray = [];
const trenchLength = 7600;
let xwing;
let ship;
let thrust0;
let thrust1;
let thrust2;
let thrust3;
let laserContainer;
let laser0Mesh;
let laser1Mesh;
let laser2Mesh;
let laser3Mesh;
let lastFireTime = 0;
let pointLight;
const obstaclePool = [];
const obstacleArray = [];
const particleArray = [];
let isDead = false;
let deadTimer = 0;
let shakeCameraTimer = 0;
let allLoaded = false;
let started = false;
let score = 0;

let composer;
let effectFocus;

let touchDevice = false;
let sizeRatio = 1;
let postprocessing = false;

const textureLoader = new THREE.TextureLoader();

function init() {
  container = document.createElement('div');
  container.id = 'container';
  document.body.appendChild(container);

  touchDevice = 'ontouchstart' in document.getElementById('container')
    || navigator.userAgent.match(/ipad|iphone|android/i) != null;
  if (touchDevice) sizeRatio = 3;
  if (touchDevice) postprocessing = false;

  const aspect = window.innerWidth / window.innerHeight;

  camera = new THREE.PerspectiveCamera(50, aspect, 1, 100000);
  camera.position.y = -60;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 20000, 25000);

  // Lights — original r44 values (SRGBColorSpace direct render, no postprocessing)
  const ambient = new THREE.AmbientLight(0x111111);
  scene.add(ambient);

  const light = new THREE.SpotLight(0x999999, 0.7, 0);
  light.position.set(-100, 1000, 1000);
  light.target.position.set(0, 0, -1000);
  light.castShadow = true;
  scene.add(light);
  scene.add(light.target);

  pointLight = new THREE.PointLight(0xf43b3c, 0.4, 5000);
  pointLight.position.set(0, -5000, -5000);
  scene.add(pointLight);

  // Models
  loader = new THREE.LegacyModelLoader();
  loader.load('./models/trench.js', trenchLoaded);

  // Lasers
  laserContainer = new THREE.Object3D();
  laserContainer.scale.set(0.8, 0.8, 0.8);
  scene.add(laserContainer);

  const laser = new THREE.BoxGeometry(6, 800, 6);

  const material = new THREE.MeshBasicMaterial({ color: 0xf43b3c, opacity: 0.5, transparent: true });

  laser0Mesh = new THREE.Mesh(laser, material);
  laser0Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.add(laser0Mesh);

  laser1Mesh = new THREE.Mesh(laser, material);
  laser1Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.add(laser1Mesh);

  laser2Mesh = new THREE.Mesh(laser, material);
  laser2Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.add(laser2Mesh);

  laser3Mesh = new THREE.Mesh(laser, material);
  laser3Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.add(laser3Mesh);

  laser0Mesh.visible = false;
  laser1Mesh.visible = false;
  laser2Mesh.visible = false;
  laser3Mesh.visible = false;

  // Particles (stars)
  const starPositions = [];
  for (let i = 0; i < 1000; i++) {
    starPositions.push(
      Math.random() * 10000 - 5000,
      Math.random() * 400 - 400,
      Math.random() * 20000 - 10000
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

  const particleImage = textureLoader.load('img/star.png');
  const particleMaterial = new THREE.PointsMaterial({
    size: 48,
    map: particleImage,
    opacity: 1.0,
    transparent: false,
    depthTest: true,
    blending: THREE.NormalBlending
  });

  const stars = new THREE.Points(starGeometry, particleMaterial);
  stars.position.z = -12000;
  stars.position.y = 2000;
  scene.add(stars);

  // Obstacle types: horizontal wall, vertical wall, 1/4 passage down, 1/4 passage up
  const numArray = [4, 3, 1, 1];

  for (let i = 0; i < 4; ++i) {
    const obsMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      emissive: 0x222222,
      specular: 0x000000,
      shininess: 100
    });

    for (let j = 0; j < numArray[i]; ++j) {
      const group = new THREE.Group();

      if (i === 0) {
        // Horizontal wall
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1200, 300, 220), obsMaterial));
        for (let k = 0; k < 12; ++k) {
          const deco = new THREE.Mesh(new THREE.BoxGeometry(260, 260, 260), obsMaterial);
          deco.position.set(
            Math.random() * 1200 - 600,
            Math.random() * 100 - 50,
            Math.random() * 100 - 50
          );
          deco.rotation.x = Math.random() * 0.4 - 0.2;
          group.add(deco);
        }
        group.position.y = Math.random() * 900 - 400;
      } else if (i === 1) {
        // Vertical wall
        group.add(new THREE.Mesh(new THREE.BoxGeometry(450, 1200, 220), obsMaterial));
        for (let k = 0; k < 12; ++k) {
          const deco = new THREE.Mesh(new THREE.BoxGeometry(260, 260, 260), obsMaterial);
          deco.position.set(
            Math.random() * 260 - 130,
            Math.random() * 1000 - 500,
            Math.random() * 100 - 50
          );
          deco.rotation.x = Math.random() * 0.4 - 0.2;
          group.add(deco);
        }
        group.position.x = Math.random() * 1200 - 600;
      } else if (i === 2 || i === 3) {
        // Quarter-passage obstacles
        group.add(new THREE.Mesh(new THREE.BoxGeometry(1200, 800, 220), obsMaterial));
        const extraMesh = new THREE.Mesh(new THREE.BoxGeometry(600, 600, 220), obsMaterial);
        extraMesh.position.set(300, i === 2 ? -400 : 400, 0);
        group.add(extraMesh);
        for (let k = 0; k < 20; ++k) {
          const deco = new THREE.Mesh(new THREE.BoxGeometry(260, 260, 260), obsMaterial);
          deco.position.set(
            Math.random() * 1000 - 500,
            Math.random() * 600 - 300,
            Math.random() * 100 - 50
          );
          deco.rotation.x = Math.random() * 0.4 - 0.2;
          group.add(deco);
        }
        group.position.y = i === 2 ? 200 : -200;
      }

      group.traverse(function(child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.visible = false;
      scene.add(group);
      obstaclePool.push({ mesh: group, material: obsMaterial, type: i });
    }
  }

  spawnNewObstacle();

  showInstruction(false);

  try {
    webglRenderer = new THREE.WebGLRenderer({
      antialias: false
    });
    webglRenderer.setClearColor(0x000000, 0.99);
    webglRenderer.setSize(
      window.innerWidth / sizeRatio,
      window.innerHeight / sizeRatio
    );

    webglRenderer.autoClear = false;

    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    light.shadow.mapSize.width = 1024 / (sizeRatio * 2);
    light.shadow.mapSize.height = 1024 / (sizeRatio * 2);
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 100000;
    light.shadow.camera.fov = 50;

    container.appendChild(webglRenderer.domElement);
    hasGl = 1;
    THREEx.WindowResize(webglRenderer, camera);

    webglRenderer.domElement.style.position = 'absolute';
    webglRenderer.domElement.style.top = '0px';
    webglRenderer.domElement.style.left = '0px';

    if (sizeRatio > 1) {
      webglRenderer.domElement.style.webkitTransform = `scale3d(${sizeRatio}, ${sizeRatio}, 1)`;
      webglRenderer.domElement.style.webkitTransformOrigin = '0 0 0';
    }
  } catch (e) {
    document.getElementById('info').innerHTML = "<P><BR><B>Note.</B> You need a modern browser that supports WebGL for this to run the way it is intended.</P>";
    document.getElementById('info').style.display = 'block';
    return;
  }

  if (postprocessing) {
    const renderModel = new THREE.RenderPass(scene, camera);
    const effectBloom = new THREE.BloomPass(0.75);

    const effectVignette = new THREE.ShaderPass(THREE.ShaderExtras.vignette);
    effectVignette.uniforms.offset.value = 1.0;
    effectVignette.uniforms.darkness.value = 1.0;

    effectFocus = new THREE.ShaderPass(THREE.ShaderExtras.focus);
    effectFocus.uniforms.screenWidth.value = window.innerWidth / sizeRatio;
    effectFocus.uniforms.screenHeight.value = window.innerHeight / sizeRatio;
    effectFocus.uniforms.sampleDistance.value = 0;
    effectFocus.uniforms.waveFactor.value = 0;
    effectFocus.renderToScreen = true;

    composer = new THREE.EffectComposer(webglRenderer);
    composer.addPass(renderModel);
    composer.addPass(effectVignette);
    composer.addPass(effectFocus);
  }
}

function toggleFullscreen() {
  if (!inFullscreen) {
    try {
      if (container.webkitRequestFullScreen) {
        container.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      inFullscreen = true;
    } catch (e) {
      // not available
    }
  } else {
    if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    inFullscreen = false;
  }
}

function loadingComplete() {
  allLoaded = true;
  showInstruction(true);
}

function startGame() {
  started = true;
  hideInstruction();
}

function addParticles() {
  const particleImg = textureLoader.load('img/fraction1.png');
  const colorArray = [0xffffff, 0xfabe82, 0xe03809, 0xee9c64, 0x910300];
  const sizeArray = [48, 48, 48, 48, 64];

  for (let i = 0; i < 15; ++i) {
    const pts = [];
    for (let k = 0; k < 500; k++) {
      const radius = Math.random() * 50;
      const v = getRandomPointOnSphere(radius);
      pts.push(v.x, v.y, v.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));

    const color = colorArray[i % colorArray.length];
    const size = sizeArray[i % sizeArray.length];

    const particleMaterial = new THREE.PointsMaterial({
      color,
      size,
      map: particleImg,
      opacity: 1.0,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(geo, particleMaterial);

    particles.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    particles.position.z = -500 + i;
    particles.scale.set(0.1, 0.1, 0.1);
    particles.visible = false;

    scene.add(particles);
    particleArray.push({ p: particles, m: particleMaterial });
  }
}

function trenchLoaded(geometry, materials) {
  const trenchMaterial = new THREE.MeshPhongMaterial({
    color: 0x111111,
    emissive: 0x222222,
    specular: 0x000000,
    shininess: 100
  });

  for (let i = 0; i < numOfTrench; ++i) {
    const mesh = new THREE.Mesh(geometry, trenchMaterial);

    const scale = 200;
    mesh.scale.set(scale, scale * 1.6, scale * 1.6);
    mesh.position.set(0, 0, -i * trenchLength - trenchLength / 2);
    mesh.rotation.set(0, Math.PI / 2, 0);

    mesh.castShadow = false;
    mesh.receiveShadow = true;

    scene.add(mesh);
    trenchArray.push(mesh);
  }

  loader.load('./models/xwing.js', xwingLoaded);
}

function xwingLoaded(geometry, materials) {
  const xwingMaterial = materials.length > 0
    ? materials
    : new THREE.MeshPhongMaterial({ color: 0x888888, specular: 0x333333, shininess: 50 });

  xwing = new THREE.Object3D();

  ship = new THREE.Mesh(geometry, xwingMaterial);

  const scale = 0.8;
  ship.scale.set(scale, scale, scale);
  xwing.position.set(0, 0, -700);
  ship.rotation.set(0, Math.PI / 2, 0);

  ship.castShadow = true;
  ship.receiveShadow = false;

  xwing.add(ship);
  scene.add(xwing);

  // Thrust sprites
  const thrustImage = textureLoader.load('img/thrust.png');
  const scale2 = 0.25;

  const makeThrustSprite = function() {
    return new THREE.Sprite(new THREE.SpriteMaterial({
      map: thrustImage,
      color: 0xff3300,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9
    }));
  };

  thrust0 = makeThrustSprite();
  thrust0.position.set(-175, 25, -42);
  thrust0.scale.set(scale2, scale2, scale2);
  ship.add(thrust0);

  thrust1 = makeThrustSprite();
  thrust1.position.set(-175, 25, 42);
  thrust1.scale.set(scale2, scale2, scale2);
  ship.add(thrust1);

  thrust2 = makeThrustSprite();
  thrust2.position.set(-175, -23, -42);
  thrust2.scale.set(scale2, scale2, scale2);
  ship.add(thrust2);

  thrust3 = makeThrustSprite();
  thrust3.position.set(-175, -23, 42);
  thrust3.scale.set(scale2, scale2, scale2);
  ship.add(thrust3);

  addParticles();
  loadingComplete();
}

function showResult(currentscore) {
  const resultbox = document.getElementById('resultbox');
  resultbox.innerHTML = "<img src='img/gameover.png'><BR><BR>";
  const scoreStr = currentscore.toString();
  let imageStr = '';
  for (let i = 0; i < scoreStr.length; ++i) {
    const num = scoreStr.substr(i, 1);
    imageStr += `<img src='img/${num}.png'>`;
  }

  resultbox.innerHTML += `<img src='img/yougot.png'> ${imageStr} <img src='img/points.png'><BR><BR>`;
  resultbox.innerHTML += "<img src='img/gameover_end.png'>";
  resultbox.style.display = 'block';
  resultbox.style.marginLeft = `-${parseInt(resultbox.offsetWidth / 2)}px`;
  resultbox.style.marginTop = `-${parseInt(resultbox.offsetHeight / 2)}px`;
}

function hideResult() {
  isDead = false;
  deadTimer = time;

  const resultbox = document.getElementById('resultbox');
  resultbox.style.display = 'none';
}

function showInstruction(loadingDone) {
  const instructionbox = document.getElementById('instructionbox');
  if (loadingDone) {
    instructionbox.innerHTML = "<img src='img/click.png'>";
  }
  instructionbox.innerHTML += "<BR><BR><img src='img/instructions.png'>";
  instructionbox.style.display = 'block';
  instructionbox.style.marginLeft = `-${parseInt(
    instructionbox.offsetWidth / 2
  )}px`;
  instructionbox.style.marginTop = `-${parseInt(
    instructionbox.offsetHeight / 2
  )}px`;
}

function hideInstruction() {
  const instructionbox = document.getElementById('instructionbox');
  instructionbox.style.display = 'none';
}

function onTouchStart(event) {
  event.preventDefault();

  if (allLoaded && !started) {
    startGame();
    return;
  }

  const resultbox = document.getElementById('resultbox');
  if (isDead && resultbox.style.display === 'block') {
    hideResult();
    score = 0;
    speedMultiplier = 4;
    return;
  }

  if (time < lastTap + 400) {
    changeRotation();
  }

  lastTap = time;
}

function onTouchMove(event) {
  event.preventDefault();

  const windowHalfX = window.innerWidth >> 1;
  const windowHalfY = window.innerHeight >> 1;

  mouseX = event.touches[0].clientX - windowHalfX;
  mouseY = event.touches[0].clientY - windowHalfY;

  mouseXpercent = mouseX / (window.innerWidth / 2.3);
  mouseYpercent = mouseY / (window.innerHeight / 2.3);
}

function onTouchEnd(event) {
  event.preventDefault();
  mouseDown = false;
}

function onDocumentMouseMove(event) {
  event.preventDefault();

  const windowHalfX = window.innerWidth >> 1;
  const windowHalfY = window.innerHeight >> 1;

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;

  mouseXpercent = mouseX / (window.innerWidth / 2.3);
  mouseYpercent = mouseY / (window.innerHeight / 2.3);
}

function onDocumentMouseDown(event) {
  event.preventDefault();

  if (allLoaded && !started) {
    startGame();
    return;
  }

  const resultbox = document.getElementById('resultbox');
  if (isDead && resultbox.style.display === 'block') {
    hideResult();
    score = 0;
    speedMultiplier = 4;
    return;
  }

  if (event.button === 2) {
    mouseDown = true;
  } else {
    changeRotation();
  }
}

function onDocumentMouseUp(event) {
  event.preventDefault();
  mouseDown = false;
}

function onDocumentKeyDown(event) {
  if (event.keyCode === 70) {
    toggleFullscreen();
  }

  if (allLoaded && !started) {
    startGame();
    return;
  }

  const resultbox = document.getElementById('resultbox');
  if (isDead && resultbox.style.display === 'block') {
    hideResult();
    score = 0;
    speedMultiplier = 4;
    return;
  }

  switch (event.keyCode) {
    case 37:
      leftIsDown = true;
      break;
    case 38:
      upIsDown = true;
      break;
    case 39:
      rightIsDown = true;
      break;
    case 40:
      downIsDown = true;
      break;
    case 17:
      ctrlIsDown = true;
      break;
    case 32:
      changeRotation();
      break;
  }
}

function onDocumentKeyUp(event) {
  switch (event.keyCode) {
    case 37:
      leftIsDown = false;
      break;
    case 38:
      upIsDown = false;
      break;
    case 39:
      rightIsDown = false;
      break;
    case 40:
      downIsDown = false;
      break;
    case 17:
      ctrlIsDown = false;
      break;
  }
}

function changeRotation() {
  if (!sideWays.state) {
    sideWays.state = true;

    let direction = Math.PI / 2;
    if (xwing.rotation.z < 0) {
      direction *= -1;
    }

    const rotatetween = new TWEEN.Tween(sideWays)
      .to({ rotation: direction }, 800)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    rotatetween.start();
  } else {
    sideWays.state = false;

    const rotatetween = new TWEEN.Tween(sideWays)
      .to({ rotation: 0 }, 800)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    rotatetween.start();
  }
}

function getRandomPointOnSphere(r) {
  const angle = Math.random() * Math.PI * 2;
  const u = Math.random() * 2 - 1;

  return new THREE.Vector3(
    Math.cos(angle) * Math.sqrt(1 - u ** 2) * r,
    Math.sin(angle) * Math.sqrt(1 - u ** 2) * r,
    u * r
  );
}

function spawnNewObstacle() {
  if (obstaclePool.length === 0) {
    console.log('no objects in pool');
    return;
  }
  const rnd = Math.floor(Math.random() * obstaclePool.length);
  const o = obstaclePool.slice(rnd, rnd + 1);
  const spliced = obstaclePool.splice(rnd, 1);

  obstacleArray.push(o[0]);

  const mesh = o[0].mesh;
  const type = o[0].type;

  mesh.position.z = -(numOfTrench - 1) * trenchLength - trenchLength / 2;
  if (type === 0) {
    mesh.position.y = Math.random() * 900 - 400;
  } else if (type === 1) {
    mesh.position.x = Math.random() * 1200 - 600;
  } else if (type === 2 || type === 3) {
    let rot = 0;
    if (Math.random() > 0.5) rot = Math.PI;
    mesh.rotation.y = rot;
  }
  mesh.visible = true;
}

function run(delta) {
  if (isDead) {
    return;
  }

  // Trenches
  for (let i = 0; i < trenchArray.length; ++i) {
    const mesh = trenchArray[i];
    mesh.position.z += speed;

    if (mesh.position.z > camera.position.z + trenchLength / 2) {
      mesh.position.z -= numOfTrench * trenchLength;

      if (obstacleArray.length < 4) {
        spawnNewObstacle();
      }
    }
  }

  // Obstacles
  for (let i = 0; i < obstacleArray.length; ++i) {
    const type = obstacleArray[i].type;
    const mesh = obstacleArray[i].mesh;
    mesh.position.z += speed;

    if (mesh.position.z > camera.position.z + trenchLength / 2) {
      mesh.visible = false;
      const shifted = obstacleArray.shift();
      obstaclePool.push(shifted);
      spawnNewObstacle();
    }

    if (xwing && time > deadTimer + 2000) {
      const difz = xwing.position.z - mesh.position.z;

      if (difz < 170 && difz > -170) {
        const difY = xwing.position.y - mesh.position.y;
        const difX = xwing.position.x - mesh.position.x;

        if (type === 0) {
          if (!sideWays.state && difY < 210 && difY > -210) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state && difY < 370 && difY > -370) {
            explode();
            isDead = true;
            return;
          }
        }

        if (type === 1) {
          if (!sideWays.state && difX < 370 && difX > -370) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state && difX < 210 && difX > -210) {
            explode();
            isDead = true;
            return;
          }
        }

        if (type === 2) {
          if (
            !sideWays.state
            && mesh.rotation.y === 0
            && (xwing.position.y > -240 || xwing.position.x > -210)
          ) {
            explode();
            isDead = true;
            return;
          }
          if (
            !sideWays.state
            && mesh.rotation.y === Math.PI
            && (xwing.position.y > -240 || xwing.position.x < 210)
          ) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state) {
            explode();
            isDead = true;
            return;
          }
        }

        if (type === 3) {
          if (
            !sideWays.state
            && mesh.rotation.y === 0
            && (xwing.position.y < 220 || xwing.position.x > -210)
          ) {
            explode();
            isDead = true;
            return;
          }
          if (
            !sideWays.state
            && mesh.rotation.y === Math.PI
            && (xwing.position.y < 220 || xwing.position.x < 210)
          ) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state) {
            explode();
            isDead = true;
            return;
          }
        }
      }
    }
  }

  // Key control
  if (leftIsDown) mouseXpercent -= 0.003 * delta;
  if (rightIsDown) mouseXpercent += 0.003 * delta;
  if (upIsDown) mouseYpercent -= 0.0025 * delta;
  if (downIsDown) mouseYpercent += 0.0025 * delta;

  if (mouseXpercent < -1) mouseXpercent = -1;
  if (mouseXpercent > 1) mouseXpercent = 1;
  if (mouseYpercent < -1) mouseYpercent = -1;
  if (mouseYpercent > 1) mouseYpercent = 1;

  if (!xwing) {
    return;
  }

  const optimalDivider = delta / 16;
  const smoothing = Math.max(8, 12 / optimalDivider);

  let toX = mouseXpercent * 380;
  let toY = -(mouseYpercent * 350) + 30;

  if (sideWays.state) {
    toX = mouseXpercent * 480;
    toY = -(mouseYpercent * 250) + 30;
  }

  let difX = (toX - xwing.position.x) / smoothing;
  let difY = (toY - xwing.position.y) / smoothing;

  xwing.position.x += difX;
  xwing.position.y += difY;

  difX = Math.min(difX, 10);
  difX = Math.max(difX, -10);
  difY = Math.min(difY, 10);
  difY = Math.max(difY, -10);

  xwing.rotation.x = difY / 40;
  xwing.rotation.y = -(difX / 40);
  xwing.rotation.z = -(difX / 40);
  xwing.rotation.z += sideWays.rotation;

  // Thrust opacity
  let opacity = (Math.abs(difX) + Math.abs(difY)) / 8;
  opacity = Math.min(opacity, 1);
  opacity = Math.max(opacity, 0.3);
  opacity += Math.random() * 0.5;

  if (!ship.visible) {
    opacity = 0;
  }

  thrust0.material.opacity = opacity;
  thrust1.material.opacity = opacity;
  thrust2.material.opacity = opacity;
  thrust3.material.opacity = opacity;

  // Blink after respawn
  if (time < deadTimer + 2000) {
    ship.visible = true;
    if (time < deadTimer + 600) {
      ship.visible = false;
    }
    if (time < deadTimer + 800 && time > deadTimer + 700) {
      ship.visible = false;
    }
    if (time < deadTimer + 1100 && time > deadTimer + 1000) {
      ship.visible = false;
    }
    if (time < deadTimer + 1400 && time > deadTimer + 1300) {
      ship.visible = false;
    }
  }

  // Lasers
  if ((mouseDown || ctrlIsDown) && time > deadTimer + 1500) {
    fire();
  }

  // Camera follow
  const toX1 = xwing.position.x;
  toY = xwing.position.y + 50;

  difX = (toX1 - camera.position.x) / (smoothing * 2);

  camera.position.x += difX;
  camera.position.y += (toY - camera.position.y) / (smoothing * 2);

  camera.up.x = -(difX / 100);
}

function explode() {
  playSound(window.explodeSound, 0.45);

  for (let i = 0; i < particleArray.length; ++i) {
    const particles = particleArray[i].p;
    const material = particleArray[i].m;

    particles.visible = true;
    particles.position.x = xwing.position.x;
    particles.position.y = xwing.position.y;

    const outscale = 3 + Math.random() * 5;

    new TWEEN.Tween(particles.scale)
      .to({ x: outscale, y: outscale, z: outscale }, 1500)
      .easing(TWEEN.Easing.Exponential.EaseOut)
      .start();

    new TWEEN.Tween(material)
      .to({ opacity: 0 }, 1500)
      .easing(TWEEN.Easing.Exponential.EaseOut)
      .start();

    new TWEEN.Tween(particles.rotation)
      .to(
        {
          x: particles.rotation.x + 0.75,
          y: particles.rotation.y + 0.75,
          z: particles.rotation.z + 0.75
        },
        1700
      )
      .easing(TWEEN.Easing.Exponential.EaseOut)
      .start();

    new TWEEN.Tween(particles.position)
      .to(
        {
          x: camera.position.x,
          y: camera.position.y + 30,
          z: particles.position.z + 500
        },
        2500
      )
      .easing(TWEEN.Easing.Exponential.EaseOut)
      .start();
  }

  new TWEEN.Tween(camera.up)
    .to({ x: 0 }, 1000)
    .easing(TWEEN.Easing.Exponential.EaseOut)
    .delay(1500)
    .onComplete(explodeDone)
    .start();

  shakeCameraTimer = time;

  ship.visible = false;
  thrust0.material.opacity = 0;
  thrust1.material.opacity = 0;
  thrust2.material.opacity = 0;
  thrust3.material.opacity = 0;
}

function explodeDone() {
  for (let i = 0; i < particleArray.length; ++i) {
    const particles = particleArray[i].p;
    const material = particleArray[i].m;

    particles.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    particles.scale.set(0.1, 0.1, 0.1);
    material.opacity = 1;
    particles.visible = false;

    new TWEEN.Tween(particles.position)
      .to({ z: particles.position.z - 500 }, 1000)
      .easing(TWEEN.Easing.Linear.EaseNone)
      .start();
  }

  showResult(score);
}

function fire() {
  if (time < lastFireTime + 200) {
    return;
  }

  playSound(window.blasterSound, 0.03);

  lastFireTime = time;

  laserContainer.rotation.copy(xwing.rotation);
  laserContainer.rotation.y = Math.PI / 2;
  laserContainer.rotation.z -= sideWays.rotation;
  laserContainer.position.copy(xwing.position);

  if (!sideWays.state) {
    laser0Mesh.position.set(500, 45, -165);
    laser1Mesh.position.set(500, 45, 165);
    laser2Mesh.position.set(500, -42, -165);
    laser3Mesh.position.set(500, -42, 165);
  } else {
    laser0Mesh.position.set(500, -165, 45);
    laser1Mesh.position.set(500, 45, 45);
    laser2Mesh.position.set(500, -165, -42);
    laser3Mesh.position.set(500, 165, -42);
  }

  laser0Mesh.visible = true;
  laser1Mesh.visible = true;
  laser2Mesh.visible = true;
  laser3Mesh.visible = true;

  pointLight.position.z = -2000;
  pointLight.position.y = 0;

  const distance = 10000;
  const tweentime = 300;

  new TWEEN.Tween(laser0Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .start();

  new TWEEN.Tween(laser1Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .start();

  new TWEEN.Tween(laser2Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .start();

  new TWEEN.Tween(laser3Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .onComplete(removeLasers)
    .start();

  const toz = pointLight.position.z - distance * 2;
  new TWEEN.Tween(pointLight.position)
    .to({ z: toz }, tweentime * 2)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .onComplete(removeLight)
    .start();
}

function removeLasers() {
  if (time > lastFireTime + 299) {
    laser0Mesh.visible = false;
    laser1Mesh.visible = false;
    laser2Mesh.visible = false;
    laser3Mesh.visible = false;
  }
}

function removeLight() {
  if (time > lastFireTime + 599) {
    pointLight.position.y = 5000;
  }
}

function animate() {
  requestAnimationFrame(animate);
  loop();
}

function loop() {
  time = new Date().getTime();
  delta = time - oldTime;
  oldTime = time;

  if (isNaN(delta) || delta > 1000 || delta === 0) {
    delta = 1000 / 60;
  }

  if (started) {
    score += Math.round(delta / 2);
    speed = delta * speedMultiplier;

    if (speedMultiplier < 9) {
      speedMultiplier += 0.001;
    }

    // Camera shake on explosion
    if (time < shakeCameraTimer + 1500) {
      const expo = (shakeCameraTimer + 1500 - time) / 1500;
      camera.up.x = (Math.random() * 0.2 - 0.1) * expo;

      if (postprocessing) {
        effectFocus.uniforms.sampleDistance.value = 0.85 * expo;
        effectFocus.uniforms.waveFactor.value = 0.00225 * expo;
      }
    }

    run(delta);
  }

  // Update camera to always look forward down the trench
  camera.lookAt(0, 0, -1200);

  TWEEN.update();

  if (renderGl && hasGl) {
    webglRenderer.clear();
    if (postprocessing) {
      composer.render(delta);
    } else {
      webglRenderer.render(scene, camera);
    }
  }
}

document.addEventListener(
  'contextmenu',
  (event) => {
    event.preventDefault();
  },
  false
);
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);
document.addEventListener('touchstart', onTouchStart, false);
document.addEventListener('touchmove', onTouchMove, false);
document.addEventListener('touchend', onTouchEnd, false);
document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

init();
animate();
