import { cosineInterpolate, cosineInterpolateV3D, isMobileDevice, randomInt, showAxis } from './utils';
import { Boat } from './boat';
import { Port, ports } from './port';
import { SoundEngine } from './soundengine';
import { AssetManager } from './assets';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { GridMaterial, WaterMaterial } from "@babylonjs/materials";
import { GLTFLoaderAnimationStartMode, GLTFFileLoader } from "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Texture, ParticleSystem, SceneLoader, Axis, PBRMaterial, Camera, StandardMaterial, ICameraInput, Matrix, ArcRotateCameraPointersInput } from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core";
import { AI } from "./ai";
import { Player } from "./player";
import { Terrain } from "./terrain";
import { BaseCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/BaseCameraPointersInput';

import $ from "jquery";

let hudVisible = true;
$('#settings').on("click",
    () => {
        let hud = $("#hudbottom");
        if (hudVisible) {
            hud.css("transform", "translate(0, 150%)");
            $("#settings").removeClass("fa-caret-square-down");
            $("#settings").addClass("fa-caret-square-up");
        } else {
            hud.css("transform", "translate(0, 0)");
            $("#settings").removeClass("fa-caret-square-up");
            $("#settings").addClass("fa-caret-square-down");
        }
        hudVisible = !hudVisible;
    }
);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('service-worker.js').then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

$("#btnClosePopup").on("click", () => $("#popup").fadeOut());

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("renderCanvas"); // Get the canvas element
canvas.onselectstart = function () { return false; }

const settingsLow = {
    reflections: false,
    useAntialiasing: false,
    gridTileSize: 1,
}

const settingsMed = {
    reflections: true,
    reflectionResolution: 1024,
    useAntialiasing: true,
    gridTileSize: 1,
}

const settingsHigh = {
    reflections: true,
    reflectionResolution: 4096,
    riverReflectionResolution: 1024,
    useAntialiasing: true,
    gridTileSize: 1,
}

class Buccaneer {
    readonly scene: Scene;
    readonly soundEngine: SoundEngine;
    readonly assetManager: AssetManager;
    camera: Camera;
    readonly settings;

    water: WaterMaterial;

    constructor(scene: Scene) {
        this.scene = scene;
        this.soundEngine = new SoundEngine();
        this.assetManager = new AssetManager();

        if (isMobileDevice())
            this.settings = settingsLow;
        else
            this.settings = settingsMed;
    }

    nextTurn() {
        let currentTurnPort = ports[currentTurnPortIndex % 8];
        while (currentTurnPort.boat == null) { // First turn only TODO
            currentTurnPort = ports[++currentTurnPortIndex % 8];
        }

        currentTurnPortIndex++;
        currentTurnPortIndex %= 8; // TODO deal with only real players

        let newTurnPort = ports[currentTurnPortIndex % 8];
        while (newTurnPort.boat == null) {
            newTurnPort = ports[++currentTurnPortIndex % 8];
        }
        updateTurn(currentTurnPort, newTurnPort);
    }
}

export {
    Buccaneer
}

class CustomCameraInput implements ICameraInput<ArcRotateCamera> {
    camera: ArcRotateCamera;

    clickStart: Vector3;
    mousePressed: boolean = false;

    //this function must return the class name of the camera, it could be used for serializing your scene
    getClassName(): string {
        return "CustomCameraInput";
    }

    //this function must return the simple name that will be injected in the input manager as short hand
    //for example "mouse" will turn into camera.inputs.attached.mouse
    getSimpleName(): string {
        return "mouse";
    }

    //this function must activate your input, event if your input does not need a DOM element
    attachControl(noPreventDefault?: boolean) {
        canvas.addEventListener('pointerdown', (event) => {
            // event.
            this.clickStart = screenXYToSeaPosition(event.x, event.y);
            console.log("You pressed: " + this.clickStart);

            this.mousePressed = true;

            event.preventDefault();
            // event.stopPropagation();

        }, false);

        // canvas.addEventListener('dragstart', (event) => {
        // this.mousePressed = false;
        // }, false);

        canvas.addEventListener('pointerup', (event) => {
            this.mousePressed = false;

            event.preventDefault();
        }, false);

        canvas.addEventListener('pointermove', (event) => {
            if (!this.mousePressed)
                return;


            // event.
            let newPos = screenXYToSeaPosition(event.x, event.y);
            console.log("You moved: " + newPos);

            event.preventDefault();

        }, false);

        console.log("Added event listener");
    }

    //detach control must deactivate your input and release all pointers, closures or event listeners
    detachControl() {

    }

    //this optional function will get called for each rendered frame, if you want to synchronize your input to rendering,
    //no need to use requestAnimationFrame. It's a good place for applying calculations if you have to
    checkInputs(): void {
        // console.log("Checking inputs");
    }
}

const engine = new Engine(canvas, true, {}, true);
engine.displayLoadingUI();
$("#loadingcover").fadeOut();
const scene = new Scene(engine);
const buccaneer = new Buccaneer(scene);
// engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

// engine.enterFullscreen(); TODO add user option

// Pause audio when window loses focus TODO
// $(window).on("focus", () => {
//     Engine.audioEngine.setGlobalVolume(1);
// }).on("blur", () => {
//     Engine.audioEngine.setGlobalVolume(0);
// });

let selectedBoat = null;
let camera: ArcRotateCamera = null;
let boatMesh = null;
let boats: Boat[] = [];
let chestLid;
let cardAnimation;

let time = 0;

let boatIndex = 0;

let wasBoatAtPirateIsland = false;
let chestAnimationStartTime = 0;
let createdParticleSystem = false;

let currentTurnPortIndex = 7;

let cardDeck = [];
for (let cardIndex = 0; cardIndex < 30; cardIndex++) {
    cardDeck.push(cardIndex);
}
// Randomly swap pairs of cards
for (let i = 0; i < 3000; i++) {
    let cardIndex = Math.floor(Math.random() * 29);
    let c1 = cardDeck[cardIndex];
    let c2 = cardDeck[cardIndex + 1];
    cardDeck[cardIndex] = c2;
    cardDeck[cardIndex + 1] = c1;
}

function screenXYToSeaPosition(screenX: number, screenY: number) {
    let screenPosition = new Vector3(screenX, screenY, 0);
    let s = engine.getHardwareScalingLevel();

    Vector3.UnprojectToRef(
        screenPosition,
        s * engine.getRenderWidth(),
        s * engine.getRenderHeight(),
        Matrix.Identity(),
        scene.getViewMatrix(),
        scene.getProjectionMatrix(),
        screenPosition
    );

    let cameraPosition: Vector3 = camera.position;
    let ray = screenPosition.subtractInPlace(cameraPosition);
    let f = cameraPosition.y / ray.y;
    return cameraPosition.subtract(ray.scaleInPlace(f));
}

function drawCard() {
    let card = cardDeck[0];
    cardDeck.shift();
    cardDeck.push(card);
    return card;
}

let minimapCanvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("minimap");
minimapCanvas.width = 285;
minimapCanvas.height = 285;
let minimapCtx = minimapCanvas.getContext("2d");
function renderMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    minimapCtx.fillStyle = "#FF0000";

    for (let boat of boats) {
        let boatX = boat.baseTransform.position.x;
        let boatY = boat.baseTransform.position.z;

        boatX = 28.5 / 2 - boatX;
        boatY += 28.5 / 2;

        let ratio = minimapCanvas.width / 28.5;

        minimapCtx.save();
        minimapCtx.translate(boatX * ratio, boatY * ratio);
        minimapCtx.rotate(boat.baseTransform.rotation.y + Math.PI); // TODO fix

        minimapCtx.beginPath();
        let w = 5;
        let h = 7;
        minimapCtx.moveTo(-w, h);
        minimapCtx.lineTo(0, -h);
        minimapCtx.lineTo(w, h);
        minimapCtx.closePath();

        minimapCtx.lineWidth = 5;
        if (boat.activated)
            minimapCtx.strokeStyle = '#C33';
        else
            minimapCtx.strokeStyle = '#000';
        minimapCtx.stroke();

        minimapCtx.fillStyle = boat.port.portColor;
        minimapCtx.fill();

        minimapCtx.restore();
    }
}

