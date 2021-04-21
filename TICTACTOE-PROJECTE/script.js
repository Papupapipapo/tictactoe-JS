let gameStatus = {
    positions: [],          //Les posicions d'aquesta partida
    actualGameName: "",     //Per a fer cache de quin nom hem de anar fer ping
    lastPassword: "",       //Cache del ultim password utilitzat per a unir la partida. Facilita el restart de partida
    player: "",             //Quin jugador es el jugador actual
    lastPlayer: "",         //El ultim que sabem que ha jugat, ens servirá per a comparar
    lastWinner: "",
    // winsThisSession: 0, //atraves de cookies fer si guanya o perd consecutiu
}
let elemBoard;
let elemButtonMenu;
let elemFormContainer;
let elemPopUp;
let elemAlertBox;
let elemCloseButton;
let elemGifAnimation;
let elemChooseSign;
let elemsGameCol;
let elemEndGame;
let elemResultText;
let currentTurn;


let auxLastChecked; //Aquest auxiliar es qui manega quina es la ultima columna que has fet

window.onload = () => {
    loadCacheElements();
    loadEvents();
}
const loadCacheElements = () => { //Fa cache dels tres main div
    elemBoard = document.getElementById("gameBoard");
    elemButtonMenu = document.getElementById("buttonMenu");
    elemFormContainer = document.getElementById("formContainer");
    elemPopUp = document.getElementById("popUp");
    elemAlertBox = document.getElementById("alertBox");
    elemChooseSign = document.getElementById("chooseSign");
    elemsGameCol = document.querySelectorAll(".colGameBoard");
    elemResultText = document.getElementById("resultText");
    elemEndGame = document.getElementById("endGame");
    elemCloseButton = document.getElementById("closeButton");
    elemGifAnimation = document.getElementById("gif");
}
const loadEvents = () => {
    elemCloseButton.addEventListener("click", closePopUpInfo, false);
    document.getElementById("rematch").addEventListener("click", rematch, false);
    document.getElementById("returnMenu").addEventListener("click", returnMenu, false);
    document.getElementById("buttonsSign").addEventListener("click", selectSign, false);
}
const boardEvents = () => {
    elemBoard.addEventListener("mouseover", previewMove, false);
    elemBoard.addEventListener("click", makeMove, false);
}
const cancelBoardEvents = () => {
    elemBoard.removeEventListener("mouseover", previewMove, false);
    elemBoard.removeEventListener("click", makeMove, false);
}
//status O OK =TRUE KO = FALSE 
//PLAYER O o X
//response desc de el que ens dona
//gameInfo com esta el tauler actualment

//-------------GET INFO 
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


//Funcions que pot fer callback
const joinGameInProgress = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        updatePositions(infoActual);
        let possiblePlayer = infoActual["player"];
        console.log("Joined correctly");
        loadBoard();
        checkEnd();
        if (checkIfEmpty(possiblePlayer)) {
            //CHECK SI HI HA PLAYER, SINO ESPERAR A el altre player estigui agafat
            loadPopUpInfoWait("Esperant a altre usuari fagi primer moviment");
            startWaitHost();
        } else {
            gameStatus.player = possiblePlayer;
        }

        boardEvents();
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const joinReloadGame = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        updatePositions(infoActual);
        let possiblePlayer = infoActual["player"];
        loadBoard();
        checkEnd();
        if (checkIfEmpty(possiblePlayer)) {
            //CHECK SI HI HA PLAYER, SINO ESPERAR A el altre player estigui agafat
            loadPopUpInfoWait("Esperant a altre usuari fagi primer moviment");
            startWaitHost();
        } else {
            gameStatus.player = possiblePlayer;
        }
        boardEvents();
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
let waitPlayer;

const startWaitHost = () => { //El que porta el interval de si el host ha realitzat el seu moviment
    clearInterval(waitPlayer);
    waitPlayer = setInterval(function () {
        loadInfoGame(playerCheck);
        if (!checkIfEmpty(gameStatus.player)) {
            clearInterval(intr);
            stopLoad(elemAlertBox);
        }
    }, 1000);
}
const updatePositions = (infoActual) => {
    gameStatus.positions = infoActual["gameInfo"];
}

