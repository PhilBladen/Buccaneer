import { ActionManager, BoundingBox, Color3, ExecuteCodeAction, Matrix, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { CustomMaterial } from "@babylonjs/materials";
import { Buccaneer } from ".";
import { Boat } from "./boat";
import { MotionAnimator } from "./motionanimator";
import { Port } from "./port";
import { SoundEngine } from "./soundengine";

class Player extends Boat {
    cw: Mesh = null;
    ccw: Mesh = null;
    movesMesh: Mesh;

    cwBounds: BoundingBox;
    ccwBounds: BoundingBox;

    mousePickPosition: Vector3 = Vector3.Zero();

    turnStartTime: number;

    constructor(x: number, z: number, port: Port, buccaneer: Buccaneer) {
        super(x, z, port, buccaneer);

        let mesh = this.mesh;
        let scene = this.buccaneer.scene;

        let cw: Mesh;
        let ccw: Mesh;
        for (let n of mesh.getChildren()) {
            if (n.name == mesh.name + ".RotateCW")
                cw = <Mesh>n;
            if (n.name == mesh.name + ".RotateCCW")
                ccw = <Mesh>n;
        }

        let material: StandardMaterial = new StandardMaterial("", scene);
        cw.material = material;
        material.specularColor = new Color3(0, 0, 0);
        material.diffuseTexture = new Texture("assets/arrows.png", scene);
        material.diffuseTexture.hasAlpha = true;
        // material.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
        material.useAlphaFromDiffuseTexture = true;
        cw.isPickable = true;
        cw.alphaIndex = 3000;
        cw.overlayAlpha = 0.0;
        cw.renderOverlay = true;
        cw.overlayColor = new Color3(0, 0, 0);
        cw.actionManager = new ActionManager(scene);
        cw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnPointerOverTrigger
            },
                () => {
                    cw.overlayAlpha = 0.3;
                }
            )
        );
        cw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnPointerOutTrigger
            },
                () => {
                    cw.overlayAlpha = 0.0;
                }
            )
        );
        cw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnLeftPickTrigger
            },
                () => {
                    this.buccaneer.soundEngine.boatRotate();

                    this.direction -= 1;
                    this.originalAngle = this.angle;
                    this.animateStartTime = this.time;

                    this.updateTurnButton();
                }
            )
        );
        this.cw = cw;

        ccw.isPickable = true;
        ccw.alphaIndex = 3000;
        ccw.renderOverlay = true;
        ccw.overlayAlpha = 0.0;
        ccw.overlayColor = new Color3(0, 0, 0);
        ccw.material = cw.material;
        ccw.actionManager = new ActionManager(scene);
        ccw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnPointerOverTrigger
            },
                function () {
                    ccw.overlayAlpha = 0.3;
                }
            )
        );
        ccw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnPointerOutTrigger
            },
                function () {
                    ccw.overlayAlpha = 0.0;
                }
            )
        );
        ccw.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnLeftPickTrigger
            },
                () => {
                    this.buccaneer.soundEngine.boatRotate();

                    this.direction += 1;
                    this.originalAngle = this.angle;
                    this.animateStartTime = this.time;

                    this.updateTurnButton();
                }
            )
        );
        this.ccw = ccw;

        this.cw.setEnabled(false);
        this.ccw.setEnabled(false);

        this.cwBounds = this.cw.getBoundingInfo().boundingBox;
        this.ccwBounds = this.ccw.getBoundingInfo().boundingBox;

        this.movesMesh = new Mesh("custom", scene);
        this.movesMesh.actionManager = new ActionManager(scene);
        this.movesMesh.actionManager.registerAction(
            new ExecuteCodeAction({
                trigger: ActionManager.OnPickTrigger
            },
                (e) => {
                    if (Math.floor(this.mousePickPosition.x) == this.x && Math.floor(this.mousePickPosition.z) == this.z) {
                        return; // Disable picking the square the boat is currently in.
                    }

                    this.moveToSquare(this.mousePickPosition.x, this.mousePickPosition.z);

                    this.updateTurnButton();
                }
            )
        );

        this.movesMesh.isPickable = true;
        this.movesMesh.alphaIndex = 600;

        let largeVector = new Vector3(10000, 0, 10000); // TODO dis kinda ugly



        var mat2 = new CustomMaterial('s', scene);
        mat2.needAlphaBlending = () => { return true };
        mat2.onBindObservable.add(() => {
            if (Math.floor(this.mousePickPosition.x) == this.x && Math.floor(this.mousePickPosition.z) == this.z) {
                mat2.getEffect().setVector3('pickedPoint', largeVector);
            } else {
                mat2.getEffect().setVector3('pickedPoint', this.mousePickPosition);
            }

            mat2.getEffect().setVector3('boatStart', this.boatStart);
            mat2.getEffect().setFloat('sailingDist', this.sailingStrength > 0 ? this.sailingStrength + 0.5 : 1.5);
            mat2.getEffect().setFloat('t', (performance.now() - this.turnStartTime) * 0.001);
            mat2.getEffect().setBool('show', this.activated);
        });
        mat2.AddUniform('pickedPoint', 'vec3', null);
        mat2.AddUniform('sailingDist', 'float', null);
        mat2.AddUniform('boatStart', 'vec3', null);
        mat2.AddUniform('t', 'float', null);
        mat2.AddUniform('show', 'bool', null);
        mat2.Fragment_Before_FragColor(`
        float x = floor(vPositionW.x);
        float z = floor(vPositionW.z);

        float trigDist = distance(vPositionW, boatStart);

        vec3 toBoat = abs(vPositionW - boatStart);
        float dist = max(toBoat.x, toBoat.z);

        vec4 c = vec4(vec3(0), 0.25);
        if (dist > sailingDist)
            c = vec4(vec3(1, 0, 0), 0.25);

        if ((x == floor(pickedPoint.x)) && (z == floor(pickedPoint.z)))
            c.a = 0.5;

        float a = clamp((trigDist - t * 50.0) * 0.1 + 1.0, 0.0, 1.0);
        if (show)
            c *= vec4(vec3(1), 1.0 - a);
        else
            c *= vec4(vec3(1), a);

        color.rgba = c;
        `);

        this.movesMesh.material = mat2;
    }

    showLegalSquares() {
        var positions = [];
        var indices = [];
        var normals = [];

        for (let move of this.legalMoves) {
            this.createSquareMesh(move[0], move[1], positions, indices);
        }

        VertexData.ComputeNormals(positions, indices, normals);
        var vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.applyToMesh(this.movesMesh);

        this.boatStart.x = this.x + 0.5;
        this.boatStart.z = this.z + 0.5;

        this.movesMesh.setEnabled(true);
    }

    createSquareMesh(x: number, z: number, positions: number[], indices: number[]) {
        let y = 0;

        positions.push(x, y, z);
        positions.push(x + 1, y, z);
        positions.push(x + 1, y, z + 1);
        positions.push(x, y, z);
        positions.push(x + 1, y, z + 1);
        positions.push(x, y, z + 1);

        let i = indices.length;
        indices.push(i, i + 1, i + 2, i + 3, i + 4, i + 5);
    }

    activate() {
        super.activate();

        this.cw.setEnabled(true);
        this.ccw.setEnabled(true);
        this.showLegalSquares();

        this.movesMesh.isPickable = true;

        this.turnStartTime = performance.now();
    }

    deactivate() {
        super.deactivate();

        if (this.cw != null) {
            this.cw.setEnabled(false);
            this.ccw.setEnabled(false);
            // this.movesMesh.setEnabled(false);
            this.movesMesh.isPickable = false;
        }

        this.turnStartTime = performance.now();
    }

    update(time: number) {
        super.update(time);

        let scene = this.buccaneer.scene;
        let screenX = scene.pointerX;
        let screenY = scene.pointerY;
        let screenPosition = new Vector3(screenX, screenY, 0);
        let engine = scene.getEngine();
        let s = engine.getHardwareScalingLevel();
        let cameraPosition: Vector3 = this.buccaneer.camera.position;

        Vector3.UnprojectToRef(
            screenPosition,
            s * engine.getRenderWidth(),
            s * engine.getRenderHeight(),
            Matrix.Identity(),
            scene.getViewMatrix(),
            scene.getProjectionMatrix(),
            screenPosition
        );

        let cwMatrix = this.cw.getWorldMatrix();
        let cwInverse = cwMatrix.invert();
        
        let camInCwFrame = Vector3.TransformCoordinates(cameraPosition, cwInverse);
        let screenInCwFrame = Vector3.TransformCoordinates(screenPosition, cwInverse);
        let rayInCwFrame = screenInCwFrame.subtract(camInCwFrame);

        let f2 = camInCwFrame.y / rayInCwFrame.y;
        let positionOnBoatPlane = camInCwFrame.subtract(rayInCwFrame.scale(f2));

        let intersect = false;
        let minCw = this.cwBounds.minimum;
        let maxCw = this.cwBounds.maximum;
        if (positionOnBoatPlane.x > minCw.x && positionOnBoatPlane.x < maxCw.x && positionOnBoatPlane.z > minCw.z && positionOnBoatPlane.z < maxCw.z) {
            intersect = true;
        }
        let minCcw = this.ccwBounds.minimum;
        let maxCcw = this.ccwBounds.maximum;
        if (positionOnBoatPlane.x > minCcw.x && positionOnBoatPlane.x < maxCcw.x && positionOnBoatPlane.z > minCcw.z && positionOnBoatPlane.z < maxCcw.z) {
            intersect = true;
        }

        console.log(intersect);

        if (!intersect) {
            let ray = screenPosition.subtract(cameraPosition);
            let f = cameraPosition.y / ray.y;
            this.mousePickPosition = cameraPosition.subtract(ray.scale(f));
        } else {
            this.mousePickPosition.set(10000, 0, 10000);
        }
    }
}

export {
    Player
}