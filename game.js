// utility functions
function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
// selecting elements
const score = document.getElementById('score');
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const startBtn = document.getElementsByClassName('startBtn');
var startmusic = new Audio('startGame.mp3');
var music = new Audio('music.mp3');
var shootMusic = new Audio('shoot.mp3');
var shrinkMusic = new Audio('shrink.mp3');
var enemyExplode = new Audio('explode1.mp3');
var playerExplode = new Audio('explode2.mp3');
var overMusic = new Audio('endGame.mp3');
music.loop = 'true';
canvas.width = innerWidth;
canvas.height = innerHeight;

modalEnd.style.display = 'none';
// creating classes for player enemies shooting particle
class Player {
    constructor(x, y, radius, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}
class Projectile {
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}
class Enemy {
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}
let friction = 0.99;
class ParticleEnemy {
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw(){
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update(){
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

let x = canvas.width / 2;
let y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
// creating all arrays
let projectiles = [];
let enemies = [];
let particles = [];

// init function where everything is reset
function init(){
    player = new Player(x, y, 15, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    scoreVar = 0;
    score.innerText = 0;
}
// spawning enemies
function spawnEnemies(){
    setInterval(() => {
        let radius = randomIntFromRange(10, 30);
        let x;
        let y;
        if(Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
            color = `hsl(${randomIntFromRange(0, 360)}, 50%, 50%)`;
        let angle = Math.atan2(
            canvas.height / 2 - y, 
            canvas.width / 2 -x)
        let velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

// animating the game.
let animationId;
let scoreVar = 0;
function animate(){
    animationId = requestAnimationFrame(animate);
    c.fillStyle = `rgba(0, 0, 0, 0.1)`
    c.fillRect(0, 0, canvas.width, canvas.height);
    // here is the player
    player.draw();
    // enemy distroy particle
    particles.forEach((particle, index) =>{
        if(particle.alpha <= 0){
            particles.splice(index, 1);
        } else {
        particle.update();
        }
    })
    // shooting projectiles
    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();
        // remove from edges of screen
        if(projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height){
            setTimeout(() => {
                projectiles.splice(projectileIndex, 1);
            }, 0);
        }
    });
    // enemies
    enemies.forEach((enemy, index) => {
        enemy.update();
        const distPlayEnemy = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // game ended
        if(distPlayEnemy - enemy.radius - player.radius < 1){
            cancelAnimationFrame(animationId);
            modalEnd.style.display = 'flex';
            scoreModal.innerText = scoreVar;
            setTimeout(() => {
                playerExplode.play();
                overMusic.play();
            }, 0);
        }
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(dist - enemy.radius - projectile.radius < 1){
                // when projectiles touch enemy
                // create explosion
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new ParticleEnemy(projectile.x, 
                        projectile.y, 
                        randomIntFromRange(1, 2),
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 8),
                            y: (Math.random() - 0.5) * (Math.random() * 8)
                        }))
                }
                if(enemy.radius - 10> 10){
                    // increase our score
                    scoreVar += 100;
                    score.innerText = scoreVar;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(() => {
                        shrinkMusic.play();
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    // remove from scene altogether
                scoreVar += 250;
                score.innerText = scoreVar;
                setTimeout(() => {
                    enemyExplode.play();
                    enemies.splice(index, 1);
                    projectiles.splice(projectileIndex, 1);
                }, 0);
            }
            }
        })
    })
}
addEventListener('click', ()=>{
    let angle = Math.atan2(
        event.clientY - canvas.height / 2, 
        event.clientX - canvas.width / 2)
    let velocity = {
        x: Math.cos(angle) * 8,
        y: Math.sin(angle) * 8
    }
    setTimeout(() => {
        shootMusic.play();
    }, 0);
    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
})
Array.from(startBtn).forEach(elem => {
    elem.addEventListener('click', ()=>{
        init();
        animate();
        spawnEnemies();
        modalStart.style.display = 'none';
        modalEnd.style.display = 'none';
        startmusic.play();
        music.play();
    })
})