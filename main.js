function init() {
    initAudio();
    playAmbientSounds();

    // scene, camera, renderer, controls setup (copy from previous working version)

    generateChunk(0,0);
    // spawn animals...

    camera.position.set(0, 32, 60);
    updateUI();
    animate();
}

// season cycle every 3 minutes
setInterval(() => {
    currentSeason = (currentSeason + 1) % 4;
    document.getElementById('season').textContent = seasons[currentSeason];
    scene.fog.color.setHex(seasonFogColors[currentSeason]);
    renderer.setClearColor(seasonFogColors[currentSeason]);
}, 180000);

init();
