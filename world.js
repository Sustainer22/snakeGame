function noise(x, z) {
    return Math.sin(x * 0.018) * 16 + Math.sin(z * 0.018) * 16 + Math.sin((x + z) * 0.009) * 11 + Math.sin(x * 0.055) * 4;
}

function createVegetation(x, y, z, parent) {
    const keys = Object.keys(vegTypes);
    const cfg = vegTypes[keys[Math.floor(Math.random() * keys.length)]];

    if (cfg.type === 'bush') {
        const mat = new THREE.MeshLambertMaterial({color: cfg.leafC});
        for (let i = 0; i < cfg.layers; i++) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(4 - i * 0.7, 8, 8), mat);
            b.position.set(x, y + 2 + i * 1.7, z);
            b.scale.set(1.6, 0.75, 1.6);
            parent.add(b);
        }
        return;
    }

    // Trunk
    if (cfg.trunkH) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(cfg.trunkR, cfg.trunkR * 1.25, cfg.trunkH, 8),
            new THREE.MeshLambertMaterial({color: cfg.trunkC})
        );
        trunk.position.set(x, y + cfg.trunkH / 2, z);
        parent.add(trunk);
    }

    const fmat = new THREE.MeshLambertMaterial({color: cfg.leafC});
    for (let i = 0; i < cfg.layers; i++) {
        const radius = cfg.branchy ? 6.2 - i * 1.3 : 6.8 - i * 1.5;
        const geo = cfg.branchy ? new THREE.SphereGeometry(radius, 8, 8) : new THREE.ConeGeometry(radius, 9, 8);
        const leaf = new THREE.Mesh(geo, fmat);
        leaf.position.set(x + (Math.random() - 0.5) * 3, y + 9 + i * 5.5, z + (Math.random() - 0.5) * 3);
        parent.add(leaf);
    }

    if (cfg.fruit) {
        for (let i = 0; i < 8; i++) {
            const f = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshLambertMaterial({color: 0xFF2222}));
            f.position.set(x + (Math.random() - 0.5) * 8, y + 13 + Math.random() * 7, z + (Math.random() - 0.5) * 8);
            parent.add(f);
        }
    }
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
