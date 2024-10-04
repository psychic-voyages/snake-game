const gameBoard = $('#game-board');

const menuStyle = {
    'grid-template-rows': '1fr 5fr 1fr',
    'grid-template-columns': '1fr 5fr 1fr',
}

const gameStyle = {
    'grid-template-rows': '1fr',
    'grid-template-columns': '1fr',
}

//Store variables relevant to the current game
const gameState = {
    cellCount: null,
    gameSpeed: null,
    useConstant: false,
    usePowerUp: false,
    useBounds: true,
    powerUpActive: false,
    score: 0,
    best: 0,
    passedBest: false,
    applePos: null,
    pup: {
        onBoard: false,
        active: false,
        timeout: null,
        length: 0,
        action: null,
        pos: null,
    },
    currentGame: null,

}

//Store the snake
const snake = {
    body: [],
    direction: null,
    rot: null,
    OnIntersect: null,
    doFlip: false,
    isFlip: false,
};

const pups = [
    {
        model: 'clear-apple.png',
        action: function () {
            const snakeBody = $('.snake-body');
            for (let i = 0; i < snakeBody.length; i++) {
                if (i % 2 === 1) {
                    $(snakeBody[i]).addClass('snake-clear');
                }
            }
            snake.doFlip = true;
            snake.OnIntersect = pups[0].NoClip;
            gameState.pup.length = 3;
            gameState.pup.active = true;
            $('#active-pup').css('background-image', `url(${pups[0].model})`);
            $('#pup-length').text(gameState.pup.length);
            $('#active-pup').show();
        },
        NoClip: function () {
            gameState.pup.length--;
            $('#pup-length').text(gameState.pup.length);
            if (gameState.pup.length < 1) {
                snake.OnIntersect = pups[0].DoClip;
                $('.snake-body').removeClass('snake-clear');
                snake.doFlip = false;
                snake.isFlip = false;
                gameState.pup.active = false;
                $('#active-pup').hide();
            }
            return false;
        },
        DoClip: function () {
            return true;
        },
    },
    {
        model: 'slo-apple.png',
        action: function () {
            gameState.gameSpeed *= 1.078;
            RefreshGameSpeed();
            RenderSpeedMod("DOWN");
        },
    },
    {
        model: 'fast-apple.png',
        action: function () {
            gameState.gameSpeed *= 0.883;
            RefreshGameSpeed();
            RenderSpeedMod("UP");
        },
    },
]

function DoTimeout (sec) {
    return Math.floor((Math.random() * (sec/2) + (sec/2 + 1)) * 1000);
}

function RenderMenu (menuID) {
    $('#game-container').css(menuStyle);
    $(menuID).fadeIn(500);
    $('button').prop('disabled', false);
}

function RenderSnake (x,y) {
    const snakeBody = $('.snake-body');
	const nextCSS = {
        'grid-row': x,
        'grid-column': y,
        'transform': snake.rot,
    };
    const nextSnakeElem = $("<div class='snake-body'></div>").css(nextCSS).addClass('snake-head');

    if (snake.doFlip) {
        snake.isFlip = !snake.isFlip;

        if (snake.isFlip) {
            nextSnakeElem.addClass('snake-clear');
        }
    }
    $(snakeBody[0]).removeClass('snake-head').css('transform', 'none');

    $('#game-board').prepend(nextSnakeElem);
}

function RenderItem (withClass, x, y) {
    const nextCSS = {
        'grid-row': x,
        'grid-column': y,
    }
    gameBoard.append($(`<div class='${withClass}'></div>`).css(nextCSS));
}

function RenderSpeedMod (dir) {
    $('#speed-mod-label').text(dir);
    $('#speed-mod').show();
    setTimeout(function () {
        $('#speed-mod').fadeOut(500);
    }, 3000);
}

function RefreshGameSpeed () {
    clearInterval(gameState.currentGame);
    gameState.currentGame = setInterval(UpdateGame, gameState.gameSpeed);
}

function RandomXY () {
    return [
        Math.floor(Math.random()*(gameState.cellCount) + 1),
        Math.floor(Math.random()*(gameState.cellCount) + 1),
    ];
}

function MakeItem (withClass, dodgePos) {
    const nextPos = RandomXY();
    const nextPosStr = String(nextPos);

    // Using strings makes coordinate comparison in an array easier
    if (!snake.body.includes(nextPosStr) && String(dodgePos) !== nextPosStr) {
        RenderItem(withClass, nextPos[0], nextPos[1]);
        return nextPos;
    }

    return null;
}

function MakePUP () {
    const pupSelector = Math.floor(Math.random() * pups.length);

    clearTimeout(gameState.pup.timeout);

    gameState.pup.pos = MakeItem('pup', gameState.applePos);
    gameState.pup.timeout = gameState.pup.pos ? setTimeout(DestroyPUP, DoTimeout(8)) : null;
    gameState.pup.action = pups[pupSelector].action;
    $('.pup').css('background-image', `url(${pups[pupSelector].model})`);

    
}