function updateTurn(currentPort, newPort) {
    if (currentPort.boat.x >= -3 && currentPort.boat.z >= -3 && currentPort.boat.x <= 2 && currentPort.boat.z <= 2) {
        drawnCard = drawCard();
        let cardMesh: Mesh = <Mesh>scene.getMeshByName("Face");
        let cardMaterial: StandardMaterial = <StandardMaterial>cardMesh.material;
        let albedoTexture: Texture = <Texture>cardMaterial.diffuseTexture;
        albedoTexture.uOffset = (drawnCard % 8) * (1 / 8);
        albedoTexture.vOffset = Math.floor(drawnCard / 8) * 0.19034;

        scene.getAnimationGroupByName("ChanceReveal").play();
    }

    currentPort.boat.deactivate();

    setTimeout(() => {
        newPort.boat.activate();

        $("#currentturnportname").html(newPort.portName + "'s Turn");
        $("#hudtop").css("background-color", newPort.portColor);
    }, 1000);
}

let drawnCard;
let lastFPSUpdate = performance.now();
let fpsText = $("#fps");
const updateGame = function () {

    if (performance.now() - lastFPSUpdate > 1000) {
        fpsText.text(engine.getFps().toFixed() + "");
        lastFPSUpdate = performance.now();
    }

    time = performance.now() * 0.001;

    renderMinimap();

    buccaneer.soundEngine.doAmbientSounds();

    let boatAtPirateIsland = false;
    for (let boat of boats) {
        // console.log(boat);
        boat.update(time);

        if (boat.x >= -3 && boat.z >= -3 && boat.x <= 2 && boat.z <= 2) {
            boatAtPirateIsland = true;
        }
    }

    if (camera.beta > 1.4) {
        camera.beta = 1.4;
    }

    let cameraToTarget = camera.target.subtract(camera.position);
    let f = camera.target.y / cameraToTarget.y;
    camera.target.subtractInPlace(cameraToTarget.scale(f));
    camera.position.subtractInPlace(cameraToTarget.scale(f));


    // camera.target.y = 0;

    (<ArcRotateCameraPointersInput>camera.inputs.attached.pointers).panningSensibility = 1500 * 1 / camera.radius;
    camera.angularSensibilityX = camera.angularSensibilityY = 300;
    (<ArcRotateCameraPointersInput>camera.inputs.attached.pointers).useNaturalPinchZoom = true;
    // console.log(camera.inputs.attached.pointers);
    // camera.zoomOnFactor = 1.0;

    if (selectedBoat !== null) {
        selectedBoat.rotate(new BABYLON.Vector3(0, 1, 0), 0.02, BABYLON.Space.WORLD);
    }

    if (wasBoatAtPirateIsland != boatAtPirateIsland) {
        wasBoatAtPirateIsland = boatAtPirateIsland;
        chestAnimationStartTime = time;

        if (boatAtPirateIsland) {
            buccaneer.soundEngine.chestOpen();


        } else {
            buccaneer.soundEngine.chestClose();

            createdParticleSystem = false;
        }
    }
    let chestAnimationProgress = (time - chestAnimationStartTime);
    if (chestAnimationProgress >= 1) {
        chestAnimationProgress = 1;
    }

    if (boatAtPirateIsland && chestAnimationProgress > 0.0) {
        if (!createdParticleSystem) {
            createdParticleSystem = true;

            const particleSystem = new ParticleSystem("particles", 200, scene);

            particleSystem.particleTexture = new Texture("assets/flare.png", scene);

            var emissionPlane = scene.getMeshByName("ChestEmitPlane");
            var emissionPlaneBounds = emissionPlane.getBoundingInfo();

            particleSystem.createBoxEmitter(new Vector3(0, 2, 0), new Vector3(0, 0.1, 0), emissionPlaneBounds.boundingBox.minimumWorld, emissionPlaneBounds.boundingBox.maximumWorld);
            particleSystem.start();

            particleSystem.minSize = 0.01;
            particleSystem.maxSize = 0.1;

            particleSystem.maxLifeTime = 2.0;
            particleSystem.minLifeTime = 0.2;

            particleSystem.emitRate = 200;
            particleSystem.disposeOnStop = true;

            particleSystem.targetStopDuration = 0.3;
        }
    }

    // let chestAngle = cosineInterpolate(boatAtPirateIsland ? 0 : -1.9, boatAtPirateIsland ? -1.9 : 0, chestAnimationProgress);
    // chestLid.setDirection(Axis.Z, 0.0, 0.0, chestAngle); // TODO
}

