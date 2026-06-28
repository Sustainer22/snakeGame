let audioCtx;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playGunshot() {
    if(!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.45, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.7;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
}

function playAmbientSounds() {
    setInterval(() => {
        if (Math.random() > 0.65) {
            const bird = audioCtx.createOscillator();
            bird.type = 'sine';
            bird.frequency.value = 900 + Math.random() * 800;
            const g = audioCtx.createGain();
            g.gain.value = 0.07;
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
            bird.connect(g).connect(audioCtx.destination);
            bird.start();
            bird.stop(audioCtx.currentTime + 1.3);
        }
    }, 900);
}
