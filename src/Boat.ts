import * as Utils from './Utils';
import * as BABYLON from "@babylonjs/core";
import { Port, ports } from './Port';
import { Color3, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { SoundEngine } from './SoundEngine';
import { Buccaneer } from '.';
import { CustomMaterial } from '@babylonjs/materials';
import { BoatMotionController } from './BoatMotionController';
import $ from "jquery";
import { PirateType, PirateCard, ChanceType, ChanceCard, TreasureType, TreasureItem, Inventory } from './GameItemManagement';
import { PirateCardStack } from './CardStacks';

let scene: Scene;
let settings: any;

class BoatInventory extends Inventory {
    
    generateRandom() {
        // let numCards = 6;
        // for (let i = 0; i < numCards; i++) {
        //     let card = new PirateCard();
        //     card.type = Utils.randomInt(1) == 0 ? PirateType.BLACK : PirateType.RED;
        //     card.value = Utils.randomInt(2) + 1;
        //     this.pirateCards.push(card);
        // }

        this.treasureSlot1 = TreasureItem.random();
        this.treasureSlot2 = TreasureItem.random();
        console.log("Random treasures: " + this.treasureSlot1.type + " & " + this.treasureSlot2.type);
    }

    calculateFightingStrength(): number {
        let fightingStrength = 0;
        for (let pirateCard of this.pirateCards) {
            switch (pirateCard.type) {
                case PirateType.BLACK:
                    fightingStrength += pirateCard.value;
                    break;
                case PirateType.RED:
                    fightingStrength -= pirateCard.value;
                    break;
                default:
                    throw new Error("Invalid pirate card type found.");
            }
        }
        return Math.abs(fightingStrength);
    }

    calculateSailingStrength(): number {
        return this.getPirateValue();
    }
}

class GridPosition {
    x: number;
    z: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }
}

class Boat {
    readonly buccaneer: Buccaneer;

    inventory: BoatInventory = new BoatInventory();
    sailingStrength: number;
    fightingStrength: number;
    numChanceCards: number;
    x: number;
    z: number;
    boatIndex: number;
    direction: number = 0;
    time: number;
    splashes: Mesh[];
    offset: number;
    port: Port;
    mesh: Mesh;
    turnStartX: number;
    turnStartZ: number;
    turnStartDir: number;
    activated: boolean = false;

    baseTransform: TransformNode; // Position + rotation
    seaMotionTransform: TransformNode;

    motionController: BoatMotionController = new BoatMotionController(this);

    legalMoves: GridPosition[];

    boatStart: Vector3 = new Vector3(0, 0, 0);

