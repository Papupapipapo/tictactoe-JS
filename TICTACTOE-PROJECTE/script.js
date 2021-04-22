let gameStatus = {
    positions: [],          //Les posicions d'aquesta partida
    actualGameName: "",     //Per a fer cache de quin nom hem de anar fer ping
    lastPassword: "",       //Cache del ultim password utilitzat per a unir la partida. Facilita el restart de partida
    player: "",             //Quin jugador es el jugador actual
    lastPlayer: "",         //El ultim que sabem que ha jugat, ens servirá per a comparar
    lastWinner: "",
    winsCrossThisSession: 0, //Per a fer track de cuantes victories porta en aquella pagina
    winsCircleThisSession: 0,
}

//Cache de elements per a estalviar recursos
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
let elemInfoBox;
let elemInfoBoxGif;

//Auxiliars a funcions de callback
let currentTurn;
let lastWinningPositionObject;
let newGameOK = false;
let auxLastChecked; //Aquest auxiliar es qui manega quina es la ultima columna que has fet

window.onload = () => {
    loadCacheElements();
    loadEvents();
}

const loadCacheElements = () => { //Fa cache dels elements que volem guardar
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
    elemInfoBox = document.getElementById("infoAbsolute");
    elemInfoBoxGif = document.getElementById("gifInfo");
}
const loadEvents = () => { //Carrega els events generals a cada objecte
    elemCloseButton.addEventListener("click", closePopUpInfo, false);
    document.getElementById("rematch").addEventListener("click", rematch, false);
    document.getElementById("returnMenu").addEventListener("click", returnMenu, false);
    document.getElementById("buttonsSign").addEventListener("click", selectSign, false);
}
//Carrega els events del gameBoard el cuals poden ser activats o desactivats, per a evitar que toqui mes del que cal
const boardEvents = () => {
    elemBoard.addEventListener("mouseover", previewMove, false);
    elemBoard.addEventListener("click", makeMove, false);
}
const cancelBoardEvents = () => {
    elemBoard.removeEventListener("mouseover", previewMove, false);
    elemBoard.removeEventListener("click", makeMove, false);
}
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
const joinGameInProgress = (infoActual) => { //Per a fer join a una partida
    gameStatus.player = "";
    if (checkStatus(infoActual.status)) {
        updatePositions(infoActual);
        let possiblePlayer = infoActual["player"];
        loadBoard();
        if (!checkEnd()) { //Si la partida no ha acabat, carregará els events
            boardEvents();
            if (checkIfEmpty(possiblePlayer)) {
                //CHECK SI HI HA PLAYER, SINO ESPERAR A el altre player estigui agafat
                loadPopUpInfoWait("Esperant a altre usuari fagi primer moviment");
                startWaitHost();
            } else { //En cas de que tot estigui bé, el usuari que surt actualment que esta per jugar será el caracter del jugador
                gameStatus.player = possiblePlayer;
                loadInfoBox();
            }
        }

      
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const joinReloadGame = (infoActual) => { //El mateix que abans pero refrescant el player per a els comprovants. Tambe nou comprovant de que el host hagi fet nova partida
    gameStatus.player = "";
    if (checkStatus(infoActual.status)) {
        updatePositions(infoActual);
        loadBoard();

        if (compareKeys(lastWinningPositionObject, infoActual["gameInfo"])) {
            loadPopUpInfoWait("Esperant a usuari host creei nova partida");
            gameStatus.positions = infoActual["gameInfo"];
            startWaitNewGame();
        } else if (checkIfEmpty(infoActual["player"])) {
            //CHECK SI HI HA PLAYER, SINO ESPERAR A el altre player estigui agafat
            loadPopUpInfoWait("Esperant a altre usuari fagi primer moviment");
            startWaitHost();
        } else {
            gameStatus.player = possiblePlayer;
            loadInfoBox();
            boardEvents();
        }
        
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}

//-------AUX INTERVALS
let waitPlayer; //Portará el interval de waitHost

let startWaitHost = () => { //El que porta el interval de si el host ha realitzat el seu moviment
    clearInterval(waitPlayer);
    waitPlayer = setInterval(function () {
        loadInfoGame(playerCheck);
        if (!checkIfEmpty(gameStatus.player)) {
            clearInterval(waitPlayer);
            stopLoad(elemAlertBox);
        }
    }, 1000);
}

let waitnewGame; //Portará el interval de waitNewGame

let startWaitNewGame = () => { //El que porta el interval de si el host ha realitzat el seu moviment
    clearInterval(waitnewGame);
    newGameOK = false;
    waitnewGame = setInterval(function () {
        loadInfoGame(newGameReloadCheck);
        if (newGameOK) {
            clearInterval(waitnewGame);
        }
    }, 1000);
}

function compareKeys(a, b) { //Compara dos objectes, util per a comparar les dues partides
    return JSON.stringify(a) === JSON.stringify(b);
}

const updatePositions = (infoActual) => { //Actualitza el gameStatus.positions amb les noves dades
    gameStatus.positions = infoActual["gameInfo"];
}

const checkNewTurn = (infoActual) => { //Comprova si el jugador 1 ha fet el primer moviment, es fa aixi perque aprofita els callbacks
    currentTurn = infoActual["player"];
    updatePositions(infoActual);
}
const newGameReloadCheck = (infoActual) => { //Aqui el que fara es primer comprovar si els dos jocs son iguals aixi evitar que afegeixi al contador innecesariament

    if (!compareKeys(lastWinningPositionObject, infoActual["gameInfo"])) {
        updatePositions(infoActual);
        newGameOK = true;
        //I com es un ansies comprova si s'ha realitzat el moviment del host i com no será el cas tornará a intentar-ho fins que el estigui d'acord
        if (checkIfEmpty(infoActual["player"])) {
            //CHECK SI HI HA PLAYER, SINO ESPERAR A el altre player estigui agafat
            loadPopUpInfoWait("Esperant a altre usuari fagi primer moviment");
            startWaitHost();
        } else {
            loadInfoBox();
            gameStatus.player = possiblePlayer;
            boardEvents();
        }
    };
}
const playerCheck = (infoActual) => { //Comprovant de si el jugador host ha fet el primer moviment
    if (!checkIfEmpty(infoActual["player"])) {
        gameStatus.player = infoActual["player"];
        updatePositions(infoActual);
        refreshGameBoardFields();
        loadInfoBox();
        boardEvents();
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

const createNewGame = (infoActual) => { //Creará la partida, pero donará un missatge de error en cas de que no hagi funcionat
    if (checkStatus(infoActual.status)) {
        loadInfoGame(createNewGameInfo);
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}
const reloadNewGame = (infoActual) => { //Per si es revancha
    if (checkStatus(infoActual.status)) {
        loadInfoGame(reloadNewGameInfo);
    } else {
        loadPopUpInfo(infoActual["response"]);
    }
}

const createNewGameInfo = (infoActual) => { //Una vegada carregada la partida, aixó inicialitza les dades i li dona a escollir al usuari entre les dues opcions
    updatePositions(infoActual);
    loadPopUpSign();
    boardEvents();
    loadBoard();
}

const reloadNewGameInfo = (infoActual) => { //Per si fem rematch, anirá per aquest camí que li guardará les dades
    updatePositions(infoActual);
    boardEvents();
    loadBoard();
    loadInfoBox();
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
    document.getElementById("actionButtonField").innerHTML = `<button type="button" class="btn btn-dark decentButtons" 
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
    loadInfoBox();
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

//MAIN INTERVAL
let intervalWaitMove; //Portará el timer interval per a comprovar la resposta
const startTimer = () => {
    clearInterval(intervalWaitMove);
    intervalWaitMove = setInterval(function () {
        loadInfoGame(checkNewTurn);
        if (currentTurn == gameStatus.player) {
            clearInterval(intervalWaitMove);
            refreshGameBoardFields();
            if (!checkEnd()) {
                hideInfoBoxWait();
                boardEvents();
            } else {
                hide(elemAlertBox);
            }
        }
    }, 1000);
}
const updatePositionsPostMove = (infoActual) => { //Comprovar si el jugador a guanyat, si no ha guanyat que posi la animació de carregar espera
    gameStatus.positions = infoActual["gameInfo"];
    if (!checkEnd()) {
        cancelBoardEvents();
        loadInfoBoxWait();
        currentTurn = "";
        startTimer();
        refreshGameBoardFields();
    }
}


const stopLoad = (elem) => { //Amagar la animacio de carregar
    //let elem = document.querySelectorAll(".loading")[0];
    let op = 1;
    var timer = setInterval(function () {
        if (op <= 0.1) {
            clearInterval(timer);
            elem.style.opacity = 1;
            closePopUpInfoWait();

            return;
        }
        elem.style.opacity = op;
        elem.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 10);
}

//---------GAMEBOARD
const loadBoard = () => { //Carregar la gameBoard i refrescarla
    if (elemFormContainer.classList.contains("d-flex")) { //Serveix per a si es simplement un reload
        hideFlex(elemFormContainer);
        showGrid(elemBoard);
    }
    refreshGameBoardFields();
}

const refreshGameBoardFields = () => { //Recarrega la UI de gameBoard
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

const loadPlayerSign = (elem) => { //Fa que aparegui el simbol adecuat del jugador
    elem.innerHTML = gameStatus.player;
}
const unloadPreview = () => { //Descarregar al moure el ratolí el preview
    auxLastChecked.innerHTML = "";
    auxLastChecked.style.removeProperty('color');
    auxLastChecked.removeEventListener("mouseleave", unloadPreview, false);
}

const makeMove = (e) => { //Al clicar lo hara permanente asi que no hace falta descargarlo
    //Hacer que pase de gris a color opaco
    let target = e.target;

    //PER A MOBIL
    if (window.innerWidth > 768) {
        if (auxLastChecked != target) {
            loadPopUpInfo("Posició no es valida, ja esta ocupada!")
            return;
        }
    } else {
        if (!checkIfEmpty(target.innerHTML)) {
            loadPopUpInfo("Posició no es valida, ja esta ocupada!")
            return;
        }

    }

    target.removeEventListener("mouseleave", unloadPreview, false);
    target.style.removeProperty('color');
    let makeMoveTo = String(target.id);
    loadMakeMove(makeMoveTo);
}

//----------Win condition
const checkEnd = () => { //Comprova si ha acabat per empat o guanyar la partida. En cas negatiu donará false;
    if (checkWinMove()) { //Si guanya actualitza algunes dades i guarda la partida per si hem de crear de nou
        loadPopUpEndGame(`Ha guanyat ${returnEmoji()}`); //Se ha de cambiar a una funcion que sea mas bonito
        printWins();
        cancelBoardEvents();
        cacheGame();
        closeInfoBox();
        hideInfoBoxWait();
        return true;
    }
    if (checkIfTie()) {
        loadPopUpEndGame(`Es un empat!`); //Se ha de cambiar a una funcion que sea mas bonito
        cancelBoardEvents();
        return true;
    }
    return false;
}

const returnEmoji = () => { //Per estetica retorna emoji
    if (gameStatus.lastWinner == "X") return "✖️";
    return "⚫";
}

const addWin = () => {  //Afegeix al contador de wins
    if (gameStatus.lastWinner == "X") ++gameStatus.winsCrossThisSession;
    else ++gameStatus.winsCircleThisSession;
}
const printWins = () => { //Posará les dades de partides guanyades actualitzat
    addWin();
    document.getElementById("crossWins").innerHTML = gameStatus.winsCrossThisSession;
    document.getElementById("dotWins").innerHTML = gameStatus.winsCircleThisSession;
}
const cacheGame = () => { //Guardará la partida acabada, per a el sistema de rematch
    lastWinningPositionObject = gameStatus.positions;
}

const checkWinMove = () => { //Comprovará els moviments dels dos usuaris per a veure si ha guanyat cap dels dos
    //Es important que miri els dos ja que es pot donar el cas de que un jugador s'uneixi a una partida ja acabada i així podria veure qui va guanyar
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
const checkDirections = (row, col) => { //Aqui mira els moviments possibles de cadascun dels usuaris
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

const checkIfTie = () => { //Conta cuants no estan buits i si es igual a 9 significa que no poden fer res més
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
    return counter == 9;
}
const convertColToCompost = (row, col) => { //Converteix les col a String que entén la API i l'objecte de posicions
    let conversionCol = ["A", "B", "C"];
    return String(conversionCol[col] + (row + 1));;
}

const rematch = () => { //un handler que ens servirá per a saber si l'usuari crea ell la partida o espera a que l'altre la creei
    hide(elemEndGame);
    hideFlex(elemPopUp);
    if (checkIfEmpty(gameStatus.lastPassword)) {
        rematchGuest();
    } else {
        rematchHost();
    }
}
const rematchHost = () => { //Si es el host creará la partida
    loadCreateGame(reloadNewGame);
}
const rematchGuest = () => {//Si es el guest mirará la info
    loadInfoGame(joinReloadGame);
}


//-------------------MISCELANIOUS FUNCTIONS

const checkIfEmpty = (string) => { //Comprova si esta buit
    return /^\s*$/.test(string);
}
//---------POP UP

//Bastant auto explicatori tot aixó. Carreguem displays i segons la seva categoria carrega i amaga diferents coses
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
const loadInfoBox = () => {
    show(elemInfoBox);
    document.getElementById("charUser").innerHTML = gameStatus.player;
}
const loadInfoBoxWait = () => {
    showFlex(elemInfoBox);
    show(elemInfoBoxGif);
    document.getElementById("txtInfo").innerHTML = "Esperant al enemic";
}
const loadPopUpSign = () => {
    show(elemChooseSign);
    loadPopUp();
}
//Aquest té de especial que es el de retornar al menu, i si escollim aquest també despejem les dades que tenim guardades
const returnMenu = () => {
    hide(elemEndGame);
    hideFlex(elemPopUp);
    hideFlex(elemBoard);
    showFlex(elemButtonMenu);
    flushData();
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
const closeInfoBox = () => {
    hideFlex(elemInfoBox);
    document.getElementById("txtInfo").innerHTML = `Et toca el torn! (Ets la <span id="charUser">${gameStatus.player}</span>)`;
}
const hideInfoBoxWait = () => {
    hide(elemInfoBoxGif);
    document.getElementById("txtInfo").innerHTML = `Et toca el torn! (Ets la <span id="charUser">${gameStatus.player}</span>)`;
}

const flushData = () => { //Reseteixa les dades, aixi estalvia problemes
    gameStatus = {
        positions: [],
        actualGameName: "",
        lastPassword: "",
        player: "",
        lastPlayer: "",
        lastWinner: "",
        winsCrossThisSession: 0,
        winsCircleThisSession: 0,
    }
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
