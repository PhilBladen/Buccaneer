import { Boat } from "./boat";

class AI extends Boat {
    constructor() {

    }

    makeMove() {
        setTimeout(() => { console.log("Did a delay ") }, 1000);
    }
}

export {
    AI
}