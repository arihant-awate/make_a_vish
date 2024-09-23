let bgMusic = document.getElementById('bgMusic');
let score = 0;

document.getElementById("startGame").addEventListener("click", function () {
  window.game.scene.keys["SnakeScene"].snake.resetGame();
});



class SnakeScene extends Phaser.Scene {
  constructor() {
    super({
      key: "SnakeScene"
    });
  }

  preload() {
    this.load.image("food", "assets/apple.svg");
    this.load.image("snakeRight", "assets5/head_right.png");
    this.load.image("snakeLeft", "assets5/head_left.png");
    this.load.image("snakeUp", "assets5/head_up.png");
    this.load.image("snakeDown", "assets5/head_down.png");
    this.load.image("bodyHorizontal", "assets5/body_horizontal.png");
    this.load.image("bodyVertical", "assets5/body_vertical.png");
    this.load.image("bodyRightUp", "assets5/body_rightup.png");
    this.load.image("bodyRightDown", "assets5/body_rightdown.png");
    this.load.image("bodyDownRight", "assets5/body_downright.png");
    this.load.image("bodyUpRight", "assets5/body_upright.png");
    this.load.image("tailRight", "assets5/tail_right.png");
    this.load.image("tailLeft", "assets5/tail_left.png");
    this.load.image("tailUp", "assets5/tail_up.png");
    this.load.image("tailDown", "assets5/tail_down.png");
    this.load.image("background", "images/go_screen.svg");


       // Background music
    this.load.audio('deathSound', './sounds/lost_sound.mp3'); // Snake death sound
    this.load.audio('eatSound', './sounds/catch_sound.mp3');
  }

  create() {
    
    
      

    let bg = this.add.image(0, 0, 'background');
    bg.displayWidth = this.sys.canvas.width;
    bg.displayHeight = this.sys.canvas.height;
    bg.setOrigin(0, 0);

    this.snake = new Snake(this, 400, 100);
    this.food = new Food(this, 400, 300);
    this.physics.world.enable(this.food);
    this.physics.world.enable(this.snake.body[0]);
    this.cursors = this.input.keyboard.createCursorKeys();

    // Ensure animations are correctly defined
    this.anims.create({
      key: 'moveUp',
      frames: [{ key: 'snakeUp' }],
    });
    this.anims.create({
      key: 'moveDown',
      frames: [{ key: 'snakeDown' }],
    });
    this.anims.create({
      key: 'moveLeft',
      frames: [{ key: 'snakeLeft' }],
    });
    this.anims.create({
      key: 'moveRight',
      frames: [{ key: 'snakeRight' }],
    });
  }

  update(time) {
    if (!this.snake.alive) return;

    let directions = {
      "left": Phaser.Math.Vector2.LEFT,
      "right": Phaser.Math.Vector2.RIGHT,
      "up": Phaser.Math.Vector2.UP,
      "down": Phaser.Math.Vector2.DOWN,
    };
    let animations = {
      "left": "moveLeft",
      "right": "moveRight",
      "up": "moveUp",
      "down": "moveDown",
    };

    for (let [direction, vector] of Object.entries(directions)) {
      if (this.cursors[direction].isDown) {
        this.snake.faceDirection(vector, animations[direction]);
      }
    }
    if (this.snake.update(time)) {
      if (this.physics.overlap(this.snake.body[0], this.food)) {
        this.food.reposition();
        this.snake.grow();
      }
    }
  }
}

class Snake {

  constructor(scene) {
    this.scene = scene;
    this.body = [];
    this.positions = [];
    this.directions = [];
    this.gameStarted = false;
    this.keyLock = false;
    this.moveEvents = [];
    this.bodyParts = [];

    const scale = 0.02; // Scale factor for snake parts

    // Initialize snake head with scaling
    this.body.push(this.scene.physics.add.sprite(100, 300, "snakeRight").setScale(scale));
    this.snakeHead = this.body[0];  // Store reference to snakeHead
    this.snakeHead.setCollideWorldBounds(true);
    this.snakeHead.body.onWorldBounds = true;
    this.snakeHead.body.world.on("worldbounds", this.endGame, this);

    this.bodyPartLength = this.snakeHead.displayWidth;
    this.body.push(this.scene.physics.add.sprite(100 - this.bodyPartLength, 300, "tailLeft").setScale(scale));
    this.direction = Phaser.Math.Vector2.RIGHT;
    this.directions.unshift(this.direction.clone());

    this.moveTime = 0;
    this.score = 0;
    this.speed = 400;
    this.alive = true;
  }

  faceDirection(vector, animation) {
    this.gameStarted = true;
    let oppositeVector = new Phaser.Math.Vector2(-vector.x, -vector.y);
    if (!this.keyLock && !this.direction.equals(oppositeVector)) {
      this.moveEvents.push(vector);
      this.keyLock = true;

      // Play the correct animation if it's defined
      if (this.snakeHead.anims && this.snakeHead.anims.animationManager.exists(animation)) {
        this.snakeHead.anims.play(animation, true);
      }
    }
  }

