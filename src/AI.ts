import { Mesh, Scene } from "@babylonjs/core";
import { Buccaneer } from ".";
import { Boat } from "./Boat";
import { Port } from "./Port";
import { SoundEngine } from "./SoundEngine";
import { randomInt } from "./Utils";

enum AIState {
    NONE = 0,
    MOVING,
    ROTATING,
}

class AI extends Boat {
    buccaneer: Buccaneer;
    state: AIState = AIState.NONE;

    constructor(x: number, z: number, port: Port, buccaneer: Buccaneer) {
        super(x, z, port, buccaneer);

        this.buccaneer = buccaneer;

        // TODO this shouldn't really be necessary:
        let cw: Mesh;
        let ccw: Mesh;
        for (let n of this.mesh.getChildren()) {
            if (n.name == this.mesh.name + ".RotateCW")
                cw = <Mesh>n;
            if (n.name == this.mesh.name + ".RotateCCW")
                ccw = <Mesh>n;
        }
        cw.dispose();
        ccw.dispose();
    }

    activate() {
        super.activate();
        this.makeMove();
    }

    makeMove() {
        let numRotates = randomInt(8) - 4;
        // console.log("Rotates: " + numRotates);
        let move = this.legalMoves[Math.floor(Math.random() * this.legalMoves.length)];
        if (move.x == this.x && move.z == this.z && numRotates == 0) {
            numRotates++;
        }

        let task = () => {
            switch (this.state) {
                case AIState.NONE:
                    if (move.x != this.x || move.z != this.z) {
                        this.moveToSquare(move.x, move.z);
                        this.state = AIState.MOVING;
                    } else {
                        this.state = AIState.ROTATING;
                    }
                    break;
                case AIState.MOVING:
                    if (!this.isMoving()) {
                        this.state = AIState.ROTATING;
                    }
                    break;
                case AIState.ROTATING:
                    if (this.isMoving()) {
                        break;
                    }
                    if (numRotates > 0) {
                        numRotates -= 1;
                        this.rotateCW();
                        // console.log("CW");
                    } else if (numRotates < 0) {
                        numRotates += 1;
                        this.rotateCCW();
                        // console.log("CCW");
                    } else {
                        this.buccaneer.nextTurn();
                        this.state = AIState.NONE;
                    }
                    break;
                default:
                    break;
            }
            if (this.state != AIState.NONE)
                setTimeout(task, 200);
        }
        task();
    }
}

export {
    AI
}