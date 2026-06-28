const CHUNK_SIZE = 160;
const RENDER_DISTANCE = 9;

const seasons = ["Spring", "Summer", "Fall", "Winter"];
const seasonFogColors = [0x88aaff, 0x77bbff, 0xffaa77, 0xdddddd];

const vegTypes = {
    evergreen: {type:'cone', trunkR:1.45, trunkH:26, trunkC:0x5C4033, leafC:0x0F4C2B, layers:5},
    maple: {type:'broad', trunkR:1.85, trunkH:21, trunkC:0x8B5A2B, leafC:0xC23D2E, layers:4, branchy:true},
    fruit: {type:'broad', trunkR:1.65, trunkH:17, trunkC:0x6B4E3D, leafC:0x2E8B57, layers:4, fruit:true},
    bush: {type:'bush', leafC:0x1e5c2b, layers:3}
};
