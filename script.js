const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn'); 

const bgm = new Audio('bgm.mp3');
bgm.loop = true; 
bgm.volume = 0.5; 
const eatSound = new Audio('waka.mp3');
const gameOverSound = new Audio('gameover.mp3');

let score = 0;
// Mengambil skor tertinggi dari memori browser, jika belum ada set ke 0
let highScore = localStorage.getItem('pacmanHighScore') || 0; 

let gameOver = false;
let gameStarted = false; 
const tileSize = 20;

const originalMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
    [2,2,2,2,2,0,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,0,2,2,2,2,2], 
    [1,1,1,1,1,0,1,1,2,1,1,1,2,1,1,2,2,1,1,2,1,1,1,2,1,1,0,1,1,1,1,1],
    [2,2,2,2,2,0,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,0,2,2,2,2,2],
    [1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = JSON.parse(JSON.stringify(originalMap));
const VIRTUAL_WIDTH = map[0].length * tileSize;  
const VIRTUAL_HEIGHT = map.length * tileSize;    

function resizeCanvas() {
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 40;
    const availWidth = window.innerWidth * 0.98;
    const availHeight = (window.innerHeight - headerHeight) * 0.95;
    const scale = Math.min(availWidth / VIRTUAL_WIDTH, availHeight / VIRTUAL_HEIGHT);
    canvas.width = VIRTUAL_WIDTH * scale;
    canvas.height = VIRTUAL_HEIGHT * scale;
    ctx.scale(scale, scale);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

const pacman = {
    x: 16 * tileSize + 10, y: 12 * tileSize + 10, 
    radius: 8, speed: 2, dx: 0, dy: 0, nextDx: 0, nextDy: 0
};

// Memuat gambar sprite musuh
function loadSprite(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const ghostSize = 28; // ukuran gambar musuh (petak = 20px)

const ghosts = [
    { x: 15 * tileSize + 10, y: 8 * tileSize + 10, color: 'white', sprite: loadSprite('kuntilanak_enemy_sprite.svg'), speed: 2, dx: 2, dy: 0, radius: 8 },
    { x: 16 * tileSize + 10, y: 8 * tileSize + 10, color: 'beige', sprite: loadSprite('pocong_enemy_sprite.svg'), speed: 2, dx: -2, dy: 0, radius: 8 },
    { x: 15 * tileSize + 10, y: 10 * tileSize + 10, color: 'brown', sprite: loadSprite('genderuwo_enemy_sprite.svg'), speed: 2, dx: 0, dy: -2, radius: 8 }
];

// === TEMA HUTAN ===
// Gambar petak dibuat sekali saja, lalu dipakai berulang agar game tetap ringan
function createTile(draw) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = tileSize * 4; // resolusi 4x agar tidak buram
    const t = tile.getContext('2d');
    t.scale(4, 4);
    draw(t);
    return tile;
}

function circle(c, x, y, r, color) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
}

// Jalan tanah dengan kerikil
const groundTile = createTile(t => {
    t.fillStyle = '#3b2a1a';
    t.fillRect(0, 0, tileSize, tileSize);
    circle(t, 4, 5, 1, '#4d3924');
    circle(t, 15, 13, 1.3, '#2e2013');
    circle(t, 8, 16, 0.7, '#5a442c');
});

// Pohon sebagai tembok
const treeTile = createTile(t => {
    t.fillStyle = '#0f2e14';
    t.fillRect(0, 0, tileSize, tileSize);
    circle(t, 10, 10, 9.5, '#1d5226');
    circle(t, 7, 8, 5.5, '#2a6e31');
    circle(t, 13, 12, 4.5, '#256029');
    circle(t, 6, 6, 2.2, '#46933f');
});

function drawMap() {
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const x = col * tileSize;
            const y = row * tileSize;
            const tile = map[row][col] === 1 ? treeTile : groundTile;
            ctx.drawImage(tile, x, y, tileSize, tileSize);

            // Makanan berupa kunang-kunang yang berkedip
            if (map[row][col] === 0) {
                const cx = x + tileSize / 2;
                const cy = y + tileSize / 2;
                const glow = 4 + Math.sin(Date.now() / 250 + row + col);
                circle(ctx, cx, cy, glow, 'rgba(210, 255, 90, 0.25)');
                circle(ctx, cx, cy, 2, '#eaff7a');
            }
        }
    }
}

