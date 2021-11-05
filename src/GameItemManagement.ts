import { ThinEngine } from '@babylonjs/core';
import * as Utils from './Utils';



enum PirateType {
    NONE, BLACK, RED
}

class PirateCard {
    type: PirateType = PirateType.NONE;
    value: number = 0;

    constructor(type : PirateType = PirateType.NONE, value: number = 0){
        this.type = type;
        this.value = value;
    }

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

    constructor(type?: TreasureType){
        this.type = type;
    }

    getValue() : number {
        switch(this.type){
            case TreasureType.RUM:      return 2;
            case TreasureType.PEARL:    return 3;
            case TreasureType.GOLD:     return 4;
            case TreasureType.DIAMOND:  return 5;
            case TreasureType.RUBY:     return 5;
            default:                    return 0;
        }
    }

    static random() {
        let randomTreasure = new TreasureItem();
        let x = Utils.randomInt(4);
        if(x==0)        randomTreasure.type = TreasureType.RUM;
        else if(x==1)   randomTreasure.type = TreasureType.PEARL;
        else if(x==2)   randomTreasure.type = TreasureType.GOLD;
        else if(x==3)   randomTreasure.type = TreasureType.DIAMOND;
        else if(x==4)   randomTreasure.type = TreasureType.RUBY;
        else            randomTreasure.type = TreasureType.NONE;
        return randomTreasure;
    }

    static getGraphicsPath(t: TreasureItem) : string {
        if(!t) return "assets/empty64.png";
        switch(t.type){
            case TreasureType.RUM:      return "assets/icon-barrel.png";
            case TreasureType.PEARL:    return "assets/icon-pearl.png";
            case TreasureType.GOLD:     return "assets/icon-gold.png";
            case TreasureType.DIAMOND:  return "assets/icon-diamond.png";
            case TreasureType.RUBY:     return "assets/icon-ruby.png";
            default:                    return "assets/empty64.png";
        }
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

    getPirateValue() : number{
        let v = 0;
        for(let c of this.pirateCards){
            if ((c.type == PirateType.BLACK) || (c.type == PirateType.RED))
                v += c.value;
            else
                throw new Error("Invalid pirate card type found.");
        }
        return v;
    }

    getTreasureValue() : number{
        let v = 0;
        for(let t of this.treasures){
            v += t.getValue();
        }
        return v;
    }

    getTotalValue() : number{
        return this.getPirateValue() + this.getTreasureValue();
    }

    getNumChanceCards() : number{
        return this.chanceCards.length;
    }

    getNumPirateCards() : number{
        return this.pirateCards.length;
    }

    getNumTreasures() : number{
        return this.treasures.length;
    }

    getNumSlotTreasures() : number{
        let n = 0;
        if (this.treasureSlot1.type != TreasureType.NONE){
            n++;
        }
        if (this.treasureSlot2.type != TreasureType.NONE){
            n++;
        }
        return n;
    }
    
}


class TreasureChest{
    rum: TreasureItem[] = [];
    pearl: TreasureItem[] = [];
    gold: TreasureItem[] = [];
    diamond: TreasureItem[] = [];
    ruby: TreasureItem[] = [];

    constructor(){
        for(let i=0;i<6;i++){
            this.rum.push(new TreasureItem(TreasureType.RUM));
            this.pearl.push(new TreasureItem(TreasureType.PEARL));
            this.gold.push(new TreasureItem(TreasureType.GOLD));
            this.diamond.push(new TreasureItem(TreasureType.DIAMOND));
            this.ruby.push(new TreasureItem(TreasureType.RUBY));
        }
    }

    getItemsByValue(v : number) : TreasureItem[] {
        let ret : TreasureItem[] = [];
        if(v<2 || v > 10) return null; //Outside possible values with one boat.
        for (let t1 = 5; t1 >= 2; t1--){
            if (t1 > v) continue; //This treasure value exceeds the required value, so continue
            else if(!this.checkItemByValue(t1,1)) continue; //This treasure value is unavailable so can't be used
            else{
                let t2 = v - t1; //Hypothetical second treasure value given t1
                if (t2==0){ //Viable
                    ret.push(this.getItemByValue(t1));
                    return ret;
                }
                else if(t2==t1){ //Need special check for 2x same value treasure
                    if(this.checkItemByValue(t1, 2)){
                        ret.push(this.getItemByValue(t1));
                        ret.push(this.getItemByValue(t2));
                        return ret;
                    }
                    continue; //Two of these don't exist so continue
                }
                else{
                    if(this.checkItemByValue(t2, 1)){//If t2 exists then valid option
                        ret.push(this.getItemByValue(t1));
                        ret.push(this.getItemByValue(t2));
                        return ret;
                    }
                    continue; //T2 does not exist so bad combination...
                }
            }
        }
        return null;
    }