const checkNewTurn  = (infoActual) => {
    currentTurn = infoActual["player"];
    updatePositions(infoActual);
}
const playerCheck = (infoActual) => {
    if (!checkIfEmpty(infoActual["player"])) {
        gameStatus.player = infoActual["player"];
        updatePositions(infoActual);
    };
}
const checkStatus = (status) => { //Mirar si l'status esta ok
    return status == "OK";
}
//------------CREATE
const loadCreateGame = (callback) => { //Aixi podrem fer aquesta funcio per a fer simplement check info i d'alli ja el usuari fer el que vulgui
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const infoActual = JSON.parse(this.responseText);
            callback(infoActual);
        }
    };
    xhttp.open("POST", "http://tictactoe.codifi.cat", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(`{"action": "createGame","gameName": "${gameStatus.actualGameName}","gamePassword": "${gameStatus.lastPassword}"}`);
}
//Funcions que pot fer callback 

const createNewGame = (infoActual) => {
    if (checkStatus(infoActual.status)) {
        loadInfoGame(createNewGameInfo);
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const reloadNewGame = (infoActual) => { //Per si es revancha
    if (checkStatus(infoActual.status)) {
        loadInfoGame(createNewGameInfo);
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}

const createNewGameInfo = (infoActual) => {
    updatePositions(infoActual);
    loadPopUpSign();
    boardEvents();
    loadBoard();
}

const loadFormGame = (typeAction) => { //Ensenya el container i ensenya o amaga la field de password i canvia la funció del botó
    hideFlex(elemButtonMenu);
    showFlex(elemFormContainer); //Ensenya el container

    //Que comprovi si es join aixi si no es estalviem que miri fins al final.  
    //Aixó es ja que per defecte esta carregat com a join
    if (typeAction == "join") {
        return;
    }
    showFlex(document.getElementById("passwField"));
    document.getElementById("actionButtonField").innerHTML = `<button type="button" class="btn btn-dark disabled" 
    onclick="createGame()">Crear partida</button>`;
}

const setDataGame = () => { //Posara el nom de la partida que volem unir-nos 
    gameStatus.actualGameName = document.getElementById("idGame").value;
}
const createGame = () => { //Creará una nova partida
    setDataGame();
    gameStatus.lastPassword = document.getElementById("passwordGame").value; //Posará la contraseya que utilitzarem fer a crear la partida
    loadCreateGame(createNewGame);
}
const joinGame = () => { //Fará un info i carregará la partida
    setDataGame();
    loadInfoGame(joinGameInProgress);
}

const selectSign = (e) => { //Aqui seleccionarem quin signe tindrem com a jugador
    let targetID = e.target.id;
    gameStatus.player = targetID;
    hide(elemChooseSign);
    hideFlex(elemPopUp);
}
//--------MAKEMOVE
const loadMakeMove = (movement) => { //Aixi podrem fer aquesta funcio per a fer simplement check info i d'alli ja el usuari fer el que vulgui
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            loadInfoGame(updatePositionsPostMove);
        }
    };
    xhttp.open("POST", "http://tictactoe.codifi.cat", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(`{"action": "playGame","gameName": "${gameStatus.actualGameName}","movement": "${movement}","player": "${gameStatus.player}"}`);
}
let intervalWaitMove; //Portará el timer interval per a comprovar la resposta
const startTimer = () => {
    clearInterval(intervalWaitMove);
    intervalWaitMove = setInterval(function () {
        loadInfoGame(checkNewTurn);
        if (currentTurn == gameStatus.player) {
            clearInterval(intervalWaitMove);
            stopLoad(elemAlertBox);
            refreshGameBoardFields();
            if(!checkEnd()){
                boardEvents();
            }
        }
    }, 1000);     
}
const updatePositionsPostMove = (infoActual) => { //Comprovar si el jugador a guanyat, si no ha guanyat que posi la animació de carregar espera
    gameStatus.positions = infoActual["gameInfo"];
    if(!checkEnd()){
        cancelBoardEvents();
        loadPopUpInfoWait("Esperant al moviment del enemic");
        currentTurn = "";
        startTimer();
        refreshGameBoardFields();   
    }
    //enableLoading();
    //startTimer();
}


const stopLoad = (elem) => { //Amagar la animacio de carregar
    //let elem = document.querySelectorAll(".loading")[0];
    let op = 1;
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            closePopUpInfoWait();
            elem.style.opacity = 1;
        }
        elem.style.opacity = op;
        elem.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 10);
}

