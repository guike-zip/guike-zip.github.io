import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.164.1/three.module.min.js';

/* ---------------------------------------------------------------- 3D hero */
(function initScene() {
  const container = document.getElementById('bg-canvas');
  if (!container) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 13;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const coreGroup = new THREE.Group();
  // Off-center and small on wide screens so it doesn't fight the headline;
  // pushed low and dim on mobile, where there is no room beside the text.
  const isNarrow = window.innerWidth < 900;
  coreGroup.position.set(isNarrow ? 0 : 3.6, isNarrow ? -5.5 : 0.4, isNarrow ? -4 : -2);
  scene.add(coreGroup);

  const coreScale = isNarrow ? 0.85 : 1;
  const baseOpacity = isNarrow ? 0.16 : 0.3;
  const baseOpacity2 = isNarrow ? 0.08 : 0.14;

  // Central wireframe icosahedron — "the build"
  const coreGeo = new THREE.IcosahedronGeometry(1.9 * coreScale, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cff,
    wireframe: true,
    transparent: true,
    opacity: baseOpacity,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(core);

  const coreGeo2 = new THREE.IcosahedronGeometry(1.9 * coreScale, 0);
  const coreMat2 = new THREE.MeshBasicMaterial({
    color: 0x00e0c6,
    wireframe: true,
    transparent: true,
    opacity: baseOpacity2,
  });
  const core2 = new THREE.Mesh(coreGeo2, coreMat2);
  core2.scale.setScalar(1.35);
  coreGroup.add(core2);

  // Particle field — "the network"
  const PARTICLES = window.innerWidth < 720 ? 420 : 900;
  const positions = new Float32Array(PARTICLES * 3);
  const speeds = new Float32Array(PARTICLES);
  for (let i = 0; i < PARTICLES; i++) {
    const radius = 5 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi) - 4;
    speeds[i] = 0.2 + Math.random() * 0.6;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.03,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let lastScrollY = window.scrollY;
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const scrollFrac = Math.min(window.scrollY / (window.innerHeight * 1.2), 1);

    if (!prefersReduced) {
      core.rotation.y = t * 0.12;
      core.rotation.x = t * 0.06;
      core2.rotation.y = -t * 0.08;
      core2.rotation.x = t * 0.05;
      particles.rotation.y = t * 0.015;
    }

    targetRotY += (mouseX * 0.25 - targetRotY) * 0.04;
    targetRotX += (mouseY * 0.15 - targetRotX) * 0.04;
    coreGroup.rotation.y = targetRotY;
    coreGroup.rotation.x = targetRotX;

    camera.position.z = 13 + scrollFrac * 4;
    const opacityFade = Math.max(0, 1 - scrollFrac * 1.6);
    coreMat.opacity = baseOpacity * opacityFade;
    coreMat2.opacity = baseOpacity2 * opacityFade;
    particleMat.opacity = 0.4 * Math.max(0.15, opacityFade);

    renderer.render(scene, camera);
  }
  animate();
})();

/* ---------------------------------------------------------------- nav */
(function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 12);
  }, { passive: true });

  toggle?.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
})();

/* ---------------------------------------------------------------- reveal on scroll */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => io.observe(el));
})();
