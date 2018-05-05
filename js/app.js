let container;
let stats;

let camera;
let scene;
let webglRenderer;
let loader;

const render_gl = 1;
let has_gl = 0;

const r = 0;

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
let thrust0,
  thrust1,
  thrust2,
  thrust3;
let laserContainer;
let laser0Mesh,
  laser1Mesh,
  laser2Mesh,
  laser3Mesh;
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
let bgSprite;
let loadingSprite;
const initTime = new Date().getTime() + 500;
let score = 0;

let composer,
  effectFocus;

let touchDevice = false;
let sizeRatio = 1;
let postprocessing = true;


document.addEventListener('contextmenu', (event) => { event.preventDefault(); }, false);
document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);
document.addEventListener('touchstart', onTouchStart, false);
document.addEventListener('touchmove', onTouchMove, false);
document.addEventListener('touchend', onTouchEnd, false);
document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

init(), animate();


function init() {
  container = document.createElement('div');
  container.id = 'container';
  document.body.appendChild(container);

  touchDevice = ('ontouchstart' in document.getElementById('container')) || (navigator.userAgent.match(/ipad|iphone|android/i) != null);
  if (touchDevice) sizeRatio = 3;
  if (touchDevice) postprocessing = false;

  const aspect = window.innerWidth / window.innerHeight;

  camera = new THREE.Camera(50, aspect, 1, 100000);
  camera.position.y = -60;
  camera.target.position.z = -1200;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 20000, 25000);

  // Loading
  const bgImage = THREE.ImageUtils.loadTexture('img/black.png');

  bgSprite = new THREE.Sprite({ map: bgImage, useScreenCoordinates: true });
  bgSprite.position.set(window.innerWidth >> 1, window.innerHeight >> 1, 0);
  bgSprite.scale.set(1000, 1000);
  scene.addChild(bgSprite);

  const loadingImage = THREE.ImageUtils.loadTexture('img/loading.png');

  loadingSprite = new THREE.Sprite({ map: loadingImage, useScreenCoordinates: true });
  loadingSprite.position.set(window.innerWidth >> 1, (window.innerHeight >> 1) - 20, 1);
  scene.addChild(loadingSprite);

  // Lights
  const ambient = new THREE.AmbientLight(0x111111);
  scene.addLight(ambient);

  const light = new THREE.SpotLight(0x999999, 0.7, 0);
  light.position.set(-100, 1000, 1000);
  light.target.position.set(0, 0, -1000);
  light.castShadow = true;
  scene.addLight(light);

  pointLight = new THREE.PointLight(0xf43b3c, 0.4, 5000);
  pointLight.position.set(0, -5000, -5000);
  scene.addLight(pointLight);

  // Models
  loader = new THREE.JSONLoader();
  loader.load({ model: './models/trench.js', callback: trenchLoaded });

  // Lasers
  laserContainer = new THREE.Object3D();
  laserContainer.scale.set(0.8, 0.8, 0.8);
  scene.addChild(laserContainer);

  const laser = new THREE.CubeGeometry(6, 800, 6);

  var material = new THREE.MeshBasicMaterial({ color: 0xf43b3c, opacity: 0.5 });

  laser0Mesh = new THREE.Mesh(laser, material);
  laser0Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.addChild(laser0Mesh);

  laser1Mesh = new THREE.Mesh(laser, material);
  laser1Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.addChild(laser1Mesh);

  laser2Mesh = new THREE.Mesh(laser, material);
  laser2Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.addChild(laser2Mesh);

  laser3Mesh = new THREE.Mesh(laser, material);
  laser3Mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  laserContainer.addChild(laser3Mesh);

  laser0Mesh.visible = false;
  laser1Mesh.visible = false;
  laser2Mesh.visible = false;
  laser3Mesh.visible = false;

  // Particles (stars)
  const geometry = new THREE.Geometry();

  for (i = 0; i < 1000; i++) {
    const vector = new THREE.Vector3((Math.random() * 10000) - 5000, (Math.random() * 400) - 400, (Math.random() * 20000) - 10000);
    geometry.vertices.push(new THREE.Vertex(vector));
  }

  const particleImage = THREE.ImageUtils.loadTexture('img/star.png');
  const particleMaterial = new THREE.ParticleBasicMaterial({
    size: 48, map: particleImage, opacity: 1.0, transparent: false, depthTest: true, blending: THREE.NormalBlending
  });

  particles = new THREE.ParticleSystem(geometry, particleMaterial);

  particles.position.z = -12000;
  particles.position.y = 2000;

  scene.addChild(particles);

  // obstacle types
  // horizontal wall, vertical wall, 1/4 passage down
  const numArray = [4, 3, 1, 1];

  // Obstacles
  for (var i = 0; i < 4; ++i) {
    var material = new THREE.MeshPhongMaterial({
      color: 0x111111, ambient: 0x222222, specular: 0x000000, shininess: 100, shading: THREE.SmoothShading
    });
    if (i == 0) {
      var box = new THREE.CubeGeometry(1200, 300, 220);
      // extras
      var inbox = new THREE.CubeGeometry(260, 260, 260);
      for (var j = 0; j < 12; ++j) {
        var inmesh = new THREE.Mesh(inbox, material);
        inmesh.position.set((Math.random() * 1200) - 600, (Math.random() * 100) - 50, (Math.random() * 100) - 50);
        inmesh.rotation.x = (Math.random() * 0.4) - 0.2;
        THREE.GeometryUtils.merge(box, inmesh);
      }
      box.computeFaceNormals();
    } else if (i == 1) {
      var box = new THREE.CubeGeometry(450, 1200, 220);
      // extras
      var inbox = new THREE.CubeGeometry(260, 260, 260);
      for (var j = 0; j < 12; ++j) {
        var inmesh = new THREE.Mesh(inbox, material);
        inmesh.position.set((Math.random() * 260) - 130, (Math.random() * 1000) - 500, (Math.random() * 100) - 50);
        inmesh.rotation.x = (Math.random() * 0.4) - 0.2;
        THREE.GeometryUtils.merge(box, inmesh);
      }
      box.computeFaceNormals();
    } else if (i == 2 || i == 3) {
      var box = new THREE.CubeGeometry(1200, 800, 220);
      const extrabox = new THREE.CubeGeometry(600, 600, 220);
      const extramesh = new THREE.Mesh(extrabox, material);
      if (i == 2) {
        extramesh.position.set(300, -400, 0);
      } else {
        extramesh.position.set(300, 400, 0);
      }
      THREE.GeometryUtils.merge(box, extramesh);
      // extras
      var inbox = new THREE.CubeGeometry(260, 260, 260);
      for (var j = 0; j < 20; ++j) {
        var inmesh = new THREE.Mesh(inbox, material);
        inmesh.position.set((Math.random() * 1000) - 500, (Math.random() * 600) - 300, (Math.random() * 100) - 50);
        inmesh.rotation.x = (Math.random() * 0.4) - 0.2;
        THREE.GeometryUtils.merge(box, inmesh);
      }
      for (var j = 0; j < 8; ++j) {
        var inmesh = new THREE.Mesh(inbox, material);
        if (i == 2) {
          inmesh.position.set(((Math.random() * 300) - 150) + 300, ((Math.random() * 300) - 150) - 400, (Math.random() * 100) - 50);
        } else {
          inmesh.position.set(((Math.random() * 300) - 150) + 300, ((Math.random() * 300) - 150) + 400, (Math.random() * 100) - 50);
        }
        inmesh.rotation.x = (Math.random() * 0.4) - 0.2;
        THREE.GeometryUtils.merge(box, inmesh);
      }

      box.computeFaceNormals();
    }

    for (var j = 0; j < numArray[i]; ++j) {
      const mesh = new THREE.Mesh(box, material);
      if (i == 0) {
        mesh.position.y = (Math.random() * 900) - 400;
      } else if (i == 1) {
        mesh.position.x = (Math.random() * 1200) - 600;
      } else if (i == 2) {
        mesh.position.y = 200;
      } else if (i == 3) {
        mesh.position.y = -200;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.visible = false;
      scene.addChild(mesh);
      const o = { mesh, material, type: i };
      obstaclePool.push(o);
    }
  }

  spawnNewObstacle();

  showInstruction(false);

  try {
    webglRenderer = new THREE.WebGLRenderer({
      scene, clearColor: 0x000000, clearAlpha: 0.99, antialias: false
    });
    webglRenderer.setSize(window.innerWidth / sizeRatio, window.innerHeight / sizeRatio);

    webglRenderer.autoClear = false;

    webglRenderer.shadowMapBias = 0.0039;
    webglRenderer.shadowMapDarkness = 0.5;
    webglRenderer.shadowMapWidth = 1024 / (sizeRatio * 2);
    webglRenderer.shadowMapHeight = 1024 / (sizeRatio * 2);

    webglRenderer.shadowMapEnabled = true;
    webglRenderer.shadowMapSoft = true;

    webglRenderer.shadowCameraNear = 1;
    webglRenderer.shadowCameraFar = 100000;
    webglRenderer.shadowCameraFov = 50;

    container.appendChild(webglRenderer.domElement);
    has_gl = 1;
    THREEx.WindowResize(webglRenderer, camera);

    webglRenderer.domElement.style.position = 'absolute';
    webglRenderer.domElement.style.top = '0px';
    webglRenderer.domElement.style.left = '0px';

    if (sizeRatio > 1) {
      webglRenderer.domElement.style.webkitTransform = `scale3d(${sizeRatio}, ${sizeRatio}, 1)`;
      webglRenderer.domElement.style.webkitTransformOrigin = '0 0 0';
    }
  } catch (e) {
    // need webgl
    document.getElementById('info').innerHTML = "<P><BR><B>Note.<\/B> You need a modern browser that supports WebGL for this to run the way it is intended.<BR>For example. <a href='http://www.google.com/landing/chrome/beta/' target='_blank'>Google Chrome 9+<\/a> or <a href='http://www.mozilla.com/firefox/beta/' target='_blank'>Firefox 4+<\/a>.<BR><BR>If you are already using one of those browsers and still see this message, it's possible that you<BR>have old blacklisted GPU drivers. Try updating the drivers for your graphic card.<BR>Or try to set a '--ignore-gpu-blacklist' switch for the browser.<\/P><CENTER><BR><img src='../general/WebGL_logo.png' border='0'><\/CENTER>";
    document.getElementById('info').style.display = 'block';
    return;
  }

  if (postprocessing) {
    // postprocessing
    const renderModel = new THREE.RenderPass(scene, camera);
    const effectBloom = new THREE.BloomPass(0.75);

    const effectVignette = new THREE.ShaderPass(THREE.ShaderExtras.vignette);
    effectVignette.uniforms.tDiffuse.texture = THREE.ImageUtils.loadTexture('img/Vignette_alpha.png');

    effectFocus = new THREE.ShaderPass(THREE.ShaderExtras.focus);

    effectFocus.uniforms.screenWidth.value = window.innerWidth / sizeRatio;
    effectFocus.uniforms.screenHeight.value = window.innerHeight / sizeRatio;
    effectFocus.uniforms.sampleDistance.value = 0;
    effectFocus.uniforms.waveFactor.value = 0;

    effectFocus.renderToScreen = true;

    composer = new THREE.EffectComposer(webglRenderer);

    composer.addPass(renderModel);
    composer.addPass(effectBloom);
    composer.addPass(effectVignette);
    composer.addPass(effectFocus);
    //
  }
}

