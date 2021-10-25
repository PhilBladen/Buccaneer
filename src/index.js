import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import { GLTFLoaderAnimationStartMode } from 'babylonjs-loaders';
import 'babylonjs-inspector';
// import "@babylonjs/core/Debug/debugLayer";

// import * from 'babylon.gridMaterial.min.js';
import { GridMaterial, WaterMaterial, CustomMaterial } from 'babylonjs-materials'
import { createPointerLock } from "./pointerLock.js"
import { cosineInterpolate, cosineInterpolateV3D, isMobileDevice, ports, showAxis } from './utils.js';
import { Boat } from './boat.js';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
canvas.onselectstart = function() { return false; }

const engine = new BABYLON.Engine(canvas, true, {}, true); // Generate the BABYLON 3D engine
// engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

// engine.enterFullscreen(); TODO add user option

$(window).focus(function() {
    BABYLON.Engine.audioEngine.setGlobalVolume(1);
}).blur(function() {
    // Pause when window loses focus
    BABYLON.Engine.audioEngine.setGlobalVolume(0);
});

let selectedBoat = null;
let camera = null;
let boatMesh = null;
let water = null;
let boats = [];
let chestLid;
let cardAnimation;

let time = 0;

let boatIndex = 0;



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

let settings;
if (isMobileDevice())
    settings = settingsLow;
else
    settings = settingsMed;

let chestOpenSound;
let chestCloseSound;

let wasBoatAtPirateIsland = false;
let chestAnimationStartTime = 0;
let createdParticleSystem = false;

let currentTurnPortIndex = 0;

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

function drawCard() {
    let card = cardDeck[0];
    cardDeck.shift();
    cardDeck.push(card);
    return card;
}

function nextTurn() {
    let currentTurnPort = ports[currentTurnPortIndex];

    currentTurnPortIndex++;
    currentTurnPortIndex %= 8; // TODO deal with only real players

    let newTurnPort = ports[currentTurnPortIndex];
    updateTurn(currentTurnPort, newTurnPort);
}

function renderMinimap() {
    let minimapCanvas = document.getElementById("minimap");
    minimapCanvas.width = 300;
    minimapCanvas.height = 300;
    let ctx = minimapCanvas.getContext("2d");
    ctx.fillStyle = "#FF0000";

    for (let boat of boats) {
        let boatX = boat.CoT.position.x;
        let boatY = boat.CoT.position.z;

        boatX = 28.5 / 2 - boatX;
        boatY += 28.5 / 2;

        let ratio = 300 / 28.5;

        ctx.save();
        ctx.translate(boatX * ratio, boatY * ratio);
        ctx.rotate(boat.CoT.rotation.y + Math.PI);

        ctx.beginPath();
        let w = 12;
        let h = 16;
        ctx.moveTo(-w, h);
        ctx.lineTo(0, -h);
        ctx.lineTo(w, h);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#666666';
        ctx.stroke();

        ctx.fillStyle = boat.port.portColor;
        ctx.fill();

        ctx.restore();
    }
}

function updateTurn(currentPort, newPort) {
    if (currentPort.boat.x >= -3 && currentPort.boat.z >= -3 && currentPort.boat.x <= 2 && currentPort.boat.z <= 2) {
        drawnCard = drawCard();
        let cardMesh = scene.getMeshByName("Face");
        cardMesh.material.albedoTexture.uOffset = (drawnCard % 8) * (1 / 8);
        cardMesh.material.albedoTexture.vOffset = Math.floor(drawnCard / 8) * 0.19034;

        scene.getAnimationGroupByName("ChanceReveal").play();
    }

    currentPort.boat.deactivate();
    newPort.boat.activate();

    $("#currentturnportname").html(newPort.portName + "'s Turn");
    $("#hudtop").css("background-color", newPort.portColor);

}

