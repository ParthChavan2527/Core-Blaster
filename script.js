const canvas = document.querySelector('canvas');
canvas.height = innerHeight;
canvas.width = innerWidth;

const ctx = canvas.getContext('2d');

const updateScore = document.querySelector('#updateScore');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEL = document.querySelector('#modalEL');
const finalScore = document.querySelector('#finalScore');

// Game Sounds : 
const shootSound = new Audio('./GameSounds/lserShoot.wav');
const enemyCollideSound = new Audio('./GameSounds/enemy-collide1.wav');
const gameOverSound = new Audio('./GameSounds/mixkit-musical-game-over-959.wav');

let score = 0;

//Objects : 

const playerProps = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 15,
  color: 'white',
}

const weapon = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 5,
  color: 'white',
  // velocity is independent for each projectile
}

// Classes : 

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const friction = 0.97

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha,
      ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

// Arrays : 

let player = new Player(playerProps.x, playerProps.y, playerProps.size, playerProps.color);
let projectiles = [];
let enemies = [];
let particles = [];

// play sound function

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}


//init function

function init(){
  player = new Player(playerProps.x, playerProps.y, playerProps.size, playerProps.color);
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0; 
  updateScore.innerHTML = score;
  finalScore.innerHTML = score;
  startGameBtn.innerHTML = "Start Game"
}

// create enemies : 

function spawnEnemies() {
  setInterval(() => {
    const max = 40;
    const min = 20;

    let size = Math.random() * (max - min) + min;

    let x;
    let y;

  //spawning enemies randomly outside of the canvas

    if (Math.random() <= 0.5) {
      x = Math.random() <= 0.5 ? 0 - size : size + canvas.width;
      y = Math.random() * canvas.height;
      console.log("spawned on y axis")
    }
    else {
      x = Math.random() * canvas.width;
      y = Math.random() <= 0.5 ? 0 - size : size + canvas.height;
      console.log("spawned on x axis")
    }

    const angle = Math.atan2(
      canvas.height / 2 - y, canvas.width / 2 - x
    )

    const enemyVelocity = {
      x: 1,
      y: 1,
    }

    enemyVelocity.x = Math.cos(angle);
    enemyVelocity.y = Math.sin(angle);

    const color = `hsl(${Math.random() * 360} , 50% , 50%)`

    let enemy = new Enemy(x, y, size, color, enemyVelocity);
    enemies.push(enemy);
  }, 1500)
}

//animation id for pausing the screen upon collision

let animationId;

// Game loop : 
const animate = () => {
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();
  //exploding particles
  particles.forEach((particle, idx) => {
    if (particle.alpha <= 0) {
      particles.splice(idx, 1);
    }
    else {
      particle.update();
    }
  })
  // projectiles : 
  projectiles.forEach(projectile => {
    projectile.update();
  });
  // spawning enemies : 
  enemies.forEach((enemy, enemyIdx) => {
    enemy.update();

    // when game ends : 
    const dist1 = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist1 - player.radius - enemy.radius < 1) {
      cancelAnimationFrame(animationId);
      modalEL.style.display = 'flex';
      finalScore.innerHTML = score;
      startGameBtn.innerHTML = "Reset Game";
      // play game over sound : 

      playSound(gameOverSound);
    }
    projectiles.forEach((projectile, projectileIdx) => {

      // projectile hitting the enemy

      const dist2 = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      if (dist2 - projectile.radius - enemy.radius < 1) {
        // Explosion particles
        for (let i = 0; i < enemy.radius/2; i++) {
          particles.push(new Particle(projectile.x, projectile.y, Math.random()*3, enemy.color, {
            x: (Math.random() - 0.5) * (6*Math.random()),
            y: (Math.random() - 0.5) * (6*Math.random()),
          }));
        }

        // Shrink or destroy enemy
        if (enemy.radius > 15) {
          score += 100;
          updateScore.innerHTML = score;
          gsap.to(enemy, {
            radius: enemy.radius -= 10,
          });
          setTimeout(() => {
            projectiles.splice(projectileIdx, 1);
          }, 0);
        } else {
          score += 250;
          updateScore.innerHTML = score;
          setTimeout(() => {
            enemies.splice(enemyIdx, 1);
            projectiles.splice(projectileIdx, 1);
          }, 0);
        }

        playSound(enemyCollideSound);
      }
    });

  });
}

//Events : 

// addEventListener('resize' , ()=>{
//   canvas.width = innerWidth;
//   canvas.height = innerHeight;

// })

startGameBtn.addEventListener('click' , ()=>{
  init(); 
  animate(); 
  spawnEnemies();
  modalEL.style.display = 'none';
  event.stopPropagation();
})
//Shooting projectiles
addEventListener('click', (e) => {
  const angle = Math.atan2(
    e.clientY - weapon.y, e.clientX - weapon.x
  );

  // Calculate new velocity for the clicked position
  const velocity = {
    x: 5 * Math.cos(angle),
    y: 5 * Math.sin(angle)
  };

  const projectile1 = new Projectile(
    weapon.x,
    weapon.y,
    weapon.size,
    weapon.color,
    velocity // Use the newly created velocity object
  );

  projectiles.push(projectile1);

  //play shooting sound

  playSound(shootSound);
});

// Resizing the canvas accordingly

// Update canvas size and reposition elements when the window is resized
addEventListener('resize', () => {
  // Save current canvas width and height
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Resize the canvas to the new window dimensions
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  // Recalculate player's position relative to the new canvas size
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  // Adjust projectiles and enemies based on the new canvas size
  projectiles.forEach((projectile) => {
      // Scale projectile position relative to the new size
      projectile.x = (projectile.x / canvasWidth) * canvas.width;
      projectile.y = (projectile.y / canvasHeight) * canvas.height;
  });

  enemies.forEach((enemy) => {
      // Scale enemy position relative to the new size
      enemy.x = (enemy.x / canvasWidth) * canvas.width;
      enemy.y = (enemy.y / canvasHeight) * canvas.height;
  });
});

