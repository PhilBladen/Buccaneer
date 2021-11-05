import { ChanceCard, PirateCard, PirateType } from "./GameItemManagement";
import { randomInt } from "./Utils";




class CardStack{
    //Represent cards as numbers for stack ops
    //Requires extension to load cards in!

    cards : number[];

    constructor(){
        this.cards = [];
    }

    shuffle(){
        if(this.cards.length > 1){
            for(let i = (this.cards.length - 1); i > 0; i--){
                let j = randomInt(i);
                let tmp = this.cards[i];
                this.cards[i] = this.cards[j];
                this.cards[j] = tmp;
            }
        }
    }

    drawCard() : number{
        return this.cards.shift();
    }

    returnCard( n : number){
        this.cards.push(n);
    }

    peekAtCard(index : number){
        if (index > this.cards.length)
            return -1;
        
            return this.cards[index];
    }

    debug_PrintDeck(){
        console.log("CARD DECK...");
        console.log("\t[TOP]");
        for(let i=0;i<this.cards.length;i++){
            console.log("\t" + i + ":\t" + this.cards[i]);
        }
        console.log("\t[BOTTOM]");
    }
}

class ChanceCardStack extends CardStack{
    
    constructor(){
        super();

        for (let cardNum = 1; cardNum <= 30; cardNum++) {
            this.cards.push(cardNum);
        }
    }

    static convert(n : number) : ChanceCard{
        return new ChanceCard(n);

    }
}

class PirateCardStack extends CardStack{

    constructor(){
        super();

        //Pirate quantities (per colour) TBD - should add to 26 for 52-card deck
        let numOnePirates = 10;
        let numTwoPirates = 12;
        let numThreePirates = 4;

        for (let i = 0; i < numOnePirates; i++) {
            this.cards.push(1);
            this.cards.push(4);
        }
        for (let i = 0; i < numTwoPirates; i++) {
            this.cards.push(2);
            this.cards.push(5);
        }
        for (let i = 0; i < numThreePirates; i++) {
            this.cards.push(3);
            this.cards.push(6);
        }
    }

    static convert(n:number) : PirateCard{
        if((n<1) || (n>6)){
            return null;
        }
        let cardColour = PirateType.NONE;

        if(n > 3){
            n-=3;
            cardColour = PirateType.RED;
        }
        else{
            cardColour = PirateType.BLACK;
        }

        return new PirateCard(cardColour, n);
    }
}


export{
    ChanceCardStack,
    PirateCardStack
}