let drawnCard;
let lastFPSUpdate = Date.now();
const updateGame = function() {

    if (Date.now() - lastFPSUpdate > 1000) {
        $("#fps").html(engine.getFps().toFixed() + " fps");
        lastFPSUpdate = Date.now();
    }

    time++;

    renderMinimap();

    let boatAtPirateIsland = false;
    for (let boat of boats) {
        // console.log(boat);
        boat.update(time);

        if (boat.x >= -3 && boat.z >= -3 && boat.x <= 2 && boat.z <= 2) {
            boatAtPirateIsland = true;
        }
    }

    if (camera.beta > 1.4)
        camera.beta = 1.4;

    camera.target.y = 0;


    if (selectedBoat !== null) {
        selectedBoat.rotate(new BABYLON.Vector3(0, 1, 0), 0.02, BABYLON.Space.WORLD);
    }

    if (wasBoatAtPirateIsland != boatAtPirateIsland) {
        wasBoatAtPirateIsland = boatAtPirateIsland;
        chestAnimationStartTime = time;

        if (boatAtPirateIsland) {
            chestOpenSound.play();


        } else {
            chestCloseSound.play();

            createdParticleSystem = false;
        }
    }
    let chestAnimationProgress = (time - chestAnimationStartTime) / 40;
    if (chestAnimationProgress >= 1) {
        chestAnimationProgress = 1;
    }

    if (boatAtPirateIsland && chestAnimationProgress > 0.0) {
        if (!createdParticleSystem) {
            createdParticleSystem = true;

            const particleSystem = new BABYLON.ParticleSystem("particles", 200);

            particleSystem.particleTexture = new BABYLON.Texture("assets/flare.png");

            var emissionPlane = scene.getMeshByName("ChestEmitPlane");
            var emissionPlaneBounds = emissionPlane.getBoundingInfo();

            particleSystem.createBoxEmitter(new BABYLON.Vector3(0, 2, 0), new BABYLON.Vector3(0, 0.1, 0), emissionPlaneBounds.boundingBox.minimumWorld, emissionPlaneBounds.boundingBox.maximumWorld);
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

    let chestAngle = cosineInterpolate(boatAtPirateIsland ? 0 : -1.9, boatAtPirateIsland ? -1.9 : 0, chestAnimationProgress);
    chestLid.setDirection(BABYLON.Axis.Z, 0.0, 0.0, chestAngle);
}

// Add your code here matching the playground format
const createScene = function() {
    engine.displayLoadingUI();

    $("#actionbtnturn").click(function() {
        nextTurn();
    });

    const scene = new BABYLON.Scene(engine);

    BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(loader => {
        loader.animationStartMode = GLTFLoaderAnimationStartMode.NONE;
    });

    if (true) { // TODO isMobileDevice()) {
        camera = new BABYLON.ArcRotateCamera("camera", -3 * Math.PI / 4, Math.PI / 3, 50, new BABYLON.Vector3(0, 0, 0));
        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 50;
        camera.attachControl(canvas, true);
        camera.inertia = 0.0;
        camera.panningInertia = 0.0;
        camera.inputs.attached.pointers.panningSensibility = 100;
        camera.inputs.attached.pointers.angularSensibility = 10;
        camera.wheelPrecision = 1;
        // camera.inputs.attached.pointers.panningSensibility = 2000;
    } else {
        camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);
        // camera.lowerRadiusLimit = 2;
        // camera.upperRadiusLimit = 50;
        camera.inertia = 0.0;
        camera.attachControl(canvas, true);
        camera.angularSensibility = 400;
        // camera.inputs.attached.pointers.panningSensibility = 2000;
    }

    var pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline", // The name of the pipeline
        false, // Do you want the pipeline to use HDR texture?
        scene, // The scene instance
        [camera] // The list of cameras to be attached to
    );
    if (settings.useAntialiasing)
        pipeline.samples = 16;
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
    scene.environmentIntensity = 0.5;

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

    chestOpenSound = new BABYLON.Sound("chestopen", "assets/chestopen.wav", scene);
    chestCloseSound = new BABYLON.Sound("chestopen", "assets/chestclose.wav", scene);
    var music = new BABYLON.Sound("water", "assets/water.mp3", scene, function() {
        // Sound has been downloaded & decoded
        music.play();
    }, { loop: true });

    // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));
    const ambientLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.7;

    let light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, -1), scene);
    light.position = new BABYLON.Vector3(-25, 10, -1);
    light.intensity = 0.3;

    Promise.all([
        BABYLON.SceneLoader.AppendAsync("assets/AllIslands.glb"),
        BABYLON.SceneLoader.AppendAsync("assets/Boat.gltf")
    ]).then(function() {
        // scene.debugLayer.show();
        // return;

        boatMesh = scene.getMeshByName("Boat");
        // boatMesh.setEnabled(false);

        var sea = scene.getMeshByName("Sea");
        var castle = scene.getMeshByName("Castle");
        var edgeIslands = scene.getMeshByName("Grass");
        let rivers = scene.getMeshByName("Rivers");
        let frame = scene.getMeshByName("Frame");
        let portMeshes = [];
        for (let i = 0; i < 8; i++) {
            portMeshes[i] = scene.getMeshByName("Dock" + i);
            console.log(portMeshes[i]);
        }
        let safes = [];
        for (let i = 0; i < 8; i++) {
            safes[i] = scene.getMeshByName("Safe" + i);
        }
        let gold = scene.getMeshByName("Gold");
        let diamond = scene.getMeshByName("Diamond");
        let ruby = scene.getMeshByName("Ruby");
        chestLid = scene.getNodeByID("ChestLid");

        scene.getAnimationGroupByName("ChanceReveal").onAnimationEndObservable.add(() => {
            // var card = drawCard();
            $("#chancecard").attr("src", "assets/cards/Chance " + (drawnCard + 1) + ".png");
            // $("#chancecard").load(function() {
            // $("#popup").css("opacity", "1.0");
            $("#popup").fadeIn();
            // });

        });

        // cardAnimation = scene.getAnimationGroupByName("FlipChanceCard");
        // cardAnimation.loopAnimation = false;

        // let sand = scene.getMeshByName("Sand");
        // let needles = scene.getMeshByName("Needles");
        // let splash = scene.getMeshByName("Splash");
        // splash.setEnabled(false);

        // cardMesh.setEnabled(false);
        // let cardMesh = scene.getMeshByName("Card");
        // cardMesh.actionManager = new BABYLON.ActionManager(scene);
        // cardMesh.isPickable = true;
        // cardMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        //     {
        //         trigger: BABYLON.ActionManager.OnPickTrigger
        //     },
        //     function () {
        //         cardMesh.setEnabled(false);
        //     }
        // ));

        // for (let mesh of scene.meshes)
        // mesh.isPickable = false;

        var groundTexture = new BABYLON.Texture("assets/sand.jpg", scene);
        groundTexture.vScale = groundTexture.uScale = 4.0;
        var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = groundTexture;
        // groundMaterial.diffuseColor = new BABYLON.Color3(69 / 100, 100 / 100, 50 / 100);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        var ground = sea.clone("Ground");
        ground.position.y = -0.19;
        ground.material = groundMaterial;

        let gridMaterial = new GridMaterial("grid", scene);
        var grid = sea.clone("Grid");
        grid.isPickable = false;

        grid.position.y = 0.001;
        gridMaterial.lineColor = new BABYLON.Color3(1, 1, 1);
        gridMaterial.majorUnitFrequency = 1;
        gridMaterial.gridRatio = settings.gridTileSize;
        gridMaterial.opacity = 0.2;
        grid.material = gridMaterial;

        water = new WaterMaterial("water", scene, new BABYLON.Vector2(settings.reflectionResolution, settings.reflectionResolution));
        water.backFaceCulling = true;
        water.bumpTexture = new BABYLON.Texture("assets/waterbump.png", scene);
        water.windForce = -5;
        water.waveHeight = 0.0;
        water.bumpHeight = 0.05;
        water.waveLength = 0.2;
        water.colorBlendFactor = 0.5;
        // water.waterColor = new BABYLON.Color3(0.1, 0.4, 0.8);
        water.waterColor = new BABYLON.Color3(0.1, 0.5, 0.8);
        // water.addToRenderList(needles)

        for (let mesh of scene.meshes) {
            // if (mesh !== sea && mesh !== grid)
            // water.addToRenderList(mesh);
            mesh.isPickable = false;
        }
        // water.addToRenderList(edgeIslands);
        // water.addToRenderList(castle);
        water.addToRenderList(skybox);
        water.addToRenderList(ground);

        let terrainParent = scene.getNodeByName("TerrainParent");
        for (let mesh of terrainParent.getChildren(undefined, false)) {
            if (mesh instanceof BABYLON.Mesh || mesh instanceof BABYLON.InstancedMesh)
                water.addToRenderList(mesh);
            // console.log(mesh);
        }

        // sea.material = water;
        sea.isPickable = false;

        let waterDiffuseMaterial = new BABYLON.StandardMaterial("", scene);
        waterDiffuseMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.8);
        waterDiffuseMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        waterDiffuseMaterial.alpha = 0.8;

        if (settings.reflections) {
            sea.material = water;
        } else {
            sea.material = waterDiffuseMaterial;
            // sea.material.needAlphaTesting = true;
            sea.alphaIndex = 500;
        }

        // let meshes = [];
        // for (let m of scene.meshes) {
        // meshes.push(m);
        // }
        // BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);

        scene.registerBeforeRender(function() {
            updateGame();
        });

        scene.onPointerMove = function() {
            // TODO
        };


        for (let i = 0; i < 8; i++) {
            let portLocation = ports[i].portLocation;
            let boat = new Boat(portLocation.x, portLocation.z, scene, settings, boatIndex++);
            boats.push(boat);
            water.addToRenderList(boat.mesh);
        }

        let material = new BABYLON.StandardMaterial("", scene);
        let grassTexture = new BABYLON.Texture("assets/grasscolors.png", scene);
        // material.diffuseTexture = grassTexture;
        material.diffuseColor = new BABYLON.Color3(69 / 100, 100 / 100, 50 / 100);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        edgeIslands.material = material;
        // edgeIslands.material.specularColor = new BABYLON.Color3(0, 0, 0);


        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        castle.material = material;

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.9, 0.7);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // sand.material = material;

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.8);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        rivers.material = material;

        if (settings.reflections) {
            rivers.material = water;
        } else {
            rivers.material = waterDiffuseMaterial;
        }

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // edgeIslands.setEnabled(false);
        frame.material = material;
        // frame.setEnabled(false);

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 0.3, 0.2);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // diamond.material = ruby.material = gold.material = material;

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 1, 1);
        material.specularColor = new BABYLON.Color3(.8, .8, .8);
        material.alpha = 0.5;
        diamond.material = material;

        material = new BABYLON.StandardMaterial("", scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 1, 1);
        material.specularColor = new BABYLON.Color3(.8, .8, .8);
        material.alpha = 0.0;
        scene.getMeshByName("ChestEmitPlane").material = material;

        // ruby.setEnabled(false);

        let portIndex = 0;
        for (let port of portMeshes) {
            material = new BABYLON.StandardMaterial("", scene);
            material.specularColor = new BABYLON.Color3(0, 0, 0);

            let portTexture = new BABYLON.Texture("assets/Merged Map_2048.png", scene, true);
            portTexture.vScale = -1;
            portTexture.uOffset = Math.floor(portIndex / 4) * 0.25;
            portTexture.vOffset = -(portIndex % 4) * 0.1416;

            material.diffuseTexture = portTexture;
            port.material = material;

            portIndex++;
        }
        portIndex = 0;
        for (let safe of safes) {
            let isActive = true;

            material = new BABYLON.StandardMaterial("", scene);
            let portTexture = new BABYLON.Texture("assets/Merged Map_2048.png", scene, true);
            portTexture.vScale = -1;
            portTexture.uOffset = portIndex * 0.11194;
            portTexture.vOffset = isActive ? -0.1791 : 0;

            material.diffuseTexture = portTexture;
            safe.material = material;

            portIndex++;
        }

        let anchor = scene.getMeshByName("Anchor");
        water.addToRenderList(anchor);
        let anchorMaterial = new BABYLON.StandardMaterial("", scene);
        anchorMaterial.diffuseTexture = new BABYLON.Texture("assets/Anchor_Plain.png", scene);
        anchorMaterial.diffuseTexture.hasAlpha = true;
        anchorMaterial.useAlphaFromDiffuseTexture = true;
        anchorMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        anchor.material = anchorMaterial;
        anchor.alphaIndex = 100;



        // ccw.material.albedoTexture.hasAlpha = true;
        // ccw.material.useAlphaFromAlbedoTexture = true;
        // splashTexture.hasAlpha = true;
        // groundTexture.vScale = groundTexture.uScale = 4.0;

        // var splashMaterial = new BABYLON.StandardMaterial("", scene);
        // splashMaterial.diffuseTexture = splashTexture;
        // splashMaterial.useAlphaFromDiffuseTexture = true;
        // splashMaterial.useSpecularOverAlpha = true;

        // console.log(cw);
        // console.log(ccw);

        boatMesh.parent.dispose();

        // for (let mesh of scene.meshes) {
        //     if (mesh.material !== null)
        //         mesh.material.freeze();
        // }


        // if (!isMobileDevice())
        // scene.debugLayer.show();

        // BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed(),
        //     function () {
        //         console.log("Optimization success");
        //     }, function () {
        //         // FPS target not reached
        //     });


        // var utilLayer = new BABYLON.UtilityLayerRenderer(scene);
        // var overlayBox = BABYLON.Mesh.CreateBox("box", 1, utilLayer.utilityLayerScene);
        // overlayBox.position.z = 0.5
        // overlayBox.position.y = 3.5;
        // // Create a different light for the overlay scene
        // var overlayLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 0, 1), utilLayer.utilityLayerScene);
        // overlayLight.intensity = 0.7;
        // utilLayer.utilityLayerScene.autoClearDepthAndStencil=false

        $("#btnClosePopup").click(() => {
            scene.getAnimationGroupByName("ChanceReturn").play();
            scene.getAnimationGroupByName("StackReturn").play();
        });

        nextTurn();

        engine.hideLoadingUI();
    });

    return scene;
};

