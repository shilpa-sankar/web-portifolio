import '../my-vite-threejs-app/style.css';
import * as THREE from 'three';
import { DragControls } from 'three/addons/controls/DragControls.js';


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
let pointsMesh = new THREE.LineLoop(geometry, material);
scene.add(pointsMesh);


// Calculate and add midpoints
const midpointMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.1 });
let midpoints = [];
let objects = [];

for (let i = 0; i < polygonPoints.length; i++) {
  const startPoint = polygonPoints[i];
  const endPoint = polygonPoints[(i + 1) % polygonPoints.length]; // Wrap around to the first vertex for the last edge
  
  const midpoint = new THREE.Vector3();
  midpoint.addVectors(startPoint, endPoint).multiplyScalar(0.5);
  
  midpoints.push({
    endPoint: {startPoint, endPoint},
    point: midpoint,
  });
}
midpoints.forEach(point => {
  const midpointGeometry = new THREE.BufferGeometry();
  midpointGeometry.setFromPoints([point.point]);
  const midpointMesh = new THREE.Points(midpointGeometry, midpointMaterial);
  midpointMesh.userData = point;
  objects.push(midpointMesh);
  scene.add(midpointMesh);
})

function createPolygon(points) {
  scene.remove(pointsMesh)
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000, size: 0.1 });
  pointsMesh = new THREE.LineLoop(geometry, material);
  scene.add(pointsMesh);
}

function createMidPoints(points) {
  objects.forEach(obj => scene.remove(obj))
  objects = [];
  midpoints = [];
  for (let i = 0; i < points.length; i++) {
    const startPoint = points[i];
    const endPoint = points[(i + 1) % points.length]; // Wrap around to the first vertex for the last edge
    
    const midpoint = new THREE.Vector3();
    midpoint.addVectors(startPoint, endPoint).multiplyScalar(0.5);
    
    midpoints.push({
      endPoint: {startPoint, endPoint},
      point: midpoint,
    });
  }
  midpoints.forEach(point => {
    const midpointGeometry = new THREE.BufferGeometry();
    midpointGeometry.setFromPoints([point.point]);
    const midpointMesh = new THREE.Points(midpointGeometry, midpointMaterial);
    midpointMesh.userData = point;
    objects.push(midpointMesh);
    scene.add(midpointMesh);
  })
}

// const mouse = new THREE.Vector2();
// const raycaster = new THREE.Raycaster();
// let selectedPoint = null;
// let isDragging = false;

// renderer.domElement.addEventListener('mousedown', onMouseDown, false);
// renderer.domElement.addEventListener('mouseup', onMouseUp, false);
// renderer.domElement.addEventListener('mousemove', onMouseMove, false);

// function onMouseDown(event) {
//   event.preventDefault();

//   const rect = renderer.domElement.getBoundingClientRect();
//   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const polygonIntersects = raycaster.intersectObject(pointsMesh);
//   const midpointIntersects = raycaster.intersectObject(midpointMesh);

//   if (polygonIntersects.length > 0) {
//     isDragging = true;
//     selectedPoint = polygonIntersects[0].index;
//   } else if (midpointIntersects.length > 0) {
//     isDragging = true;
//     selectedPoint = midpointIntersects[0].index;
//   }
// }

// function onMouseUp() {
//   isDragging = false;
//   selectedPoint = null;
// }

// function onMouseMove(event) {
//   event.preventDefault();

//   if (isDragging) {
//     const rect = renderer.domElement.getBoundingClientRect();
//     mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//     mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

//     raycaster.setFromCamera(mouse, camera);

//     const intersection = raycaster.intersectObject(pointsMesh);
//     if (intersection.length > 0) {
//       const newPosition = intersection[0].point;
//       // if (selectedPoint < polygonPoints.length) {
//       //   geometry.attributes.position.setXYZ(selectedPoint, newPosition.x, newPosition.y, newPosition.z);
//       //   geometry.attributes.position.needsUpdate = true;
//       // // } else {
//       //   // Update midpoint position
//       //   midpoints[selectedPoint - polygonPoints.length].copy(newPosition);
//       //   midpointGeometry.attributes.position.setXYZ(selectedPoint - polygonPoints.length, newPosition.x, newPosition.y, newPosition.z);
//       //   midpointGeometry.attributes.position.needsUpdate = true;
//       // }
//     }
//   }
// }

let initialPosition = new THREE.Vector3();
let finalPosition = new THREE.Vector3();
let draggedPoint = new THREE.Vector3();

let controls = new DragControls( objects, camera, renderer.domElement );
const dragStart = ( event ) => {
  initialPosition = event.object.position.clone();
}
controls.addEventListener( 'dragstart', dragStart );

const dragEnd = ( event ) => {
  finalPosition = event.object.position.clone();
  const delta = new THREE.Vector3(finalPosition.x - initialPosition.x, finalPosition.y - initialPosition.y , 0)
  const newPoint = event.object.userData.point.clone().add(delta)
  const pointBeforeMidPointInArray = event.object.userData.endPoint.startPoint;
  const indexToInsertAfter = polygonPoints.indexOf(pointBeforeMidPointInArray);
  polygonPoints.splice(indexToInsertAfter + 1, 0, newPoint);
  createPolygon(polygonPoints);
  createMidPoints(polygonPoints);
  removeAllEventListerns();
  addDragControls(objects);
}
controls.addEventListener( 'dragend', dragEnd );

const drag = (event) => {
  draggedPoint = event.object.position.clone();
  const point = [...polygonPoints];
  const delta = new THREE.Vector3(draggedPoint.x - initialPosition.x, draggedPoint.y - initialPosition.y , 0)
  const newPoint = event.object.userData.point.clone().add(delta)
  const pointBeforeMidPointInArray = event.object.userData.endPoint.startPoint;
  const indexToInsertAfter = point.indexOf(pointBeforeMidPointInArray);
  point.splice(indexToInsertAfter + 1, 0, newPoint);
  createPolygon(point);
  // // createMidPoints(polygonPoints);
  // // removeAllEventListerns();
  // // addDragControls(objects);

}
controls.addEventListener( 'drag', drag);


function removeAllEventListerns() {
  controls.dispose(); // Dispose of the controls instance
  // Remove any associated event listeners
  controls.removeEventListener('dragstart', dragStart);
  controls.removeEventListener('drag', dragEnd);
  controls.removeEventListener('dragend', drag);
}

function addDragControls(obj) {
  controls = new DragControls(obj, camera, renderer.domElement);
  controls.addEventListener('dragstart', dragStart);
  controls.addEventListener('dragend', dragEnd);
  controls.addEventListener('drag', drag);
}

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

