function noise(x, z) {
    return Math.sin(x * 0.018) * 16 + Math.sin(z * 0.018) * 16 + Math.sin((x + z) * 0.009) * 11 + Math.sin(x * 0.055) * 4;
}

function createVegetation(x, y, z, parent) {
    const keys = Object.keys(vegTypes);
    const cfg = vegTypes[keys[Math.floor(Math.random()*keys.length)]];

    if (cfg.type === 'bush') {
        const mat = new THREE.MeshLambertMaterial({color: cfg.leafC});
        for(let i=0; i<cfg.layers; i++) {
            const b = new THREE.Mesh(new THREE.SphereGeometry(4.2 - i*0.8, 8, 8), mat);
            b.position.set(x, y + 2 + i*1.8, z);
            b.scale.set(1.6, 0.8, 1.6);
            parent.add(b);
        }
        return;
    }

    if (cfg.trunkH > 0) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(cfg.trunkR, cfg.trunkR*1.3, cfg.trunkH, 8),
            new THREE.MeshLambertMaterial({color: cfg.trunkC}));
        trunk.position.set(x, y + cfg.trunkH/2, z);
        parent.add(trunk);
    }

    const fmat = new THREE.MeshLambertMaterial({color: cfg.leafC});
    for(let i=0; i<cfg.layers; i++) {
        let geo = cfg.branchy ? 
            new THREE.SphereGeometry(5.8 - i*1.2, 8, 8) : 
            new THREE.ConeGeometry(6.5 - i*1.4, 9, 8);
        const leaf = new THREE.Mesh(geo, fmat);
        leaf.position.set(x + (Math.random()-0.5)*2.5, y + 9 + i*5.5, z + (Math.random()-0.5)*2.5);
        parent.add(leaf);
    }

    if (cfg.fruit) {
        for(let i=0; i<8; i++) {
            const f = new THREE.Mesh(new THREE.SphereGeometry(0.65,8,8), new THREE.MeshLambertMaterial({color:0xFF2222}));
            f.position.set(x+(Math.random()-0.5)*7, y+13+Math.random()*7, z+(Math.random()-0.5)*7);
            parent.add(f);
        }
    }
}

// generateChunk, updateChunks functions go here (copy from previous working version)
