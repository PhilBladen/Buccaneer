import { Axis, MeshBuilder, Tools, Vector3 } from "@babylonjs/core";
import { Boat } from "./Boat";
import { cosineInterpolate } from "./Utils";

class TrajectoryPoint {
    position: number;
    // velocity: Vector3;
    // angle: number;
    // angularVelocity: number;
    time: number;
}

class RotationAnimation {
    readonly animationDuration: number = 0.25;

    startAngle: number = 0;
    currentAngle: number = 0;
    targetAngle: number = 0;
    startTime: number;

    animationRunning: boolean = false;

    constructor() {
    }

    angleClamp0to2PI(a: number): number {
        if (a >= 0 && a < Math.PI * 2) {
            return a;
        }
        return a - (Math.PI * 2) * Math.floor(a / (Math.PI * 2));
    }

    setTargetDirection(direction: number): void {
        this.setTargetAngle(Tools.ToRadians(direction * 45));
    }

    setTargetAngle(angle: number): void {
        angle = this.angleClamp0to2PI(angle);
        let currentAngle0to2PI = this.angleClamp0to2PI(this.currentAngle);

        if (Math.abs(angle - currentAngle0to2PI) > Math.PI) {
            if (angle < currentAngle0to2PI) {
                angle += Math.PI * 2;
            } else {
                currentAngle0to2PI += Math.PI * 2;
            }
        }

        this.startAngle = currentAngle0to2PI;
        this.targetAngle = angle;

        if (!this.animationRunning) {
            this.animationRunning = true;
            this.startTime = performance.now() * 0.001;
        } else {
            this.startTime = performance.now() * 0.001;
        }
    }

    update(): void {
        if (!this.animationRunning) {
            return;
        }
        let animationProgress = (performance.now() * 0.001 - this.startTime) / this.animationDuration;
        this.currentAngle = cosineInterpolate(this.startAngle, this.targetAngle, animationProgress);
        if (animationProgress > 1.0) {
            this.animationRunning = false;
            this.currentAngle = this.targetAngle;
        }
    }

    getAngle(): number {
        return this.currentAngle;
    }
}

class BoatMotionController {
    readonly acceleration: number = 5;
    readonly maxVelocity: number = 5;
    readonly boat: Boat;
    readonly rotationAnimation: RotationAnimation = new RotationAnimation();

    startPosition: Vector3 = Vector3.Zero();
    endPosition: Vector3 = Vector3.Zero();
    startVelocity: number;

    points: TrajectoryPoint[] = [];

    currentVelocity: number = 0;

    trajectoryStartTime = 0;

    animationStartDirection: number = 0;
    animationTargetDirection: number = 0;

    animationRunning: boolean = false;

    constructor(boat: Boat) {
        this.boat = boat;
    };

    setLocation(x: number, z: number) {
        this.startPosition.set(x, 0, z);
        this.endPosition.set(x, 0, z);
        this.boat.baseTransform.position.copyFrom(this.startPosition);
        // this.setDestination(x, z);
    }

    updateDirection() {
        // this.trajectoryStartTime = performance.now() / 1000;
        // this.animationTargetDirection = this.boat.direction;

        this.rotationAnimation.setTargetDirection(this.boat.direction);
        console.log(this.boat.direction);
    }

