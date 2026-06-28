let audioCtx;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playGunshot() {
    if (!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.75;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    noise.connect(gain).connect(audioCtx.destination);
    noise.start();
}

function playAmbient() {
    setInterval(() => {
        if (Math.random() > 0.6) {
            const bird = audioCtx.createOscillator();
            bird.type = 'sine';
            bird.frequency.value = 700 + Math.random() * 900;
            const g = audioCtx.createGain();
            g.gain.value = 0.06;
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);
            bird.connect(g).connect(audioCtx.destination);
            bird.start();
            bird.stop(audioCtx.currentTime + 1.5);
        }
    }, 1100);
}