//---------GAMEBOARD
const loadBoard = () => { //Carregar la 
    if (elemFormContainer.classList.contains("d-flex")) { //Serveix per a si es simplement un reload
        hideFlex(elemFormContainer);
        showGrid(elemBoard);
    }
    refreshGameBoardFields();
}

const refreshGameBoardFields = () => {
    let positionTracker = 0;
    let compost;
    for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
            compost = convertColToCompost(col, row);
            elemsGameCol[positionTracker].innerHTML = gameStatus.positions[compost];
            positionTracker++;
        }
    }
}



//------------EVENTS DEL BOARD
const previewMove = (e) => { //Carrega el moviment al fer hover
    let target = e.target;
    if (target.classList.contains("col-sm") && checkIfEmpty(target.textContent)) { //Comprova que sigui columna i que el texte estigui buit
        target.style.color = "#f2f2f2";
        loadPlayerSign(target);
        auxLastChecked = target;
        target.addEventListener("mouseleave", unloadPreview, false);
    }
}

const loadPlayerSign = (elem) => {
    elem.innerHTML = gameStatus.player;
}
const unloadPreview = () => {
    auxLastChecked.innerHTML = "";
    auxLastChecked.style.removeProperty('color');
    auxLastChecked.removeEventListener("mouseleave", unloadPreview, false);
}

const makeMove = (e) => { //Al clicar lo hara permanente asi que no hace falta descargarlo
    //Hacer que pase de gris a color opaco
    let target = e.target;

    if (auxLastChecked != target) {
        loadPopUpInfo("Posició no es valida, ja esta ocupada!")
        return;
    }
    auxLastChecked.removeEventListener("mouseleave", unloadPreview, false);
    target.style.removeProperty('color');
    let makeMoveTo = String(target.id);
    loadMakeMove(makeMoveTo);
}

//----------Win condition
const checkEnd = () => {
    if (checkWinMove()) {
        loadPopUpEndGame(`Ha ganao ${gameStatus.lastWinner}`); //Se ha de cambiar a una funcion que sea mas bonito
        cancelBoardEvents();
        return true;
    }
    if (checkIfTie()) {
        loadPopUpEndGame(`Es un empat!`); //Se ha de cambiar a una funcion que sea mas bonito
        cancelBoardEvents();
        return true;
    }
    return false;
}
const checkWinMove = () => {
    let playersToCheck = ["X", "O"];
    let positions = gameStatus.positions;
    let compost;
    for (let i = 0; i < playersToCheck.length; i++) {
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                compost = convertColToCompost(col, row);
                if (positions[compost] == playersToCheck[i]) {
                    if (checkDirections(row, col)) {
                        gameStatus.lastWinner = playersToCheck[i];
                        return true;
                    }
                }
            }
        }
    }

    return false;
}
const checkDirections = (row, col) => {
    let resultCheckAngle = false;
    if (row == 0) {
        if (col == 0) {
            resultCheckAngle = checkAngleAscending(row, col);
        }
        if (col == 2) {
            resultCheckAngle = checkAngleDescending(row, col);
        }
    }
    return checkHoritzontal(row, col) || checkVertical(row, col) || resultCheckAngle;
}
//Solament mirarán de forma positiva ja que si o si es el primer que es trobaria. 
//Al ser de 3 es indiferent quin es el punt de referncia si o si es fent de forma positiva
const checkHoritzontal = (row, col) => {
    let compost = convertColToCompost(col, row);
    let currentPlayer = gameStatus.positions[compost];
    let positions = gameStatus.positions;
    let consecutive = 1;
    let trackCol = col;
    while (positions[compost] == currentPlayer && trackCol < 3) {
        trackCol++;
        compost = convertColToCompost(trackCol, row);
        if (positions[compost] == currentPlayer) {
            consecutive++;
        }
    }
    return consecutive == 3;
}

