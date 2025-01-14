/****************************************
 *            GAME STATE VARIABLES
 ****************************************/

// Home screen / game start
let gameRunning = false;

// High scores
const maxHighScores = 5;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const startGameButton = document.getElementById('start-game');
const gameContainer = document.getElementById('game-container');
const scoresList = document.getElementById('scores-list');
const playerNameInput = document.getElementById('player-name');

// Game Over
let gameOver = false;

/****************************************
 *            GAME VARIABLES
 ****************************************/

// Game container size (dynamic)
let containerWidth = 512;
let containerHeight = 512;

// Ship
let ship = {
    element: null,
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 10
};

// Aliens
let aliens = [];
let alienWidth = 40;
let alienHeight = 40;
let alienRows = 2;
let alienColumns = 3;
let alienSpeedX = 1.5;
const alienImages = ['images/red.png', 'images/yellow.png', 'images/green.png', 'images/extra.png'];
let alienCount = 0;

// Boss
let bossActive = false;
let boss = {
    element: null,
    x: 0,
    y: 0,
    width: 120,
    height: 120,
    health: 0,
    maxHealth: 0,
    speedX: 1.5
};

// Buildings (for boss levels)
let buildings = [];

// Bullets
let bullets = [];
let bulletSpeedY = -10;

// Enemy bullets
let enemyBullets = [];
let enemyBulletSpeedY = 5;

// Boss bullets
let bossBullets = [];
let bossBulletSpeedY = 3;

// Level, Score, Lives
let level = 1;
let score = 0;
let lives = 3;

// Health bar
let health = 100;
const maxHealth = 100;

// Key states
let leftKeyPressed = false;
let rightKeyPressed = false;
let spaceKeyPressed = false;

// Rate-limiting for shooting
let lastShootTime = 0;
const shootCooldown = 200; // ms

// Boss bullet timing
let lastBossFireTime = 0;
let bossFireCooldown = 800; // ms => boss fires more frequently

// Healing threshold
let healCheckpoint = 1000;

/****************************************
 *         INITIAL SETUP / HOME SCREEN
 ****************************************/
window.onload = function () {
    // Initialize game container size
    updateContainerSize();

    // Show any existing high scores
    displayHighScores();

    // Setup Start Game button
    startGameButton.addEventListener('click', startGame);

    // Setup Key listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Setup Mobile Controls
    setupMobileControls();

    // Update container size on window resize
    window.addEventListener('resize', updateContainerSize);
};

/****************************************
 *            START GAME
 ****************************************/
function startGame() {
    // Make sure player name is entered
    const trimmedName = playerNameInput.value.trim();
    if (!trimmedName) {
        alert('Please enter your name before starting!');
        return;
    }

    // Hide home screen, show game container
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    resetGame();

    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset essential variables
    gameOver = false;
    score = 0;
    level = 1;
    lives = 3;
    health = maxHealth;
    healCheckpoint = 1000;

    // Grab the ship element if not already
    if (!ship.element) {
        ship.element = document.getElementById('ship');
    }

    // Update container size variables
    updateContainerSize();

    // Calculate ship size based on container
    ship.width = ship.element.offsetWidth;
    ship.height = ship.element.offsetHeight;

    // Initialize ship position
    ship.x = containerWidth / 2 - ship.width / 2;
    ship.y = containerHeight - ship.height - 20; // 20px from bottom
    positionElement(ship.element, ship.x, ship.y);

    // Clear everything from previous run
    removeAllAliens();
    removeAllBullets();
    removeAllBuildings();

    // Create initial wave
    createAliens();

    // Update scoreboard and health bar
    updateScoreboard();
    updateHealthBar();

    // Hide game over message if visible
    document.getElementById('game-over').style.display = 'none';
}

/****************************************
 *            GAME LOOP
 ****************************************/
function gameLoop() {
    if (!gameRunning) return;
    if (gameOver) return;

    requestAnimationFrame(gameLoop);

    moveShip();

    if (bossActive) {
        updateBoss();
        maybeFireBossBullet();
    } else {
        updateAliens();
        maybeFireEnemyBullet();
    }

    attemptShootBullet();

    updateBullets();
    updateEnemyBullets();
    updateBossBullets();

    updateBuildingCollisions();

    cleanBullets();

    updateScoreboard();
    updateHealthBar();

    checkForScoreHeal();
}

