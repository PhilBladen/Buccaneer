import * as Utils from './utils';

let scene, settings;

let boatRotate = null;

class Boat {
    constructor(x, z, _scene, _settings, boatIndex) {
        let self = this;
        scene = _scene;
        settings = _settings;

        this.sailingStrength = Math.floor(Math.random() * 8);
        this.x = x;
        this.z = z;
        this.boatIndex = boatIndex;
        this.squares = [];
        this.originalAngle = 0;
        this.originalLocation = new BABYLON.Vector3(0, 0, 0);
        this.targetLocation = new BABYLON.Vector3((x + 0.5) * settings.gridTileSize, 0, (z + 0.5) * settings.gridTileSize);
        this.animateStartTime = 0;
        this.moveAnimateStartTime = 0;

        if (boatRotate == null) {
            boatRotate = new BABYLON.Sound("boatrotate", "assets/boat-rotate.wav", scene);
            boatRotate.setVolume(0.5);
        }

        let boatMesh = scene.getMeshByName("Boat");
        let mesh = boatMesh.clone("Boat" + boatIndex);
        // mesh.setParent(null);
        // mesh.name
        mesh.setEnabled(true);
        // water.addToRenderList(mesh);
        mesh.isPickable = true;
        mesh.position.y = -0.03;

        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger
                },
                function() {
                    self.showLegalSquares();
                }
            )
        );

        let CoT = new BABYLON.TransformNode("Boat" + boatIndex + " transform");
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

        this.CoT = CoT;

        let cw;
        let ccw;
        for (let n of mesh.getChildren()) {
            if (n.name == "Boat" + boatIndex + ".RotateCW")
                cw = n;
            if (n.name == "Boat" + boatIndex + ".RotateCCW")
                ccw = n;
        }

        cw.material = new BABYLON.StandardMaterial("", scene);
        cw.material.specularColor = new BABYLON.Color3(0, 0, 0);
        cw.material.diffuseTexture = new BABYLON.Texture("assets/arrows.png", scene);
        cw.material.diffuseTexture.hasAlpha = true;
        // cw.material.transparencyMode = BABYLON.StandardMaterial.MATERIAL_ALPHABLEND;
        cw.material.useAlphaFromDiffuseTexture = true;
        cw.isPickable = true;
        cw.overlayAlpha = 0.0;
        cw.renderOverlay = true;
        cw.overlayColor = new BABYLON.Color3(0, 0, 0);
        cw.actionManager = new BABYLON.ActionManager(scene);
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOverTrigger
                },
                function() {
                    cw.overlayAlpha = 0.3;
                }
            )
        );
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnPointerOutTrigger
                },
                function() {
                    cw.overlayAlpha = 0.0;
                }
            )
        );
        cw.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger
                },
                function() {
                    boatRotate.stop();
                    boatRotate.play();

                    self.direction -= 1;
                    self.originalAngle = self.angle;
                    self.animateStartTime = self.time;

                    if (self.squares.length > 0)
                        self.showLegalSquares();
                }
            )
        );

        ccw.isPickable = true;
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
                function() {
                    boatRotate.stop();
                    boatRotate.play();

                    self.direction += 1;
                    self.originalAngle = self.angle;
                    self.animateStartTime = self.time;

                    if (self.squares.length > 0)
                        self.showLegalSquares();
                }
            )
        );

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
        mat.diffuseColor = BABYLON.Color3.FromHexString(Utils.ports[boatIndex].portColor);
        mat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
        mat.roughness = 0;
        mesh.material = mat;

        this.port = Utils.ports[boatIndex];

        this.mesh = mesh;

        this.offset = Math.random();
    }

    clearSquares() {
        if (this.squares.length > 0) {
            for (let s of this.squares)
                s.dispose();
            this.squares = [];
        }
    }

    showLegalSquares() {
        let self = this;

        this.clearSquares();

        let matRed = new BABYLON.StandardMaterial("red", scene);
        matRed.diffuseColor = new BABYLON.Color3(1, 0, 0);
        matRed.specularColor = new BABYLON.Color3(0, 0, 0);
        matRed.alpha = 0.1;

        let matWhite = new BABYLON.StandardMaterial("white", scene);
        matWhite.diffuseColor = new BABYLON.Color3(1, 1, 1);
        matWhite.specularColor = new BABYLON.Color3(0, 0, 0);
        matWhite.alpha = 0.1;

        let selectionSquareRed = new BABYLON.MeshBuilder.CreateGround("Selection square", { width: settings.gridTileSize, height: settings.gridTileSize }, scene);
        selectionSquareRed.material = matRed;
        let selectionSquareWhite = new BABYLON.MeshBuilder.CreateGround("Selection square", { width: settings.gridTileSize, height: settings.gridTileSize }, scene);
        selectionSquareWhite.material = matWhite;
        // selectionSquare.position.y = 0.01;
        // selectionSquare.isPickable = true;

        let x = 0;
        let z = 0;

        if (this.sailingStrength > 0) {
            for (let i = 0; i < 32; i++) {
                let d = this.direction % 8;
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

                let square = new BABYLON.MeshBuilder.CreateGround("Move square", { width: settings.gridTileSize, height: settings.gridTileSize }, scene);
                if (i < this.sailingStrength) {
                    square.material = matWhite;
                } else {
                    square.material = matRed;
                }
                this.squares.push(square);
                square.overlayColor = new BABYLON.Color3(0, 0, 0);
                square.overlayAlpha = 0.0;
                square.renderOverlay = true;

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
                            self.x = square.gridX;
                            self.z = square.gridZ;
                            self.originalLocation = self.CoT.position.clone();
                            self.moveAnimateStartTime = self.time;
                            self.targetLocation.x = (self.x + 0.5) * settings.gridTileSize;
                            self.targetLocation.z = (self.z + 0.5) * settings.gridTileSize;

                            for (let s of self.squares)
                                s.dispose();
                            self.squares = [];
                        }
                    )
                );


                square.position.x = settings.gridTileSize * (x + 0.5);
                square.position.z = settings.gridTileSize * (z + 0.5);
            }
        }
        // selectionSquareRed.dispose();
        // selectionSquareWhite.dispose();
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