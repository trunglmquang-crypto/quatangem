// 1. Cấu hình file ảnh của bạn (đặt tên file ảnh đúng như thế này trong thư mục)
const myPhotos = ['anh1.jpg', 'anh2.jpg', 'anh3.jpg'];

// 2. Thiết lập Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 3. Tạo Cây Thông (Particle Tree)
const starCount = 5000;
const geometry = new THREE.BufferGeometry();
const posArray = new Float32Array(starCount * 3);
const colorArray = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
    const h = Math.random() * 8; // Chiều cao cây
    const r = (8 - h) * 0.3;     // Bán kính thu hẹp dần lên đỉnh
    const theta = Math.random() * Math.PI * 2;

    posArray[i * 3] = Math.cos(theta) * r;
    posArray[i * 3 + 1] = h - 4; // Căn giữa cây
    posArray[i * 3 + 2] = Math.sin(theta) * r;

    // Màu hạt: Cam, Vàng, Đỏ xen kẽ
    colorArray[i * 3] = 1; 
    colorArray[i * 3 + 1] = Math.random() * 0.9; 
    colorArray[i * 3 + 2] = 0.1;
}

geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
const treeMaterial = new THREE.PointsMaterial({ size: 0.025, vertexColors: true });
const tree = new THREE.Points(geometry, treeMaterial);
scene.add(tree);

// 4. Khởi tạo ảnh cá nhân
const photoMeshes = [];
const loader = new THREE.TextureLoader();

myPhotos.forEach(url => {
    const photoGeo = new THREE.PlaneGeometry(1.2, 1.5);
    const photoMat = new THREE.MeshBasicMaterial({ 
        map: loader.load(url), 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0 
    });
    const mesh = new THREE.Mesh(photoGeo, photoMat);
    scene.add(mesh);
    photoMeshes.push(mesh);
});

camera.position.z = 7;

// 5. Hàm bung ảnh khi chụm tay
let exploded = false;
function triggerExplosion() {
    if (exploded) return;
    exploded = true;
    
    photoMeshes.forEach((mesh, i) => {
        mesh.material.opacity = 1;
        gsap.to(mesh.position, {
            x: (Math.random() - 0.5) * 12,
            y: (Math.random() - 0.5) * 9,
            z: Math.random() * 4,
            duration: 2.5,
            ease: "expo.out"
        });
        gsap.to(mesh.rotation, { z: (Math.random() - 0.5) * 1.5, duration: 2.5 });
    });
    gsap.to(tree.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 2 });
}

// 6. Mediapipe Hand Tracking
const videoElement = document.getElementById('input_video');
videoElement.style.display = "block"; // Hiện camera để kiểm tra
videoElement.style.position = "absolute";
videoElement.style.top = "10px";
videoElement.style.left = "10px";
videoElement.style.width = "150px";
videoElement.style.zIndex = "100";
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.7 });
hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        // Tính khoảng cách ngón cái (4) và ngón trỏ (8)
        const d = Math.hypot(hand[4].x - hand[8].x, hand[4].y - hand[8].y);
        if (d < 0.04) triggerExplosion();
    }
});

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640, height: 480
});

// 7. Sự kiện Nút bấm
document.getElementById('start-btn').onclick = () => {
    cameraUtils.start();
    document.getElementById('bg-music').play();
    document.getElementById('status').innerText = "Đã nhận diện camera. Chụm ngón tay ngay!";
    document.getElementById('start-btn').style.opacity = '0';
};

// 8. Vòng lặp Render
function animate() {
    requestAnimationFrame(animate);
    tree.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});
