// 
// Author: [Harry Kakadiya]
// GitHub: [yaeger211202]
// Student ID: [922964988]
//

// Game variables
let gameArea;
let playerJet;
const enemies = [];
const bullets = [];
const enemyBullets = [];
const specialCollectibles = [];
let isGameOver = false;
let health = 100;
let score = 0;
let enemySpeed = 3;  
let bulletSpeed = 2;
const enemyBulletSpeed = 4; 
let specialCollectibleFrequency = 2000;
let username = "";
let backgroundImage;
let jetSpeed = 7;  
let gameInterval;
let createEnemyInterval;
let createSpecialCollectibleInterval;

// Function definitions
function startGame() {
    try {
        username = document.getElementById("username").value;
        const usernameInput = document.getElementById("usernameInput");
        const startGameButton = document.getElementById("startGameButton");
        const gameName = document.getElementById("gameName");
        
        if (!usernameInput || !startGameButton || !gameName) {
            throw new Error("Missing HTML elements");
        }
        
        usernameInput.style.display = "none";
        startGameButton.style.display = "none";
        gameName.innerHTML = `Welcome, ${username}`;
        setTimeout(() => {
            gameName.style.display = "none";
        }, 2000);
        
        gameArea = new GameArea();
        gameArea.keys = {};
        playerJet = new Component(50, 50, "blue", gameArea.canvas.width / 2 - 25, gameArea.canvas.height - 60, "jetfighter.png");
        backgroundImage = new Image();
        backgroundImage.src = "408-0.png";
        backgroundImage.onerror = function() {
          console.error("Failed to load background image");
        };
        gameArea.start();
        
        createEnemyInterval = setInterval(createEnemy, 2000);
        createSpecialCollectibleInterval = setInterval(createSpecialCollectible, specialCollectibleFrequency);

    } catch (error) {
        console.error("Error starting game:", error);
    }
}

function GameArea() {
    this.canvas = document.getElementById("gameCanvas");
    this.context = this.canvas.getContext("2d");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    });
    this.start = function() {
        gameInterval = setInterval(updateGameArea, 20);
        document.addEventListener('keydown', function(e) {
            gameArea.keys[e.keyCode] = true;
        });
        document.addEventListener('keyup', function(e) {
            gameArea.keys[e.keyCode] = false;
        });
    };
    this.clear = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    this.stop = function() {
        clearInterval(gameInterval);
        clearInterval(createEnemyInterval);
        clearInterval(createSpecialCollectibleInterval);
    };
    this.drawBackground = function() {
        this.context.drawImage(backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    };
}

function Component(width, height, color, x, y, image) {
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.image = new Image();
    this.image.src = image;
    this.image.onerror = function() {
      console.error(`Failed to load image: ${image}`);
    };
    this.update = function() {
        let ctx = gameArea.context;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    };
    this.newPos = function() {
        if (gameArea.keys && gameArea.keys[37]) this.x -= jetSpeed; 
        if (gameArea.keys && gameArea.keys[39]) this.x += jetSpeed; 
             if (gameArea.keys && gameArea.keys[38]) this.y -= jetSpeed; 
        if (gameArea.keys && gameArea.keys[40]) this.y += jetSpeed; 
    };
}

function createEnemy() {
    const x = Math.floor(Math.random() * (gameArea.canvas.width - 50));
    const enemy = new Component(50, 50, "red", x, 0, "SpaceShipSmall.png");
    enemies.push(enemy);
    
    // Enemy fires bullets periodically
    setInterval(() => {
        if (enemies.includes(enemy)) {  
            createEnemyBullet(enemy);
        }
    }, 1000);  
}

function createSpecialCollectible() {
    const x = Math.floor(Math.random() * (gameArea.canvas.width - 30));
    const specialCollectible = new Component(20, 20, "green", x, 0, "specialCollectible.png");
    specialCollectibles.push(specialCollectible);
}

function updateGameArea() {
    if (isGameOver) return;
    gameArea.clear();
    gameArea.drawBackground();
    playerJet.newPos();
    playerJet.update();

    // Update enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].y += enemySpeed;
        enemies[i].update();
        if (enemies[i].y > gameArea.canvas.height) {
            enemies.splice(i, 1);
        }

        // Collision detection with player jet
        if (checkCollision(playerJet, enemies[i])) {
            health -= 10; 
            enemies.splice(i, 1); 
            if (health <= 0) {
                endGame();
            }
        }
    }

    // Update bullets
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].y -= bulletSpeed;
        bullets[i].update();
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }

        // Collision detection with enemies
        for (let j = 0; j < enemies.length; j++) {
            if (checkCollision(bullets[i], enemies[j])) {
                score += 10; 
                enemies.splice(j, 1); 
                bullets.splice(i, 1); 
                break;
            }
        }
    }

    // Update enemy bullets
    for (let i = 0; i < enemyBullets.length; i++) {
        enemyBullets[i].y += enemyBulletSpeed;
        enemyBullets[i].update();
        if (enemyBullets[i].y > gameArea.canvas.height) {
            enemyBullets.splice(i, 1);
        }

        // Collision detection with player
        if (checkCollision(playerJet, enemyBullets[i])) {
            health -= 10;
            enemyBullets.splice(i, 1);
            if (health <= 0) {
                endGame();
            }
        }
    }

    // Fire bullet on spacebar press
    if (gameArea.keys[32]) {
        createBullet();
        gameArea.keys[32] = false; 
    }

    // Display health bar and score
    gameArea.context.fillStyle = "red";
    gameArea.context.fillRect(20, 20, 200, 20);
    gameArea.context.fillStyle = "green";
    gameArea.context.fillRect(20, 20, health * 2, 20);

    gameArea.context.fillStyle = "white";
    gameArea.context.font = "20px Arial";
    gameArea.context.fillText(`Score: ${score}`, 20, 60);
    gameArea.context.fillText(`Health: ${health}`, 20, 80);
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

function createBullet() {
    const bullet = new Component(10, 10, "yellow", playerJet.x + 20, playerJet.y, "spr_bullet_strip03.png");
    bullets.push(bullet);
}

function createEnemyBullet(enemy) {
    const bullet = new Component(10, 10, "red", enemy.x + 20, enemy.y + 50, "spr_bullet_strip03.png");
    enemyBullets.push(bullet);
}

function endGame() {
    isGameOver = true;
    document.getElementById("gameOverMessage").style.display = "block";
    document.getElementById("restartButton").style.display = "block";
    gameArea.stop();
}

function restartGame() {
    isGameOver = false;
    health = 100;
    score = 0;
    enemySpeed = 3;  
    bulletSpeed = 2;
    specialCollectibleFrequency = 2000;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    specialCollectibles.length = 0;
    playerJet.x = gameArea.canvas.width / 2 - 25;
    playerJet.y = gameArea.canvas.height - 60;

    document.getElementById("gameOverMessage").style.display = "none";
    document.getElementById("restartButton").style.display = "none";

    clearInterval(createEnemyInterval);
    clearInterval(createSpecialCollectibleInterval);
    createEnemyInterval = setInterval(createEnemy, 2000);
    createSpecialCollectibleInterval = setInterval(createSpecialCollectible, specialCollectibleFrequency);

    gameArea.start();
}

// Event listeners for game start and restart
document.getElementById("startGameButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", restartGame);