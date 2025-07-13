function checkwin(){
    // Horizontale Überprüfung 3d
    for(var i=0;i<gamefield.length;i++){
        
        for(var x=0; x<gamefield[i].length;x++){
            var playerlist = [];
            for(var y=0; y<gamefield[i][x].length;y++){

                if(gamefield[i][x][y] == player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }
    }

    // horizontale Überprüfung 2d
    for(var ebene = 1; ebene<5; ebene++){
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                if(gamefield[i][x][ebene]==player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }
    }

    // vertikale Überprüfung 2d
    for(var ebene = 1; ebene<5; ebene++){
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                if(gamefield[x][i][ebene]==player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }
    }
    // Diagonale Überprüfung von links nach rechts 2d
    for(var ebene = 1; ebene<5; ebene++){
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;
            
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }
            checkPlayerlistLenght(playerlist)
        }
    }

    // Diagonale Überprüfung von rechts nach links 2d
    for(var ebene = 1; ebene<5; ebene++){
        var playerlist = []
        
        for(var row=0, cell=3; row<gamefield.length; row++,cell--){
            //alert(gamefield[row][cell][ebene])
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }
            checkPlayerlistLenght(playerlist)
        }
    }

    // horizontale Überprüfung von links nach rechts 3d
        for(var i=0; i<gamefield.length;i++){
            var playerlist = [];
            for(var x=0; x<gamefield[i].length; x++){
                var ebene = x+1
                if(gamefield[i][x][ebene]==player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }

    // Horizontale Prüfung von rechts nach links 3d
        for(var row=0; row<gamefield.length;row++){
            var playerlist = [];
            for(var cell=0; cell<gamefield[row].length; cell++){
                var ebene = (4 - cell)
                if(gamefield[row][cell][ebene]==player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }

    // vertikale Überprüfung von oben nach unten 3d
        for(var row=0; row<gamefield.length;row++){
            var playerlist = [];
            for(var cell=0; cell<gamefield[row].length; cell++){
                var ebene = cell + 1
                if(gamefield[cell][row][ebene]==player){
                    playerlist.push(player)
                }
            }
            checkPlayerlistLenght(playerlist)
        }

    // vertikale Überprüfung von unten nach oben 3d
    for(var row=0; row<gamefield.length;row++){
        var playerlist = [];
        for(var cell=0; cell<gamefield[row].length; cell++){
            var ebene = (4 - cell) 
            if(gamefield[cell][row][ebene]==player){
                playerlist.push(player)
            }
        }
        checkPlayerlistLenght(playerlist)
    }

    // Diagonale Überprüfung von oben links nach unten rechts 3d
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;
            var ebene = row+1
            
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }
            checkPlayerlistLenght(playerlist)
        }

    // Diagonale Überprüfung von unten rechts nach oben links 3d
        var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = row;
            var ebene = 4-row
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }

            checkPlayerlistLenght(playerlist)

        }
    // Diagonale Überprüfung von oben rechts nach unten links 3d

    var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = 3-row
            var ebene = row+1
            
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }
            checkPlayerlistLenght(playerlist)
        }

    // Diagonale Überprüfung von unten links nach oben rechts 3d

    var playerlist = []
        for(var row=0; row<gamefield.length; row++){
            var cell = 3-row
            var ebene = 4-row
            
            if(gamefield[row][cell][ebene]==player){
                playerlist.push(player)
            }
            if(checkPlayerlistLenght(playerlist)){}
        }
    return false;
}

function checkPlayerlistLenght(playerlist){
    if(playerlist.length==4){
        alert(player + " Hat das Spiel gewonnen.")
        
        wincounter()
        gameIsOver = true
        return true
    }
}

function wincounter(){
    if(player=="rot"){
            sessionStorage.wincounter_red =  sessionStorage.wincounter_red + 1
        }
    if(player=="grün"){
        sessionStorage.wincounter_green = sessionStorage.wincounter_green + 1
    }
}

function getIndexOfK(arr, k){
    if (!arr){
        return [];
    }

    for(var i=0; i<arr.length; i++){
        for( var j = 0 ; j < arr[i].length; j ++ ) {
            var index = arr[i][j].indexOf(k);
            if (index > -1){
                return [i, j,index];
            }        
        }
    }
}

function play(position){
    if(gameIsOver){
        return;
    }
    var result = getIndexOfK(gamefield, position);
    var positionsum = gamefield[result[0]][result[1]].length              
    var canvas = document.getElementById(position);
    var ctx = canvas.getContext("2d")

    const img = new Image();
    if(positionsum>4){
        return;
    }

    if(counter % 2 == 0){
        player = "rot";
        gamefield[result[0]][result[1]].push(player)
        img.src = 'cube_red.png';
        var nextplayer = document.getElementById("playerimg")
        nextplayer.src = "cube_green.png"
    }else{
        player = "grün";
        gamefield[result[0]][result[1]].push(player)
        img.src = 'cube_green.png';
        var nextplayer = document.getElementById("playerimg")
        nextplayer.src = "cube_red.png"   
    }
    img.onload = draw;

    function draw() {
        const destX = 45;
        const destY = (90-(positionsum*25));
        const destWidth = 200;
        const destHeight = 100;
        ctx.drawImage(img, destX, destY, destWidth, destHeight); 
    }
    
    checkwin();
    counter++
}
var gameIsOver = false;
var player = "";
var counter = 0;
var gamefield = [[['c1'],['c2'],['c3'],['c4']],
                    [['c5'],['c6'],['c7'],['c8']],
                    [['c9'],['c10'],['c11'],['c12']],
                [['c13'],['c14'],['c15'],['c16']]];
//local storage
var stats_red = sessionStorage.getItem("wincounter_red")
if(!stats_red){
    sessionStorage.setItem("wincounter_red", 0)
}
//alert(localStorage.getItem("wincounter_red"))

var stats_green = sessionStorage.getItem("wincounter_green")
if(!stats_green){
    sessionStorage.setItem("wincounter_green", 0)
}
wincounter()