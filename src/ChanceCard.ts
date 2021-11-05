import { Scene } from "@babylonjs/core";
import { Buccaneer, GameAnimations } from "./index";
import { PirateCard } from "./Boat";
import { ChanceCard } from "./Boat";
import { PirateCardStack } from "./CardStacks";
import { initialiseTreasureOverlay } from "./UIoverlays";





const chanceCardDisplayHandler = function(buccaneer : Buccaneer, cardID : number) {
    switch(cardID){
        case 2:
        case 7:
        case 8:
        case 11:
        case 12:
        case 13:
        case 14:
        case 27: //Treasure or crew
            $("#chance_btnCrewTreasure").show();
            $("#chance_btnOK").hide();
            break;
        default: //just OK
            $("#chance_btnOK").show();
            $("#chance_btnCrewTreasure").hide();
            break;
    }
    $("#chance_popup").show();
}

const ccPiratePickupCount = function(buccaneer : Buccaneer, cardID: number){
    switch(cardID){
        case 1:
            if(buccaneer.player.inventory.getPirateValue() <= 3) return 4;
            else    return 0;
        case 3:
            if(buccaneer.player.inventory.getPirateValue() <= 3) return 4;
            else    return 0;
        case 4:
            if(buccaneer.player.inventory.getPirateValue() <= 3) return 4;
            else    return 0;
        case 5:
            if(buccaneer.player.inventory.getPirateValue() <= 3) return 4;
            else    return 0;
        case 6:
            if(buccaneer.player.inventory.getPirateValue() <= 3) return 4;
            else    return 0;
        case 11:    return 2;
        case 12:    return 2;
        case 13:    return 2;
        case 14:    return 3;
        case 15:    return 2;
        case 18:
            if(buccaneer.player.inventory.getPirateValue() <= 7) return 2;
            else    return 0;
        case 27:    return 3;
        case 28:    return 2;
        default:    return 0;
    }
}


const chanceCardOkHandler = function(buccaneer: Buccaneer, cardID : number) {
    GameAnimations.chanceCardDoneAnimation(cardID);
    buccaneer.player.pickUpPirateCards(ccPiratePickupCount(buccaneer, cardID));
    if(ChanceCard.isTradeable(cardID)){
        buccaneer.player.addChanceCard(new ChanceCard(cardID));
    }

    switch(cardID){
        case 2:
            //Card swapping with another player - show player select UI THEN crew selection UI (for both)
            break;
        case 9:
            //Treasure/crew to flat island - show boat crew/treasure UI -> blanked out to only enable selection of "Most valuable" treasure, else "Best" crew (can do automatically if unambiguous)
            break;
        case 10:
            //Crew desert to pirate island - show boat crew/treasure UI -> blanked out to only enable selection of "Best" crew (can do automatically if unambiguous)
            break;
        case 16:
            //Treasure then Reduce crew to 10 - show Treasure Island(7) THEN crew selection UI
            break;
        case 17:
            //Treasure then Reduce crew to 10 - show Treasure Island(6) THEN crew selection UI
            break;
        case 18:
            //Treasure Island(4)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        case 20:
            //Exchange crew with nearest ship on coast or return two crew cards -> crew selection UI (for both) if doing else crew selection UI to allow player to choose return
            break;
        case 22:
            //crew selection UI (for all)
            break;
        default:
            //do nothing
            break;
    }
}

const chanceCardTreasureHandler = function(buccaneer: Buccaneer, cardID : number) {
    GameAnimations.chanceCardDoneAnimation(cardID);
    switch(cardID){
        case 7:
            //Select treasure onboard to lose
            break;
        case 8:
            //Select treasure onboard to lose
            break;
        case 11:
            //Treasure Island(5)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        case 12:
            //Treasure Island(4)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        case 13:
            //Treasure Island(5)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        case 14:
            //Treasure Island(7)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        case 27:
            //Treasure Island(5)
            initialiseTreasureOverlay(buccaneer);
            $("#treasureoverlay").show();
            break;
        default:
            break;
    }
}

const chanceCardCrewHandler = function(buccaneer: Buccaneer, cardID : number) {
    GameAnimations.chanceCardDoneAnimation(cardID);
    buccaneer.player.pickUpPirateCards(ccPiratePickupCount(buccaneer, cardID));
    

    switch(cardID){
        case 7:
            //select crew to lose
            break;
        case 8:
            //select crew to lose
            break;
        default:
            break;
    }
}


export {
    chanceCardDisplayHandler,
    chanceCardOkHandler,
    chanceCardCrewHandler,
    chanceCardTreasureHandler
}
