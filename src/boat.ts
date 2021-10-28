import * as Utils from './utils';
import * as BABYLON from "@babylonjs/core";
import { Port, ports } from './port';
import { Color3, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { SoundEngine } from './soundengine';
import { Buccaneer } from '.';
import { CustomMaterial } from '@babylonjs/materials';

let scene: Scene;
let settings: any;

let matRed = null;
let matWhite = null;

class Boat {
    readonly buccaneer : Buccaneer;

    sailingStrength: number;
    x: number;
    z: number;
    boatIndex: number;
    originalLocation: Vector3;
    targetLocation: Vector3;
    animateStartTime: number;
    moveAnimateStartTime: number;
    direction: number;
    originalAngle: number;
    CoT: TransformNode;
    angle: number;
    time: number;
    splashes: Mesh[];
    offset: number;
    port: Port;
    mesh: Mesh;
    turnStartX: number;
    turnStartZ: number;
    turnStartDir: number;
    activated: boolean = false;

    legalMoves: number[][];

    boatStart: Vector3 = new Vector3(0, 0, 0);

    constructor(x: number, z: number, port: Port, buccaneer: Buccaneer) {
        this.buccaneer = buccaneer;

        scene = buccaneer.scene;
        settings = buccaneer.settings;

        this.sailingStrength = Math.floor(Math.random() * 12) + 6;
        this.x = x;
        this.z = z;
        this.originalLocation = this.targetLocation = new BABYLON.Vector3((x + 0.5) * settings.gridTileSize, 0, (z + 0.5) * settings.gridTileSize);
        this.animateStartTime = 0;
        this.moveAnimateStartTime = 0;
        this.legalMoves = [];

        if (matRed == null) {
            matRed = new BABYLON.StandardMaterial("red", scene);
            matRed.diffuseColor = new BABYLON.Color3(1, 0, 0);
            matRed.specularColor = new BABYLON.Color3(0, 0, 0);
            matRed.alpha = 0.1;
        }
        if (matWhite == null) {
            matWhite = new BABYLON.StandardMaterial("white", scene);
            matWhite.diffuseColor = new BABYLON.Color3(1, 1, 1);
            matWhite.specularColor = new BABYLON.Color3(0, 0, 0);
            matWhite.alpha = 0.1;
        }

        let boatMesh = scene.getMeshByName("Boat");
        let mesh: Mesh = <Mesh>boatMesh.clone("Boat" + port.portName, null);
        // mesh.setParent(null);
        // mesh.name
        mesh.setEnabled(true);
        // water.addToRenderList(mesh);
        mesh.isPickable = true;
        mesh.position.y = -0.03;

        buccaneer.water.addToRenderList(mesh);

        let CoT = new BABYLON.TransformNode("Boat" + port.portName + " transform");
        mesh.setParent(CoT);

        if (x <= -12)
            this.direction = 0;
        else if (x >= 12)
            this.direction = 4;
        else if (z <= -12)
            this.direction = 6;
        else
            this.direction = 2;

        this.direction += Math.floor(Math.random() * 3 - 1);
        this.originalAngle = BABYLON.Tools.ToRadians(45 * this.direction);

        this.CoT = CoT;

        

        this.splashes = [];
        for (let i = 0; i < 3; i++) {
            let splash = BABYLON.Mesh.CreateGround("Splash", settings.gridTileSize, settings.gridTileSize, 0, scene);
            splash.isPickable = false;
            splash.alphaIndex = 500;

            splash.material = Utils.getSplashMaterial(scene);

            splash.position.x = CoT.position.x;
            splash.position.z = CoT.position.z;

            this.splashes.push(splash);
        }

        let mat = new BABYLON.StandardMaterial("boat", scene);
        mat.diffuseColor = Color3.FromHexString(port.portColor);
        mat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
        mat.roughness = 0;
        mesh.material = mat;

        this.port = port;
        this.port.boat = this;

        this.mesh = mesh;

        this.offset = Math.random();

        this.deactivate();
    }

    isInPort() {
        for (let port of ports) {
            if (port.portLocation.x == this.x && port.portLocation.z == this.z) {
                return true;
            }
        }
        return false;
    }

    hasMovedSinceTurnStart() {
        if (this.turnStartX == this.x && this.turnStartZ == this.z && this.turnStartDir == this.direction) {
            return false;
        }
        return true;
    }

    updateTurnButton() {
        if (!this.hasMovedSinceTurnStart()) {
            if (!$("#actionbtnturn").hasClass("disabled")) {
                $("#actionbtnturn").addClass("disabled");
            }
        } else {
            $("#actionbtnturn").removeClass("disabled");
        }
    }

    /**
     * Calculates possible moves given the terrian and current location. This does not guarantee that the move is not cheating.
     */
    calculateLegalMoves() {
        this.legalMoves = [];

        let x = 0;
        let z = 0;
        if (this.sailingStrength > 0) {
            let inPort = this.isInPort();
            for (let dir = this.direction; dir < (inPort ? this.direction + 8 : this.direction + 1); dir++) {
                for (let i = 0; i < 32; i++) {
                    let d = dir % 8;
                    if (d < 0)
                        d += 8;
                    if (d == 7 || d == 0 || d == 1) {
                        x = i + 1;
                    } else if (d == 3 || d == 4 || d == 5) {
                        x = -i - 1;
                    } else
                        x = 0;
                    //
                    if (d == 1 || d == 2 || d == 3) {
                        z = -i - 1;
                    } else if (d == 5 || d == 6 || d == 7) {
                        z = i + 1;
                    } else
                        z = 0;

                    x += this.x;
                    z += this.z;

                    if (!Utils.isSquareAllowed(x, z))
                        break;

                        this.legalMoves.push([x, z]);
                }
            }
        }
        this.legalMoves.push([this.x, this.z]);
    }



    deactivate() {
        this.activated = false;

        this.mesh.isPickable = false;
    }

    activate() {
        this.turnStartX = this.x;
        this.turnStartZ = this.z;
        this.turnStartDir = this.direction;

        this.activated = true;
        
        this.mesh.isPickable = true;
        this.calculateLegalMoves();

        this.updateTurnButton();
    }

    update(time: number) {
        this.time = time;
        let dilatedTime = time * 0.02 + this.offset * 348;

        let rotationAnimationProgress = (time - this.animateStartTime) * 0.05;
        this.angle = Utils.cosineInterpolate(this.originalAngle, BABYLON.Tools.ToRadians(45 * this.direction), rotationAnimationProgress);
        if (rotationAnimationProgress >= 1)
            this.originalAngle = this.angle;

        let moveAnimationProgress = (time - this.moveAnimateStartTime) * 0.01;
        if (moveAnimationProgress < 1)
            Utils.cosineInterpolateV3D(this.originalLocation, this.targetLocation, moveAnimationProgress, this.CoT.position);
        // else if (moveAnimationProgress >= 1)
        // this.CoT.position = this.originalLocation = this.targetLocation;

        let angleDeltaX = Math.sin(dilatedTime * 0.1) * 0.05;
        let angleDeltaY = Math.sin(dilatedTime * 0.67) * 0.05;
        let angleDeltaZ = Math.sin(dilatedTime * 0.315) * 0.05;
        this.CoT.setDirection(BABYLON.Axis.Y, angleDeltaX + this.angle, angleDeltaY + Math.PI / 2, angleDeltaZ);

        for (let i = 0; i < 3; i++) {
            let splash = this.splashes[i];
            let t = dilatedTime + i * 8;
            splash.scaling.x = splash.scaling.z = 0 + (t % 24) / 12;
            splash.material.alpha = 1 - (t % 24) / 24;

            splash.position.x = this.CoT.position.x;
            splash.position.z = this.CoT.position.z;

            if (t % 24 == 0)
                splash.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);
        }





    }
}

export {
    Boat,
}