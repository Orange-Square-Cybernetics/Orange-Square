// Game Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const uiRed = document.getElementById("red-status");
const uiYellow = document.getElementById("yellow-status");
const uiOrange = document.getElementById("orange-status");
const winMessage = document.getElementById("win-message");
const joystick = document.getElementById("joystick");
const joystickHandle = document.getElementById("joystick-handle");
const jumpBtn = document.getElementById("jump-btn");

// Adjust canvas size to fit screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initGame(); // Reinitialize game elements on resize
}
window.addEventListener("resize", resizeCanvas);

// Game State
let player, platforms, orbs, door;

function initGame() {
    player = {
        x: canvas.width * 0.1,
        y: canvas.height * 0.5,
        width: 30,
        height: 50,
        speed: 5,
        velY: 0,
        jumpPower: 12,
        isJumping: false,
        color: "white",
        hasRed: false,
        hasYellow: false,
        hasOrange: false
    };

    platforms = [
        { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, color: "#333" },
        { x: canvas.width * 0.2, y: canvas.height * 0.7, width: canvas.width * 0.3, height: 15, color: "#555" },
        { x: canvas.width * 0.5, y: canvas.height * 0.5, width: canvas.width * 0.3, height: 15, color: "#555" },
        { x: canvas.width * 0.3, y: canvas.height * 0.3, width: canvas.width * 0.2, height: 15, color: "#555" }
    ];

    orbs = [
        { x: canvas.width * 0.25, y: canvas.height * 0.65, radius: 15, color: "red", collected: false },
        { x: canvas.width * 0.65, y: canvas.height * 0.45, radius: 15, color: "yellow", collected: false }
    ];

    door = {
        x: canvas.width * 0.8,
        y: canvas.height * 0.7,
        width: 40,
        height: 60,
        color: "#666",
        isOpen: false
    };
}

// Controls
const keys = {
    left: false,
    right: false,
    up: false
};

// Touch Controls
let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;

joystick.addEventListener("touchstart", (e) => {
    e.preventDefault();
    joystickActive = true;
    const rect = joystick.getBoundingClientRect();
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
});

document.addEventListener("touchmove", (e) => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - joystickStartX;
    const deltaY = touch.clientY - joystickStartY;
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 40);

    joystickHandle.style.left = `${30 + distance * Math.cos(angle)}px`;
    joystickHandle.style.top = `${30 + distance * Math.sin(angle)}px`;

    keys.left = deltaX < -10;
    keys.right = deltaX > 10;
});

document.addEventListener("touchend", () => {
    joystickActive = false;
    joystickHandle.style.left = "30px";
    joystickHandle.style.top = "30px";
    keys.left = false;
    keys.right = false;
});

jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    keys.up = true;
});

jumpBtn.addEventListener("touchend", () => {
    keys.up = false;
});

// Keyboard Controls
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowUp") keys.up = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.up = false;
});

// Game Loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update Game State
function update() {
    // Movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    // Jumping
    if (keys.up && !player.isJumping) {
        player.velY = -player.jumpPower;
        player.isJumping = true;
    }

    // Gravity
    player.velY += 0.5;
    player.y += player.velY;

    // Platform Collisions
    let onGround = false;
    platforms.forEach(platform => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y &&
            player.velY > 0
        ) {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.isJumping = false;
            onGround = true;
        }
    });

    // Screen Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velY = 0;
        player.isJumping = false;
    }

    // Orb Collection
    orbs.forEach(orb => {
        if (!orb.collected) {
            const dx = player.x + player.width / 2 - orb.x;
            const dy = player.y + player.height / 2 - orb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < orb.radius + player.width / 2) {
                orb.collected = true;
                if (orb.color === "red") player.hasRed = true;
                if (orb.color === "yellow") player.hasYellow = true;
            }
        }
    });

    // Orange Fusion
    if (player.hasRed && player.hasYellow && !player.hasOrange) {
        player.hasOrange = true;
        player.color = "orange";
    }

    // Door Opening
    if (player.hasOrange && !door.isOpen) {
        door.color = "orange";
        door.isOpen = true;
    }

    // Win Condition
    if (
        door.isOpen &&
        player.x < door.x + door.width &&
        player.x + player.width > door.x &&
        player.y < door.y + door.height &&
        player.y + player.height > door.y
    ) {
        winMessage.style.display = "block";
        setTimeout(() => {
            resetGame();
        }, 3000);
    }

    // Update UI
    uiRed.textContent = player.hasRed ? "Yes" : "No";
    uiYellow.textContent = player.hasYellow ? "Yes" : "No";
    uiOrange.textContent = player.hasOrange ? "Yes" : "No";
}

// Render Game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw Orbs
    orbs.forEach(orb => {
        if (!orb.collected) {
            ctx.fillStyle = orb.color;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Door
    ctx.fillStyle = door.color;
    ctx.fillRect(door.x, door.y, door.width, door.height);

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Reset Game
function resetGame() {
    initGame();
    winMessage.style.display = "none";
}

// Initialize and Start Game
resizeCanvas(); // Sets up initial canvas size

gameLoop();