function DestroyPUP () {
    clearTimeout(gameState.pup.timeout);
    $('.pup').remove();
    gameState.pup.pos = null;
    gameState.pup.timeout = null;
    gameState.pup.action = null;
}

// Used as the entry point for the game
function InitGame () {
    $('#game-stats').hide();
    $('#game-board').hide();
    $('.game-menu').hide();
    $('#gameover-label').hide();
    RenderMenu('#start-menu');
}

function SetGameOptions () {
    // Before anything, set values from input elements
    gameState.cellCount = +($('#cell-count-slider').val());
    gameState.gameSpeed = Math.floor(1000 / (8 + (+($('#game-speed-slider').val()))*2));
    
    gameState.useConstant = $('#use-constant').prop('checked');
    gameState.usePowerUp = $('#use-powerup').prop('checked');
    gameState.useBounds = !($('#use-nobound').prop('checked'));

    // Create snake and store initial position
    const initPos = [Math.floor(gameState.cellCount/2), 2];
    snake.body[0] = String(initPos); //There is a very good reason for this - See NOTE 1 below
    snake.direction = [0,1];
    snake.rot = "rotate(0deg)";
    snake.OnIntersect = pups[0].DoClip;
	RenderSnake(initPos[0],initPos[1]);
}

function ResetGame () {
    gameState.cellCount = null;
    gameState.gameSpeed = null;
    gameState.useConstant = false;
    gameState.usePowerUp = false;
    gameState.useBounds = false;
    gameState.score = 0;
    gameState.passedBest = false;
    gameState.applePos = null;
    gameState.pup.pos = null;
    gameState.pup.timeout = null;
    gameState.pup.action = null;
    gameState.currentGame = null;
    snake.body = [];
    snake.direction = null;
    snake.rot = null;
    $('#game-board div').remove();
    $('#game-score').text('0');
    $('#game-best').text(gameState.best);
}

// Use the options to initialize the game styles and settings
function StartGame () {
    // Before even that! See if there is a game currently started
    if (gameState.currentGame !== null) return;
    
    SetGameOptions();
    
    // Create/apply styling for game board grid
    const cellGridArea = `repeat(${gameState.cellCount},1fr)`;
    const gridStyle = {
        'grid-template-rows': cellGridArea,
        'grid-template-columns': cellGridArea,
    }
    
    // Set initial game board style and states
    $('#game-container').css(gameStyle);
    $('#game-board').css(gridStyle).show();
    
    // Restore game status labels
    $('.stat').show();
    $('#speed-mod').hide();
    $('#active-pup').hide();
    $('#game-stats').slideDown(500);

    // Start game loop
    gameState.currentGame = setInterval(UpdateGame, gameState.gameSpeed);
    setTimeout(() => window.scrollTo({
        top: document.body.scrollHeight,
        left: 0,
        behavior: 'smooth'
      }), 500 );
}

// Main loop of the current game
function UpdateGame () {
    // Get relevant info for each frame
    const snakeBody = $('.snake-body');
    const snakePos = snake.body[0].split(",").map((num) => +num); // Split string to number array
    const nextPos = [snakePos[0] + snake.direction[0],
                     snakePos[1] + snake.direction[1]];

    const collectedItem = snake.body[0] === String(gameState.applePos);
    const collectedPUP = snake.body[0] === String(gameState.pup.pos);
                     
    const exceedsBounds = (nextPos[0] < 1 || nextPos[0] > gameState.cellCount) || (nextPos[1] < 1 || nextPos[1] > gameState.cellCount);

   let gameOver = false;

    // Game over checks before continuing the game
    if (snake.body.includes(String(nextPos))) {
		gameOver = snake.OnIntersect();
    }

    if (exceedsBounds && gameState.useBounds) {
        gameOver = true;
    }

    if (gameOver) {
        StopGame();
		return;
    }

    // Wrap snake around bounds of board
    if (exceedsBounds && !gameState.useBounds) {
        if (nextPos[0] < 1) {
            nextPos[0] = gameState.cellCount;
        } else if (nextPos[0] > gameState.cellCount) {
            nextPos[0] = 1;
        } else if (nextPos[1] < 1) {
            nextPos[1] = gameState.cellCount;
        } else if (nextPos[1] > gameState.cellCount) {
            nextPos[1] = 1;
        }
    }

    if ((gameState.score >= gameState.best && !gameState.passedBest) || gameState.best === 0) gameState.passedBest = true;
    
    // Generate apple if there is no position data
    if (gameState.applePos === null) {
        gameState.applePos = MakeItem('apple', gameState.pup.pos);
    }

    // Create the cycle for powerup generation
    if (!gameState.pup.timeout && !gameState.pup.pos && gameState.usePowerUp && !gameState.pup.active) {
        gameState.pup.timeout = setTimeout(MakePUP, DoTimeout(5));
    }
    
    // Draw the snake - store coordinates
    RenderSnake(nextPos[0],nextPos[1]);
    snake.body.unshift(String(nextPos));

    //Increase score and reset item - keep tail of snake
    if (gameState.applePos !== null && collectedItem) {
        gameState.score++;
        gameState.applePos = null;
        $('.apple').remove();
        $('#game-score').text(gameState.score);
        if (gameState.passedBest) $('#game-best').text(gameState.score);

        // Game speed modifier
        if (gameState.score % 10 === 0 && !gameState.useConstant) {
            gameState.gameSpeed = Math.ceil(gameState.gameSpeed * 0.922);
            RefreshGameSpeed();
            
            RenderSpeedMod("UP");
        }
    } else {
        snakeBody[snakeBody.length - 1].remove();
        snake.body.pop();
    }

    // Do call for powerup
    if (gameState.pup.pos && collectedPUP) {
        gameState.pup.action();

        DestroyPUP();
    }
}

