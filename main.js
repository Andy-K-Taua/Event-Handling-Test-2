"use strict";

const CONFIG = {
    CANVAS_WIDTH: 376,
    CANVAS_HEIGHT: 384,
    FRAME_INTERVAL: 20,
    PLAYER_SIZE: 30,
    OBSTACLE_WIDTH: 10,
    OBSTACLE_SPEED: 1,
    OBSTACLE_INTERVAL: 150,
    GRAVITY: 0.05
};

class GameArea {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement("canvas");
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
        this.context = this.canvas.getContext("2d");
        this.container.appendChild(this.canvas);
        
        this.frameNo = 0;
        this.interval = null;
        this.isRunning = false;
    }

    reset() {
        this.stop();
        this.clear();
        this.frameNo = 0;
    }

    start(updateCallback) {
        this.isRunning = true;
        this.interval = setInterval(updateCallback, CONFIG.FRAME_INTERVAL);
    }

    stop() {
        clearInterval(this.interval);
        this.isRunning = false;
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class Component {
    constructor(width, height, color, x, y, type = "rect") {
        this.type = type;
        this.width = width;
        this.height = height;
        this.color = color;
        this.x = x;
        this.y = y;
        this.speedX = 0;
        this.speedY = 0;
        this.gravity = 0;
        this.gravitySpeed = 0;
        this.text = "";
    }

    update(ctx) {
        if (this.type === "text") {
            ctx.font = `${this.width} ${this.height}`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    newPos() {
        this.gravitySpeed += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY + this.gravitySpeed;
        this.hitBounds();
    }

    hitBounds() {
        const rockBottom = CONFIG.CANVAS_HEIGHT - this.height;
        if (this.y > rockBottom) {
            this.y = rockBottom;
            this.gravitySpeed = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.gravitySpeed = 0;
        }
    }

    crashWith(other) {
        return !(
            this.y + this.height < other.y ||
            this.y > other.y + other.height ||
            this.x + this.width < other.x ||
            this.x > other.x + other.width
        );
    }
}

const game = (() => {
    let gameArea;
    let player;
    let obstacles = [];
    let score;
    let controlsSetup = false;

    function init() {
        gameArea = new GameArea("containerOne");
        setupControls();
        startNewGame();
    }

    function startNewGame() {
        player = new Component(CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE, "red", 10, 120);
        player.gravity = CONFIG.GRAVITY;
        score = new Component("25px", "Consolas", "black", 200, 40, "text");
        obstacles = [];
        
        gameArea.reset();
        gameArea.start(updateGameArea);
    }

    function setupControls() {
    if (controlsSetup) return;
    controlsSetup = true;

    const accelerate = (n) => {
        if (player && gameArea.isRunning) player.gravity = n;
    };

    const redBtn = document.getElementById("redButton");
    const blueBtn = document.getElementById("blueButton");

    // Red button - down
    redBtn.addEventListener("mousedown", () => accelerate(0.2));
    redBtn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Stops screen scroll/zoom
        accelerate(0.2);
    });

    redBtn.addEventListener("mouseup", () => accelerate(CONFIG.GRAVITY));
    redBtn.addEventListener("mouseleave", () => accelerate(CONFIG.GRAVITY));
    redBtn.addEventListener("touchend", (e) => {
        e.preventDefault();
        accelerate(CONFIG.GRAVITY);
    });
    redBtn.addEventListener("touchcancel", () => accelerate(CONFIG.GRAVITY));

    // Blue button - up  
    blueBtn.addEventListener("mousedown", () => accelerate(-0.2));
    blueBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        accelerate(-0.2);
    });

    blueBtn.addEventListener("mouseup", () => accelerate(CONFIG.GRAVITY));
    blueBtn.addEventListener("mouseleave", () => accelerate(CONFIG.GRAVITY));
    blueBtn.addEventListener("touchend", (e) => {
        e.preventDefault();
        accelerate(CONFIG.GRAVITY);
    });
    blueBtn.addEventListener("touchcancel", () => accelerate(CONFIG.GRAVITY));
    
    document.getElementById("restartButton").addEventListener("click", startNewGame);
    document.getElementById("restartButton").addEventListener("touchend", (e) => {
        e.preventDefault();
        startNewGame();
    });

    // Keyboard stays the same
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault();
            accelerate(-0.2);
        }
    });
    document.addEventListener("keyup", (e) => {
        if (e.code === "Space") accelerate(CONFIG.GRAVITY);
    });
}

    function everyInterval(n) {
        return (gameArea.frameNo / n) % 1 === 0;
    }

    function updateGameArea() {
        for (const obstacle of obstacles) {
            if (player.crashWith(obstacle)) {
                gameOver();
                return;
            }
        }

        gameArea.clear();
        gameArea.frameNo += 1;

        if (gameArea.frameNo === 1 || everyInterval(CONFIG.OBSTACLE_INTERVAL)) {
            const x = gameArea.canvas.width;
            const minHeight = 20;
            const maxHeight = 200;
            const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            const minGap = 50;
            const maxGap = 200;
            const gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
            
            obstacles.push(new Component(CONFIG.OBSTACLE_WIDTH, height, "green", x, 0));
            obstacles.push(new Component(CONFIG.OBSTACLE_WIDTH, x - height - gap, "green", x, height + gap));
        }

        obstacles.forEach(obstacle => {
            obstacle.x -= CONFIG.OBSTACLE_SPEED;
            obstacle.update(gameArea.context);
        });

        obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

        score.text = `SCORE: ${gameArea.frameNo}`;
        score.update(gameArea.context);
        player.newPos();
        player.update(gameArea.context);
    }

    function gameOver() {
        gameArea.stop();
        const ctx = gameArea.context;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.font = "30px Consolas";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        ctx.font = "16px Consolas";
        ctx.fillText("Press Restart", CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", game.init);