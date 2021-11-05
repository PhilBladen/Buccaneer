import { Buccaneer } from "src";
import { PirateCard } from "./Boat";
import { ChanceCard } from "./Boat";





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


const chanceCardHandler = function(buccaneer: Buccaneer, cardID: number) {
    switch (cardID) {
        case 14:
            buccaneer.player.addPirateCard(PirateCard.random());
        case 11:
        case 12:
        case 13:
        case 15:
            buccaneer.player.addPirateCard(PirateCard.random());
            buccaneer.player.addPirateCard(PirateCard.random());
            break;
        default:
            break;
    }

    if(ChanceCard.isTradeable(cardID)){
        buccaneer.player.addChanceCard(new ChanceCard(cardID));
    }
}

export {
    chanceCardDisplayHandler,
    chanceCardHandler
}