function StopGame () {
    // Change face to X--X
    const snakeHead = $('.snake-body')[0];
    $(snakeHead).css('background-image', 'url("snake-face-x.png")');

    // Terminate current loop
    DestroyPUP();
    clearInterval(gameState.currentGame);
    gameState.currentGame = null;


    //Update end menu values
    
    if (gameState.passedBest && gameState.score > 0) {
        gameState.best = gameState.score;
        $('#new-best-label').html("Congratulations!<br>A new record!");
    } else {
        $('#new-best-label').html("Try again for a high score!");
    }

    $('#final-score-label').text(gameState.score);
    $('#best-score-label').text(gameState.best);

    // Update graphics to show end menu
    console.log("Game Over!");
    $('#game-board').fadeOut(2500, function () {
        $('#game-stats').slideUp(500);
        RenderMenu("#end-menu");
    });
    $('.stat').hide();
    $('#gameover-label').show();

}


// HANDLERS
// Handler for start menu cell count slider
$('#cell-count-slider').on('input', function () {
    $('#cell-count-label').text($(this).val());
});

// Handler for start menu game speed slider
$('#game-speed-slider').on('input', function () {
    const speedVal = $(this).val();

    $('#game-speed-label').text(
        (speedVal < 3) ? "Rosy Boa" :
        (speedVal < 5) ? "Ball Python" : "Black Mamba"
    );
});

$('button').click(function () {
    $('button').prop('disabled', true);
});

// Handler for start menu start button
$('#start-button').click(function () {
    $('#start-menu').fadeOut(500, StartGame);
});

$('#restart-button').click(function () {
    $('#end-menu').fadeOut(500, function () {
        $('#gameover-label').hide();
        ResetGame();
        StartGame();
    });
});

$('#end-button').click(function () {
    $('#end-menu').fadeOut(500, function () {
        $('#gameover-label').hide();
        ResetGame();
        RenderMenu('#start-menu');
    });
});

// Handler for direction changing using arrow keys
$(window).keydown(function (event) {
    const keyPress = event.code;

	let snakePos = snake.body[0].split(",").map((num) => +num);
    let tempDir = [0,0];
    let tempRot = "";
    
    if (keyPress === "ArrowLeft" || keyPress === "KeyA") {
        tempDir[1] = -1;
        tempRot = "rotate(180deg)";
    } else if (keyPress === "ArrowRight" || keyPress === "KeyD") {
        tempDir[1] = 1;
        tempRot = "rotate(0deg)";
    } else if (keyPress === "ArrowUp" || keyPress === "KeyW") {
        tempDir[0] = -1;
        tempRot = "rotate(-90deg)";
    } else if (keyPress === "ArrowDown" || keyPress === "KeyS") {
        tempDir[0] = 1;
        tempRot = "rotate(90deg)";
    }
    
    //Store position as string to check for backward movement
    let tempPos = String([snakePos[0] + tempDir[0], snakePos[1] + tempDir[1]]);


    let canChangeDir = !(
        snake.body.length > 1 &&
        tempPos === snake.body[1]
    ) && String(tempDir) !== "0,0";
    
    if (canChangeDir) {
        snake.rot = tempRot;
        snake.direction = tempDir;
    }
});

// Exec!!
InitGame();

/*
NOTE 1 - COORDINATE VERIFICATION

Two arrays that store the same values will always be treated as two separate objects.

const arrOne = [1,4];
const arrTwo = [1,4];

"arrOne === arrTwo" and "arrOne == arrTwo" reduces to:

"[1,4] === [1,4]" and "[1,4] == [1,4]" and will always return false.

This makes comparing coordinates a drag, having to loop through every item in the array to compare the indexed values
Instead convert the arrays to strings, as they will have the same output if they are "equal":

"String(arrOne) === String(arrTwo)" reduces to:

"1,4" === "1,4" and will pass the verification!

If we store the snake coordinates as string can also do neat things such as:

"snake.body.includes(arrOne);" for a cheaper inquiry and less lines of code than a "forEach" call

The only coordinate in the snake body that's needed for arithmetic is the head "snake.body[0]".
Using a daisy chain of string/array methods, we can expand the stored sting back into a number array!
The comma can be used as a delimiter to break apart the values
The "map" method can be used with the "+" unary operator to return numbers:

"snake.body[0].split(",").map((num) => +num);" returns "[x,y]"!

*/