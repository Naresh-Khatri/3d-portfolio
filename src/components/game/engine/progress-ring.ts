import * as THREE from "three";

const SEGMENTS = 64;

export function makeProgressRing(innerRadius: number, outerRadius: number, color: number, opacity = 0.9) {
  const group = new THREE.Group();
  const track = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, SEGMENTS).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, depthWrite: false, toneMapped: false }),
  );
  const arc = new THREE.Mesh(
    track.geometry.clone(),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false }),
  );
  arc.position.y = 0.005;
  arc.geometry.computeBoundingSphere();
  group.add(track, arc);
  const positions = arc.geometry.getAttribute("position") as THREE.BufferAttribute;
  positions.setUsage(THREE.DynamicDrawUsage);
  let lastProgress = -1;

  const setProgress = (value: number) => {
    const progress = THREE.MathUtils.clamp(value, 0, 1);
    if (progress === lastProgress) return;
    lastProgress = progress;
    arc.visible = progress > 0;
    for (let row = 0; row < 2; row++) {
      const radius = row === 0 ? innerRadius : outerRadius;
      for (let i = 0; i <= SEGMENTS; i++) {
        // The seam starts on +z; rotate the group to keep it toward the camera.
        const angle = -Math.PI / 2 + (i / SEGMENTS) * Math.PI * 2 * progress;
        positions.setXYZ(row * (SEGMENTS + 1) + i, Math.cos(angle) * radius, 0, -Math.sin(angle) * radius);
      }
    }
    positions.needsUpdate = true;
  };

  const faceCamera = (camera: THREE.Vector3, origin: THREE.Vector3) => {
    group.rotation.y = Math.atan2(camera.x - origin.x, camera.z - origin.z);
  };

  const dispose = () => {
    group.removeFromParent();
    track.geometry.dispose();
    track.material.dispose();
    arc.geometry.dispose();
    arc.material.dispose();
  };

  setProgress(0);
  return { group, setProgress, faceCamera, dispose };
}
