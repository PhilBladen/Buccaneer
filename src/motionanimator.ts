import { Vector3 } from "@babylonjs/core";

class TrajectoryPoint {
    pos: number;
    time: number;
}

class MotionAnimator {
    readonly acceleration: number = 5;
    readonly maxVelocity: number = 5;

    startPosition: Vector3;
    endPosition: Vector3;
    startVelocity: number;
    
    points: TrajectoryPoint[] = [];

    currentVelocity: number = 0;

    constructor() {};

    setTrajectory(startPosition: Vector3, startVelocity: number, endPosition: Vector3) {
        startVelocity = this.currentVelocity;
        console.log("Current velocity: " + startVelocity);

        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.startVelocity = startVelocity;

        let startVelocitySquared = startVelocity * startVelocity;
        let maxVelocitySquared = this.maxVelocity * this.maxVelocity;
        let accelerationSquared = this.acceleration * this.acceleration;

        for (let i = 0; i < 4; i++) {
            this.points.push({pos: 0, time: 0});
        }

        var lengthOfTrajectory = endPosition.subtract(startPosition).length(); // TODO optimize

        var canIDoThisInOneStepCheck = startVelocitySquared / (2 * this.acceleration);
        if (lengthOfTrajectory < canIDoThisInOneStepCheck) {
            console.log("Can't do it. Go home now.");
            return;
        }

        let coastRequired = (startVelocitySquared / 2) + this.acceleration * lengthOfTrajectory - this.maxVelocity * this.maxVelocity;

        this.points[3].pos = lengthOfTrajectory;
        
        if (coastRequired <= 0) {
            console.log("We don't have a coast phase.");

            this.points[1].pos = this.points[2].pos = lengthOfTrajectory / 2 - startVelocitySquared / (4 * this.acceleration);
            this.points[1].time = this.points[2].time = Math.sqrt(lengthOfTrajectory / this.acceleration + startVelocitySquared / (2 * accelerationSquared)) - this.startVelocity / this.acceleration;
            this.points[3].time = this.points[2].time + Math.sqrt(lengthOfTrajectory / this.acceleration + startVelocitySquared / (2 * accelerationSquared));
        } else {
            console.log("We have a coastline.");

            this.points[1].pos = (maxVelocitySquared - startVelocitySquared) / (2 * this.acceleration);
            this.points[2].pos = lengthOfTrajectory - maxVelocitySquared / (2 * this.acceleration);

            this.points[1].time = (this.maxVelocity - startVelocity) / this.acceleration;
            this.points[2].time = this.points[1].time + lengthOfTrajectory / this.maxVelocity + (startVelocitySquared - 2 * maxVelocitySquared) / (2 * this.acceleration * this.maxVelocity);
            // this.points[2].time = this.points[1].time + lengthOfTrajectory / this.maxVelocity - (startVelocitySquared + 2 * maxVelocitySquared) / (2 * this.acceleration * this.maxVelocity);
            this.points[3].time = this.points[2].time + this.maxVelocity / this.acceleration;
        }
    }

    getVelocity(t: number) : number {
        if (t < 0) {
            return 0;
        } else if (t < this.points[1].time) { // Accel phase
            return this.startVelocity + this.acceleration * t;
        } else if (t < this.points[2].time) { // Coast phase
            return this.maxVelocity;
        } else if (t < this.points[3].time) { // Decel phase
            return this.acceleration * (this.points[3].time - t);
        }
        return 0;
    }

    getLinearPosition(t: number) {
        this.currentVelocity = this.getVelocity(t);

        if (t < 0) {
            console.log("Start")
            return this.points[0].pos;
        } else if (t < this.points[1].time) { // Accel phase
            console.log("Accel")
            return this.startVelocity * t + 0.5 * this.acceleration * t * t;
        } else if (t < this.points[2].time) { // Coast phase
            console.log("Coast")
            return this.points[1].pos + this.maxVelocity * (t - this.points[1].time);
        } else if (t < this.points[3].time) { // Decel phase
            console.log("Decel")
            // return this.points[2].pos + this.maxVelocity * t - 0.5 * this.acceleration * t * t;
            return this.points[3].pos - 0.5 * this.acceleration * (this.points[3].time - t) * (this.points[3].time - t);
        }
        return this.points[3].pos;
    }

    getVectorPosition(t: number) {
        let journeyVector = this.endPosition.subtract(this.startPosition).normalize();
        return journeyVector.scaleInPlace(this.getLinearPosition(t)).addInPlace(this.startPosition);
    }

    isComplete(t: Number) : boolean {
        return t >= this.points[3].time;
    }
}

export {
    MotionAnimator
}