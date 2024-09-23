const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let leftSnake;
let rightSnake;
let cursors;
let wasd;
let obstacles;
let score = 0;
let scoreText;
const spawnInterval = 3000; // 2 seconds between obstacle sets
const minObstacleDistance = 300; // Increased minimum vertical distance between obstacles
let startGame = false; // Flag to check if the game has started
let gameOverFlag = false;
let leftButton, rightButton, gameOverImage;

let bgMusic, deathSound, collectSound;

// Placeholder for lane positions - replace these values with the correct X-coordinates
const lanes = [
    500,  // X-coordinate of the first lane (left snake)
    630,  // X-coordinate of the second lane (left snake)
    770,  // X-coordinate of the first lane (right snake)
    890   // X-coordinate of the second lane (right snake)
];

function preload() {
    this.load.image('background', './images/og_screen.svg');
    this.load.image('green1', './images/green_1.png');
    this.load.image('green2', './images/green_2.png');
    this.load.image('green3', './images/green_3.png');
    this.load.image('green4', './images/green_4.png');
    this.load.image('orange1', './images/orange_1.png');
    this.load.image('orange2', './images/orange_2.png');
    this.load.image('orange3', './images/orange_3.png');
    this.load.image('orange4', './images/orange_4.png');
    this.load.image('poison', './go_version/poison.svg');
    this.load.image('bomb', './go_version/bomb.svg');
    this.load.image('startImage', './go_version/rules.png'); // Load start screen image
    this.load.image('gameOverImage', './assets/game_over_image.svg'); // Load game over image
    this.load.image('restartButton', './assets/restart_button.svg'); // Load left button image
    this.load.image('goButton', './go_version/og_version.png'); // Load right button image

    // Load sounds
    this.load.audio('bgMusic', './sounds/og_music.mp3'); // Background music
    this.load.audio('deathSound', './sounds/lost_sound.mp3'); // Snake death sound
    this.load.audio('collectSound', './sounds/catch_sound.mp3'); // Item collection sound
}

function create() {
    // Create the background music and play it in a loop
    bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.5 });
    bgMusic.play();

    // Create other sounds
    deathSound = this.sound.add('deathSound');
    collectSound = this.sound.add('collectSound');

    // Create a black background
    const blackBackground = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000).setOrigin(0, 0);

    // Display the start image
    const startImage = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'startImage');
    startImage.setDisplaySize(window.innerWidth * 1, window.innerHeight * 1);

    // Listen for spacebar press to start the game
    this.input.keyboard.on('keydown-SPACE', () => {
        if (!startGame) {
            startGame = true;
            blackBackground.destroy();
            startImage.destroy();
            startGameScene.call(this); // Start the game
        }
    });
}

function startGameScene() {
    // Background image
    const bg = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'background');
    bg.setDisplaySize(window.innerWidth, window.innerHeight);

    // Create animations for green and orange snakes
    this.anims.create({
        key: 'green_move',
        frames: [{ key: 'green1' }, { key: 'green2' }, { key: 'green3' }, { key: 'green4' }],
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'orange_move',
        frames: [{ key: 'orange1' }, { key: 'orange2' }, { key: 'orange3' }, { key: 'orange4' }],
        frameRate: 10,
        repeat: -1
    });

    // Initialize snakes
    leftSnake = this.physics.add.sprite(lanes[0], window.innerHeight - 100, 'green1').setScale(0.015);
    leftSnake.play('green_move');
    rightSnake = this.physics.add.sprite(lanes[2], window.innerHeight - 100, 'orange1').setScale(0.015);
    rightSnake.play('orange_move');

    obstacles = this.physics.add.group();
    wasd = this.input.keyboard.addKeys({ left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D });
    cursors = this.input.keyboard.createCursorKeys();

    scoreText = this.add.text(160, 90, '0', { fontFamily: 'Freckle Face', fontSize: '50px', fill: '#000' });

    this.time.addEvent({ delay: 1000, callback: addPoisonObstacle, callbackScope: this, loop: true });
    this.time.addEvent({ delay: spawnInterval, callback: spawnObstacleSet, callbackScope: this, loop: true });

    this.physics.add.overlap(leftSnake, obstacles, handleCollision, null, this);
    this.physics.add.overlap(rightSnake, obstacles, handleCollision, null, this);
}