    getItemByValue(v : number) : TreasureItem {
        if(!this.checkItemByValue(v,1)) return null;
        switch(v){
            case 2: return this.rum.pop();
            case 3: return this.pearl.pop();
            case 4: return this.gold.pop();
            case 5: 
                switch(this.diamondOrRuby()){
                    case TreasureType.DIAMOND:
                        return this.diamond.pop();
                    case TreasureType.RUBY:
                        return this.ruby.pop();
                    default:
                        return null;
                }
            default:
                return null;
        }
    }

    getItemByType(t : TreasureType) : TreasureItem {
        if(!this.checkItemByType(t,1)) return null;
        switch(t){
            case TreasureType.RUM:      return this.rum.pop();
            case TreasureType.PEARL:    return this.pearl.pop();
            case TreasureType.GOLD:     return this.gold.pop();
            case TreasureType.DIAMOND:  return this.diamond.pop();
            case TreasureType.RUBY:     return this.ruby.pop();
            default:                    return null;
        }
    }

    checkItemByValue(value: number, quantity : number = 1) : boolean{
        switch(value){
            case 2: return((this.rum.length >= quantity)? true : false);
            case 3: return((this.pearl.length >= quantity)? true : false);
            case 4: return((this.gold.length >= quantity)? true : false);
            case 5: return(((this.diamond.length + this.ruby.length) >= quantity)? true : false);
            default: return false;
        }
    }

    checkItemByType(t: TreasureType, quantity: number = 1) : boolean{
        switch(t){
            case TreasureType.RUM: return((this.rum.length >= quantity)? true : false);
            case TreasureType.PEARL: return((this.pearl.length >= quantity)? true : false);
            case TreasureType.GOLD: return((this.gold.length >= quantity)? true : false);
            case TreasureType.DIAMOND: return((this.diamond.length >= quantity)? true : false);
            case TreasureType.RUBY: return((this.ruby.length >= quantity)? true : false);
            default: return false;
        }
    }

    diamondOrRuby() : TreasureType{
        let testDiamonds : boolean = (this.diamond.length > 0)? true : false;
        let testRubies : boolean = (this.ruby.length > 0)? true : false;
        let testInt : number = ((this.diamond.length > 0)? 1 : 0) + ((this.ruby.length > 0)? 2 : 0);
        switch(testInt){
            case 0: //Neither diamonds nor rubies available
                return TreasureType.NONE;
            case 1: //Only diamonds available
                return TreasureType.DIAMOND;
            case 2: //Only rubies available
                return TreasureType.RUBY;
            case 3: //Both diamonds and rubies available
                if(Utils.randomInt(1) == 1) return TreasureType.DIAMOND;
                else                        return TreasureType.RUBY;
            default:
                return TreasureType.NONE;
        }
    }

    getTotalValue() : number {
        return (2 * this.rum.length) + (3 * this.pearl.length) + (4 * this.gold.length) + (5 * (this.diamond.length + this.ruby.length));
    }

    print(){
        console.log("TREASURE CHEST CONTENTS:");
        console.log("\tRUM:\t\t" + this.rum.length);
        console.log("\tPEARLS:\t\t" + this.pearl.length);
        console.log("\tGOLD:\t\t" + this.gold.length);
        console.log("\tDIAMONDS:\t" + this.diamond.length);
        console.log("\tRUBIES:\t\t" + this.ruby.length);
        console.log(" TOTAL VALUE:\t\t" + this.getTotalValue());
    }

}

export{
    PirateType,
    PirateCard,
    ChanceType,
    ChanceCard,
    TreasureType,
    TreasureItem,
    Inventory,
    TreasureChest
}