  update(time) {
    if (time >= this.moveTime && this.gameStarted) {
      this.keyLock = false;
      if (this.moveEvents.length > 0) {
        this.direction = this.moveEvents.shift();
      }
      this.move();
      return true;
    }
    return false;
  }

  move() {
    let oldHeadPosition = { x: this.snakeHead.x, y: this.snakeHead.y };
    this.directions.unshift(this.direction.clone());
    this.snakeHead.x += this.direction.x * this.bodyPartLength;
    this.snakeHead.y += this.direction.y * this.bodyPartLength;

    if (this.snakeHead.x > game.config.width || this.snakeHead.x < 0 || this.snakeHead.y > game.config.height || this.snakeHead.y < 0) {
      this.endGame();
      return;
    }

    // Check for self-collision before moving the body parts
    for (let i = 1; i < this.body.length; i++) {
      if (this.snakeHead.x === this.body[i].x && this.snakeHead.y === this.body[i].y) {
        this.endGame();
        return;
      }
    }

    for (let i = 1; i < this.body.length; i++) {
      let oldBodyPosition = { x: this.body[i].x, y: this.body[i].y };
      let oldBodyDirection = this.directions[i];
      this.body[i].x = oldHeadPosition.x;
      this.body[i].y = oldHeadPosition.y;
      oldHeadPosition = oldBodyPosition;
      this.setBodyPartTexture(i, oldBodyDirection);
    }
    this.setTailTexture();
    if (this.positions.length > this.body.length * this.bodyPartLength) {
      this.positions.pop();
      this.directions.pop();
    }

    this.moveTime = this.scene.time.now + this.speed;
  }



  setBodyPartTexture(i, oldBodyDirection) {
    if (!oldBodyDirection.equals(this.directions[i - 1])) {
      let prevDirection = `${this.directions[i - 1].x},${this.directions[i - 1].y}`;
      let currDirection = `${oldBodyDirection.x},${oldBodyDirection.y}`;
      let textureMap = {
        "1,0,0,-1": "bodyUpRight",
        "0,1,-1,0": "bodyUpRight",
        "-1,0,0,1": "bodyRightUp",
        "0,-1,1,0": "bodyRightUp",
        "0,1,1,0": "bodyRightDown",
        "-1,0,0,-1": "bodyRightDown",
        "0,-1,-1,0": "bodyDownRight",
        "1,0,0,1": "bodyDownRight",
      };
      let directionKey = `${prevDirection},${currDirection}`;
      this.body[i].setTexture(textureMap[directionKey]).setScale(0.02);
    } else {
      if (oldBodyDirection.y != 0) {
        this.body[i].setTexture("bodyVertical").setScale(0.02);
      } else {
        this.body[i].setTexture("bodyHorizontal").setScale(0.02);
      }
    }
  }

  setTailTexture() {
    let tailIndex = this.body.length - 1;
    if (tailIndex > 0) {
      let prevDirection = this.directions[tailIndex - 1];
      let textureMap = {
        "0,-1": "tailDown",
        "0,1": "tailUp",
        "-1,0": "tailRight",
        "1,0": "tailLeft",
      };
      let directionKey = `${prevDirection.x},${prevDirection.y}`;
      this.body[tailIndex].setTexture(textureMap[directionKey]).setScale(0.02);
    }
  }

  grow() {
    this.scene.sound.play('eatSound');
    const scale = 0.02; // Scale factor to reduce size
    let newPart = this.scene.physics.add.sprite(-1 * this.bodyPartLength, -1 * this.bodyPartLength, "tailRight").setScale(scale);
    this.body.push(newPart);
    score++;
    document.getElementById("scoreNumber").innerHTML = score;
  }

  endGame() {
    this.alive = false;
    // Stop the background music
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        bgMusic.currentTime = 0; // Reset to the beginning if needed
    }
    this.scene.sound.play('deathSound');
    // Hide the game control panel
    document.getElementById("gameControlPanel").style.display = "none";

    // Create and display the game over image
    const gameOverImage = document.createElement("img");
    gameOverImage.src = "./assets/game_over_image.svg"; // Path to your game over image
    gameOverImage.id = "gameOverImage";
    gameOverImage.style.position = "absolute";
    gameOverImage.style.top = "50%";
    gameOverImage.style.left = "50%";
    gameOverImage.style.transform = "translate(-50%, -50%)";
    gameOverImage.style.zIndex = "10"; // Ensure it appears on top of other elements
    gameOverImage.style.width = "70%"; // Adjust the width as needed
    gameOverImage.style.height = "auto";
    document.body.appendChild(gameOverImage);

