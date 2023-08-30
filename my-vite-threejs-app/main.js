import '../my-vite-threejs-app/style.css';
import * as THREE from 'three';



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const polygonPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(2, 0, 0),
  new THREE.Vector3(2, 2, 0),
  new THREE.Vector3(0, 2, 0),
];

const geometry = new THREE.BufferGeometry().setFromPoints(polygonPoints);
const material = new THREE.LineBasicMaterial({ color: 0xff0000, size: 0.1 });
const pointsMesh = new THREE.LineLoop(geometry, material);
scene.add(pointsMesh);

// Calculate and add midpoints
const midpointGeometry = new THREE.BufferGeometry();
const midpointMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.1 });
const midpoints = [];

for (let i = 0; i < polygonPoints.length; i++) {
  const startPoint = polygonPoints[i];
  const endPoint = polygonPoints[(i + 1) % polygonPoints.length]; // Wrap around to the first vertex for the last edge
  
  const midpoint = new THREE.Vector3();
  midpoint.addVectors(startPoint, endPoint).multiplyScalar(0.5);
  
  midpoints.push(midpoint);
}

midpointGeometry.setFromPoints(midpoints);
const midpointMesh = new THREE.Points(midpointGeometry, midpointMaterial);
scene.add(midpointMesh);

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let selectedPoint = null;
let isDragging = false;

renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);

function onMouseDown(event) {
  event.preventDefault();

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const polygonIntersects = raycaster.intersectObject(pointsMesh);
  const midpointIntersects = raycaster.intersectObject(midpointMesh);

  if (polygonIntersects.length > 0) {
    isDragging = true;
    selectedPoint = polygonIntersects[0].index;
  } else if (midpointIntersects.length > 0) {
    isDragging = true;
    selectedPoint = midpointIntersects[0].index;
  }
}

function onMouseUp() {
  isDragging = false;
  selectedPoint = null;
}

function onMouseMove(event) {
  event.preventDefault();

  if (isDragging) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersection = raycaster.intersectObject(pointsMesh);
    if (intersection.length > 0) {
      const newPosition = intersection[0].point;
      if (selectedPoint < polygonPoints.length) {
        geometry.attributes.position.setXYZ(selectedPoint, newPosition.x, newPosition.y, newPosition.z);
        geometry.attributes.position.needsUpdate = true;
      } else {
        // Update midpoint position
        midpoints[selectedPoint - polygonPoints.length].copy(newPosition);
        midpointGeometry.attributes.position.setXYZ(selectedPoint - polygonPoints.length, newPosition.x, newPosition.y, newPosition.z);
        midpointGeometry.attributes.position.needsUpdate = true;
      }
    }
  }
}

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