/****************************************
 *        CREATE & UPDATE ALIENS
 ****************************************/
function createAliens() {
    aliens = [];
    alienCount = 0;

    for (let r = 0; r < alienRows; r++) {
        for (let c = 0; c < alienColumns; c++) {
            let alienX = 50 + c * (alienWidth + 10);
            let alienY = 50 + r * (alienHeight + 10);

            let alienEl = document.createElement('img');
            alienEl.classList.add('alien');
            alienEl.src = getRandomAlienImage();
            positionElement(alienEl, alienX, alienY);
            gameContainer.appendChild(alienEl);

            aliens.push({
                element: alienEl,
                x: alienX,
                y: alienY,
                width: alienWidth,
                height: alienHeight,
                alive: true
            });
            alienCount++;
        }
    }
}

function updateAliens() {
    let shouldReverse = false;

    for (let i = 0; i < aliens.length; i++) {
        let alien = aliens[i];
        if (!alien.alive) continue;

        alien.x += alienSpeedX;

        // Check for boundary collision
        if (alien.x + alien.width >= containerWidth || alien.x <= 0) {
            shouldReverse = true;
        }

        // Check if alien reaches ship row
        if (alien.y + alien.height >= ship.y) {
            setGameOver();
            return;
        }

        positionElement(alien.element, alien.x, alien.y);
    }

    if (shouldReverse) {
        alienSpeedX *= -1;
        for (let j = 0; j < aliens.length; j++) {
            let alien = aliens[j];
            if (alien.alive) {
                alien.y += 10;
                positionElement(alien.element, alien.x, alien.y);
                // Check again if aliens have reached the ship after moving down
                if (alien.y + alien.height >= ship.y) {
                    setGameOver();
                    return;
                }
            }
        }
    }

    // All aliens destroyed => next level
    if (alienCount <= 0) {
        nextLevel();
    }
}

/****************************************
 *              BOSS LOGIC
 ****************************************/
function createBoss() {
    bossActive = true;

    boss.x = containerWidth / 2 - boss.width / 2;
    boss.y = 50;
    boss.health = 500 + 100 * level;
    boss.maxHealth = boss.health;
    boss.speedX = 2 + (level - 1) * 0.5;

    let bossEl = document.createElement('img');
    bossEl.src = getRandomAlienImage(); // Consider using a specific boss image
    bossEl.classList.add('alien', 'bossAlien');
    positionElement(bossEl, boss.x, boss.y);
    gameContainer.appendChild(bossEl);

    boss.element = bossEl;

    // Optionally, create buildings when boss appears
    createBuildings();
}

function updateBoss() {
    boss.x += boss.speedX;
    if (boss.x <= 0 || boss.x + boss.width >= containerWidth) {
        boss.speedX *= -1;
    }
    positionElement(boss.element, boss.x, boss.y);

    if (boss.health <= 0) {
        removeBoss();
        nextLevel();
    }
}

function removeBoss() {
    if (boss.element) {
        boss.element.remove();
    }
    bossActive = false;
}

/****************************************
 *            BUILDINGS
 ****************************************/
function createBuildings() {
    buildings = [];
    const buildingPositions = [
        { x: containerWidth * 0.3, y: containerHeight * 0.8 },
        { x: containerWidth * 0.7, y: containerHeight * 0.8 }
    ];

    for (let pos of buildingPositions) {
        let bEl = document.createElement('div');
        bEl.classList.add('building');
        positionElement(bEl, pos.x, pos.y);
        gameContainer.appendChild(bEl);

        buildings.push({
            element: bEl,
            x: pos.x,
            y: pos.y,
            width: 40,
            height: 40,
            hp: 50 // building HP
        });
    }
}

