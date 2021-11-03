import { Buccaneer } from "src";
import { PirateCard } from "./Boat";

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

    console.log("Ran card handler: " + cardID);
}

export {
    chanceCardHandler
}