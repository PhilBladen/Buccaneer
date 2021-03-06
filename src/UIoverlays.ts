import { Buccaneer } from "src";
import { PirateCardStack } from "./CardStacks";
import { Inventory, PirateType, TreasureItem } from "./GameItemManagement";
import { Player } from "./Player";
import { ports } from "./Port";

function initialiseTradingOverlay(buccaneer: Buccaneer) {
    
    $("#trading_button_quitcenter").on("click", () => $("#tradingoverlay").hide());
    $("#trading_button_quitbottom").on("click", () => $("#tradingoverlay").hide());

    $("#trading_button_switchcenter").on("click", () => {
        
    });

    $("#trading_button_switchbottom").on("click", () => {
        
    });


    setBackgroundColor($("#trading_LHSpane"), buccaneer.player.port.portColor);
    

    populatePirateCards(buccaneer.player.inventory, $("#trading_LHSredcrew"), $("#dummytradingcard"), PirateType.RED, false);
    populatePirateCards(buccaneer.player.inventory, $("#trading_LHSblackcrew"), $("#dummytradingcard"), PirateType.BLACK, false);
    populateChanceCards(buccaneer.player.inventory, $("#trading_LHSchance"), $("#dummytradingcard"), false);
    setTreasureItem(buccaneer.player.inventory.treasureSlot1, $("#trading_LHStreasure1"));
    setTreasureItem(buccaneer.player.inventory.treasureSlot2, $("#trading_LHStreasure2"));

    let p = buccaneer.player.currentPort();
    setBackgroundColor($("#trading_RHSpane"), p.portColor);
    setText($("#trading_RHStitletext"), "PORT OF<br>" + p.portName.toUpperCase());


    populatePirateCards(p.inventory, $("#trading_RHSredcrew"), $("#dummytradingcard"), PirateType.RED, false);
    populatePirateCards(p.inventory, $("#trading_RHSblackcrew"), $("#dummytradingcard"), PirateType.BLACK, false);
    populateChanceCards(p.inventory, $("#trading_RHSchance"), $("#dummytradingcard"), false);
    populateTreasureItems(p.inventory, $("#trading_RHStreasure"), $("#dummyRHStreasure"));
}

function initialiseDockOverlay(buccaneer: Buccaneer) {
    
    $("#dock_button_quitcenter").on("click", () => $("#dockoverlay").hide());
    $("#dock_button_quitbottom").on("click", () => $("#dockoverlay").hide());

    $("#dock_button_unloadcenter").on("click", () => {
        
    });

    $("#dock_button_loadcenter").on("click", () => {
        
    });

    $("#dock_button_unloadbottom").on("click", () => {
        
    });

    $("#dock_button_loadbottom").on("click", () => {
        
    });


    setBackgroundColor($("#dock_LHSpane"), buccaneer.player.port.portColor);
    

    populatePirateCards(buccaneer.player.inventory, $("#dock_LHSredcrew"), $("#dummytradingcard"), PirateType.RED, false);
    populatePirateCards(buccaneer.player.inventory, $("#dock_LHSblackcrew"), $("#dummytradingcard"), PirateType.BLACK, false);
    populateChanceCards(buccaneer.player.inventory, $("#dock_LHSchance"), $("#dummytradingcard"), false);
    setTreasureItem(buccaneer.player.inventory.treasureSlot1, $("#dock_LHStreasure1"));
    setTreasureItem(buccaneer.player.inventory.treasureSlot2, $("#dock_LHStreasure2"));

    let p = buccaneer.player.currentPort();
    setBackgroundColor($("#dock_RHSpane"), p.portColor);
    setText($("#dock_RHStitletext"), "HOME PORT<br>POINTS: " + p.inventory.getTreasureValue());


    populatePirateCards(p.inventory, $("#dock_RHSredcrew"), $("#dummytradingcard"), PirateType.RED, false);
    populatePirateCards(p.inventory, $("#dock_RHSblackcrew"), $("#dummytradingcard"), PirateType.BLACK, false);
    populateChanceCards(p.inventory, $("#dock_RHSchance"), $("#dummytradingcard"), false);
    populateTreasureItems(p.inventory, $("#dock_RHStreasure"), $("#dummyRHStreasure"));
}