    setDestination(x: number, z: number) {
        this.endPosition.x = x;
        this.endPosition.z = z;
        this.startPosition.copyFrom(this.boat.baseTransform.position);

        this.animationRunning = true;

        this.trajectoryStartTime = performance.now() / 1000;

        this.startVelocity = this.currentVelocity;

        this.animationStartDirection = this.boat.direction;

        let trajectory = this.endPosition.subtract(this.startPosition);

        this.animationTargetDirection = (-Math.round(Math.atan2(trajectory.z, trajectory.x) / (Math.PI / 4)) + 8) % 8;
        // let directionToBe = (-Math.round(Math.atan2(trajectory.z, trajectory.x) / (Math.PI / 4)) + 8) % 8;


        // console.log("Angle we are: " + this.boat.angle);

        // if (this.animationTargetDirection != this.boat.direction) {
        //     console.log("I am on the wonk.");
        // }

        // console.log("Direction to be: " + this.animationTargetDirection);
        this.boat.direction = this.animationTargetDirection;
        // console.log("Direction we are: " + this.boat.direction);
        this.rotationAnimation.setTargetDirection(this.animationTargetDirection);

        const startVelocitySquared = this.startVelocity * this.startVelocity;
        const maxVelocitySquared = this.maxVelocity * this.maxVelocity;
        const accelerationSquared = this.acceleration * this.acceleration;

        for (let i = 0; i < 4; i++) {
            this.points.push({ position: 0, time: 0 });
        }

        let trajectoryLength = trajectory.length(); // TODO optimize

        let canIDoThisInOneStepCheck = startVelocitySquared / (2 * this.acceleration);
        if (trajectoryLength < canIDoThisInOneStepCheck) {
            this.points[0].position = this.points[1].position = this.points[2].position = 0;
            this.points[0].time = this.points[1].time = this.points[2].time = 0;

            this.points[3].position = trajectoryLength;
            this.points[3].time = 2 * trajectoryLength / this.startVelocity;
            return;
        }

        let coastRequired = (startVelocitySquared / 2) + this.acceleration * trajectoryLength - this.maxVelocity * this.maxVelocity;

        this.points[3].position = trajectoryLength;

        if (coastRequired <= 0) {
            // console.log("We don't have a coast phase.");

            this.points[1].position = this.points[2].position = trajectoryLength / 2 - startVelocitySquared / (4 * this.acceleration);
            this.points[1].time = this.points[2].time = Math.sqrt(trajectoryLength / this.acceleration + startVelocitySquared / (2 * accelerationSquared)) - this.startVelocity / this.acceleration;
            this.points[3].time = this.points[2].time + Math.sqrt(trajectoryLength / this.acceleration + startVelocitySquared / (2 * accelerationSquared));
        } else {
            // console.log("We have a coastline.");

            this.points[1].position = (maxVelocitySquared - startVelocitySquared) / (2 * this.acceleration);
            this.points[2].position = trajectoryLength - maxVelocitySquared / (2 * this.acceleration);

            this.points[1].time = (this.maxVelocity - this.startVelocity) / this.acceleration;
            this.points[2].time = this.points[1].time + trajectoryLength / this.maxVelocity + (startVelocitySquared - 2 * maxVelocitySquared) / (2 * this.acceleration * this.maxVelocity);
            // this.points[2].time = this.points[1].time + lengthOfTrajectory / this.maxVelocity - (startVelocitySquared + 2 * maxVelocitySquared) / (2 * this.acceleration * this.maxVelocity);
            this.points[3].time = this.points[2].time + this.maxVelocity / this.acceleration;
        }
    }

    getVelocity(t: number): number {
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
            // console.log("Start")
            return this.points[0].position;
        } else if (t < this.points[1].time) { // Accel phase
            // console.log("Accel")
            return this.startVelocity * t + 0.5 * this.acceleration * t * t;
        } else if (t < this.points[2].time) { // Coast phase
            // console.log("Coast")
            return this.points[1].position + this.maxVelocity * (t - this.points[1].time);
        } else if (t < this.points[3].time) { // Decel phase
            // console.log("Decel")
            // return this.points[2].position + this.maxVelocity * t - 0.5 * this.acceleration * t * t;
            let acceleration = 2 * (this.points[3].position - this.points[2].position) / Math.pow(this.points[3].time - this.points[2].time, 2);
            return this.points[3].position - 0.5 * acceleration * (this.points[3].time - t) * (this.points[3].time - t);
        }
        return this.points[3].position;
    }

    getVectorPosition(t: number) {
        let journeyVector = this.endPosition.subtract(this.startPosition).normalize();
        return journeyVector.scaleInPlace(this.getLinearPosition(t)).addInPlace(this.startPosition);
    }

    _isComplete(t: Number): boolean {
        return t >= this.points[3].time;
    }

    isMoving(): boolean {
        return this.animationRunning || this.rotationAnimation.animationRunning;
    }

    update(time: number) {
        this.rotationAnimation.update();
        this.boat.baseTransform.setDirection(Axis.Y, this.rotationAnimation.getAngle(), Math.PI / 2, 0);

        if (this.animationRunning) {
            let animationTime = (time - this.trajectoryStartTime);
            this.boat.baseTransform.position = this.getVectorPosition(animationTime);
            if (this._isComplete(animationTime)) {
                this.animationRunning = false;
            }
        }
    }
}

export {
    BoatMotionController
}