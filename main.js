let scene, camera, renderer, controls;
let move = {f:false, b:false, l:false, r:false};
let animals = [], chunks = new Map();
let score = 0, ammo = 30, currentSeason = 0;

function init() {
    initAudio();
    playAmbient();

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x88aaff, 420, 1600);

    camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.1, 3000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x88aaff);
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.15);
    sun.position.set(110, 165, 75);
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
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    generateChunk(0, 0);
    for(let i = 0; i < 16; i++) {
        const d = 80 + Math.random() * 160;
        const a = Math.random() * Math.PI * 2;
        spawnAnimal(Math.cos(a) * d, Math.sin(a) * d);
    }

    camera.position.set(0, 32, 60);
    updateUI();
    animate();
}

// Season cycle
setInterval(() => {
    currentSeason = (currentSeason + 1) % 4;
    document.getElementById('season').textContent = seasons[currentSeason];
    scene.fog.color.setHex(seasonFogColors[currentSeason]);
    renderer.setClearColor(seasonFogColors[currentSeason]);
}, 180000);

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
                    setTimeout(() => { scene.remove(a); animals.splice(animals.indexOf(a), 1); }, 1000);
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
        else if (camera.position.y > th + 5) camera.position.y -= 1.4;

        updateChunks();
        updateAnimals(delta);
    }
    renderer.render(scene, camera);
}

init();
