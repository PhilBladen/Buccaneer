import * as BABYLON from "@babylonjs/core";
import { Color3, Vector3 } from "@babylonjs/core";
import { Boat } from "./boat";

let portIndex = 0;

class Port {
    portLocation : Vector3;
    portColor : string;
    portName : string;
    inventoryLocation : number[];
    portIndex : number;
    boat : Boat;

    constructor(portLocation, portColor, portName, inventoryLocation) {
        this.portLocation = portLocation;
        this.portColor = portColor;
        this.portName = portName;
        this.inventoryLocation = inventoryLocation;
        this.portIndex = portIndex++;
    }

    init(scene, assetManager) {
        let inventoryTransform = new BABYLON.TransformNode(this.portName, scene);

        let l = this.portLocation;
        inventoryTransform.position.x = l.x + 0.5 + this.inventoryLocation[0];
        inventoryTransform.position.z = l.z + 0.5 + this.inventoryLocation[1];
        if (l.x < -10) { // West
            inventoryTransform.rotation.y = -Math.PI / 2;
        } else if (l.x > 10) { // East
            inventoryTransform.rotation.y = Math.PI / 2;
        } else if (l.z < -10) { // South
            inventoryTransform.rotation.y = Math.PI;
        } else if (l.z > 10) { // North
            inventoryTransform.rotation.y = 0;
        }

        let possibleCards = [20, 22, 23, 24, 25, 28, 34, 35, 36, 37, 38, 39];

        let numCards = 2; //Math.floor(Math.random() * 3);
        for (let i = 0; i < numCards; i++) {
            let cardMesh = scene.getMeshByName("GenericCardFace").clone(this.portName + " card");
            cardMesh.setParent(null);
            cardMesh.scaling.x = 1;
            cardMesh.scaling.y = 1;
            cardMesh.scaling.z = 1;

            cardMesh.parent = inventoryTransform; //, true);

            let material = new BABYLON.StandardMaterial("", scene);
            let diffuseTexture = new BABYLON.Texture("assets/Cards_MergedMap_1024.png", scene);
            diffuseTexture.vScale = -1;
            material.diffuseTexture = diffuseTexture;
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            material.backFaceCulling = true;

            cardMesh.material = material;
            cardMesh.animations = [];

            // cardMesh.renderOverlay = true;
            // cardMesh.overlayColor = BABYLON.Color3.FromHexString(this.portColor);
            // cardMesh.overlayAlpha = 0.0;


            let drawnCard = possibleCards[Math.floor(Math.random() * possibleCards.length)];
            cardMesh.material.diffuseTexture.uOffset = (drawnCard % 8) * (1 / 8);
            cardMesh.material.diffuseTexture.vOffset = 1 - Math.floor(drawnCard / 8) * 0.19034;

            cardMesh.position.x = (i - numCards / 2 + 0.5) * 0.25;
            cardMesh.position.y = -i * 0.001;
        }

        // if (this.portName != "Bombay") return;

        let cardMesh;
        let rand = Math.floor(Math.random() * 3);
        if (rand == 0)
            cardMesh = assetManager.getRubyInstance();
        else if (rand == 1) {
            cardMesh = assetManager.getGoldInstance();
        } else if (rand == 2) {
            cardMesh = assetManager.getBarrelInstance();
        }
        cardMesh.parent = new BABYLON.TransformNode("", scene);
        cardMesh.parent.setDirection(BABYLON.Axis.Z, Math.random() * Math.PI * 2, 0, 0);
        cardMesh.parent.position = scene.getMeshByName("Dock" + this.portIndex).getAbsolutePosition();
        // cardMesh.position.y += 0.1;
    }
}

const ports = [
    new Port(new BABYLON.Vector3(12, 0, 4), "#6A9023", "Bombay", [3, 2.5]),
    new Port(new BABYLON.Vector3(12, 0, -4), "#82B3CC", "Cadiz", [3, -2.5]),
    new Port(new BABYLON.Vector3(4, 0, -13), "#A5739C", "Bristol", [2.5, -3]),
    new Port(new BABYLON.Vector3(-4, 0, -13), "#F88642", "London", [-2.5, -3]),
    new Port(new BABYLON.Vector3(-13, 0, -5), "#F9D42C", "Genoa", [-3, -2.5]),
    new Port(new BABYLON.Vector3(-13, 0, 3), "#E25E9F", "Venice", [-3, 2.5]),
    new Port(new BABYLON.Vector3(-5, 0, 12), "#B37F39", "Amsterdam", [-2.5, 3]),
    new Port(new BABYLON.Vector3(3, 0, 12), "#E84D4C", "Marseilles", [2.5, 3]),
];

export {
    Port,
    ports
}