    constructor(x: number, z: number, port: Port, buccaneer: Buccaneer) {
        this.buccaneer = buccaneer;

        this.inventory.generateRandom();
        this.dealHand();
        this.sailingStrength = this.inventory.calculateSailingStrength();
        this.fightingStrength = this.inventory.calculateFightingStrength();
        this.numChanceCards = this.inventory.getNumChanceCards();

        scene = buccaneer.scene;
        settings = buccaneer.settings;

        this.x = x;
        this.z = z;
        this.legalMoves = [];

        let boatMesh = scene.getMeshByName("Boat");
        let mesh: Mesh = <Mesh>boatMesh.clone("Boat" + port.portName, null);
        // mesh.setParent(null);
        // mesh.name
        mesh.setEnabled(true);
        // water.addToRenderList(mesh);
        mesh.isPickable = true;
        mesh.position.y = -0.03;

        buccaneer.water.addToRenderList(mesh);

        this.baseTransform = new BABYLON.TransformNode("Boat" + port.portName + " transform");
        this.seaMotionTransform = new BABYLON.TransformNode("Boat" + port.portName + " sea motion transform");
        this.seaMotionTransform.setParent(this.baseTransform);
        mesh.setParent(this.seaMotionTransform);

        if (x <= -12)
            this.direction = 0;
        else if (x >= 12)
            this.direction = 4;
        else if (z <= -12)
            this.direction = 6;
        else
            this.direction = 2;

        this.motionController.setLocation(x + 0.5, z + 0.5);
        this.motionController.updateDirection();

        this.splashes = [];
        for (let i = 0; i < 3; i++) {
            let splash = BABYLON.Mesh.CreateGround("Splash", settings.gridTileSize, settings.gridTileSize, 0, scene);
            splash.isPickable = false;
            splash.alphaIndex = 500;

            splash.material = Utils.getSplashMaterial(scene);

            splash.position.x = this.baseTransform.position.x;
            splash.position.z = this.baseTransform.position.z;

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

    dealHand(){
        let numCards=6;
        for(let i=0;i<numCards;i++){
            this.inventory.pirateCards.push(PirateCardStack.convert(this.buccaneer.pirateCardStack.drawCard()));
        }
    }

    addPirateCard(card: PirateCard) {
        this.inventory.pirateCards.push(card);
        this.sailingStrength = this.inventory.calculateSailingStrength();
        this.fightingStrength = this.inventory.calculateFightingStrength();
    }

    addChanceCard(card: ChanceCard){
        this.inventory.chanceCards.push(card);
        this.numChanceCards = this.inventory.getNumChanceCards();
    }

    isInPort() : boolean {
        if(this.currentPort() == null){
            return false;
        }
        return true;
    }

    currentPort() : Port {
        for (let port of ports) {
            if (port.portLocation.x == this.x && port.portLocation.z == this.z) {
                return port;
            }
        }
        return null;
    }

    hasMovedSinceTurnStart() {
        if (this.turnStartX == this.x && this.turnStartZ == this.z && this.turnStartDir == this.direction) {
            return false;
        }
        return true;
    }

    rotateCW() {
        this.buccaneer.soundEngine.boatRotate();
        this.direction++;
        this.motionController.updateDirection();
    }

    rotateCCW() {
        this.buccaneer.soundEngine.boatRotate();
        this.direction--;
        this.motionController.updateDirection();
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

                    this.legalMoves.push(new GridPosition(x, z));
                }
            }
            this.legalMoves.push(new GridPosition(this.x, this.z));
        } else { // Shipwrecked
            for (let dx = -2; dx < 3; dx++) {
                for (let dz = -2; dz < 3; dz++) {
                    x = this.x + dx;
                    z = this.z + dz;

                    if (!Utils.isSquareAllowed(x, z)) {
                        continue;
                    }

                    this.legalMoves.push(new GridPosition(x, z));
                }
            }
        }
    }

    isMoving() : boolean {
        return this.motionController.isMoving();
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

        // this.mesh.isPickable = true;
        this.calculateLegalMoves();
    }

    moveToSquare(x: number, z: number) {
        this.x = Math.floor(x);
        this.z = Math.floor(z);

        this.motionController.setDestination(this.x + 0.5, this.z + 0.5);
    }

    update(time: number) {
        this.time = time;

        this.motionController.update(time);

        // Do random wave motion:
        let dilatedTime = time + this.offset * 348;
        let angleDeltaX = Math.sin(dilatedTime * 0.1) * 0.05;
        let angleDeltaY = Math.sin(dilatedTime * 0.67) * 0.05;
        let angleDeltaZ = Math.sin(dilatedTime * 0.315) * 0.05;
        this.seaMotionTransform.setDirection(BABYLON.Axis.Z, angleDeltaX, angleDeltaY, angleDeltaZ);

        // Do splashes:
        for (let i = 0; i < 3; i++) {
            let splash = this.splashes[i];
            let t = dilatedTime + i * 8;
            splash.scaling.x = splash.scaling.z = 0 + (t % 24) / 12;
            splash.material.alpha = 1 - (t % 24) / 24;

            splash.position.x = this.baseTransform.position.x;
            splash.position.z = this.baseTransform.position.z;

            if (t % 24 == 0)
                splash.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);
        }
    }
}

export {
    Boat,
    GridPosition,
    PirateType,
    PirateCard,
    ChanceType,
    ChanceCard,
    TreasureType,
    TreasureItem
    
}