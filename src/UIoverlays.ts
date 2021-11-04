import { Buccaneer } from "src";
// import { Inventory } from "./Boat";

function initialiseTradingOverlay(buccaneer: Buccaneer) {
    
    $("#trading_button_quitcenter").on("click", () => $("#tradingoverlay").hide());
    $("#trading_button_quitbottom").on("click", () => $("#tradingoverlay").hide());

    $("#trading_button_switchcenter").on("click", () => {
        
    });

    $("#trading_button_switchbottom").on("click", () => {
        
    });

    

}

// function populatePirateCards(inv: Inventory, el: HTMLElement) {

// }

export {
    initialiseTradingOverlay
}