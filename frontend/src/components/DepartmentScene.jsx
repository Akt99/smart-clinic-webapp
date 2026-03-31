import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import brainModelUrl from "../assets/Brain.glb?url";
import skeletalHandModelUrl from "../assets/Skeletal Hand.glb?url";
import womanModelUrl from "../assets/Woman.glb?url";
import eyeModelUrl from "../assets/stylized_eye.glb?url";

const CONFIG = {
  psychiatry: {
    geometry: "brain",
    color: "#ff7f50",
    modelUrl: brainModelUrl,
    modelScale: 2.9,
    yOffset: -0.02,
    rotation: { x: 0, y: -0.2, z: 0 },
  },
  gynaecology: {
    geometry: "woman",
    color: "#f4a261",
    modelUrl: womanModelUrl,
    modelScale: 2.25,
    yOffset: -0.7,
    rotation: { x: 0, y: -0.35, z: 0 },
  },
  orthopaedics: {
    geometry: "capsule",
    color: "#2a9d8f",
    modelUrl: skeletalHandModelUrl,
    modelScale: 2.2,
    yOffset: 0,
    rotation: { x: 0, y: -0.2, z: 0 },
  },
  ophthalmology: {
    geometry: "eye",
    color: "#457b9d",
    modelUrl: eyeModelUrl,
    modelScale: 2.2,
    yOffset: 0,
    rotation: { x: 0, y: 0, z: 0 },
  },
};

function createBrain(material) {
  const group = new THREE.Group();
  const lobeGeometry = new THREE.SphereGeometry(0.42, 28, 28);

  const positions = [
    [-0.48, 0.28, 0.08],
    [-0.44, -0.12, 0.1],
    [-0.08, 0.4, 0.06],
    [-0.02, 0.02, 0.12],
    [0.08, 0.4, 0.06],
    [0.02, 0.02, 0.12],
    [0.48, 0.28, 0.08],
    [0.44, -0.12, 0.1],
  ];

  positions.forEach(([x, y, z], index) => {
    const lobe = new THREE.Mesh(lobeGeometry, material.clone());
    lobe.position.set(x, y, z);
    lobe.scale.set(1, index % 2 === 0 ? 1.05 : 0.92, 0.9);
    group.add(lobe);
  });

  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, 0.32, 4, 8),
    material.clone(),
  );
  stem.position.set(0, -0.7, -0.02);
  stem.rotation.z = Math.PI / 14;
  group.add(stem);

  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.02, 8, 28, Math.PI),
    new THREE.MeshStandardMaterial({
      color: "#ffb199",
      metalness: 0.12,
      roughness: 0.55,
    }),
  );
  seam.rotation.z = Math.PI / 2;
  seam.position.set(0, 0.12, 0.48);
  group.add(seam);

  return group;
}

function createOrthopaedicJoint(material) {
  const group = new THREE.Group();

  const upperBone = new THREE.Bone();
  const jointBone = new THREE.Bone();
  const lowerBone = new THREE.Bone();

  upperBone.position.set(0, 0.78, 0);
  jointBone.position.set(0, -0.78, 0);
  lowerBone.position.set(0, -0.78, 0);
  jointBone.rotation.z = Math.PI / 5;

  upperBone.add(jointBone);
  jointBone.add(lowerBone);
  group.add(upperBone);

  const helper = new THREE.SkeletonHelper(upperBone);
  helper.material.linewidth = 3;
  helper.material.transparent = true;
  helper.material.opacity = 0.9;
  helper.material.color = new THREE.Color("#d7f7f1");
  group.add(helper);

  const shaftGeometry = new THREE.CapsuleGeometry(0.16, 0.92, 6, 12);
  const boneMaterial = material.clone();
  boneMaterial.color = new THREE.Color("#d8fff7");
  boneMaterial.roughness = 0.38;

  const upperMesh = new THREE.Mesh(shaftGeometry, boneMaterial);
  upperMesh.position.set(0, 0.46, 0);
  group.add(upperMesh);

  const lowerMesh = new THREE.Mesh(shaftGeometry, boneMaterial.clone());
  lowerMesh.position.set(0.38, -0.52, 0);
  lowerMesh.rotation.z = Math.PI / 5;
  group.add(lowerMesh);

  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 28, 28),
    new THREE.MeshStandardMaterial({
      color: "#9be7d5",
      metalness: 0.18,
      roughness: 0.26,
      emissive: "#2a9d8f",
      emissiveIntensity: 0.18,
    }),
  );
  joint.position.set(0.12, -0.02, 0.02);
  joint.scale.set(1.1, 0.92, 1);
  group.add(joint);

  return group;
}