const checkVertical = (row, col) => {
    let compost = convertColToCompost(col, row);
    let currentPlayer = gameStatus.positions[compost];
    let positions = gameStatus.positions;
    let consecutive = 1;
    let trackRow = row;
    console.log(currentPlayer + " player V");
    while (positions[compost] == currentPlayer && trackRow < 3) {
        trackRow++;
        compost = convertColToCompost(col, trackRow);
        if (positions[compost] == currentPlayer) {
            consecutive++;
        }
    }
    return (consecutive == 3);
}

const checkAngleAscending = (row, col) => {//A1,B2,C3
    let compost = convertColToCompost(col, row);
    let currentPlayer = gameStatus.positions[compost];
    let positions = gameStatus.positions;
    return currentPlayer == positions["A1"] && positions["A1"] == positions["B2"] && positions["B2"] == positions["C3"]
}
const checkAngleDescending = (row, col) => { //A3 , B2, C1
    let compost = convertColToCompost(col, row);
    let currentPlayer = gameStatus.positions[compost];
    let positions = gameStatus.positions;
    return currentPlayer == positions["A3"] && positions["A3"] == positions["B2"] && positions["B2"] == positions["C1"]
}

const checkIfTie = () => {
    let positions = gameStatus.positions;
    let counter = 0;
    for (let col = 0; col < 3; col++) {
        for (let row = 0; row < 3; row++) {
            compost = convertColToCompost(col, row);
            if (positions[compost] != "") {
                counter++;
            }
        }
    }
    return counter == 8;
}
const convertColToCompost = (row, col) => {
    let conversionCol = ["A", "B", "C"];
    return String(conversionCol[col] + (row + 1));;
}

const rematch = () => {
    if (checkIfEmpty(gameStatus.lastPassword)) {
        rematchGuest();
    } else {
        rematchHost();
    }
}
const rematchHost = () => {
    hide(elemEndGame);
    hideFlex(elemPopUp);
    loadCreateGame(reloadNewGame);
}
const rematchGuest = () => {
    hide(elemEndGame);
    hideFlex(elemPopUp);
    loadInfoGame(joinReloadGame);
}


//-------------------MISCELANIOUS FUNCTIONS

const checkIfEmpty = (string) => {
    return /^\s*$/.test(string);
}
//---------POP UP
const loadPopUp = () => {
    showFlex(elemPopUp);
}
const loadPopUpInfo = (stringToLoad) => {
    document.getElementById("txtAlert").innerHTML = stringToLoad;
    show(elemAlertBox);
    loadPopUp();
}
const loadPopUpInfoWait = (stringToLoad) => {
    document.getElementById("txtAlert").innerHTML = stringToLoad;
    hide(elemCloseButton);
    show(elemGifAnimation);
    show(elemAlertBox);
    loadPopUp();
}
const loadPopUpEndGame = (stringToLoad) => {
    show(elemEndGame);
    document.getElementById("resultText").innerHTML = stringToLoad;
    show(elemResultText);

    loadPopUp();
}
const loadPopUpSign = () => {
    show(elemChooseSign);
    loadPopUp();
}

const returnMenu = () => {
    hide(elemEndGame);
    hideFlex(elemPopUp);
    hideFlex(elemBoard);
    showFlex(elemButtonMenu);
}

const closePopUpInfo = () => {
    hide(elemAlertBox);
    hideFlex(elemPopUp);
}
const closePopUpInfoWait = () => {
    hide(elemAlertBox);
    hide(elemGifAnimation);
    hideFlex(elemPopUp);
    show(elemCloseButton);
}

//-----------DISPLAYS

const showFlex = (element) => { //Li donem un element i li dona display de flex
    show(element);
    element.classList.add("d-flex");
}
const hideFlex = (element) => { //Li donem un element flex i l'amaga donantli display none
    hide(element);
    element.classList.remove("d-flex");
}

const showGrid = (element) => { //Li donem un element i li dona display de flex
    show(element);
    element.classList.add("d-grid");
}
const hideGrid = (element) => { //Li donem un element i li dona display de flex
    hide(element);
    element.classList.remove("d-grid");
}
const hide = (element) => {
    element.classList.add("d-none");
}
const show = (element) => {
    element.classList.remove("d-none");
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