function initialiseTreasureOverlay(buccaneer: Buccaneer) {
    
    $("#treasure_button_quitcenter").on("click", () => $("#treasureoverlay").hide());
    $("#treasure_button_quitbottom").on("click", () => $("#treasureoverlay").hide());

    $("#treasure_button_loadcenter").on("click", () => {
        buccaneer.treasureChestInventory.print();
    });

    $("#treasure_button_switchbottom").on("click", () => {
        
    });

    $("#treasure_button_delete").on("click", () => {
        
    });

    $("#treasure_button_reset").on("click", () => {
        buccaneer.treasureChestInventory.print();
    });

    setTreasureItem(buccaneer.player.inventory.treasureSlot1, $("#treasure_LHStreasure1"));
    setTreasureItem(buccaneer.player.inventory.treasureSlot2, $("#treasure_LHStreasure2"));

    let tc = buccaneer.treasureChestInventory;

    populateTreasureItems(tc.rum, $("#treasure_RHSvalue2"), $("#dummyRHStreasure"));
    populateTreasureItems(tc.pearl, $("#treasure_RHSvalue3"), $("#dummyRHStreasure"));
    populateTreasureItems(tc.gold, $("#treasure_RHSvalue4"), $("#dummyRHStreasure"));
    populateTreasureItems(tc.diamond.concat(tc.ruby), $("#treasure_RHSvalue5"), $("#dummyRHStreasure"));
}

function initialisePlayerSelectOverlay(buccaneer: Buccaneer) {
    let container : JQuery<HTMLElement> = $("#playerselect_buttoncontainer");
    container.empty();
    for(let port of ports) {
        if(port.boat != null){
            if(port.boat.port.portName == buccaneer.player.port.portName) continue;
            let newBtn = $("#dummyplayerbutton").clone();
            let newSpace = $("#dummyplayerbuttonspacing").clone();
            newBtn.css("background-color", port.portColor);
            newBtn.text(port.portName.toUpperCase());
            let newID = "playerbutton" + port.portName
            newBtn.attr("id", newID);

            newBtn.on("click", () => {
                $("#playerselectoverlay").hide(); //TODO change me to open card select UI, and also to notify other player through server somehow...
            });
        

            newBtn.show();
            newSpace.show();
            container.append(newBtn);
            container.append(newSpace);
        }
    }
}

function initialiseBoatCrewTreasureOverlay(buccaneer : Buccaneer){
    $("#bct_button_ok").on("click", () => $("#boatcrewtreasureoverlay").hide());


    setBackgroundColor($("#trading_LHSpane"), buccaneer.player.port.portColor);
    

    populatePirateCards(buccaneer.player.inventory, $("#bct_redcrew"), $("#dummytradingcard"), PirateType.RED, false);
    populatePirateCards(buccaneer.player.inventory, $("#bct_blackcrew"), $("#dummytradingcard"), PirateType.BLACK, false);
    setTreasureItem(buccaneer.player.inventory.treasureSlot1, $("#bct_treasure1"));
    setTreasureItem(buccaneer.player.inventory.treasureSlot2, $("#bct_treasure2"));
}

function initialiseCrewSelectionOverlay(buccaneer : Buccaneer){
    $("#cardview_button").on("click", () => $("#cardviewoverlay").hide());


    setBackgroundColor($("#crewsel_pane"), buccaneer.player.port.portColor);
    setText($("#cardview_title"), "REDUCE CREW TOTAL TO 10");
    setText($("#cardview_button"), "OK");
    

    populatePirateCards(buccaneer.player.inventory, $("#cardview_cards"), $("#dummydynamiccard"), PirateType.NONE, false);
}


