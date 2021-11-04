import * as BABYLON from "@babylonjs/core";
import { AbstractMesh, Axis, Color3, FloatArray, Mesh, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Buccaneer } from "src";
import { AssetManager } from "./Assets";
import { Boat } from "./Boat";
import { ChanceCard, Inventory, PirateCard, PirateType, TreasureItem, TreasureType } from "./GameItemManagement";
import { offsetMeshUVs, randomInt } from "./Utils";

let portMaterial: StandardMaterial = null;

class Port {
    buccaneer: Buccaneer;

    resourceIndex: number;
    portLocation: Vector3;
    portColor: string;
    portName: string;
    inventoryLocation: number[];
    inventory: Inventory;
    boat: Boat;
    dockMesh: Mesh;
    inventoryMeshInstances: AbstractMesh[];

    constructor(resourceIndex: number, portLocation: Vector3, portColor: string, portName: string, inventoryLocation: number[]) {
        this.resourceIndex = resourceIndex;
        this.portLocation = portLocation;
        this.portColor = portColor;
        this.portName = portName;
        this.inventoryLocation = inventoryLocation;
        this.inventory = new Inventory();
        this.inventoryMeshInstances = [];
    }

    generateInventoryContent() {
        // //2 cards
        // this.inventory.pirateCards.push(PirateCard.random());
        // this.inventory.pirateCards.push(PirateCard.random());

        // //up to 2 of each treasure - for now
        // for(let i=1;i<6;i++){
        //     let numOfThisType = randomInt(2);
        //     for (let j = 0; j < numOfThisType; j++) {
        //         this.inventory.treasures.push(new TreasureItem(i));
        //     }
        // }

        // //As a test - two chance cards!
        // this.inventory.chanceCards.push(new ChanceCard(21));
        // this.inventory.chanceCards.push(new ChanceCard(25));

        //For Trading ports only
        //2 cards
        this.inventory.pirateCards.push(PirateCard.random());
        this.inventory.pirateCards.push(PirateCard.random());

        //Treasure up to a value of 8

        let treasureValue = 8 - this.inventory.getPirateValue();
        let treasureItems : TreasureItem[] = this.buccaneer.treasureChestInventory.getItemsByValue(treasureValue);
        for(let i of treasureItems){
            this.inventory.treasures.push(i);
        }
        // console.log("Generated inventory for " + this.portName + ":");
        // console.log("\tPirate total: " + this.inventory.getPirateValue());
        // console.log("\tTreasure total: " + treasureValue);
        // for(let i of this.inventory.treasures){
        //     console.log("\t\tGot treasure id " + i.type + " of value " + i.getValue());
        // }
    }

