import { Mesh, Scene } from "@babylonjs/core";
import { Buccaneer } from ".";
import { Boat } from "./boat";
import { Port } from "./port";
import { SoundEngine } from "./soundengine";

class AI extends Boat {
    buccaneer: Buccaneer;

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
        // return;// TODO remove

        let rotateDone = false;
        let moveDone = false;
        let rotates = Math.floor(Math.random() * 8 - 4);
        let task = () => {
            if (rotateDone) {
                this.buccaneer.nextTurn();
                return;
            }

            if (!moveDone) {
                let move = this.legalMoves[Math.floor(Math.random() * this.legalMoves.length)];
                this.moveToSquare(move.x, move.z);
                moveDone = true;

                setTimeout(task, 1000);
            } else {
                if (!rotateDone) {
                    if (rotates > 0) {
                        rotates -= 1;
                        this.rotateCCW();
                    } else if (rotates < 0) {
                        rotates += 1;
                        this.rotateCCW();
                    } else {
                        rotateDone = true;
                    }
                    setTimeout(task, 200);
                }
            }
        };
        // setTimeout(task, 500);
        task();
    }
}

export {
    AI
}