    // Create the left button (Positioned inside the "Kapow" area)
    const leftButton = document.createElement("button");
    leftButton.id = "leftButton";
    leftButton.style.position = "absolute"; // Position relative to the container
    leftButton.style.left = "33%"; // Adjust to match the "Kapow" area
    leftButton.style.top = "34%"; // Adjust to match the "Kapow" area
    leftButton.style.width = "180px"; // Adjust width as needed
    leftButton.style.height = "180px"; // Adjust height as needed
    leftButton.style.backgroundImage = "url('./assets/restart_button.svg')"; // Path to the left button image
    leftButton.style.backgroundSize = "contain";
    leftButton.style.backgroundRepeat = "no-repeat";
    leftButton.style.backgroundColor = "transparent"; // Make background transparent
    leftButton.style.border = "none";
    leftButton.style.cursor = "pointer";
    leftButton.style.zIndex = "11"; // Ensure it's above the game over image

    // Debounce the click event to ensure it's only processed once
    let clickHandled = false;

    leftButton.addEventListener('click', () => {
        if (!clickHandled) {
            clickHandled = true;
            this.resetGame(); // Call the resetGame method
            bgMusic.play();
            // Immediately remove the game over elements after resetting the game
            gameOverImage.remove(); // Remove the game over image
            leftButton.remove();    // Remove the left button
            rightButton.remove();   // Remove the right button

            clickHandled = false;
        }
    });



    // Create the right button (Positioned inside the "Kapow" area)
    const rightButton = document.createElement("button");
    rightButton.id = "rightButton";
    rightButton.style.position = "absolute"; // Position relative to the container
    rightButton.style.left = "52%"; // Adjust to match the "Kapow" area
    rightButton.style.top = "34%"; // Adjust to match the "Kapow" area
    rightButton.style.width = "200px"; // Adjust width as needed
    rightButton.style.height = "200px"; // Adjust height as needed
    rightButton.style.backgroundImage = "url('./assets/go_to_go.svg')"; // Path to the right button image
    rightButton.style.backgroundSize = "contain";
    rightButton.style.backgroundRepeat = "no-repeat";
    rightButton.style.backgroundColor = "transparent"; // Make background transparent
    rightButton.style.border = "none";
    rightButton.style.cursor = "pointer";
    rightButton.style.zIndex = "11"; // Ensure it's above the game over image


    rightButton.addEventListener('click', () => {
      window.location.href = 'go_screen.html';
  });
    // Append the buttons to the body (they will appear above the image)
    document.body.appendChild(leftButton);
    document.body.appendChild(rightButton);
}


  resetGame() {
    // Clear existing snake parts
    this.body.forEach(part => part.destroy());
    this.body = [];

    // Reinitialize snake with scaling
    const scale = 0.02; // Scale factor to reduce size
    this.body.push(this.scene.physics.add.sprite(100, 300, "snakeRight").setScale(scale));
    this.snakeHead = this.body[0];
    this.snakeHead.setCollideWorldBounds(true);
    this.snakeHead.body.onWorldBounds = true;

    this.bodyPartLength = this.snakeHead.displayWidth;
    this.body.push(this.scene.physics.add.sprite(100 - this.bodyPartLength, 300, "tailLeft").setScale(scale));
    this.direction = Phaser.Math.Vector2.RIGHT;
    this.directions = [this.direction.clone()];

    this.moveTime = 0;
    this.alive = true;

    score = 0;
    document.getElementById("scoreNumber").innerHTML = score;

    // Remove the game over image if it exists
    const gameOverImage = document.getElementById("gameOverImage");
    if (gameOverImage) {
        gameOverImage.remove(); // Remove the game over image
    }

    // Remove the left button if it exists
    const leftButton = document.getElementById("leftButton");
    if (leftButton) {
        leftButton.remove(); // Remove the left button
    }

    // Remove the right button if it exists
    const rightButton = document.getElementById("rightButton");
    if (rightButton) {
        rightButton.remove(); // Remove the right button
    }

    // Hide the control panel (if applicable)
    document.getElementById("gameControlPanel").style.display = "none";
  }
}

class Food extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "food");
    this.scene.add.existing(this);
    this.setScale(0.2); // Apply larger scale to food
  }

  reposition() {
    let bodyPartLength = this.scene.snake.bodyPartLength;
    let x = Phaser.Math.Between(0, (this.scene.game.config.width / bodyPartLength) - 1);
    let y = Phaser.Math.Between(0, (this.scene.game.config.height / bodyPartLength) - 1);
    x = bodyPartLength * x + 0.5 * bodyPartLength;
    y = bodyPartLength * y + 0.5 * bodyPartLength;
    this.setPosition(x, y);
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
    },
  },
  render: {
    pixelArt: false, // Set to true if you're working with pixel art and want crisp scaling
    antialias: true, // Enable anti-aliasing for smoother scaling
  },
  scene: [SnakeScene],
  parent: 'gameContainer',
  backgroundColor: '#000'
};

window.game = new Phaser.Game(config);
