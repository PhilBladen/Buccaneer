import * as Utils from './utils';
import * as BABYLON from "@babylonjs/core";
import { Port, ports } from './port';
import { Color3, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import { SoundEngine } from './soundengine';
import { Buccaneer } from '.';

let scene: Scene;
let settings: any;

let matRed = null;
let matWhite = null;

class Boat {
    sailingStrength : number;
    x : number;
    z : number;
    boatIndex : number;
    squares : Mesh[];
    originalLocation : Vector3;
    targetLocation : Vector3;
    animateStartTime : number;
    moveAnimateStartTime : number;
    direction : number;
    originalAngle : number;
    CoT : TransformNode;
    angle : number;
    time : number;
    cw : Mesh;
    ccw : Mesh;
    splashes : Mesh[];
    offset : number;
    port : Port;
    mesh : Mesh;
    turnStartX : number;
    turnStartZ : number;
    turnStartDir : number;
    activated : boolean = false;

    constructor(x : number, z : number, port : Port, buccaneer : Buccaneer) {
        let self = this;
        scene = buccaneer.scene;
        settings = buccaneer.settings;

        this.sailingStrength = Math.floor(Math.random() * 12) + 6;
        this.x = x;
        this.z = z;
        this.squares = [];
        this.originalLocation = this.targetLocation = new BABYLON.Vector3((x + 0.5) * settings.gridTileSize, 0, (z + 0.5) * settings.gridTileSize);
        this.animateStartTime = 0;
        this.moveAnimateStartTime = 0;

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
        let mesh : Mesh = <Mesh> boatMesh.clone("Boat" + port.portName, null);
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

        let cw : Mesh;
        let ccw : Mesh;
        for (let n of mesh.getChildren()) {
            if (n.name == mesh.name + ".RotateCW")
                cw = <Mesh> n;
            if (n.name == mesh.name + ".RotateCCW")
                ccw = <Mesh> n;
        }

        let material : StandardMaterial = new BABYLON.StandardMaterial("", scene);
        cw.material = material;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.diffuseTexture = new BABYLON.Texture("assets/arrows.png", scene);
        material.diffuseTexture.hasAlpha = true;
        // cw.material.transparencyMode = BABYLON.StandardMaterial.MATERIAL_ALPHABLEND;
        material.useAlphaFromDiffuseTexture = true;
        cw.isPickable = true;
        cw.alphaIndex = 3000;
        cw.overlayAlpha = 0.0;
        cw.renderOverlay = true;
        cw.overlayColor = new BABYLON.Color3(0, 0, 0);
        cw.actionManager = new BABYLON.ActionManager(scene);
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOverTrigger
                },
                () => {
                    cw.overlayAlpha = 0.3;
                }
            )
        );
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOutTrigger
                },
                () => {
                    cw.overlayAlpha = 0.0;
                }
            )
        );
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger
                },
                () => {
                    buccaneer.soundEngine.boatRotate();

                    self.direction -= 1;
                    self.originalAngle = self.angle;
                    self.animateStartTime = self.time;

                    self.updateTurnButton();
                }
            )
        );
        this.cw = cw;

        ccw.isPickable = true;
        ccw.alphaIndex = 3000;
        ccw.renderOverlay = true;
        ccw.overlayAlpha = 0.0;
        ccw.overlayColor = new BABYLON.Color3(0, 0, 0);
        ccw.material = cw.material;
        ccw.actionManager = new BABYLON.ActionManager(scene);
        ccw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOverTrigger
                },
                function() {
                    ccw.overlayAlpha = 0.3;
                }
            )
        );
        ccw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOutTrigger
                },
                function() {
                    ccw.overlayAlpha = 0.0;
                }
            )
        );
        ccw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger
                },
                () => {
                    buccaneer.soundEngine.boatRotate();

                    self.direction += 1;
                    self.originalAngle = self.angle;
                    self.animateStartTime = self.time;

                    self.updateTurnButton();
                }
            )
        );
        this.ccw = ccw;

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

    clearSquares() {
        if (this.squares.length > 0) {
            for (let s of this.squares)
                s.dispose();
            this.squares = [];
        }
    }

    createSquare(x, z, distanceFromBoat) {
        let self = this;

        let square = BABYLON.MeshBuilder.CreateGround("Move square", { width: settings.gridTileSize, height: settings.gridTileSize }, scene);
        if (distanceFromBoat < this.sailingStrength) {
            square.material = matWhite;
        } else {
            square.material = matRed;
        }
        this.squares.push(square);
        square.overlayColor = new BABYLON.Color3(0, 0, 0);
        square.overlayAlpha = 0.0;
        square.renderOverlay = true;
        square.alphaIndex = 600;

        square['gridX'] = x;
        square['gridZ'] = z;

        square.isPickable = true;

        square.actionManager = new BABYLON.ActionManager(scene);
        square.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOverTrigger
                },
                function() {
                    square.overlayAlpha = 0.3;
                }
            )
        );
        square.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOutTrigger
                },
                function() {
                    square.overlayAlpha = 0.0;
                }
            )
        );
        square.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger,
                    parameter: {}
                },
                function() {
                    self.x = square['gridX'];
                    self.z = square['gridZ']; // TODO dis nasty
                    self.originalLocation = self.CoT.position.clone();
                    self.moveAnimateStartTime = self.time;
                    self.targetLocation.x = (self.x + 0.5) * settings.gridTileSize;
                    self.targetLocation.z = (self.z + 0.5) * settings.gridTileSize;

                    self.updateTurnButton();
                }
            )
        );

        square.position.x = settings.gridTileSize * (x + 0.5);
        square.position.z = settings.gridTileSize * (z + 0.5);

        return square;
    }

    showLegalSquares() {
        let self = this;

        this.clearSquares();

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

                    this.createSquare(x, z, i);
                }
            }
            this.createSquare(this.x, this.z, 0);
        }
    }

    deactivate() {
        this.activated = false;
        this.cw.setEnabled(false);
        this.ccw.setEnabled(false);
        this.mesh.isPickable = false;
        this.clearSquares();
    }

    activate() {
        this.turnStartX = this.x;
        this.turnStartZ = this.z;
        this.turnStartDir = this.direction;

        this.activated = true;
        this.cw.setEnabled(true);
        this.ccw.setEnabled(true);
        this.mesh.isPickable = true;
        this.showLegalSquares();

        this.updateTurnButton();
    }

    update(time) {
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