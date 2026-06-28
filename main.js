// ==================== FULL MAIN.JS ====================
let scene, camera, renderer, controls;
let move = {f:false, b:false, l:false, r:false};
let animals = [], chunks = new Map();
let score = 0, ammo = 30, currentSeason = 0;

function noise(x, z) {
    return Math.sin(x * 0.018) * 16 + Math.sin(z * 0.018) * 16 + Math.sin((x + z) * 0.009) * 11 + Math.sin(x * 0.055) * 4;
}

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

function spawnAnimal(x, z) {
    const h = noise(x, z) + 4;
    const animal = new THREE.Group();
    animal.add(new THREE.Mesh(new THREE.BoxGeometry(3,2.2,6), new THREE.MeshLambertMaterial({color:0x8B5A2B})));
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.8,8,8), new THREE.MeshLambertMaterial({color:0xA0522D}));
    head.position.set(0,2.8,3); animal.add(head);
    animal.position.set(x, h, z);
    animal.userData = {vel:new THREE.Vector3((Math.random()-0.5)*0.7,0,(Math.random()-0.5)*0.7), alive:true, hp:3, bob:0};
    scene.add(animal); animals.push(animal);
}

function generateChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (chunks.has(key)) return;
    const group = new THREE.Group();

    const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 52, 52);
    geo.rotateX(-Math.PI / 2);
    const verts = geo.attributes.position.array;
    for (let i = 0; i < verts.length; i += 3) {
        const wx = verts[i] + cx * CHUNK_SIZE;
        const wz = verts[i + 2] + cz * CHUNK_SIZE;
        verts[i + 1] = noise(wx, wz);
    }
    geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({color: 0x336633}));
    terrain.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    group.add(terrain);

    for (let i = 0; i < 14; i++) {
        const tx = cx * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        const tz = cz * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
        if (Math.random() > 0.32) createVegetation(tx, noise(tx, tz) + 1.8, tz, group);
    }
    scene.add(group);
    chunks.set(key, group);
}

function createVegetation(x, y, z, parent) {
    const keys = Object.keys(vegTypes);
    const cfg = vegTypes[keys[Math.floor(Math.random()*keys.length)]];

    if (cfg.type === 'bush') {
        const mat = new THREE.MeshLambertMaterial({color: cfg.leafC});
        for(let i=0; i<cfg.layers; i++) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(4 - i*0.7, 8, 8), mat);
            b.position.set(x, y + 2 + i*1.7, z);
            b.scale.set(1.6, 0.75, 1.6);
            parent.add(b);
        }
        return;
    }

    if (cfg.trunkH) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(cfg.trunkR, cfg.trunkR*1.25, cfg.trunkH, 8), new THREE.MeshLambertMaterial({color: cfg.trunkC}));
        trunk.position.set(x, y + cfg.trunkH/2, z);
        parent.add(trunk);
    }

    const fmat = new THREE.MeshLambertMaterial({color: cfg.leafC});
    for (let i = 0; i < cfg.layers; i++) {
        const radius = cfg.branchy ? 6.2 - i*1.3 : 6.8 - i*1.5;
        const geo = cfg.branchy ? new THREE.SphereGeometry(radius, 8, 8) : new THREE.ConeGeometry(radius, 9, 8);
        const leaf = new THREE.Mesh(geo, fmat);
        leaf.position.set(x + (Math.random()-0.5)*3, y + 9 + i*5.5, z + (Math.random()-0.5)*3);
        parent.add(leaf);
    }

    if (cfg.fruit) {
        for (let i = 0; i < 8; i++) {
            const f = new THREE.Mesh(new THREE.SphereGeometry(0.65,8,8), new THREE.MeshLambertMaterial({color:0xFF2222}));
            f.position.set(x+(Math.random()-0.5)*8, y+13+Math.random()*7, z+(Math.random()-0.5)*8);
            parent.add(f);
        }
    }
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

function updateUI() {
    document.getElementById('ammoCount').textContent = ammo;
    document.getElementById('score').textContent = `Score: ${score}`;
}

function updateChunks() {
    const cx = Math.floor(camera.position.x / CHUNK_SIZE);
    const cz = Math.floor(camera.position.z / CHUNK_SIZE);
    for(let x = cx - RENDER_DISTANCE; x <= cx + RENDER_DISTANCE; x++) {
        for(let z = cz - RENDER_DISTANCE; z <= cz + RENDER_DISTANCE; z++) {
            generateChunk(x, z);
        }
    }
}

function updateAnimals(delta) {
    for(let i = animals.length - 1; i >= 0; i--) {
        const a = animals[i];
        if (!a.userData.alive) continue;
        a.position.x += a.userData.vel.x * delta * 18;
        a.position.z += a.userData.vel.z * delta * 18;
        a.position.y = noise(a.position.x, a.position.z) + 3.5 + Math.sin(a.userData.bob += delta * 4.5) * 0.4;
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