function update() {
    if (!startGame || gameOverFlag) return; // Do nothing if the game hasn't started or it's game over

    // Handle snake movements and collisions as before
    if (wasd.left.isDown && leftSnake.x > lanes[0]) {
        leftSnake.setX(lanes[0]);
    } else if (wasd.right.isDown && leftSnake.x < lanes[1]) {
        leftSnake.setX(lanes[1]);
    }

    if (cursors.left.isDown && rightSnake.x > lanes[2]) {
        rightSnake.setX(lanes[2]);
    } else if (cursors.right.isDown && rightSnake.x < lanes[3]) {
        rightSnake.setX(lanes[3]);
    }

    obstacles.children.iterate(obstacle => {
        if (obstacle.y > window.innerHeight && obstacle.texture.key === 'poison') {
            gameOver.call(this);
        }
    });
}

function addPoisonObstacle() {
    const lane = Phaser.Math.Between(0, 3);

    // Ensure there's no bomb already in this lane
    if (!isLaneOccupied(lane)) {
        const obstacle = obstacles.create(lanes[lane], 10, 'poison');
        obstacle.setScale(0.2).setVelocityY(200).setCollideWorldBounds(false).setBounce(0);
    }
}

function spawnObstacleSet() {
    // First, pick the lane for the first bomb
    const lane1 = Phaser.Math.Between(0, 3);

    // Now, pick the second lane, ensuring it's not immediately next to the first lane
    let lane2;
    do {
        lane2 = Phaser.Math.Between(0, 3);
    } while (lane1 === lane2 || Math.abs(lane1 - lane2) === 1);

    // Spawn obstacles in the selected lanes
    addBombObstacle(lane1);
    addBombObstacle(lane2);
}

function addBombObstacle(lane) {
    if (!isLaneOccupied(lane)) {
        const obstacle = obstacles.create(lanes[lane], 10, 'bomb');
        obstacle.setScale(0.2).setVelocityY(200).setCollideWorldBounds(false).setBounce(0);
    }
}

function isLaneOccupied(lane) {
    let occupied = false;
    obstacles.children.iterate(function (obstacle) {
        if (obstacle.x === lanes[lane] && obstacle.y < minObstacleDistance) {
            occupied = true;
        }
    });
    return occupied;
}

function handleCollision(snake, obstacle) {
    if (obstacle.texture.key === 'poison') {
        score += 1;
        scoreText.setText(score);
        collectSound.play(); // Play item collection sound
        obstacle.destroy();
    } else if (obstacle.texture.key === 'bomb') {
        gameOver.call(this);
    }
}

function gameOver() {
    gameOverFlag = true;
    this.physics.pause();

    // Stop the background music
    bgMusic.stop();

    // Play the snake death sound
    deathSound.play();

    // Display the game over image
    gameOverImage = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'gameOverImage');
    gameOverImage.setDisplaySize(window.innerWidth * 0.8, window.innerHeight * 0.8);

    // Create the left and right buttons with images as textures and scale them down
    leftButton = this.add.image(window.innerWidth / 2 - 170, window.innerHeight / 2 + 0, 'restartButton').setInteractive().setScale(0.4);
    rightButton = this.add.image(window.innerWidth / 2 + 150, window.innerHeight / 2 + 0, 'goButton').setInteractive().setScale(0.04);

    // Handle button clicks
    leftButton.on('pointerdown', () => {
        // Hide the right button and game over image
        rightButton.setVisible(false);
        gameOverImage.setVisible(false);
    
        // Optionally, you can also disable the interactivity of the right button
        rightButton.disableInteractive();
    
        // Reset the game
        resetGame.call(this);
        bgMusic.play(); // Restart the background music
    });

    rightButton.on('pointerdown', () => {
        // Redirect to the og_screen.html page
        window.location.href = 'og_screen.html';
    });
}

function resetGame() {
    // Hide the game over image and buttons
    gameOverImage.setVisible(false);
    leftButton.setVisible(false);
    rightButton.setVisible(false);

    // Reset variables
    gameOverFlag = false;
    score = 0;
    scoreText.setText(score);

    // Clear obstacles
    obstacles.clear(true, true);

    // Reset snakes
    leftSnake.setX(lanes[0]);
    leftSnake.setY(window.innerHeight - 100);
    rightSnake.setX(lanes[2]);
    rightSnake.setY(window.innerHeight - 100);

    // Resume physics
    this.physics.resume();

    // Restart the obstacle spawning
    this.time.addEvent({ delay: 1000, callback: addPoisonObstacle, callbackScope: this, loop: true });
    this.time.addEvent({ delay: spawnInterval, callback: spawnObstacleSet, callbackScope: this, loop: true });
}
