let scene, camera, renderer, controls;
let move = {f:false, b:false, l:false, r:false};
let animals = [], chunks = new Map();
let score = 0, ammo = 30, currentSeason = 0;

function init() {
    console.log("=== Game initializing ===");

    initAudio();
    playAmbient();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x88aaff, 420, 1600);

    camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 3000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x88aaff);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.3);
    sun.position.set(110, 180, 80);
    scene.add(sun);

    controls = new THREE.PointerLockControls(camera, document.body);
    document.addEventListener('click', () => controls.lock());

    controls.addEventListener('lock', () => document.getElementById('instructions').style.display = 'none');
    controls.addEventListener('unlock', () => document.getElementById('instructions').style.display = 'block');

    document.addEventListener('keydown', e => {
        if(e.code==='KeyW') move.f = true;
        if(e.code==='KeyS') move.b = true;
        if(e.code==='KeyA') move.l = true;
        if(e.code==='KeyD') move.r = true;
        if(e.code==='KeyR') { ammo = 30; updateUI(); }
    });
    document.addEventListener('keyup', e => {
        if(e.code==='KeyW') move.f = false;
        if(e.code==='KeyS') move.b = false;
        if(e.code==='KeyA') move.l = false;
        if(e.code==='KeyD') move.r = false;
    });
    document.addEventListener('mousedown', e => { if(controls.isLocked && e.button === 0) shoot(); });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log("Generating initial world...");
    generateChunk(0, 0);

    for(let i = 0; i < 14; i++) {
        const d = 80 + Math.random() * 160;
        const a = Math.random() * Math.PI * 2;
        spawnAnimal(Math.cos(a) * d, Math.sin(a) * d);
    }

    camera.position.set(0, 35, 70);

    updateUI();
    animate();
    console.log("=== Game started successfully ===");
}

// Spawn animal function
function spawnAnimal(x, z) {
    const h = noise(x, z) + 4;
    const animal = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2.2, 6),
        new THREE.MeshLambertMaterial({color: 0x8B5A2B})
    );
    animal.add(body);
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 8, 8),
        new THREE.MeshLambertMaterial({color: 0xA0522D})
    );
    head.position.set(0, 2.8, 3);
    animal.add(head);
    
    animal.position.set(x, h, z);
    animal.userData = {vel: new THREE.Vector3((Math.random()-0.5)*0.7, 0, (Math.random()-0.5)*0.7), alive: true, hp: 3, bob: 0};
    
    scene.add(animal);
    animals.push(animal);
}

function updateUI() {
    document.getElementById('ammoCount').textContent = ammo;
    document.getElementById('score').textContent = `Score: ${score}`;
}

function shoot() {
    if (ammo <= 0) return;
    ammo--;
    updateUI();
    playGunshot();

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    if (hits.length) {
        let obj = hits[0].object;
        while (obj) {
            if (animals.includes(obj.parent)) {
                const a = obj.parent;
                a.userData.hp = (a.userData.hp || 3) - 1;
                if (a.userData.hp <= 0 && a.userData.alive) {
                    a.userData.alive = false;
                    score += 100;
                    updateUI();
                    a.scale.set(0.6, 0.3, 0.6);
                    setTimeout(() => { 
                        scene.remove(a); 
                        const idx = animals.indexOf(a);
                        if (idx > -1) animals.splice(idx, 1); 
                    }, 1000);
                }
                break;
            }
            obj = obj.parent;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = 0.016;

    if (controls.isLocked) {
        const dx = (move.r?1:0) - (move.l?1:0);
        const dz = (move.f?1:0) - (move.b?1:0);
        const len = Math.hypot(dx, dz) || 1;
        controls.moveRight(dx / len * 42 * delta);
        controls.moveForward(dz / len * 42 * delta);

        const th = noise(camera.position.x, camera.position.z) + 10;
        if (camera.position.y < th) camera.position.y = th;
        else if (camera.position.y > th + 6) camera.position.y -= 1.4;

        updateChunks();
        updateAnimals(delta);
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// Season cycle
setInterval(() => {
    currentSeason = (currentSeason + 1) % 4;
    document.getElementById('season').textContent = seasons[currentSeason];
    if (scene && scene.fog) scene.fog.color.setHex(seasonFogColors[currentSeason]);
    if (renderer) renderer.setClearColor(seasonFogColors[currentSeason]);
}, 180000);

init();