function updateBuildingCollisions() {
    // Check collisions of enemy and boss bullets with buildings
    for (let b of buildings) {
        if (b.hp <= 0) continue;

        // Enemy bullets
        for (let eb of enemyBullets) {
            if (!eb.used && checkCollision(b, eb)) {
                eb.used = true;
                b.hp -= 10;
                updateBuildingVisual(b);
            }
        }

        // Boss bullets
        for (let bb of bossBullets) {
            if (!bb.used && checkCollision(b, bb)) {
                bb.used = true;
                b.hp -= 15;
                updateBuildingVisual(b);
            }
        }

        // Destroy if HP <= 0
        if (b.hp <= 0) {
            b.element.remove();
        }
    }

    // Filter out destroyed buildings
    buildings = buildings.filter(b => b.hp > 0);
}

/** Change building color as HP drops */
function updateBuildingVisual(building) {
    const originalHP = 50; // Initial HP
    const ratio = building.hp / originalHP;
    if (ratio < 0.2) {
        building.element.style.backgroundColor = "#a00"; // near destroyed
    } else if (ratio < 0.5) {
        building.element.style.backgroundColor = "#cc6600"; // ~ half HP
    } else {
        building.element.style.backgroundColor = "#666"; // healthy
    }
}

/****************************************
 *      MULTI-BULLET FIRING (ALIENS)
 ****************************************/
function maybeFireEnemyBullet() {
    // Chance increases with level
    const chance = 0.02 * level;
    if (Math.random() < chance) {
        fireEnemyBullet();
    }
}

function fireEnemyBullet() {
    const liveAliens = aliens.filter(a => a.alive);
    if (liveAliens.length === 0) return;

    const randomAlien = liveAliens[Math.floor(Math.random() * liveAliens.length)];

    // 3-bullet horizontal spread
    const offsets = [-10, 0, 10];
    offsets.forEach(offsetX => {
        const bulletX = randomAlien.x + alienWidth / 2 - 3 + offsetX;
        const bulletY = randomAlien.y + alienHeight;

        const bulletEl = document.createElement('div');
        bulletEl.classList.add('enemy-bullet');
        positionElement(bulletEl, bulletX, bulletY);
        gameContainer.appendChild(bulletEl);

        enemyBullets.push({
            element: bulletEl,
            x: bulletX,
            y: bulletY,
            width: 6,
            height: 20,
            used: false
        });
    });
}

/****************************************
 *      MULTI-BULLET FIRING (BOSS)
 ****************************************/
function maybeFireBossBullet() {
    const now = Date.now();
    if (now - lastBossFireTime > bossFireCooldown) {
        fireBossBullet();
        lastBossFireTime = now;
    }
}

function fireBossBullet() {
    // 3-bullet spread
    const bulletBaseX = boss.x + boss.width / 2 - 5;
    const bulletBaseY = boss.y + boss.height;
    const spread = [-30, 0, 30];

    spread.forEach(offset => {
        const bX = bulletBaseX + offset;
        const bY = bulletBaseY;

        const bulletEl = document.createElement('div');
        bulletEl.classList.add('boss-bullet');
        positionElement(bulletEl, bX, bY);
        gameContainer.appendChild(bulletEl);

        bossBullets.push({
            element: bulletEl,
            x: bX,
            y: bY,
            width: 10,
            height: 25,
            used: false
        });
    });
}

/****************************************
 *      PLAYER SHOOTING (WITH COOLDOWN)
 ****************************************/
function attemptShootBullet() {
    if (!spaceKeyPressed) return;

    const now = Date.now();
    if (now - lastShootTime > shootCooldown) {
        shootBullet();
        lastShootTime = now;
    }
}

function shootBullet() {
    const bulletEl = document.createElement('div');
    bulletEl.classList.add('bullet');

    const bulletX = ship.x + ship.width / 2 - 3;
    const bulletY = ship.y - 20;

    positionElement(bulletEl, bulletX, bulletY);
    gameContainer.appendChild(bulletEl);

    bullets.push({
        element: bulletEl,
        x: bulletX,
        y: bulletY,
        width: 6,
        height: 20,
        used: false
    });
}

/****************************************
 *     UPDATE PLAYER, ENEMY, & BOSS BULLETS
 ****************************************/