function initialiseCrewDisplayOverlay(buccaneer : Buccaneer){
    $("#cardview_button").on("click", () => $("#cardviewoverlay").hide());

    setBackgroundColor($("#crewsel_pane"), buccaneer.player.port.portColor);
    setText($("#cardview_title"), "CREW");
    setText($("#cardview_button"), "CLOSE");
    
    populatePirateCards(buccaneer.player.inventory, $("#cardview_cards"), $("#dummydynamiccard"), PirateType.NONE, false);
}

function initialiseChanceDisplayOverlay(buccaneer : Buccaneer){
    $("#cardview_button").on("click", () => $("#cardviewoverlay").hide());

    setBackgroundColor($("#crewsel_pane"), buccaneer.player.port.portColor);
    setText($("#cardview_title"), "CHANCE CARDS");
    setText($("#cardview_button"), "CLOSE");
    
    populateChanceCards(buccaneer.player.inventory, $("#cardview_cards"), $("#dummytradingcard"), false);
}


function setBackgroundColor(container: JQuery<HTMLElement>, color : string){
    container.css("background-color", color);
}

function setText(container: JQuery<HTMLElement>, t : string){
    container.html(t);
}


function populatePirateCards(inventory: Inventory, container: JQuery<HTMLElement>, template: JQuery<HTMLElement>, filter: PirateType, unshadeFirstCard: boolean) {
    container.empty();
    for (let card of inventory.pirateCards) {
        if((filter==PirateType.NONE)||(card.type == filter)){
            let newCard = template.clone();
            if (unshadeFirstCard) {
                newCard.children().addClass("noshadow");
                unshadeFirstCard = false;
            }
            newCard.children().attr("src", "assets/pirates/Pirate " + (card.type == PirateType.BLACK ? "Black" : "Red") + " " + (card.value) + " NoWear.png ");
            newCard.show();
            container.append(newCard);
        }
    }
}

function populateChanceCards(inventory: Inventory, container: JQuery<HTMLElement>, template: JQuery<HTMLElement>, unshadeFirstCard: boolean) {
    container.empty();
    for(let card of inventory.chanceCards) {
        let newCard = template.clone();
        if(unshadeFirstCard) {
            newCard.children().addClass("noshadow");
            unshadeFirstCard = false;
        }
        newCard.children().attr("src", "assets/cards/Chance " + (card.cardNum) + ".png");
        newCard.show();
        container.append(newCard);
    }
}

function populateTreasureItems(treasureInput: Inventory|TreasureItem[], container: JQuery<HTMLElement>, template: JQuery<HTMLElement>) {
    container.empty();
    let t : TreasureItem[];
    if(treasureInput instanceof Inventory){
        t = treasureInput.treasures;
    }
    else{
        t = treasureInput;
    }
    if(t.length == 0){ //Fudge to preserve container height if no treasure present
        let phantomTreasure = $("#phantomRHStreasure").clone();
        phantomTreasure.show();
        container.append(phantomTreasure);
        return;
    }
    for(let item of t) {
        console.log("Treasure Item is: " + item.type);
        let newItem = template.clone();

        newItem.children().attr("src", TreasureItem.getGraphicsPath(item));
        newItem.show();
        container.append(newItem);
    }
}


function setTreasureItem(t: TreasureItem, container: JQuery<HTMLElement>) {
    container.children().attr("src", TreasureItem.getGraphicsPath(t));
}




export {
    initialiseTradingOverlay,
    initialiseTreasureOverlay,
    initialiseDockOverlay,
    initialisePlayerSelectOverlay,
    initialiseBoatCrewTreasureOverlay,
    initialiseCrewSelectionOverlay,
    initialiseCrewDisplayOverlay,
    initialiseChanceDisplayOverlay,
    populatePirateCards,
    populateChanceCards,
    setTreasureItem
}