function createOvum(material) {
  const group = new THREE.Group();

  const ovum = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 32, 32),
    new THREE.MeshStandardMaterial({
      color: "#f7a8b8",
      metalness: 0.08,
      roughness: 0.32,
      transparent: true,
      opacity: 0.96,
    }),
  );
  ovum.scale.set(1.04, 0.98, 1);

  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 32, 32),
    new THREE.MeshStandardMaterial({
      color: "#d64550",
      metalness: 0.12,
      roughness: 0.34,
      emissive: "#b91c1c",
      emissiveIntensity: 0.14,
    }),
  );
  nucleus.position.set(0.12, -0.04, 0.26);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.04, 16, 60),
    material.clone(),
  );
  halo.rotation.x = Math.PI / 2.8;
  halo.scale.set(1, 1.06, 1);

  group.add(ovum);
  group.add(nucleus);
  group.add(halo);
  return group;
}

function createMesh(type, material) {
  if (type === "brain") {
    return createBrain(material);
  }

  if (type === "ovum") {
    return createOvum(material);
  }

  if (type === "torus") {
    return new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.22, 100, 16), material);
  }

  if (type === "capsule" && THREE.CapsuleGeometry) {
    return createOrthopaedicJoint(material);
  }

  if (type === "eye") {
    const group = new THREE.Group();
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 32), material);
    iris.scale.set(1.35, 0.9, 0.7);
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 20),
      new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.4 }),
    );
    pupil.position.z = 0.5;
    group.add(iris);
    group.add(pupil);
    return group;
  }

  return new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), material);
}

function fitObjectToScene(object, targetSize = 2.25) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxAxis;

  object.scale.setScalar(scale);
  object.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(object);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  object.position.sub(scaledCenter);
}

export default function DepartmentScene({ slug }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(180, 180);
    mountNode.appendChild(renderer.domElement);

    const pointLight = new THREE.PointLight("#ffffff", 2.5, 20);
    pointLight.position.set(2, 2, 4);
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.1);
    scene.add(pointLight, ambientLight);

    const config = CONFIG[slug] || CONFIG.psychiatry;
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: 0.2,
      roughness: 0.3,
    });
    let mesh = createMesh(config.geometry, material);
    let rotatingObject = mesh;
    scene.add(mesh);
    let disposed = false;

    if (config.modelUrl) {
      const pivot = new THREE.Group();
      pivot.position.y = config.yOffset || 0;
      scene.remove(mesh);
      scene.add(pivot);
      rotatingObject = pivot;
      pivot.add(mesh);

      const loader = new GLTFLoader();
      loader.load(
        config.modelUrl,
        (gltf) => {
          if (disposed) {
            return;
          }

          mesh = gltf.scene;
          fitObjectToScene(mesh, config.modelScale || 2.25);
          mesh.rotation.set(
            config.rotation?.x || 0,
            config.rotation?.y || 0,
            config.rotation?.z || 0,
          );
          mesh.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          pivot.clear();
          pivot.add(mesh);
        },
        undefined,
        () => {
          // Keep the generated fallback model if the GLB fails to load.
        },
      );
    }

    let frameId;
    const animate = () => {
      if (config.modelUrl) {
        rotatingObject.rotation.y += 0.015;
      } else {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.015;
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
      mountNode.removeChild(renderer.domElement);
    };
  }, [slug]);

  return <div className="department-scene" ref={mountRef} aria-hidden="true" />;
}