    drawInventory() {
        // this.generateInventoryContent();

        //Clear old meshes
        for(let inst of this.inventoryMeshInstances){
            inst.dispose();
        }
        this.inventoryMeshInstances = [];


        let scene = this.buccaneer.scene;
        let assetManager = this.buccaneer.assetManager;

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

        let totalCardCount = this.inventory.pirateCards.length + this.inventory.chanceCards.length
        for (let i = 0; i < totalCardCount; i++) {
            let cardMesh = scene.getMeshByName("GenericCardFace").clone(this.portName + " card", null);
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

            let drawnCard = 0;
            if(i<this.inventory.pirateCards.length){
                drawnCard = this.inventory.pirateCards[i].value + ((this.inventory.pirateCards[i].type == PirateType.RED)?36:33); 
            }
            else{
                drawnCard = this.inventory.chanceCards[i-this.inventory.pirateCards.length].cardNum - 1;
            }

            let cardTexture: Texture = <Texture>(<StandardMaterial>cardMesh.material).diffuseTexture;
            cardTexture.uOffset = (drawnCard % 8) * (1 / 8);
            cardTexture.vOffset = 1 - Math.floor(drawnCard / 8) * 0.19034;

            cardMesh.position.x = -(i - totalCardCount / 2 + 0.5) * 0.5;
            cardMesh.position.y = i * 0.001;

            this.inventoryMeshInstances.push(cardMesh);
        }



        let treasuresOrderedIndices : number[] = [];
        let treasuresRandomisedIndices : number[] = [];
        for(let i = 0; i < this.inventory.treasures.length;i++){
            treasuresOrderedIndices.push(i);
        }

        while(treasuresOrderedIndices.length > 0){
            treasuresRandomisedIndices.push(treasuresOrderedIndices.splice(randomInt(treasuresOrderedIndices.length - 1), 1)[0]);
        }

        for(let i of treasuresRandomisedIndices){
            let treasureMesh : AbstractMesh;
            switch(this.inventory.treasures[i].type){
                case TreasureType.RUM:      treasureMesh = assetManager.getBarrelInstance();    break;
                case TreasureType.PEARL:    treasureMesh = assetManager.getPearlInstance();     break;
                case TreasureType.GOLD:     treasureMesh = assetManager.getGoldInstance();      break;
                case TreasureType.DIAMOND:  treasureMesh = assetManager.getDiamondInstance();   break;
                case TreasureType.RUBY:     treasureMesh = assetManager.getRubyInstance();      break;
                default:                    /*sad*/                                             break;
            }

            let numTreasures = treasuresRandomisedIndices.length;
        
            let parent = new BABYLON.TransformNode("Treasure", scene);




            parent.position.copyFrom(this.dockMesh.getAbsolutePosition());

            if (l.x < -10) { // West
                parent.rotation.y = -Math.PI / 2;
            } else if (l.x > 10) { // East
                parent.rotation.y = Math.PI / 2;
            } else if (l.z < -10) { // South
                parent.rotation.y = Math.PI;
            } else if (l.z > 10) { // North
                parent.rotation.y = 0;
            }

            parent.translate(Axis.X, ((i % (numTreasures / 2)) - numTreasures / 4 + 0.5) * 0.6);
            parent.translate(Axis.Z, i >= numTreasures / 2 ? 0.35 : -0.35);
            parent.translate(new BABYLON.Vector3(Math.random() - 0.5, 0.01, Math.random() - 0.5), 0.3);
            parent.rotation.y = Math.random() * Math.PI * 2;

            treasureMesh.parent = parent;

            this.inventoryMeshInstances.push(treasureMesh);
        }
    }




    init(buccaneer: Buccaneer) {
        this.buccaneer = buccaneer;

        if (portMaterial == null) {
            portMaterial = new BABYLON.StandardMaterial("Port material", buccaneer.scene);
            portMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            let portTexture = new BABYLON.Texture("assets/Merged Map_2048.png", buccaneer.scene, true);
            portMaterial.diffuseTexture = portTexture;
        }

        let isActive = this.boat != null;

        this.dockMesh = <Mesh>buccaneer.scene.getMeshByID("Dock" + this.resourceIndex);
        this.dockMesh.material = portMaterial;
        offsetMeshUVs(this.dockMesh, Math.floor(this.resourceIndex / 4) * 0.25 + (isActive ? 0 : 0.5), (this.resourceIndex % 4) * 0.1416); // Adjust mesh UVs to correctly render port texture without requiring a unique material

        let safeMesh = <Mesh>buccaneer.scene.getMeshByID("Safe" + this.resourceIndex);
        safeMesh.material = portMaterial;
        offsetMeshUVs(safeMesh, this.resourceIndex * 0.11194, isActive ? 0.1791 : 0); // Adjust mesh UVs to correctly render safe texture without requiring a unique material

        if (isActive == false) this.generateInventoryContent();
        this.drawInventory();
    }
}

const ports = [
    new Port(0, new BABYLON.Vector3(12, 0, 4), "#6A9023", "Bombay", [3, 2.5]),
    new Port(1, new BABYLON.Vector3(12, 0, -4), "#82B3CC", "Cadiz", [3, -2.5]),
    new Port(2, new BABYLON.Vector3(4, 0, -13), "#A5739C", "Bristol", [2.5, -3]),
    new Port(3, new BABYLON.Vector3(-4, 0, -13), "#F88642", "London", [-2.5, -3]),
    new Port(4, new BABYLON.Vector3(-13, 0, -5), "#F9D42C", "Genoa", [-3, -2.5]),
    new Port(5, new BABYLON.Vector3(-13, 0, 3), "#E25E9F", "Venice", [-3, 2.5]),
    new Port(6, new BABYLON.Vector3(-5, 0, 12), "#B37F39", "Amsterdam", [-2.5, 3]),
    new Port(7, new BABYLON.Vector3(3, 0, 12), "#E84D4C", "Marseilles", [2.5, 3]),
];

// function portLookup(x : number, z : number) : Port{
//     for (let p of ports){
//         if((Math.floor(x) == p.portLocation.x) && (Math.floor(z) == p.portLocation.z)){

//         }
//     }
// }

export {
    Port,
    ports
}