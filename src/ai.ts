import { Scene } from "@babylonjs/core";
import { Buccaneer } from ".";
import { Boat } from "./boat";
import { Port } from "./port";
import { SoundEngine } from "./soundengine";

class AI extends Boat {
    buccaneer: Buccaneer;

    constructor(x: number, z: number, port: Port, buccaneer: Buccaneer) {
        super(x, z, port, buccaneer);

        this.buccaneer = buccaneer;
    }

    activate() {
        super.activate();
        
        for (let s of this.squares) {
            s.setEnabled(false);
        }

        this.cw.setEnabled(false);
        this.ccw.setEnabled(false);

        this.makeMove();
    }

    makeMove() {
        let rotateDone = false;
        let moveDone = false;
        let rotates = Math.floor(Math.random() * 8 - 4);
        let task = () => {
            if (rotateDone) {
                this.buccaneer.nextTurn();
                return;
            }

            if (!moveDone) {
                let square = this.squares[Math.floor(Math.random() * this.squares.length)];
                this.x = square['gridX'];
                this.z = square['gridZ']; // TODO dis nasty
                this.originalLocation = this.CoT.position.clone();
                this.moveAnimateStartTime = this.time;
                this.targetLocation.x = (this.x + 0.5);
                this.targetLocation.z = (this.z + 0.5);
                moveDone = true;

                setTimeout(task, 1000);
            } else {
                if (!rotateDone) {
                    if (rotates > 0) {
                        this.direction += 1;
                        rotates -= 1;
                        this.buccaneer.soundEngine.boatRotate();
                    } else if (rotates < 0) {
                        this.direction -= 1;
                        rotates += 1;
                        this.buccaneer.soundEngine.boatRotate();
                    } else {
                        rotateDone = true;
                    }
                    this.originalAngle = this.angle;
                    this.animateStartTime = this.time;

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