function canMove(x, y, dx, dy) {
    if (dx === 0 && dy === 0) return false;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    const nextCol = col + Math.sign(dx);
    const nextRow = row + Math.sign(dy);
    if (nextCol < 0 || nextCol >= map[0].length) return true;
    if (nextRow < 0 || nextRow >= map.length) return false;
    return map[nextRow][nextCol] !== 1;
}

function drawCharacter(char, color) {
    ctx.beginPath();
    ctx.arc(char.x, char.y, char.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill(); ctx.closePath();
}

function drawGhost(ghost) {
    // Jika gambar gagal / belum termuat, tampilkan lingkaran seperti semula
    if (!ghost.sprite.complete || ghost.sprite.naturalWidth === 0) {
        drawCharacter(ghost, ghost.color);
        return;
    }
    // Efek melayang naik-turun (hanya visual, tidak mengubah posisi asli)
    const float = Math.sin(Date.now() / 150 + ghost.x / 20) * 1.5;
    ctx.drawImage(ghost.sprite, ghost.x - ghostSize / 2, ghost.y - ghostSize / 2 + float, ghostSize, ghostSize);
}

// === KARAKTER MANUSIA ===
function drawPlayer(player) {
    // Simpan arah hadap terakhir (1 = kanan, -1 = kiri)
    if (player.dx !== 0) player.facing = Math.sign(player.dx);
    const moving = gameStarted && (player.dx !== 0 || player.dy !== 0);
    const step = moving ? Math.sin(Date.now() / 80) * 3 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(player.facing || 1, 1);
    ctx.lineCap = 'round';

    // Fungsi bantu untuk menggambar garis (tangan & kaki)
    const limb = (x1, y1, x2, y2, color) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.8;
        ctx.stroke();
    };

    // Cahaya di sekitar pemain agar mudah terlihat
    circle(ctx, 0, 0, 13, 'rgba(255, 230, 150, 0.18)');

    // Kaki
    limb(-1.5, 4, -2.5 - step, 11, '#2f5fb3');
    limb(1.5, 4, 2.5 + step, 11, '#4a7fd6');
    // Tangan belakang
    limb(-2, -1, -5 + step, 3, '#c98d62');
    // Badan (baju merah)
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-4, -3, 8, 8);
    // Tangan depan
    limb(2, -1, 5 - step, 3, '#f2b98a');
    // Kepala, rambut, dan mata
    circle(ctx, 0, -7.5, 4.5, '#f2b98a');
    ctx.beginPath();
    ctx.arc(0, -8, 4.8, Math.PI * 0.85, Math.PI * 1.95);
    ctx.fillStyle = '#2b1a10';
    ctx.fill();
    circle(ctx, 2, -7, 0.8, '#111');

    ctx.restore();
}

function movePacman() {
    const atCenterX = (pacman.x - (tileSize / 2)) % tileSize === 0;
    const atCenterY = (pacman.y - (tileSize / 2)) % tileSize === 0;

    if (atCenterX && atCenterY) {
        if (canMove(pacman.x, pacman.y, pacman.nextDx, pacman.nextDy)) {
            pacman.dx = pacman.nextDx; pacman.dy = pacman.nextDy;
        }
        if (!canMove(pacman.x, pacman.y, pacman.dx, pacman.dy)) {
            pacman.dx = 0; pacman.dy = 0;
        }
    } else {
        if (pacman.nextDx !== 0 && pacman.nextDx === -pacman.dx) { pacman.dx = pacman.nextDx; pacman.dy = 0; }
        if (pacman.nextDy !== 0 && pacman.nextDy === -pacman.dy) { pacman.dx = 0; pacman.dy = pacman.nextDy; }
    }

    pacman.x += pacman.dx;
    pacman.y += pacman.dy;

    if (pacman.x < 0) pacman.x = VIRTUAL_WIDTH;
    if (pacman.x > VIRTUAL_WIDTH) pacman.x = 0;

    const col = Math.floor(pacman.x / tileSize);
    const row = Math.floor(pacman.y / tileSize);
    
    if (map[row] && map[row][col] === 0) {
        map[row][col] = 2; 
        score += 10;
        scoreElement.innerText = score;
        eatSound.currentTime = 0; 
        eatSound.play().catch(e => {}); 
        
        const respawnRow = row;
        const respawnCol = col;
        
        setTimeout(() => {
            if (originalMap[respawnRow][respawnCol] === 0) {
                map[respawnRow][respawnCol] = 0; 
            }
        }, 10000);
    }
}