function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        if (bullet.used) continue;

        bullet.y += bulletSpeedY;
        positionElement(bullet.element, bullet.x, bullet.y);

        // Collisions with aliens or boss
        if (!bossActive) {
            for (let j = 0; j < aliens.length; j++) {
                const alien = aliens[j];
                if (alien.alive && checkCollision(bullet, alien)) {
                    bullet.used = true;
                    alien.alive = false;
                    alien.element.remove();
                    alienCount--;
                    score += 100;
                    break;
                }
            }
        } else {
            // Collide with boss
            if (checkCollision(bullet, boss)) {
                bullet.used = true;
                boss.health -= 10;
                score += 50;
            }
        }

        // Off-screen?
        if (bullet.y < 0) {
            bullet.used = true;
        }
    }
}

function updateEnemyBullets() {
    for (let i = 0; i < enemyBullets.length; i++) {
        let bullet = enemyBullets[i];
        if (bullet.used) continue;

        bullet.y += (enemyBulletSpeedY + (level - 1) * 0.5);
        positionElement(bullet.element, bullet.x, bullet.y);

        // Collide with player
        if (checkCollision(bullet, ship)) {
            bullet.used = true;
            takeDamage(20);
        }

        // Off-screen?
        if (bullet.y > containerHeight) {
            bullet.used = true;
        }
    }
}

function updateBossBullets() {
    for (let i = 0; i < bossBullets.length; i++) {
        let bullet = bossBullets[i];
        if (bullet.used) continue;

        bullet.y += (bossBulletSpeedY + (level - 1) * 0.3);
        positionElement(bullet.element, bullet.x, bullet.y);

        // Collide with player
        if (checkCollision(bullet, ship)) {
            bullet.used = true;
            takeDamage(30);
        }

        // Off-screen?
        if (bullet.y > containerHeight) {
            bullet.used = true;
        }
    }
}

/****************************************
 *          CLEAN UP USED BULLETS
 ****************************************/
function cleanBullets() {
    bullets = bullets.filter(b => {
        if (b.used) b.element.remove();
        return !b.used;
    });

    enemyBullets = enemyBullets.filter(b => {
        if (b.used) b.element.remove();
        return !b.used;
    });

    bossBullets = bossBullets.filter(b => {
        if (b.used) b.element.remove();
        return !b.used;
    });
}

/****************************************
 *        HEALTH & SCORE LOGIC
 ****************************************/
function takeDamage(amount) {
    health -= amount;
    if (health < 0) health = 0;
    updateHealthBar();

    if (health === 0) {
        lives--;
        if (lives > 0) {
            health = maxHealth;
            updateHealthBar();
        } else {
            setGameOver();
        }
    }
}

function heal(amount) {
    health += amount;
    if (health > maxHealth) {
        health = maxHealth;
    }
    updateHealthBar();
}

function checkForScoreHeal() {
    if (score >= healCheckpoint) {
        heal(10);
        healCheckpoint += 1000;
    }
}

/****************************************
 *              LIFE BAR
 ****************************************/
function updateHealthBar() {
    const lifeBarElement = document.getElementById('life-bar');
    const percentage = (health / maxHealth) * 100;
    lifeBarElement.style.width = `${percentage}%`;

    // Change color based on health
    if (percentage > 60) {
        lifeBarElement.style.backgroundColor = 'lime';
    } else if (percentage > 30) {
        lifeBarElement.style.backgroundColor = 'yellow';
    } else {
        lifeBarElement.style.backgroundColor = 'red';
    }
}

/****************************************
 *           HELPER FUNCTIONS
 ****************************************/
function positionElement(el, x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
}

function getRandomAlienImage() {
    return alienImages[Math.floor(Math.random() * alienImages.length)];
}

function handleKeyDown(e) {
    if (gameOver) return;
    if (e.code === 'ArrowLeft') leftKeyPressed = true;
    if (e.code === 'ArrowRight') rightKeyPressed = true;
    if (e.code === 'Space') spaceKeyPressed = true;
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft') leftKeyPressed = false;
    if (e.code === 'ArrowRight') rightKeyPressed = false;
    if (e.code === 'Space') spaceKeyPressed = false;
}

