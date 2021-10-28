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
        
        // TODO don't render move
        // for (let m of this.legalMoves) {
        //     s.setEnabled(false);
        // }

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
                this.x = move[0];
                this.z = move[1];
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