// fullscreen test
function toggleFullscreen() {
  if (!inFullscreen) {
    try {
      if (container.webkitRequestFullScreen) {
        container.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else {
        container.mozRequestFullScreen();
      }
      inFullscreen = true;
    } catch (e) {
      // not avalaiable
    }
  } else {
    if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else {
      document.mozCancelFullScreen();
    }
    inFullscreen = false;
  }
}

function loadingComplete() {
  allLoaded = true;
  scene.removeChild(loadingSprite);
  loadingSprite = undefined;
  showInstruction(true);
}

function startGame() {
  started = true;
  hideInstruction();

  const alphaTween = new TWEEN.Tween(bgSprite)
    .to({ opacity: 0 }, 2000)
    .easing(TWEEN.Easing.Sinusoidal.EaseOut)
    .onComplete(removeBg);
  alphaTween.start();
}

function removeBg() {
  scene.removeChild(bgSprite);
  bgSprite = undefined;
}

function addParticles() {
  // Particles (explosion)
  const geometry = new THREE.Geometry();

  for (i = 0; i < 500; i++) {
    const radius = Math.random() * 50;
    const vector = getRandomPointOnSphere(radius);
    geometry.vertices.push(new THREE.Vertex(vector));
  }

  const particleImage = THREE.ImageUtils.loadTexture('img/fraction1.png');
  const colorArray = [0xffffff, 0xfabe82, 0xe03809, 0xee9c64, 0x910300];
  const sizeArray = [48, 48, 48, 48, 64];

  for (var i = 0; i < 15; ++i) {
    const color = colorArray[i % colorArray.length];
    const size = sizeArray[i % sizeArray.length];

    const particleMaterial = new THREE.ParticleBasicMaterial({
      color, size, map: particleImage, opacity: 1.0, transparent: true, depthTest: false, blending: THREE.AdditiveBlending
    });
    particles = new THREE.ParticleSystem(geometry, particleMaterial);

    particles.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    particles.position.z = -500 + i;
    particles.scale.set(0.1, 0.1, 0.1);
    particles.visible = false;

    scene.addChild(particles);
    const o = { p: particles, m: particleMaterial };
    particleArray.push(o);
  }
}

function trenchLoaded(geometry) {
  const material = new THREE.MeshPhongMaterial({
    color: 0x111111, ambient: 0x222222, specular: 0x000000, shininess: 100, shading: THREE.SmoothShading
  });

  for (let i = 0; i < numOfTrench; ++i) {
    const mesh = new THREE.Mesh(geometry, material);

    const scale = 200;
    mesh.scale.set(scale, scale * 1.6, scale * 1.6);
    mesh.position.set(0, 0, (-i * trenchLength) - (trenchLength / 2));
    mesh.rotation.set(0, Math.PI / 2, 0);

    mesh.castShadow = false;
    mesh.receiveShadow = true;

    scene.addChild(mesh);
    trenchArray.push(mesh);
  }

  loader.load({ model: './models/xwing.js', callback: xwingLoaded });
}

function xwingLoaded(geometry) {
  const material = new THREE.MeshFaceMaterial();

  xwing = new THREE.Object3D();

  ship = new THREE.Mesh(geometry, material);

  var scale = 0.8;
  ship.scale.set(scale, scale, scale);
  xwing.position.set(0, 0, -700);
  ship.rotation.set(0, Math.PI / 2, 0);

  ship.castShadow = true;
  ship.receiveShadow = false;

  xwing.addChild(ship);
  scene.addChild(xwing);

  // thrust
  const thrustImage = THREE.ImageUtils.loadTexture('img/thrust.png');
  var scale = 0.25;

  thrust0 = new THREE.Sprite({ map: thrustImage, useScreenCoordinates: false });
  thrust0.position.set(-175, 25, -42);
  thrust0.scale.set(scale, scale, scale);
  thrust0.blending = THREE.AdditiveBlending;
  ship.addChild(thrust0);

  thrust1 = new THREE.Sprite({ map: thrustImage, useScreenCoordinates: false });
  thrust1.position.set(-175, 25, 42);
  thrust1.scale.set(scale, scale, scale);
  thrust1.blending = THREE.AdditiveBlending;
  ship.addChild(thrust1);

  thrust2 = new THREE.Sprite({ map: thrustImage, useScreenCoordinates: false });
  thrust2.position.set(-175, -23, -42);
  thrust2.scale.set(scale, scale, scale);
  thrust2.blending = THREE.AdditiveBlending;
  ship.addChild(thrust2);

  thrust3 = new THREE.Sprite({ map: thrustImage, useScreenCoordinates: false });
  thrust3.position.set(-175, -23, 42);
  thrust3.scale.set(scale, scale, scale);
  thrust3.blending = THREE.AdditiveBlending;
  ship.addChild(thrust3);

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

function showInstruction(loadingComplete) {
  const instructionbox = document.getElementById('instructionbox');
  if (loadingComplete) {
    instructionbox.innerHTML = "<img src='img/click.png'>";
  }
  instructionbox.innerHTML += "<BR><BR><img src='img/instructions.png'>";
  instructionbox.style.display = 'block';
  instructionbox.style.marginLeft = `-${parseInt(instructionbox.offsetWidth / 2)}px`;
  instructionbox.style.marginTop = `-${parseInt(instructionbox.offsetHeight / 2)}px`;
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
    // reset
    score = 0;
    speedMultiplier = 4;
    return;
  }

  // doubletap?
  if (time < lastTap + 400) {
    changeRotation();
  }

  lastTap = time;
}

function onTouchMove(event) {
  event.preventDefault();

  const windowHalfX = window.innerWidth >> 1;
  const windowHalfY = window.innerHeight >> 1;

  mouseX = (event.touches[0].clientX - windowHalfX);
  mouseY = (event.touches[0].clientY - windowHalfY);

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

  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);

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
    // reset
    score = 0;
    speedMultiplier = 4;
    return;
  }

  if (event.button == 2) {
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
  if (event.keyCode == 70) {
    toggleFullscreen();
  }

  if (allLoaded && !started) {
    startGame();
    return;
  }

  const resultbox = document.getElementById('resultbox');
  if (isDead && resultbox.style.display === 'block') {
    hideResult();
    // reset
    score = 0;
    speedMultiplier = 4;
    return;
  }

  switch (event.keyCode) {
    case 37: leftIsDown = true; break;
    case 38: upIsDown = true; break;
    case 39: rightIsDown = true; break;
    case 40: downIsDown = true; break;
    case 17: ctrlIsDown = true; break;
    case 32: changeRotation(); break;
  }
}