function moveShip() {
    if (leftKeyPressed && ship.x > 0) {
        ship.x -= ship.speed;
    }
    if (rightKeyPressed && ship.x + ship.width < containerWidth) {
        ship.x += ship.speed;
    }
    positionElement(ship.element, ship.x, ship.y);
}

function updateScoreboard() {
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('level').innerText = `Level: ${level}`;
    document.getElementById('lives').innerText = `Lives: ${lives}`;
}

/****************************************
 *           GAME OVER LOGIC
 ****************************************/
function setGameOver() {
    gameOver = true;
    document.getElementById('game-over').style.display = 'block';

    // Wait 2 seconds, then end game
    setTimeout(() => {
        document.getElementById('game-over').style.display = 'none';
        endGame();
    }, 2000);
}

function endGame() {
    gameRunning = false;

    // The name was already typed at the start
    const playerName = playerNameInput.value.trim();
    addHighScore(playerName, score);

    // Return to home screen
    homeScreen.style.display = 'flex';
    gameContainer.style.display = 'none';

    // Update high scores
    displayHighScores();
}

/****************************************
 *        HIGH SCORES LOGIC
 ****************************************/
function addHighScore(name, score) {
    highScores.push({ name, score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, maxHighScores);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() {
    scoresList.innerHTML = '';
    highScores.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.textContent = `${idx + 1}. ${entry.name} - ${entry.score}`;
        scoresList.appendChild(li);
    });
}

/****************************************
 *    NEXT LEVEL / BOSS SPAWN LOGIC
 ****************************************/
function nextLevel() {
    level++;
    removeAllAliens();
    removeAllBullets();
    removeAllBuildings();

    if (level % 3 === 0) {
        createBoss();
        createBuildings(); // Buildings appear on boss levels
    } else {
        alienRows = Math.min(alienRows + 1, 6);
        alienColumns = Math.min(alienColumns + 1, 6);
        alienSpeedX += 0.5;
        createAliens();
    }
}

/****************************************
 *          REMOVE ENTITIES
 ****************************************/
function removeAllAliens() {
    for (const alien of aliens) {
        if (alien.element) alien.element.remove();
    }
    aliens = [];
}

function removeAllBullets() {
    for (const bullet of bullets) {
        bullet.element.remove();
    }
    bullets = [];

    for (const bullet of enemyBullets) {
        bullet.element.remove();
    }
    enemyBullets = [];

    for (const bullet of bossBullets) {
        bullet.element.remove();
    }
    bossBullets = [];
}

function removeAllBuildings() {
    for (const b of buildings) {
        b.element.remove();
    }
    buildings = [];
}

/****************************************
 *       COLLISION DETECTION
 ****************************************/
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/****************************************
 *    MOBILE CONTROLS SETUP
 ****************************************/
function setupMobileControls() {
    // Get mobile control buttons
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const shootBtn = document.getElementById('shoot-btn');

    /*
     * Touch Control Handlers
     * These handlers simulate key presses by setting the corresponding key state variables.
     */

    // Left Button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevents default touch behaviors
        leftKeyPressed = true;
    });

    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        leftKeyPressed = false;
    });

    // Right Button
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        rightKeyPressed = true;
    });

    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        rightKeyPressed = false;
    });

    // Shoot Button
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        spaceKeyPressed = true;
    });

    shootBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        spaceKeyPressed = false;
    });
}

/****************************************
 *         INITIALIZING CONTAINER SIZE
 ****************************************/
function updateContainerSize() {
    const rect = gameContainer.getBoundingClientRect();
    containerWidth = rect.width;
    containerHeight = rect.height;
}

/****************************************
 *        NEXT LEVEL / BOSS SPAWN LOGIC
 ****************************************/
function nextLevel() {
    level++;
    removeAllAliens();
    removeAllBullets();
    removeAllBuildings();

    if (level % 3 === 0) {
        createBoss();
        createBuildings(); // Buildings appear on boss levels
    } else {
        alienRows = Math.min(alienRows + 1, 6);
        alienColumns = Math.min(alienColumns + 1, 6);
        alienSpeedX += 0.5;
        createAliens();
    }
}
