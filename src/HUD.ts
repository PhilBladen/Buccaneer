import { Buccaneer } from "src";
import { chanceCardCrewHandler, chanceCardOkHandler, chanceCardTreasureHandler } from "./ChanceCard";
import { PirateType, TreasureItem, TreasureType } from "./GameItemManagement";
import { Player } from "./Player";
import { initialiseTradingOverlay, populatePirateCards, populateChanceCards, setTreasureItem, initialiseDockOverlay, initialiseTreasureOverlay, initialisePlayerSelectOverlay } from "./UIoverlays";

function initialiseHUD(buccaneer: Buccaneer) {
    $(() => {
        // $("#rulescontent").load("rules.html");


        let contentMap = $.getJSON("content/map.json", (json) => {
            // console.log(json);

            for (let key of Object.keys(json)) {
                console.log(key + ": " + json[key]);

                $("#" + key).load("content/" + json[key], (response, status, xhr) => {
                    if (status == "error") {
                        let msg = "Failed to load " + json[key] + ": ";
                        $("#error").html(msg + xhr.status + " " + xhr.statusText);
                    } else {
                        console.log("Loaded " + json[key] + ".");
                    }
                });
            }
        });
    });

    $("#chance_btnOK").on("click", () => {
        $("#chance_popup").hide()
        chanceCardOkHandler(buccaneer, buccaneer.drawnChanceCard);
    });
    $("#chance_btncrew").on("click", () =>{
        console.log("CREW");
        $("#chance_popup").hide();
        chanceCardCrewHandler(buccaneer, buccaneer.drawnChanceCard);
    });


    $("#chance_btntreasure").on("click", () =>{
        console.log("TREASURE");
        $("#chance_popup").hide();
        chanceCardTreasureHandler(buccaneer, buccaneer.drawnChanceCard);
        // initialiseTreasureOverlay(buccaneer);
        // $("#treasureoverlay").show();

    });

    $("#actionbtnturn").on({
        click: () => {
            $("#actionbtnturn").addClass("disabled");
            buccaneer.soundEngine.buttonClick();
            buccaneer.nextTurn();
        },
        mouseover: () => { buccaneer.soundEngine.buttonHover() }
    });

    $("#actionbtnattacktrade").on("click", () => {
        let btnText = $("#actionbtnattacktrade").text();
        if(btnText== "TRADE"){
            initialiseTradingOverlay(buccaneer);
            $("#tradingoverlay").show();
        }
        else if(btnText == "DOCK"){
            initialiseDockOverlay(buccaneer);
            $("#dockoverlay").show();
        }
    });

    $("#rules").on("click", () => {
        $("#rules").hide();
    });

    $('#btnrules').on("click", () => {
        $("#rules").show();
    });

    $("#btnhome").on("pointerdown", () => {
        let camera = buccaneer.camera;

        let p = buccaneer.boats[0].port;
        let pl = p.portLocation;
        camera.target.copyFrom(pl);
        camera.target.x += 0.5;
        camera.target.z += 0.5;
        if (pl.x <= -12) {
            camera.alpha = Math.PI;
        } else if (pl.x >= 12) {
            camera.alpha = 0;
        } else if (pl.z <= -12) {
            camera.alpha = -Math.PI / 2;
        } else if (pl.z >= 12) {
            camera.alpha = Math.PI / 2;
        }
        camera.beta = 1;
        camera.radius = 15;

        let button = $("#btncameralockboat");
        if (button.hasClass("cameralocktoggleon")) {
            button.removeClass("cameralocktoggleon");
            buccaneer.isCameraLockedToPlayerBoat = false;
        }
    });

    $("#btncameralockboat").on("pointerdown", () => {
        let button = $("#btncameralockboat");
        if (button.hasClass("cameralocktoggleon")) {
            button.removeClass("cameralocktoggleon");
            buccaneer.isCameraLockedToPlayerBoat = false;
        } else {
            button.addClass("cameralocktoggleon");
            buccaneer.isCameraLockedToPlayerBoat = true;
        }
    });

    let btnChanceCards = $("#btnchancecards");
    let btnPirateCards = $("#btnpiratecards");
    const showPirateCards = function () {
        btnPirateCards.addClass("cameralocktoggleon");
        $("#cs").show();
    }
    const hidePirateCards = function () {
        btnPirateCards.removeClass("cameralocktoggleon");
        $("#cs").hide();
    }
    const showChanceCards = function () {
        btnChanceCards.addClass("cameralocktoggleon");
        $("#chancecardviewer").show();
    }
    const hideChanceCards = function () {
        btnChanceCards.removeClass("cameralocktoggleon");
        $("#chancecardviewer").hide();
    }
    btnChanceCards.on("pointerdown", () => {
        if (btnChanceCards.hasClass("cameralocktoggleon")) {
            hideChanceCards();
        } else {
            showChanceCards();
        }

        if (btnPirateCards.hasClass("cameralocktoggleon")) {
            hidePirateCards();
        }
    });
    btnPirateCards.on("pointerdown", () => {
        if (btnPirateCards.hasClass("cameralocktoggleon")) {
            hidePirateCards();
        } else {
            showPirateCards();
        }

        if (btnChanceCards.hasClass("cameralocktoggleon")) {
            hideChanceCards();
        }
    });

    let numCards = 7;

    const layoutPirateCards = function () {
        let c = $("#c1");
        let cards = $("#cs");

        let element = cards[0];
        let aspect = 600 / 394;
        let defaultCardHeight = 200;
        let defaultCardWidth = defaultCardHeight / aspect;
        let scaleFactor = Math.min(1, (element.clientWidth) / (defaultCardWidth * (1 + 0.25 * (numCards - 1 + 1))));
        let cw = scaleFactor * defaultCardWidth;
        let ch = scaleFactor * defaultCardHeight;
        let elements: NodeListOf<HTMLElement> = document.querySelectorAll('.card');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.width = cw + "px";
            elements[i].style.marginLeft = (-0.375 * cw) + "px";
        }

        elements = document.querySelectorAll('.cardimg');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.maxWidth = (cw * 0.25) + "px";
            elements[i].style.maxHeight = (ch) + "px";
        }
    }

    const layoutChanceCards = function () {
        let cards = $("#chancecardviewer");

        let element = cards[0];
        let aspect = 600 / 394;
        let defaultCardHeight = 200;
        let defaultCardWidth = defaultCardHeight / aspect;
        let scaleFactor = Math.min(1, (element.clientWidth) / (defaultCardWidth * (1 + 1 * (numCards - 1 + 0))));
        let cw = scaleFactor * defaultCardWidth;
        let ch = scaleFactor * defaultCardHeight;
        let elements: NodeListOf<HTMLElement> = document.querySelectorAll('.card2');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.width = cw + "px";
            // elements[i].style.marginLeft = (-0.375 * cw) + "px";
        }

        elements = document.querySelectorAll('.cardimg2');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.minWidth = (cw * 1) + "px";
            elements[i].style.maxWidth = (cw * 1) + "px";
            elements[i].style.maxHeight = (ch) + "px";
        }
    }


    // setInterval(() => {
    //     let cards = $("#cs");
    //     let c = $("#c1");
    //     if (numCards < 15) {
    //         numCards++;
    //         cards.append(c.clone(true, true));
    //         layoutCards();
    //     }
    // }, 100);

    if (window.ResizeObserver) {
        console.log("Using resize observer")
        new ResizeObserver(layoutPirateCards).observe(document.getElementById("cs"));
        new ResizeObserver(layoutChanceCards).observe(document.getElementById("chancecardviewer")); // TODO
    } else {
        console.log("Using native")
        window.onresize = () => {
            layoutPirateCards();
            layoutChanceCards();
        }
    }

    layoutPirateCards();
    layoutChanceCards();


}

const updatePlayerPirateCards = function (player: Player): void {
    populatePirateCards(player.inventory, $("#cs"), $("#dummypiratecard"), PirateType.NONE, true);
}

const updatePlayerChanceCards = function (player: Player) : void {
    populateChanceCards(player.inventory, $("#chancecardviewer"), $("#dummychancecard"), true);
}

const updatePlayerTreasureGraphics = function(player : Player) : void {
    setTreasureItem(player.inventory.treasureSlot1, $("#hudtreasure1"));
    setTreasureItem(player.inventory.treasureSlot2, $("#hudtreasure2"));
}


export {
    initialiseHUD,
    updatePlayerPirateCards,
    updatePlayerChanceCards,
    updatePlayerTreasureGraphics
}