function moveGhosts() {
    ghosts.forEach(ghost => {
        const atCenterX = (ghost.x - (tileSize / 2)) % tileSize === 0;
        const atCenterY = (ghost.y - (tileSize / 2)) % tileSize === 0;

        if (atCenterX && atCenterY) {
            const directions = [{dx: ghost.speed, dy: 0}, {dx: -ghost.speed, dy: 0}, {dx: 0, dy: ghost.speed}, {dx: 0, dy: -ghost.speed}];
            let possibleDirs = directions.filter(dir => {
                if (dir.dx === -ghost.dx && dir.dy === -ghost.dy && (ghost.dx !== 0 || ghost.dy !== 0)) return false;
                return canMove(ghost.x, ghost.y, dir.dx, dir.dy);
            });
            if (possibleDirs.length === 0) possibleDirs = [{dx: -ghost.dx, dy: -ghost.dy}];
            const randomDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            ghost.dx = randomDir.dx; ghost.dy = randomDir.dy;
        }

        ghost.x += ghost.dx; ghost.y += ghost.dy;
        if (ghost.x < 0) ghost.x = VIRTUAL_WIDTH;
        if (ghost.x > VIRTUAL_WIDTH) ghost.x = 0;

        const dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
        if (dist < pacman.radius + ghost.radius) {
            gameOver = true;
            bgm.pause(); 
            gameOverSound.play().catch(e => {});
            
            // Cek dan simpan skor tertinggi saat Game Over
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('pacmanHighScore', highScore);
            }
        }
    });
}

function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = 'bold 45px Courier New';
        // Teks ditata ulang posisinya agar tidak bertabrakan
        ctx.fillText('GAME OVER!', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 40);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Courier New';
        ctx.fillText('Skor Akhir: ' + score, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2);
        
        // Tampilkan Skor Tertinggi
        ctx.fillStyle = 'yellow';
        ctx.fillText('Skor Tertinggi: ' + highScore, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 30);
        
        restartBtn.style.display = 'block'; 
        return; 
    }

    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    drawMap();

    if (gameStarted) {
        movePacman();
        moveGhosts();
    } else {
        ctx.fillStyle = 'yellow';
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Courier New';
        ctx.fillText('TEKAN ARAH / SWIPE', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40);
        ctx.fillText('UNTUK MULAI', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 70);
    }

    drawPlayer(pacman);
    ghosts.forEach(drawGhost);

    requestAnimationFrame(gameLoop);
}

restartBtn.addEventListener('click', () => {
    window.location.reload(); 
});

document.addEventListener('keydown', (e) => {
    if (!gameStarted && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(e.key)) {
        gameStarted = true;
        bgm.play().catch(e => {});
    }
    if (e.key === 'ArrowRight' || e.key === 'd') { pacman.nextDx = pacman.speed; pacman.nextDy = 0; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { pacman.nextDx = -pacman.speed; pacman.nextDy = 0; }
    if (e.key === 'ArrowUp' || e.key === 'w') { pacman.nextDx = 0; pacman.nextDy = -pacman.speed; }
    if (e.key === 'ArrowDown' || e.key === 's') { pacman.nextDx = 0; pacman.nextDy = pacman.speed; }
});

let touchStartX = 0; let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    if (gameOver) return; 
    if (!gameStarted) { gameStarted = true; bgm.play().catch(e => {}); }
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', (e) => {
    if (gameOver) return;
    let dx = e.changedTouches[0].screenX - touchStartX;
    let dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) { pacman.nextDx = pacman.speed; pacman.nextDy = 0; } 
            else { pacman.nextDx = -pacman.speed; pacman.nextDy = 0; }       
        } else {
            if (dy > 0) { pacman.nextDx = 0; pacman.nextDy = pacman.speed; } 
            else { pacman.nextDx = 0; pacman.nextDy = -pacman.speed; }       
        }
    }
}, {passive: false});

gameLoop();