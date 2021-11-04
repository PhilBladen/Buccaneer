import * as Utils from './Utils';



enum PirateType {
    NONE, BLACK, RED
}

class PirateCard {
    type: PirateType = PirateType.NONE;
    value: number = 0;

    static random() {
        let card = new PirateCard();
        card.type = Utils.randomInt(1) == 0 ? PirateType.BLACK : PirateType.RED;
        card.value = Utils.randomInt(2) + 1;
        return card;
    }
}

enum ChanceType {
    NONE, ACTION, TRADEABLE
}

class ChanceCard {
    type: ChanceType = ChanceType.NONE;
    cardNum: number = 0;

    constructor(n: number){
        if(n>0 && n <= 30){
            this.cardNum = n;
            if(ChanceCard.isTradeable(n)){
                this.type = ChanceType.TRADEABLE;
            } else{
                this.type = ChanceType.ACTION;
            }
        }
        else{
            this.cardNum = 0;
            this.type = ChanceType.NONE;
        }
    }

    static isTradeable(n: number){
        switch(n){
            case 21:
            case 23:
            case 24:
            case 25:
            case 26:
            case 29:
                return true;
            default:
                return false;
        }
    }
}

enum TreasureType {
    NONE, RUM, PEARL, GOLD, DIAMOND, RUBY
}

class TreasureItem {
    type: TreasureType = TreasureType.NONE;

    static random() {
        let randomTreasure = new TreasureItem();
        let x = Utils.randomInt(4);
        switch(x){
            case 0:
                randomTreasure.type = TreasureType.RUM;
                break;
            case 1:
                randomTreasure.type = TreasureType.PEARL;
                break;
            case 2:
                randomTreasure.type = TreasureType.GOLD;
                break;
            case 3:
                randomTreasure.type = TreasureType.DIAMOND;
                break;
            case 4:
                randomTreasure.type = TreasureType.RUBY;
                break;
            default:
                randomTreasure.type = TreasureType.NONE;
                break;
        }
        return randomTreasure;
    }
}

class Inventory {
    pirateCards: PirateCard[] = [];
    chanceCards: ChanceCard[] = [];
    treasures: TreasureItem[] = [];
    treasureSlot1: TreasureItem;
    treasureSlot2: TreasureItem;

    constructor() {

    }
}

export{
    PirateType,
    PirateCard,
    ChanceType,
    ChanceCard,
    TreasureType,
    TreasureItem,
    Inventory
}