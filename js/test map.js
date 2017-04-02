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
    //soundKick = new Audio("sound/kick.wav"),
    soundPause = new Audio("sound/pause.mp3"),
    soundPowerUp = new Audio("sound/powerup.mp3"),
    music = new Audio("sound/music.mp3"),
    musicUnderground = new Audio("sound/underground.mp3");

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

// document.addEventListener("onresize", function () {
    
//     console.log(width);
// })
    

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
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
            '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();
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
var clear = function () {
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fill();
}

// Вывод статистики
var stats = function () {
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
            if (points > high) high = points;

            var rand = Math.random() * (width - platformWidth);

            clouds.forEach(function (cloud, index) {
                cloud.Y += that.jumpSpeed / 5;
                if (cloud.Y > height) {
                    clouds[index] = new Cloud(Math.random() * (width - cloudWidth), Math.random() * (height - cloudHeight) - height - cloudHeight);
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
            that.setPosition(theX - that.width / 2, that.Y);
        }
    }

    this.moveRight = function (theX) {
        if ((that.X + that.width < width) && that.isMoving) {
            that.setPosition(theX + that.width / 2, that.Y);
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


var Cloud = function (x, y) {
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

var Platform = function (x, y) {
    this.image = new Image();
    this.image.src = imagePlatform;

    this.width = width;
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

var Mushroom = function (x, y) {

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

var Coin = function (x, y) {
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

var Flower = function (x, y) {
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

var numberOfPlatforms = 1,
    platforms = [],
    platformWidth = width,
    platformHeight = 32,
    numberOfClouds = 5,
    clouds = [],
    cloudWidth = 64,
    cloudHeight = 48,
    numberOfMushroom = 0,
    mushrooms = [],
    mushroomWidth = 32,
    mushroomHeight = 32,
    coins = [],
    coinWidth = 20,
    coinHeight = 28;
    numberOfFlower = 0,
    flowers = [],
    flowerWidth = 32,
    flowerHeight = 48;

// Создание объектов
var generateObjects = function () {
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
}

// Проверка на столкновения
var checkCollision = function () {
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
        if ((player.X <= e.X + flowerWidth) &&
            (player.X + player.width >= e.X) &&
            (player.Y + player.height >= e.Y) &&
            (player.Y + player.height <= e.Y + flowerHeight)
        ) {
            e.onCollide();
        }
    });
}
var Die = function () {
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

var GameOver = function () {
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
            //imageGround = "img/ground2.png";
            //imageTitle = "img/title2.png";
            //imageShrubs = "img/shrubs2.png";
            //imageGreen = "img/green2.png";
            imageMario = "img/mario2.png";
            //imageMenuButtons = "img/menubuttons2.png";
            imageFlower = "img/flowersprite2.png";
            break;
        case 2:
            imageHero = "img/hero2.png";
            imageStats = "img/blockstats3.png";
            imageSuper = "img/supermario2.png";
            imageCloud = "img/cloud3.png";
            imagePlatform = "img/block3.png";
            imageMushroom = "img/mushroomblocksprite3.png";
            imageMushroomEmpty = "img/superblocksprite3.png";
            imageCoin = "img/coin3.png";
            imageSmallCoin = "img/smallcoin3.png";
            background = '#000';
            //imageGround = "img/ground2.png";
            //imageTitle = "img/title2.png";
            //imageShrubs = "img/shrubs2.png";
            //imageGreen = "img/green2.png";
            imageMario = "img/mario2.png";
            //imageMenuButtons = "img/menubuttons2.png";
            imageFlower = "img/flowersprite3.png";
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
            imageTitle = "img/title.png";
            imageShrubs = "img/shrubs.png";
            imageGreen = "img/green.png";
            imageMario = "img/mario1.png";
            imageMenuButtons = "img/menubuttons.png";
            imageFlower = "img/flowersprite.png";
            break;
    }
}

document.onmousemove = function (e) {
    if (state == 1) {
        // if (player.X + canvas.offsetLeft > e.pageX - 20) {
        //     player.moveLeft(e.pageX - canvas.offsetLeft);
        // } else if (player.X + canvas.offsetLeft < e.pageX - 20) {
        //     player.moveRight(e.pageX - canvas.offsetLeft);
        // }
    } else if (state == 2) {
        if (e.pageY - canvas.offsetTop > height / (2.75) && e.pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 0; }
        if (e.pageY - canvas.offsetTop > height/2.75 + 80 && e.pageY - canvas.offsetTop < (height/2.75) + 140)
            { select = 1; }
    } else if (state == 3) {
        if (e.pageY - canvas.offsetTop > height/2.75 + 80 && e.pageY - canvas.offsetTop < (height/2.75) + 140)
            { select = 2; }
        if (e.pageY - canvas.offsetTop > height / (2.75) && e.pageY - canvas.offsetTop < (height/2.75) + 80)
            { select = 3; }
    }
};

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

////////////////////


var dir = 0;
var speed = 0;
var speedlimit = 50;
var SetLeft;
var SetRight;
var stopLeft;
var stopRight;
var l = false;
var r = false;
var fps = 18;
document.addEventListener("keydown", function (e) {
    if (e.keyCode == 37 && r == false) {
        l = true;
        clearInterval(SetRight);
        if (speed > 0) {
            speed = 0;
        }
        if (speed == 0) {
        SetLeft = setInterval(function () {
            if (speed > -speedlimit) {
            speed -= 1;
            }
            player.moveLeft(player.X + (speed/1000));
        }, fps);
        }
    }
    else if (e.keyCode == 37) {
        clearInterval(stopLeft);
        clearInterval(SetRight);
        acc = 0;
    }
});
document.addEventListener("keyup", function (e) {
    if (e.keyCode == 37) {
        l = false;
        clearInterval(SetLeft);
        stopLeft = setInterval(function () {
            if (speed != 0) {
            speed += 1;
            //player.moveLeft(player.X + (speed/1000));
            }
            else {
                clearInterval(stopLeft);
            }
        }, fps);
    }
});

document.addEventListener("keydown", function (e) {
    if (e.keyCode == 39 && l == false) {
        r = true;
        clearInterval(SetLeft);
        if (speed < 0) {
            speed = 0;
        }
        if (speed == 0) {
        SetRight = setInterval(function () {
            if (speed < speedlimit) {
            speed += 1;
            }
            player.moveRight(player.X + (speed/1000));
        }, fps);
        }
    }
    else if (e.keyCode == 37) {
        clearInterval(stopLeft);
        clearInterval(SetRight);
        acc = 0;
    }
});
document.addEventListener("keyup", function (e) {
    if (e.keyCode == 39) {
        r = false;
        clearInterval(SetRight);
        stopRight = setInterval(function () {
            if (speed != 0) {
            speed -= 1;
            //player.moveLeft(player.X + (speed/1000));
            }
            else {
                clearInterval(stopRight);
            }
        }, fps);
    }
});


///////////////

var GameLoop = function () {
    console.log(speed);
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

var StartMenu = function () {
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
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        
        var menubuttons = new Image(),
            menubuttonsWidth = 180,
            menubuttonsHeight = 120;
        menubuttons.src = imageMenuButtons;
        
        ctx.drawImage(menubuttons, 0, 0, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75), menubuttonsWidth, menubuttonsHeight/2);
        
        ctx.drawImage(menubuttons, 0, menubuttonsHeight/2, menubuttonsWidth, menubuttonsHeight/2, width/2 - menubuttonsWidth/2, height/(2.75) + menubuttonsHeight/2 + 20, menubuttonsWidth, menubuttonsHeight/2);
    }
    
    if (select == 0) {
        ctx.drawImage(smallCoin, width / 2 - 60, height/(2.75) + menubuttonsHeight/4 - smallCoinHeight/2, smallCoinWidth, smallCoinHeight);
    } else if (select == 1){
        ctx.drawImage(smallCoin, width / 2 - 60, height / (2.75) + menubuttonsHeight - 20 + smallCoinHeight/4, smallCoinWidth, smallCoinHeight); 
    }
    
    if (state == 2)
        requestAnimationFrame(StartMenu);
    else {
        clearTimeout();
        GameLoop();
    }
}

var pause = false;

var Pause = function () {
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

// 1. Исправить звук
// 2. Сделать нормальное меню
// 3. Сделать смену текстур