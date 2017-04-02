var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");

var points = 0, // Количество очков
    high = 0, // Рекорд
    state = 2, // Состояние - 2 - Меню
    select = 0,
    win = false,
    sumOfCoins = 0, // Количество монет
    soundJump = new Audio("sound/jump-small.mp3"),
    soundJumpSuper = new Audio("sound/jump-super.mp3"),
    soundCoin = new Audio("sound/coin.mp3"),
    soundDie = new Audio("sound/die.mp3"),
    soundPause = new Audio("sound/pause.mp3"),
    soundPowerUp = new Audio("sound/powerup.mp3"),
    music = new Audio("sound/music.mp3"),
    musicUnderground = new Audio("sound/underground.mp3");

var mobile;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    mobile = true;
}

window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame   || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function(/* function */ callback, /* DOMElement */ element){
             window.setTimeout(callback, 1000 / 50);
        };
})();

changeWorld(0);
soundJump.volume = 0.7;

var width = window.innerWidth,
    height = window.innerHeight;

window.onresize = function () {
    width = window.innerWidth,
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}   

canvas.width = width;
canvas.height = height;

var smallCoin = new Image(),
    smallCoinWidth = 10,
    smallCoinHeight = 16;
smallCoin.src = imageSmallCoin;

//Начало - загрузка шрифта
window.onload = function () {
    WebFontConfig = {
        custom: {
            families: ['Press Start 2P'],
            urls: ['fonts.css']
        },
        active: function () {
            fontsReady = true;
            changeWorld(0);
            StartMenu();
        }
    };
    (function () {
        var wf = document.createElement('script');
        wf.type = 'text/javascript';
        wf.src = 'js/webfontloader.js';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();
    // if (localStorage.getItem('highPoint')) {
    //     high = localStorage.getItem('highPoint');
    // }
    
}
//Конец - загрузка шрифта

// Начало - Полифилл для поддержки requestAnimationFrame
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
        || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
        timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());
// Конец - Полифилл для поддержки requestAnimationFrame

// Очистка экрана
function clear() {
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fill();
}

// Вывод статистики
function stats () {
    this.image = new Image();
    this.image.src = imageStats;
    ctx.fillStyle = ctx.createPattern(this.image, "repeat");
    ctx.fillRect(0, 0, canvas.width, 48);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top"
    ctx.textAlign = "left";
    ctx.fillText("HIGH:", 10, 10);
    ctx.fillText(high, 10, 27);
    ctx.textAlign = "center";
    ctx.fillText("SCORE:", width / 2, 10);
    ctx.fillText(points, width / 2, 28);
    ctx.textAlign = "right";
    ctx.drawImage(smallCoin, width - 30 - smallCoinWidth, 9, smallCoinWidth, smallCoinHeight);
    ctx.fillText("X", width - 10, 10);
    ctx.fillText(sumOfCoins, width - 10, 28);
}

var player = new(function () {
    var that = this;

    this.image = new Image();
    this.image.src = imageHero;

    this.width = 32;
    this.height = 32;

    this.X = 0;
    this.Y = 0;

    this.isJumping = 0;
    this.isFalling = 0;

    this.frame = 0;
    this.numberOfFrames = 1;

    this.jumpSpeed = 0;
    this.fallSpeed = 0;
    var jump = 24;
    this.superDuration = 10000;
    this.super = false;


    this.checkSuper = function () {
        if (this.super == true) {
            this.image.src = imageSuper;
            this.width = 32;
            this.height = 64;
            jump = 36;
        } else {
            this.image.src = imageHero;
            this.width = 32;
            this.height = 32;
            jump = 24;
        }
    }

    this.isMoving = true;

    this.setPosition = function (x, y) {
        this.X = x;
        this.Y = y;
    }

    this.jump = function () {
        if (!this.isJumping && !this.isFalling) {
            this.fallSpeed = 0;
            this.isJumping = true;
            this.jumpSpeed = jump;
            if (this.super == false) {
                soundJump.play();
            } else {
                soundJumpSuper.play();
                //soundJump.play();
            }
        }
    }

    this.checkJump = function () {
        if (this.Y > height * 0.25) {
            this.setPosition(this.X, this.Y - this.jumpSpeed);
        } else {
            if (this.jumpSpeed > 10) {
                points += 1;
            }
            if (points > high) {
                high = points;
                //localStorage.setItem('highPoint', high);
            }

            var rand = Math.random() * (width - platformWidth);

            clouds.forEach(function (cloud, index) {
                cloud.Y += that.jumpSpeed / 5;
                if (cloud.Y > height) {
                    clouds[index] = new Cloud(Math.random() * (width - cloudWidth), Math.random() * (height - cloudHeight) - height - cloudHeight);
                }
            });

            birds.forEach(function (bird, index) {
                bird.Y += that.jumpSpeed;
                if (bird.Y > height) {
                    birds[index] = new Bird(Math.random() * (width - birdWidth), bird.Y - 4*height);
                }
            });

            flowers.forEach(function (flower, index) {
                flower.Y += that.jumpSpeed;
                if (flower.Y > height) {
                    flowers[index] = new Flower(platforms[0].X, flower.Y - 4 * height - 4 * platformHeight);
                }
            });

            platforms.forEach(function (platform, index) {
                platform.Y += that.jumpSpeed;
                coins[index].Y += that.jumpSpeed;

                if (platform.Y > height) {
                    platforms[index] = new Platform(Math.random() * (width - platformWidth), platform.Y - height - platformHeight);
                }
                if (coins[index].Y > height) {
                    coins[index] = new Coin(platforms[index].X + (platformWidth / 2) - (coinWidth / 2), coins[index].Y - height - platformHeight);
                }
            });

            mushrooms.forEach(function (mushroom, index) {
                mushroom.Y += that.jumpSpeed;
                if (mushroom.Y > height) {
                    mushrooms[index] = new Mushroom(~~(Math.random() * (width - mushroomWidth)), mushroom.Y - (height * (Math.floor((points + 100) / 50))) - mushroomHeight);
                }
                if (player.super == true) {
                    mushroom.empty = true;
                    mushroom.checkEmpty();
                }
            });
        }

        this.jumpSpeed--;
        if (this.jumpSpeed == 0) {
            this.isJumping = false;
            this.isFalling = true;
            this.fallSpeed = 1;
        }
    }

    this.checkFall = function () {
        if (this.Y < height - this.height) {
            this.setPosition(this.X, this.Y + this.fallSpeed);
            this.fallSpeed++;
        } else {
            if (points == 0) that.fallStop();
                GameOver();
        }
    }

    this.fallStop = function () {
        this.isFalling = false;
        this.fallSpeed = 0;
        this.jump();
    }

    this.moveLeft = function (theX) {
        if ((that.X > 0) && that.isMoving) {
            if (mobile){
                that.setPosition(this.X + theX, that.Y);
            } else {
                that.setPosition(theX - that.width / 2, that.Y);
            }
            
        }
    }

    this.moveRight = function (theX) {
        if ((that.X + that.width < width) && that.isMoving) {
            if (mobile) {
                that.setPosition(this.X + theX, that.Y);
            } else {
                that.setPosition(theX - that.width / 2, that.Y);
            }
        }
    }

    this.draw = function () {
        try {
            ctx.drawImage(that.image, this.frame * this.width, 0, that.width, that.height,
                that.X, that.Y, that.width, that.height);
        } catch (e) {}
    }

    this.update = function () {
        if (this.isJumping) {
            this.frame = 0;
            this.checkJump();
        }
        if (this.isFalling) {
            this.frame = 1;
            this.checkFall();
        }
        this.checkSuper();
        this.draw();
    }

})();


function Cloud (x, y) {
    this.image = new Image();
    this.image.src = imageCloud;

    this.width = 64;
    this.height = 48;

    this.isMoving = 1;
    this.direction = 1;

    this.draw = function () {
        try {
            ctx.drawImage(this.image, 0, 0, this.width, this.height, this.X, this.Y, this.width, this.height);
        } catch (e) {}
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

function Platform (x, y) {
    this.image = new Image();
    this.image.src = imagePlatform;

    this.width = 96;
    this.height = 32;

    this.onCollide = function () {
        player.fallStop();
    }

    this.isMoving = ~~(Math.random() * 2); //~~ Округляет число
    this.direction = ~~(Math.random() * 2) ? -1 : 1;

    this.draw = function () {
        try {
            ctx.drawImage(this.image, 0, 0, this.width, this.height, this.X, this.Y, this.width, this.height);
        } catch (e) {}
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

function Mushroom (x, y) {

    this.image = new Image();
    this.image.src = imageMushroom;

    this.width = 128;
    this.height = 64;

    this.empty = false;

    this.frame = 0;
    this.numberOfFrames = this.width / mushroomWidth;
    this.speedFrame = 15;
    this.speedTemp = 0;

    this.checkEmpty = function () {
        if (this.empty == false) {
            this.image.src = imageMushroom;
        } else {
            this.image.src = imageMushroomEmpty;
        }
    }

    this.onCollide = function () {
        player.fallStop();
        if (this.empty == false) {
            this.empty = true;
            player.super = true;
            soundPowerUp.play();
            setTimeout(function () {
                player.super = false;
            }, player.superDuration);
        }
        this.checkEmpty();
    }

    this.draw = function () {
        try {
            ctx.drawImage(this.image, this.frame * this.width / this.numberOfFrames, 0, this.width / this.numberOfFrames, this.height, this.X, this.Y, this.width / this.numberOfFrames, this.height);
        } catch (e) {}
    }

    this.update = function () {
        if (this.frame > this.numberOfFrames - 1) this.frame = 0
        this.draw();
        this.speedTemp += 1;
        if (this.speedTemp > this.speedFrame) {
            this.speedTemp = 0;
            this.frame += 1;
        }
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

function Coin (x, y) {
    this.image = new Image();
    this.image.src = imageCoin;

    this.width = 80;
    this.height = 28;

    this.empty = false;

    this.frame = 0;
    this.numberOfFrames = this.width / coinWidth;
    this.speedFrame = 5;
    this.speedTemp = 0;

    this.checkEmpty = function () {
        if (this.empty == false) {
            this.image.src = imageCoin;
        } else {
            this.image.src = "";
        }
    }

    this.onCollide = function () {
        //player.fallStop();
        if (this.empty == false) {
            this.empty = true;
            sumOfCoins++;
            points +=10;
            //soundCoin.play();
        }
        this.checkEmpty();
    }

    this.draw = function () {
        try {
            ctx.drawImage(this.image, this.frame * this.width / this.numberOfFrames, 0, this.width / this.numberOfFrames, this.height, this.X, this.Y, this.width / this.numberOfFrames, this.height);
        } catch (e) {}
    }

    this.update = function () {
        if (this.frame > this.numberOfFrames - 1) this.frame = 0
        this.draw();
        this.speedTemp += 1;
        if (this.speedTemp > this.speedFrame) {
            this.speedTemp = 0;
            this.frame += 1;
        }
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

function Flower (x, y) {
    this.image = new Image();
    this.image.src = imageFlower;

    this.width = 64;
    this.height = 80;

    this.frame = 0;
    this.numberOfFrames = 2;
    this.speedFrame = 10;
    this.speedTemp = 0;

    this.onCollide = function () {
        //this.frame = 1;
        if (player.super == false) {
            GameOver();
        }
        else {
            setTimeout(function () {
                player.super = false;
            }, 100);
            player.jump();
        }
    }

    this.draw = function () {
        try {
            ctx.drawImage(this.image, this.frame * this.width / this.numberOfFrames, 0, this.width / this.numberOfFrames, this.height, this.X, this.Y, this.width / this.numberOfFrames, this.height);
        } catch (e) {}
    }

    this.update = function () {
        if (this.frame > this.numberOfFrames - 1) this.frame = 0
        this.draw();
        this.speedTemp += 1;
        if (this.speedTemp > this.speedFrame) {
            this.speedTemp = 0;
            this.frame += 1;
        }
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

function Bird (x, y) {
    this.image = new Image();
    this.image.src = imageBird;

    this.width = 62;
    this.height = 32;

    this.frame = 0;
    this.numberOfFrames = 2;
    this.speedFrame = 5;
    this.speedTemp = 0;

    this.Temp = 0,
    this.Up = true,
    this.Down = false;

    this.onCollide = function () {
        if (player.super == false) {
            GameOver();
        }
        else {
            setTimeout(function () {
                player.super = false;
            }, 100);
            player.jump();
        }
    }

    this.draw = function () {
        try {
            ctx.drawImage(this.image, this.frame * this.width / this.numberOfFrames, 0, this.width / this.numberOfFrames, this.height, this.X, this.Y, this.width / this.numberOfFrames, this.height);
        } catch (e) {}
    }

    this.update = function () {
        if (this.frame > this.numberOfFrames - 1) this.frame = 0
        this.draw();
        this.speedTemp += 1;
        if (this.speedTemp > this.speedFrame) {
            this.speedTemp = 0;
            this.frame += 1;
        }
    }

    this.X = ~~x;
    this.Y = y;

    return this;
}

var numberOfPlatforms = 6,
    platforms = [],
    platformWidth = 96,
    platformHeight = 32,
    numberOfClouds = 5,
    clouds = [],
    cloudWidth = 64,
    cloudHeight = 48,
    numberOfMushroom = 1,
    mushrooms = [],
    mushroomWidth = 32,
    mushroomHeight = 32,
    coins = [],
    coinWidth = 20,
    coinHeight = 28;
    numberOfFlower = 1,
    flowers = [],
    flowerWidth = 32,
    flowerHeight = 48,
    numberOfBirds = 1,
    birds = [],
    birdWidth = 32,
    birdHeight = 32;



// Создание объектов
function generateObjects () {
    var position = 0;
    var mushroomPosition = ~~(height / numberOfMushroom);

    for (var i = 0; i < numberOfPlatforms; i++) {
        platforms[i] = new Platform((Math.random() * (width - platformWidth)), position);
        coins[i] = new Coin(platforms[i].X + (platformWidth / 2) - (coinWidth / 2), position - platformHeight);
        if (position < height - platformHeight) position += ~~(height / numberOfPlatforms);
    }

    for (var i = 0; i < numberOfClouds; i++) {
        clouds[i] = new Cloud((Math.random() * (width - cloudWidth)), (Math.random() * (height - cloudHeight)));
    }

    for (var i = 0; i < numberOfMushroom; i++) {
        mushrooms[i] = new Mushroom((Math.random() * (width - mushroomWidth)), platforms[0].Y - platformHeight);
    }

    for (var i = 0; i < numberOfFlower; i++) {
        flowers[i] = new Flower((Math.random() * (width - flowerWidth)), platforms[0].Y - flowerHeight);
    }
    for (var i = 0; i < numberOfBirds; i++) {
        birds[i] = new Bird((Math.random() * (width - flowerWidth)), -4*height);
    }
}

// Проверка на столкновения
function checkCollision () {
    platforms.forEach(function (e, index) {
        if ((player.isFalling) &&
            (player.X < e.X + platformWidth) &&
            (player.X + player.width > e.X) &&
            (player.Y + player.height > e.Y) &&
            (player.Y + player.height < e.Y + platformHeight)
        ) {
            e.onCollide();
        }
    });
    mushrooms.forEach(function (e, index) {
        if ((player.X < e.X + mushroomWidth) &&
            (player.X + player.width > e.X) &&
            (player.Y + player.height > e.Y + (mushroomHeight) / 1.5) &&
            (player.Y + player.height < e.Y + (mushroomHeight * 2))
        ) {
            e.onCollide();
        }
    });
    coins.forEach(function (e, index) {
        if ((player.X <= e.X + coinWidth) &&
            (player.X + player.width >= e.X) &&
            (player.Y + player.height >= e.Y - coinHeight) &&
            (player.Y + player.height <= e.Y + coinHeight)
        ) {
            e.onCollide();
        }
    });
    flowers.forEach(function (e, index) {
        if ((player.isFalling) &&
            (player.X <= e.X + flowerWidth) &&
            (player.X + player.width >= e.X) &&
            (player.Y + player.height >= e.Y) &&
            (player.Y + player.height <= e.Y + flowerHeight)
        ) {
            e.onCollide();
        }
    });
    birds.forEach(function (e, index) {
        if ((player.X <= e.X + birdWidth) &&
            (player.X + player.width >= e.X) &&
            (player.Y + player.height >= e.Y - birdHeight) &&
            (player.Y + player.height <= e.Y + birdHeight)
        ) {
            e.onCollide();
        }
    });
}
function Die () {
    state = false;
    soundDie.play();
        music.pause();
        musicUnderground.pause();
        if (points == high) {
            win = true;
        }
        for (var i = 0; i < platforms.length; i++) {
            delete platforms[i];
        }
        player.super = false;
        setTimeout(function () {
            clear();
            ctx.textAlign = "center";
            ctx.textBaseline = "center"
            ctx.fillStyle = "#ffffff";
            if (win) ctx.fillText("NEW HIGH SCORE!", width / 2, height / 2);
            ctx.fillText("GAME OVER", width / 2, height / 2 - 60);
            ctx.fillText("YOUR RESULT:" + points, width / 2, height / 2 - 30);
            changeWorld(0);
        }, 100);

}

function GameOver () {
    if (mobile) { navigator.vibrate(500); }
    if (sumOfCoins >= 100 && (state == true || state == 3)) {
        clear();
        player.setPosition(-player.width, player.Y);
        state = 3;
        var menubuttons = new Image(),
            menubuttonsWidth = 180,
            menubuttonsHeight = 120;
        menubuttons.src = imageMenuButtons;

        ctx.textAlign = "center";
            ctx.textBaseline = "center"
            ctx.fillStyle = "#ffffff";
        ctx.fillText("CONTINUE FOR  100?", width / 2, height / 4);
        ctx.drawImage(smallCoin, width / 2 + 55, height/(4), smallCoinWidth, smallCoinHeight);
        

        
        ctx.drawImage(menubuttons, 0, 0, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75), menubuttonsWidth, menubuttonsHeight/2);

        ctx.drawImage(menubuttons, 0, menubuttonsHeight/2, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75) + menubuttonsHeight/2 + 20, menubuttonsWidth, menubuttonsHeight/2);

        if (select == 3) {
        ctx.drawImage(smallCoin, width / 2 - 60, height/(2.75) + menubuttonsHeight/4 - smallCoinHeight/2, smallCoinWidth, smallCoinHeight);
        } else if (select == 2){
            ctx.drawImage(smallCoin, width / 2 - 60, height / (2.75) + menubuttonsHeight - 20 + smallCoinHeight/4, smallCoinWidth, smallCoinHeight); 
        }
    }
    else {
        Die();
    }
}

function changeWorld (world) {
    switch (world) {
        case 1:
            imageHero = "img/hero2.png";
            imageStats = "img/blockstats2.png";
            imageSuper = "img/supermario2.png";
            imageCloud = "";
            imagePlatform = "img/block2.png";
            imageMushroom = "img/mushroomblocksprite2.png";
            imageMushroomEmpty = "img/superblocksprite2.png";
            imageCoin = "img/coin2.png";
            imageSmallCoin = "img/smallcoin2.png";
            background = '#000';
            imageMario = "img/mario2.png";
            imageFlower = "img/flowersprite2.png";
            imageBird = "img/bird2.png";
            break;
        case 2:
            imageHero = "img/hero1.png";
            imageStats = "img/blockstats3.png";
            imageSuper = "img/supermario1.png";
            imageCloud = "img/cloud3.png";
            imagePlatform = "img/block3.png";
            imageMushroom = "img/mushroomblocksprite3.png";
            imageMushroomEmpty = "img/superblocksprite3.png";
            imageCoin = "img/coin3.png";
            imageSmallCoin = "img/smallcoin3.png";
            background = '#000';
            imageMario = "img/mario1.png";
            imageFlower = "img/flowersprite3.png";
            imageBird = "img/bird.png";
            break;
        default:
            imageHero = "img/hero1.png";
            imageStats = "img/blockstats.png";
            imageSuper = "img/supermario1.png";
            imageCloud = "img/cloud.png";
            imagePlatform = "img/block.png";
            imageMushroom = "img/mushroomblocksprite.png";
            imageMushroomEmpty = "img/superblocksprite.png";
            imageCoin = "img/coin.png";
            imageSmallCoin = "img/smallcoin.png";
            background = '#6b8cff';
            imageGround = "img/ground.png";
            imageTitle = "img/ttl.png";
            imageShrubs = "img/shrubs.png";
            imageGreen = "img/green.png";
            imageMario = "img/mario1.png";
            imageMenuButtons = "img/menubuttons.png";
            imageFlower = "img/flowersprite.png";
            imageBird = "img/bird.png";
            break;
    }
}

document.onmousemove = function (e) {
    if (state == 1) {
        if (!mobile) {
            if (player.X + canvas.offsetLeft > e.pageX - 20) {
                player.moveLeft(e.pageX - canvas.offsetLeft);
            } else if (player.X + canvas.offsetLeft < e.pageX - 20) {
                player.moveRight(e.pageX - canvas.offsetLeft);
            }
        }
    } else if (state == 2) {
        if (e.pageY - canvas.offsetTop > height / (2.75) && e.pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 0; }
        if (e.pageY - canvas.offsetTop > height/2.75 + 80 && e.pageY - canvas.offsetTop < (height/2.75) + 140 && !mobile)
            { select = 1; }
    } else if (state == 3) {
        if (e.pageY - canvas.offsetTop > height/2.75 + 80 && e.pageY - canvas.offsetTop < (height/2.75) + 140)
            { select = 2; }
        if (e.pageY - canvas.offsetTop > height / (2.75) && e.pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 3; }
    }
};

if (mobile) {
    document.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (state == 1) {
    } else if (state == 2) {
        if (e.changedTouches[0].pageY - canvas.offsetTop > height / (2.75) && e.changedTouches[0].pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 0; }
        if (e.changedTouches[0].pageY - canvas.offsetTop > height/2.75 + 80 && e.changedTouches[0].pageY - canvas.offsetTop < (height/2.75) + 140)
            { select = 1; }
    } else if (state == 3) {
        if (e.changedTouches[0].pageY - canvas.offsetTop > height/2.75 + 80 && e.changedTouches[0].pageY - canvas.offsetTop < (height/2.75) + 140)
            { select = 2; }
        if (e.changedTouches[0].pageY - canvas.offsetTop > height / (2.75) && e.changedTouches[0].pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 3; }
    }
    if (state == false) {
        points = 0;
        state = 2;
        win = false;
        StartMenu();
    } else if (state == 2) {
        if (select == 0) {
            
            var world = ~~(Math.random() * 3);
            changeWorld(world);
            if (world == 1) musicUnderground.play();
            else music.play();
            
            player.image.src = imageHero;
            player.X = width / 2;
            player.Y = height / 4;
            player.fallStop();
            generateObjects();
        } else {
            window.close();
        }
        state = true;
    } else if (state == 3) {
        if (select == 3) {
            player.X = width / 2;
            player.Y = height / 4;
            player.fallStop();
            state = true;
            sumOfCoins -= 100;
        }
        if (select == 2) {
            Die();
        }
    }
    });
}

document.onmousedown = function (e) {
    if (state == false) {
        points = 0;
        state = 2;
        win = false;
        StartMenu();
    } else if (state == 2) {
        if (select == 0) {
            
            var world = ~~(Math.random() * 3);
            changeWorld(world);
            if (world == 1) musicUnderground.play();
            else music.play();
            
            player.image.src = imageHero;
            player.X = width / 2;
            player.Y = height / 4;
            player.fallStop();
            generateObjects();
        } else {
            window.close();
        }
        state = true;
    } else if (state == 3) {
        if (select == 3) {
            player.X = width / 2;
            player.Y = height / 4;
            player.fallStop();
            state = true;
            sumOfCoins -= 100;
        }
        if (select == 2) {
            Die();
        }
    }
}
document.addEventListener("keydown", function (e) {
    if (e.keyCode == 32 || e.keyCode == 27) {
        Pause();
    }
});


//////////


var dir = 0;
var acc = 0;
var acclimit = 20;
var SetLeft;
var SetRight;
var stopLeft;
var stopRight;
var l = false;
var r = false;
var speed = 18;

if (mobile) {
    document.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (e.changedTouches[0].pageX < width/2 && r == false) {
            l = true;
            clearInterval(SetRight);
            if (acc > 0) {
                acc = 0;
            }
            if (acc == 0) {
            SetLeft = setInterval(function () {
                if (acc >= -acclimit) {
                acc -= 2;
                }
                player.moveLeft(acc);
            }, speed);
            }
        }
        else if (e.changedTouches[0].pageX > width/2) {
            clearInterval(stopLeft);
            clearInterval(SetRight);
            acc = 0;
        }
    });
    document.addEventListener("touchend", function (e) {
            l = false;
            r = false;
            clearInterval(SetLeft);
            clearInterval(SetRight);
            acc = 0;
    });

    document.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (e.changedTouches[0].pageX > width/2 && l == false) {
            r = true;
            clearInterval(SetLeft);
            if (acc < 0) {
                acc = 0;
            }
            if (acc == 0) {
            SetRight = setInterval(function () {
                if (acc <= acclimit) {
                acc += 2;
                }
                player.moveRight(acc);
            }, speed);
            }
        }
        else if (e.changedTouches[0].pageX < width/2) {
            clearInterval(stopLeft);
            clearInterval(SetRight);
            acc = 0;
        }
    });
}

function GameLoop () {
    if (pause == false) {
        clear();

        clouds.forEach(function (cloud, index) {
            if (cloud.isMoving == 1) {
                if (cloud.X > width + cloudWidth) {
                    cloud.X = 0 - cloudWidth;
                }
                cloud.X += cloud.direction / 2;

            }
            cloud.draw();
        });

        platforms.forEach(function (platform, index) {
            if (platform.isMoving) {
                if (platform.X < 0) {
                    platform.direction = 1; //right
                } else if (platform.X > width - platformWidth) {
                    platform.direction = -1; //left
                }
                var platformSpeed = (index / 2) * (points / 200);
                platform.X += platform.direction * platformSpeed;
                coins[index].X = platform.X + (platformWidth / 2) - (coinWidth / 2);
            }
            platform.draw();
            coins[index].update();
        });
        mushrooms.forEach(function (mushroom, index) {
            mushroom.update();
        });
        flowers.forEach(function (flower, index) {
            flower.update();
        });

        
        birds.forEach(function (bird, index) {
            if (bird.X > width + birdWidth) {
                    bird.X = 0 - birdWidth;
            }
            bird.X += 4;
            if (bird.Up == true) {
                if (bird.Temp <= 64){
                bird.Y +=2;
                bird.Temp = bird.Temp + 2;
                } else {
                    bird.Up = false;
                    bird.Down = true;
                }
            }
            if (bird.Down == true) {
                if (bird.Temp >= -64){
                    bird.Y -=2;
                    bird.Temp -=2;
                } else {
                    bird.Up = true;
                    bird.Down = false;
                }   
            } 
            bird.update();
        });

        stats();

        checkCollision();
        player.update();
        if (state)
            requestAnimationFrame(GameLoop);
        else if (state == 2) StartMenu();
    } else {
        ctx.textBaseline = "center";
        ctx.textAlign = "center";
        ctx.fillText("Pause", width / 2, height / 2);
    }
}

function StartMenu () {
    clear();

    var ground = new Image(),
        groundHeight = 96;
    ground.src = imageGround;

    // Исправление CanvasPatterns
    // offset vars
    var offset_x = 0;
    var offset_y = height - groundHeight;

    // offset
    ctx.translate(offset_x, offset_y);

    // draw
    ctx.fillStyle = ctx.createPattern(ground, 'repeat');
    ctx.fillRect(-offset_x, -offset_y + height - groundHeight, canvas.width, groundHeight);

    // undo offset
    ctx.translate(-offset_x, -offset_y);
    // Конец костыля
    
    
    var title = new Image(),
        titleWidth = 355,
        titleHeight = 199;
    title.src = imageTitle;

    ctx.drawImage(title, (width / 2 - titleWidth / 2), height / 20, titleWidth, titleHeight);

    var shrubs = new Image(),
        shrubsWidth = 142,
        shrubsHeight = 32;
    shrubs.src = imageShrubs;
    

    ctx.drawImage(shrubs, width - shrubsWidth * 1.5, height - groundHeight - shrubsHeight, shrubsWidth, shrubsHeight);

    var green = new Image(),
        greenWidth = 136,
        greenHeight = 58;
    green.src = imageGreen;

    ctx.drawImage(green, width / 8, height - groundHeight - greenHeight, greenWidth, greenHeight);

    var mario = new Image();
    mario.src = imageMario;

    ctx.drawImage(mario, width / 6, height - groundHeight - 32, 24, 32);

    if (fontsReady == true) {
        ctx.font = '14px "Press Start 2P"';
        if (mobile) {
            ctx.font = '12px "Press Start 2P"';
        }
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        
        var menubuttons = new Image(),
            menubuttonsWidth = 180,
            menubuttonsHeight = 120;
        menubuttons.src = imageMenuButtons;
        
        ctx.drawImage(menubuttons, 0, 0, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75), menubuttonsWidth, menubuttonsHeight/2);

        if (!mobile) {
            ctx.drawImage(menubuttons, 0, menubuttonsHeight/2, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75) + menubuttonsHeight/2 + 20, menubuttonsWidth, menubuttonsHeight/2);
        }
    }
    
    if (select == 0) {
        ctx.drawImage(smallCoin, width / 2 - 60, height/(2.75) + menubuttonsHeight/4 - smallCoinHeight/2, smallCoinWidth, smallCoinHeight);
    } else if (select == 1){
        ctx.drawImage(smallCoin, width / 2 - 60, height / (2.75) + menubuttonsHeight - 20 + smallCoinHeight/4, smallCoinWidth, smallCoinHeight); 
    }
    
    if (state == 2)
        //requestAnimationFrame(StartMenu);
        requestAnimFrame(StartMenu);
    else {
        clearTimeout();
        GameLoop();
    }
}

var pause = false;

function Pause () {
    if (pause == false) {
        if (state == true) {
            soundPause.play();
            pause = true;
        }
    } else {
        pause = false;
        GameLoop();
    }
}