window.addEventListener("orientationchange", function() {
    console.log("The orientation of the screen is: " + window.orientation);
    return;

    var vpwidth = "device-width";
    var vlwidth = "device-height";
    var scale = .5;
    var viewport = document.querySelector("meta[name=viewport]");

    switch (window.orientation) {
        case 0: //portrait
            //set the viewport attributes to whatever you want!
            viewport.setAttribute('content', 'width=' + vpwidth + ', initial-scale=' + scale + ', maximum-scale=1.0')
            console.log(viewport.getAttribute("content"))
            break;
        case 90:
        case -90: //landscape
            //set the viewport attributes to whatever you want!
            viewport.setAttribute('content', 'width=' + vlwidth + ', initial-scale=' + scale + ', maximum-scale=1.0')
            break;
        default:
            //set the viewport attributes to whatever you want!
            viewport.setAttribute('content', 'width=' + vpwidth + ', initial-scale=' + scale + ', maximum-scale=1.0')
            break;
    }
});

const scene = createScene();
// createPointerLock(scene);

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function() {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function() {
    engine.resize();
    console.log("Canvas:" + canvas.clientWidth + ":" + canvas.clientHeight)
    console.log("Window:" + window.innerWidth * window.devicePixelRatio + ":" + window.innerHeight * window.devicePixelRatio)
        // console.log()
});