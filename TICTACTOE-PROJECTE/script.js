let actualPositions = [];
let actualGame; //Per a fer cache de quin joc mirar cada vegada que cridem la nova
let gameStatus = {
    positions: [],          //Les posicions d'aquesta partida
    actualGameName: "",     //Per a fer cache de quin nom hem de anar fer ping
    player: "",      //Quin jugador es el jugador actual
    lastPlayer: "",     //El ultim que sabem que ha jugat, ens servirá per a comparar
    // winsThisSession: 0, //atraves de cookies fer si guanya o perd consecutiu
}
//status O OK =TRUE KO = FALSE 
//PLAYER O o X
//response desc de el que ens dona
//gameInfo com esta el tauler actualment
const loadInfoGame = (callback) => { //Aixi podrem fer aquesta funcio per a fer simplement check info i d'alli ja el usuari fer el que vulgui
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const infoActual = JSON.parse(this.responseText);
            callback(infoActual);
        }
    };
    xhttp.open("POST", "http://tictactoe.codifi.cat", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(`{"action": "infoGame","gameName": "${gameStatus.actualGameName}"}`);
}

const joinGameInProgress = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        gameStatus.positions = infoActual["gameInfo"];
        gameStatus.player = newPlayer(infoActual["player"])
        console.log("Joined correctly");
        //loadUI();
    } else {
        //loadError(infoActual.status);
    }
}
const checkStatus = (status) => {
    return status == "OK";
}
const newPlayer = (playerSign) => { //Per a dir al jugador que s'uneix quin es el seu simbol;
    if (playerSign == "O") {
        return "X";
    }
    return "O";
}
//AFEGIR LOADING ANIMATION AL ACABAR FER QUE EL MENU PUJI
const loadMainMenu = () => {
    //AMAGAR LOAD QUE ESTARA EN UNA CAPSA
    //Pop in de botons
    //Afegir events al botons
}
const loadData = (typeAction) => {
    let HTML = ``
}

const joinGame = () => {
    gameStatus.actualGameName = document.getElementById("idGame").value;
    loadInfoGame(joinGameInProgress);
}

const stopLoad = () => { //Amagar la animacio de carregar
    //let elem = document.querySelectorAll(".loading")[0];
    let op = 1;
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            elem.style.display = 'none';
        }
        elem.style.opacity = op;
        elem.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 10);
}

//AL CONECTARSE DIR CREAR O UNIR
    //SI CREAR LI DIREM QUE POSI EL GAMENAME I GAME PASSWORD
        //AL REQUEST TINDRA {
/*     "action": "createGame",
    "gameName": "xxxxx",
    "gamePassword": "yyyyy"
} */
    //AL CREAR DEMANAR QUIN SIGNE VOLS
    //SI VOL UNIR
        //fara infoGame i veura si dona ok, si ho fa segueix i carrega les dades
            //SI ESTA player buit esperar

    //FUNCIO CARREGAR ESTAT
        //infogame

//AL ESTAR AL JOC
    //Li direm que miri el moviment 

//Interval que comprovi a quin usuari li toca cada 5 usuaris


//EXAMPLE CREACIO
// {"status":"OK","response":"The game has been created."}

//EXAMPLE INFOGAME
/* {"status":"OK","response":"Enjoy the
game.","gameInfo":{"A1":"","A2":"","A3":"","B1":"","B2":"","B3":"","C1":"","C2":"","C3":""},"player":""} */