function onDocumentKeyUp(event) {
  switch (event.keyCode) {
    case 37: leftIsDown = false; break;
    case 38: upIsDown = false; break;
    case 39: rightIsDown = false; break;
    case 40: downIsDown = false; break;
    case 17: ctrlIsDown = false; break;
  }
}

function changeRotation() {
  if (!sideWays.state) {
    sideWays.state = true;

    let direction = Math.PI / 2;
    if (xwing.rotation.z < 0) {
      direction *= -1;
    }

    var rotatetween = new TWEEN.Tween(sideWays)
      .to({ rotation: direction }, 800)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    rotatetween.start();
  } else {
    sideWays.state = false;

    var rotatetween = new TWEEN.Tween(sideWays)
      .to({ rotation: 0 }, 800)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    rotatetween.start();
  }
}

function getRandomPointOnSphere(r) {
  const angle = Math.random() * Math.PI * 2;
  const u = Math.random() * 2 - 1;

  const v = new THREE.Vector3(
    Math.cos(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
    Math.sin(angle) * Math.sqrt(1 - Math.pow(u, 2)) * r,
    u * r
  );
  return v;
}

function spawnNewObstacle() {
  if (obstaclePool.length == 0) {
    console.log('no objects in pool');
    return;
  }
  const rnd = Math.floor(Math.random() * obstaclePool.length);
  const o = obstaclePool.slice(rnd, rnd + 1);
  const spliced = obstaclePool.splice(rnd, 1);

  obstacleArray.push(o[0]);

  const mesh = o[0].mesh;
  const type = o[0].type;

  // add mesh
  mesh.position.z = (-(numOfTrench - 1) * trenchLength) - (trenchLength / 2);
  if (type == 0) {
    mesh.position.y = (Math.random() * 900) - 400;
  } else if (type == 1) {
    mesh.position.x = (Math.random() * 1200) - 600;
  } else if (type == 2 || type == 3) {
    // random flip
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

  // trenches
  for (var i = 0; i < trenchArray.length; ++i) {
    var mesh = trenchArray[i];
    mesh.position.z += speed;

    if (mesh.position.z > camera.position.z + trenchLength / 2) {
      mesh.position.z -= ((numOfTrench) * trenchLength);

      if (obstacleArray.length < 4) {
        spawnNewObstacle();
      }
    }
  }

  // obstacles
  for (var i = 0; i < obstacleArray.length; ++i) {
    const type = obstacleArray[i].type;
    var mesh = obstacleArray[i].mesh;
    mesh.position.z += speed;

    // respawn / remove
    if (mesh.position.z > camera.position.z + trenchLength / 2) {
      mesh.visible = false;
      const shifted = obstacleArray.shift();
      obstaclePool.push(shifted);
      spawnNewObstacle();
    }

    // collision
    if (xwing && time > deadTimer + 2000) {
      const difz = xwing.position.z - mesh.position.z;

      if (difz < 170 && difz > -170) {
        var dify = xwing.position.y - mesh.position.y;
        var difx = xwing.position.x - mesh.position.x;

        if (type == 0) {
          // horizontal bar
          if (!sideWays.state && dify < 210 && dify > -210) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state && dify < 370 && dify > -370) {
            explode();
            isDead = true;
            return;
          }
        }

        if (type == 1) {
          // vertical bar
          if (!sideWays.state && difx < 370 && difx > -370) {
            explode();
            isDead = true;
            return;
          }
          if (sideWays.state && difx < 210 && difx > -210) {
            explode();
            isDead = true;
            return;
          }
        }

        if (type == 2) {
          // 1/4 hole down
          if (!sideWays.state && mesh.rotation.y == 0 && (xwing.position.y > -240 || xwing.position.x > -210)) {
            explode();
            isDead = true;
            return;
          }
          if (!sideWays.state && mesh.rotation.y == Math.PI && (xwing.position.y > -240 || xwing.position.x < 210)) {
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

        if (type == 3) {
          // 1/4 hole up
          if (!sideWays.state && mesh.rotation.y == 0 && (xwing.position.y < 220 || xwing.position.x > -210)) {
            explode();
            isDead = true;
            return;
          }
          if (!sideWays.state && mesh.rotation.y == Math.PI && (xwing.position.y < 220 || xwing.position.x < 210)) {
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

  // key control
  if (leftIsDown) mouseXpercent -= 0.003 * delta;
  if (rightIsDown) mouseXpercent += 0.003 * delta;
  if (upIsDown) mouseYpercent -= 0.0025 * delta;
  if (downIsDown) mouseYpercent += 0.0025 * delta;

  if (mouseXpercent < -1) mouseXpercent = -1;
  if (mouseXpercent > 1) mouseXpercent = 1;
  if (mouseYpercent < -1) mouseYpercent = -1;
  if (mouseYpercent > 1) mouseYpercent = 1;


  // xwing
  if (!xwing) {
    return;
  }

  const optimalDivider = delta / 16;

  const smoothing = Math.max(8, (12 / optimalDivider));

  var tox = mouseXpercent * 380;
  var toy = -(mouseYpercent * 350) + 30;

  if (sideWays.state) {
    tox = mouseXpercent * 480;
    toy = -(mouseYpercent * 250) + 30;
  }

  var difx = (tox - xwing.position.x) / smoothing;
  var dify = (toy - xwing.position.y) / smoothing;

  xwing.position.x += difx;
  xwing.position.y += dify;

  difx = Math.min(difx, 10);
  difx = Math.max(difx, -10);
  dify = Math.min(dify, 10);
  dify = Math.max(dify, -10);

  xwing.rotation.x = dify / 40;
  xwing.rotation.y = -(difx / 40);

  xwing.rotation.z = -(difx / 40);

  xwing.rotation.z += sideWays.rotation;

  // thrust
  let opacity = (Math.abs(difx) + Math.abs(dify)) / 8;
  opacity = Math.min(opacity, 1);
  opacity = Math.max(opacity, 0.3);

  const noise = Math.random() * 0.5;
  opacity += noise;

  if (!ship.visible) {
    opacity = 0;
  }

  thrust0.opacity = opacity;
  thrust1.opacity = opacity;
  thrust2.opacity = opacity;
  thrust3.opacity = opacity;

  // blink
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

  // lasers
  if ((mouseDown || ctrlIsDown) && time > deadTimer + 1500) {
    fire();
  }

  // camera
  var tox = xwing.position.x;
  var toy = xwing.position.y + 50;

  var difx = (tox - camera.position.x) / (smoothing * 2);

  camera.position.x += difx;
  camera.position.y += (toy - camera.position.y) / (smoothing * 2);

  camera.up.x = -(difx / 100);
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

    const scaletween = new TWEEN.Tween(particles.scale)
      .to({ x: outscale, y: outscale, z: outscale }, 1500)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    scaletween.start();

    const alphatween = new TWEEN.Tween(material)
      .to({ opacity: 0 }, 1500)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    alphatween.start();

    const rotatetween = new TWEEN.Tween(particles.rotation)
      .to({ x: particles.rotation.x + 0.75, y: particles.rotation.y + 0.75, z: particles.rotation.z + 0.75 }, 1700)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    rotatetween.start();

    const positiontween = new TWEEN.Tween(particles.position)
      .to({ x: camera.position.x, y: camera.position.y + 30, z: particles.position.z + 500 }, 2500)
      .easing(TWEEN.Easing.Exponential.EaseOut);
    positiontween.start();
  }

  const delaytween = new TWEEN.Tween(camera.up)
    .to({ x: 0 }, 1000)
    .easing(TWEEN.Easing.Exponential.EaseOut)
    .delay(1500)
    .onComplete(explodeDone);
  delaytween.start();

  shakeCameraTimer = time;

  ship.visible = false;
  thrust0.opacity = 0;
  thrust1.opacity = 0;
  thrust2.opacity = 0;
  thrust3.opacity = 0;
}

function explodeDone() {
  for (let i = 0; i < particleArray.length; ++i) {
    const particles = particleArray[i].p;
    const material = particleArray[i].m;

    particles.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    particles.scale.set(0.1, 0.1, 0.1);
    material.opacity = 1;
    particles.visible = false;

    const positiontween = new TWEEN.Tween(particles.position)
      .to({ z: particles.position.z - 500 }, 1000)
      .easing(TWEEN.Easing.Linear.EaseNone);
    positiontween.start();
  }

  showResult(score);
}

function fire() {
  if (time < (lastFireTime + 200)) {
    return;
  }

  playSound(blasterSound, 0.03);

  lastFireTime = time;

  laserContainer.rotation = xwing.rotation.clone();
  laserContainer.rotation.y = Math.PI / 2;

  laserContainer.rotation.z -= sideWays.rotation;

  laserContainer.position = xwing.position.clone();

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

  const tween0 = new TWEEN.Tween(laser0Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone);
  tween0.start();

  const tween1 = new TWEEN.Tween(laser1Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone);
  tween1.start();

  const tween2 = new TWEEN.Tween(laser2Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone);
  tween2.start();

  const tween3 = new TWEEN.Tween(laser3Mesh.position)
    .to({ x: distance }, tweentime)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .onComplete(removeLasers);
  tween3.start();

  const toz = pointLight.position.z - (distance * 2);
  const tweenLight = new TWEEN.Tween(pointLight.position)
    .to({ z: toz }, tweentime * 2)
    .easing(TWEEN.Easing.Linear.EaseNone)
    .onComplete(removeLight);
  tweenLight.start();
}

function removeLasers() {
  if (time > (lastFireTime + 299)) {
    laser0Mesh.visible = false;
    laser1Mesh.visible = false;
    laser2Mesh.visible = false;
    laser3Mesh.visible = false;
  }
}

function removeLight() {
  if (time > (lastFireTime + 599)) {
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

  if (isNaN(delta) || delta > 1000 || delta == 0) {
    delta = 1000 / 60;
  }

  if (started) {
    score += Math.round(delta / 2);

    speed = delta * speedMultiplier;

    if (speedMultiplier < 9) {
      speedMultiplier += 0.001;
    }

    // shake camera
    if (time < shakeCameraTimer + 1500) {
      const expo = ((shakeCameraTimer + 1500) - time) / 1500;
      camera.up.x = ((Math.random() * 0.2) - 0.1) * expo;

      if (postprocessing) {
        effectFocus.uniforms.sampleDistance.value = 0.85 * expo;
        effectFocus.uniforms.waveFactor.value = 0.00225 * expo;
      }
    }

    run(delta);
  } else if (loadingSprite) {
    loadingSprite.position.set(window.innerWidth / sizeRatio >> 1, (window.innerHeight / sizeRatio >> 1) - 20, 0);
    loadingSprite.rotation -= 0.08;
  }

  if (bgSprite) {
    bgSprite.position.set(window.innerWidth / sizeRatio >> 1, window.innerHeight / sizeRatio >> 1, 0);
  }

  TWEEN.update();

  if (render_gl && has_gl) {
    webglRenderer.clear();
    if (postprocessing) {
      composer.render(delta);
    } else {
      webglRenderer.render(scene, camera);
    }
  }
}