const createScene = function () {


    $("#actionbtnturn").on({
        click: () => {
            $("#actionbtnturn").addClass("disabled");
            buccaneer.soundEngine.buttonClick();
            buccaneer.nextTurn();
        },
        mouseover: () => { buccaneer.soundEngine.buttonHover() }
    });

    $("#rules").on("click", () => {
        $("#rules").fadeOut();
    });
    
    $('#btnrules').on("click", () => {
        $("#rules").fadeIn();
    });

    SceneLoader.OnPluginActivatedObservable.addOnce(loader => {
        (<GLTFFileLoader>loader).animationStartMode = GLTFLoaderAnimationStartMode.NONE;
    });

    camera = new ArcRotateCamera("camera", -3 * Math.PI / 4, Math.PI / 3, 50, new BABYLON.Vector3(0, 0, 0), scene);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 100;
    console.log(camera.inputs);
    // camera.inputs.clear();
    // camera.inputs.add(new CustomCameraInput());
    camera.attachControl(canvas, true);
    camera.inertia = 0.0;
    camera.panningInertia = 0.0;
    (<any>camera.inputs.attached.pointers).angularSensibility = 1;
    camera.wheelPrecision = 1;
    buccaneer.camera = camera;

    var pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline",
        true, // HDR texture
        scene, [camera]
    );
    if (buccaneer.settings.useAntialiasing) {
        pipeline.samples = 16;
    }
    // new BABYLON.FxaaPostProcess("fxaa", 1.0, camera);

    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    let skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox_sunny/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/environment.dds", scene);
    scene.environmentIntensity = 0.3;

    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: 'r'
        },
            () => scene.debugLayer.show()
        )
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: 'a'
        },
            () => showAxis(5, scene)
        )
    );


    $("#debug").on("click", () => { scene.debugLayer.show({ handleResize: true, overlay: true }) });

    // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));
    const ambientLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.7;

    let light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, -1), scene);
    light.position = new BABYLON.Vector3(-25, 10, -1);
    light.intensity = 0.3;

    Promise.all([
        BABYLON.SceneLoader.AppendAsync("assets/AllIslands.glb"),
        BABYLON.SceneLoader.AppendAsync("assets/Boat.glb"),
        BABYLON.SceneLoader.AppendAsync("assets/3DAssets.glb")
    ]).then(function () {
        buccaneer.assetManager.load(scene);

        let terrain = new Terrain();
        terrain.loadTerrain(buccaneer);
        buccaneer.water.addToRenderList(skybox);

        boatMesh = scene.getMeshByName("Boat");

        let portMeshes = [];
        for (let i = 0; i < 8; i++) {
            portMeshes[i] = scene.getMeshByName("Dock" + i);
        }
        let safes = [];
        for (let i = 0; i < 8; i++) {
            safes[i] = scene.getMeshByName("Safe" + i);
        }
        chestLid = scene.getNodeByID("ChestLid");

        scene.getAnimationGroupByName("ChanceReveal").onAnimationEndObservable.add(() => {
            $("#chancecard").attr("src", "assets/cards/Chance " + (drawnCard + 1) + ".png");
            $("#popup").fadeIn();
        });

        let playerPort = ports[randomInt(7)];
        boats.push(new Player(playerPort.portLocation.x, playerPort.portLocation.z, playerPort, buccaneer));

        let numPlayers = 1;//randomInt(5) + 2;
        for (let i = 0; i < numPlayers; i++) {
            let port = ports[i];
            if (port.boat != null) continue;
            let portLocation = port.portLocation;
            let boat: Boat;
            boat = new AI(portLocation.x, portLocation.z, port, buccaneer);
            boats.push(boat);

        }

        for (let port of ports) {
            port.init(buccaneer);
        }

        boatMesh.parent.dispose();

        buccaneer.soundEngine.init(scene);

        $("#btnClosePopup").on("click", () => {
            scene.getAnimationGroupByName("ChanceReturn").play();
            scene.getAnimationGroupByName("StackReturn").play();
        });

        scene.getAnimationGroupByName("ChanceReturn").start();
        scene.getAnimationGroupByName("ChanceReturn").goToFrame(50);

        buccaneer.nextTurn();

        scene.executeWhenReady(() => {
            engine.hideLoadingUI();
        });
    });
};

createScene();

scene.registerBeforeRender(() => {
    if (scene.getViewMatrix() === undefined)
        return;
    updateGame();
});

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});