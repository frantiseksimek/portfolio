// Interaktivní 3D náhled (three.js). Model se načte až když se prohlížeč přiblíží k obrazovce.
const THREE_V = "0.160.0";
const CDN = `https://cdn.jsdelivr.net/npm/three@${THREE_V}`;

document.querySelectorAll("[data-model]").forEach((el) => {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    init(el).catch((err) => {
      console.error(err);
      el.querySelector(".v-status").textContent = "Model se nepodařilo načíst.";
    });
  }, { rootMargin: "400px 0px" });
  io.observe(el);
});

async function init(el) {
  const status = el.querySelector(".v-status");
  const THREE = await import("three");
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");

  const stage = el.querySelector(".v-stage");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  scene.add(rim);

  const draco = new DRACOLoader().setDecoderPath(`${CDN}/examples/jsm/libs/draco/gltf/`);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const gltf = await new Promise((res, rej) =>
    loader.load(el.dataset.model, res, (p) => {
      if (p.total) status.textContent = `Načítám ${Math.round((p.loaded / p.total) * 100)} %`;
    }, rej)
  );

  const model = gltf.scene;
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.55, metalness: 0, side: THREE.DoubleSide });
  model.traverse((o) => { if (o.isMesh) { o.material = mat; o.castShadow = o.receiveShadow = true; } });

  // vycentrovat a usadit na zem
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center).add(new THREE.Vector3(0, size.y / 2, 0));
  scene.add(model);
  const R = size.length() / 2;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 20, R * 20), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  key.position.set(R * 2, R * 4, R * 2.5);
  key.shadow.camera.left = key.shadow.camera.bottom = -R * 2;
  key.shadow.camera.right = key.shadow.camera.top = R * 2;
  key.shadow.camera.near = R * 0.1; key.shadow.camera.far = R * 12;
  rim.position.set(-R * 3, R * 2, -R * 2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, size.y / 2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = R * 0.4;
  controls.maxDistance = R * 6;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;
  controls.enableZoom = false; // kolečko až po kliknutí, ať neblokuje scrollování stránky

  const home = () => {
    const k = Math.max(1, 1.5 / camera.aspect); // užší rám = kamera dál, ať se model vejde
    camera.position.set(R * 1.6 * k, R * 1.5 * k, R * 2.2 * k);
    controls.target.set(0, size.y / 2, 0);
    controls.update();
  };

  renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; controls.enableZoom = true; el.classList.add("active"); });
  el.addEventListener("pointerleave", () => { controls.enableZoom = false; el.classList.remove("active"); });
  renderer.domElement.addEventListener("dblclick", home);
  el.querySelector("[data-reset]").onclick = () => { home(); controls.autoRotate = true; };
  el.querySelector("[data-zoom-in]").onclick = () => zoom(0.8);
  el.querySelector("[data-zoom-out]").onclick = () => zoom(1.25);
  function zoom(f) {
    const d = camera.position.clone().sub(controls.target).multiplyScalar(f);
    const len = THREE.MathUtils.clamp(d.length(), controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(d.setLength(len));
  }

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  home();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  });

  status.textContent = "";
  el.classList.add("ready");
}
