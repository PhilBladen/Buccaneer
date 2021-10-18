import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import 'babylonjs-loaders';
// import * from 'babylon.gridMaterial.min.js';
import { GridMaterial, WaterMaterial } from 'babylonjs-materials'
import { createPointerLock } from "./pointerLock.js"
import { cosineInterpolate, cosineInterpolateV3D, isMobileDevice, portLocations } from './utils.js';
import { Boat } from './boat.js';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
canvas.onselectstart = function () { return false; }

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

// engine.enterFullscreen(); TODO add user option

console.log(engine.getCaps().maxTextureSize);

let selectedBoat = null;
let camera = null;
let boatMesh = null;
let water = null;
let boats = [];
let chestLid;

let time = 0;

let boatIndex = 0;



const settingsLow = {
    reflections: false,
    reflectionResolution: 512,
    riverReflectionResolution: 64,
    useAntialiasing: true,
    gridTileSize: 1,
}

const settingsMed = {
    reflections: true,
    reflectionResolution: 1024,
    riverReflectionResolution: 128,
    useAntialiasing: false,
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
    settings = settingsLow;

var chestOpen;
var chestClose;

let wasBoatAtPirateIsland = false;
let chestAnimationStartTime = 0;
let createdParticleSystem = false;
const updateGame = function () {
    // console.log("yoo");

    time++;

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
            chestOpen.play();
        }
        else {
            chestClose.play();
            createdParticleSystem = false;
        }
    }
    let chestAnimationProgress = (time - chestAnimationStartTime) / 40;
    if (chestAnimationProgress >= 1) {
        chestAnimationProgress = 1;
    }

    if (boatAtPirateIsland && chestAnimationProgress > 0.3) {
        if (!createdParticleSystem) {
            createdParticleSystem = true;
            // Create a particle system
            const particleSystem = new BABYLON.ParticleSystem("particles", 2000);

            //Texture of each particle
            particleSystem.particleTexture = new BABYLON.Texture("assets/flare.png");

            // Position where the particles are emitted from
            let chestCenter = chestLid.position.clone();
            chestCenter.x -= 1.7;
            chestCenter.z -= 0.8;
            particleSystem.emitter = scene.getMeshByName("ChestEmitPlane");
            particleSystem.start();

            particleSystem.minSize = 0.01;
            particleSystem.maxSize = 0.1;

            particleSystem.maxLifeTime = 2.0;
            // particleSystem.maxLifeTime = 5.0;

            particleSystem.emitRate = 1;
            particleSystem.disposeOnStop = true;

            particleSystem.manualEmitCount = 20;
        }
    }

    let chestAngle = cosineInterpolate(boatAtPirateIsland ? 0 : -1.9, boatAtPirateIsland ? -1.9 : 0, chestAnimationProgress);
    chestLid.setDirection(BABYLON.Axis.Z, 0.0, 0.0, chestAngle);
}

// Add your code here matching the playground format
const createScene = function () {
    engine.displayLoadingUI();

    const scene = new BABYLON.Scene(engine);

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
    }
    else {
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
        true, // Do you want the pipeline to use HDR texture?
        scene, // The scene instance
        [camera] // The list of cameras to be attached to
    );
    if (settings.useAntialiasing)
        pipeline.samples = 16;

    // new BABYLON.FxaaPostProcess("fxaa", 2.0, camera);

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
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                parameter: 'r'
            },
            function () {
                scene.debugLayer.show();
            }
        )
    );

    chestOpen = new BABYLON.Sound("chestopen", "assets/chestopen.wav", scene);
    chestClose = new BABYLON.Sound("chestopen", "assets/chestclose.wav", scene);
    var music = new BABYLON.Sound("water", "assets/water.mp3", scene, function () {
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
        BABYLON.SceneLoader.AppendAsync("assets/AllIslands.gltf"),
        BABYLON.SceneLoader.AppendAsync("assets/Boat.gltf")
    ]).then(function () {
        boatMesh = scene.getMeshByName("Boat");
        // boatMesh.setEnabled(false);

        var sea = scene.getMeshByName("Sea");
        var castle = scene.getMeshByName("Castle");
        var edgeIslands = scene.getMeshByName("Grass");
        let rivers = scene.getMeshByName("Rivers");
        let frame = scene.getMeshByName("Frame");
        let ports = [];
        for (let i = 0; i < 8; i++) {
            ports[i] = scene.getMeshByName("Dock" + i);
        }
        let safes = [];
        for (let i = 0; i < 8; i++) {
            safes[i] = scene.getMeshByName("Safe" + i);
        }
        let gold = scene.getMeshByName("Gold");
        let diamond = scene.getMeshByName("Diamond");
        let ruby = scene.getMeshByName("Ruby");
        chestLid = scene.getNodeByID("ChestLid");
        // let cardMesh = scene.getMeshByName("Card");
        // let sand = scene.getMeshByName("Sand");
        // let needles = scene.getMeshByName("Needles");
        // let splash = scene.getMeshByName("Splash");
        // splash.setEnabled(false);

        // cardMesh.setEnabled(false);
        // cardMesh.actionManager = new BABYLON.ActionManager(scene);
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

        var ground = sea.clone();
        ground.position.y = -0.19;
        ground.material = groundMaterial;
        ground.material.backFaceCulling = false;

        let gridMaterial = new GridMaterial("grid", scene);
        var grid = sea.clone();
        grid.isPickable = false;

        let gridBounds = grid.getBoundingInfo();
        let min = gridBounds.minimum;
        let max = gridBounds.maximum;

        grid.position.y = 0.001;
        // gridMaterial.mainColor = new BABYLON.Color4(1, 0, 0, 0);
        gridMaterial.lineColor = new BABYLON.Color3(1, 1, 1);
        gridMaterial.majorUnitFrequency = 1;
        // gridMaterial.minorUnitVisibility = 1;
        gridMaterial.gridRatio = settings.gridTileSize;// width * 0.25;//2 * 0.81 / 23.125;//0.072;
        // grid.position.x = 0.08;
        // grid.position.z = -0.03;
        // settings.gridOffset.x = grid.position.x = (min.x + max.x) * 0.5;
        // settings.gridOffset.z = grid.position.z = (min.z + max.z) * 0.5;
        console.log(grid.position);
        // gridMaterial.
        gridMaterial.opacity = 0.2;
        grid.material = gridMaterial;

        water = new WaterMaterial("water", scene, new BABYLON.Vector2(settings.reflectionResolution, settings.reflectionResolution));
        water.backFaceCulling = true;
        water.bumpTexture = new BABYLON.Texture("assets/waterbump.png", scene);
        water.windForce = -5;
        water.waveHeight = 0.0;
        water.bumpHeight = 0.1;
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
        water.addToRenderList(edgeIslands);
        water.addToRenderList(castle);
        water.addToRenderList(skybox);
        water.addToRenderList(ground);

        // sea.material = water;
        sea.isPickable = false;

        let waterDiffuseMaterial = new BABYLON.StandardMaterial(scene);
        waterDiffuseMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.4, 0.8);
        waterDiffuseMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        waterDiffuseMaterial.alpha = 0.8;

        if (settings.reflections) {
            sea.material = water;
        }
        else {
            sea.material = waterDiffuseMaterial;
            sea.material.needAlphaTesting = true;
            sea.alphaIndex = 500;
        }




        scene.registerBeforeRender(function () {
            updateGame();
        });

        scene.onPointerMove = function () {
            // TODO
        };


        for (let i = 0; i < 8; i++) {
            // let x, z;
            // do {
            // x = Math.floor(Math.random() * 24) - 12;
            // z = Math.floor(Math.random() * 24) - 12;
            // } while (!isSquareAllowed(x, z));
            let port = portLocations[i];
            boats.push(new Boat(port.x, port.z, scene, settings, boatIndex++));
        }

        let material = new BABYLON.StandardMaterial(scene);
        let grassTexture = new BABYLON.Texture("assets/grasscolors.png", scene);
        // material.diffuseTexture = grassTexture;
        material.diffuseColor = new BABYLON.Color3(69 / 100, 100 / 100, 50 / 100);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        edgeIslands.material = material;
        // edgeIslands.material.specularColor = new BABYLON.Color3(0, 0, 0);


        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        castle.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.9, 0.7);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // sand.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.8);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        rivers.material = material;

        let riverWater = new WaterMaterial("", scene, new BABYLON.Vector2(settings.riverReflectionResolution, settings.riverReflectionResolution));
        riverWater.backFaceCulling = true;
        riverWater.bumpTexture = new BABYLON.Texture("assets/waterbump.png", scene);
        // riverWater.bumpTexture.uScale = riverWater.bumpTexture.vScale = 100;
        riverWater.windForce = -20;
        riverWater.waveHeight = 0.0;
        riverWater.bumpHeight = 0.05;
        riverWater.waveLength = 0.01;
        riverWater.colorBlendFactor = 0.5;
        // water.waterColor = new BABYLON.Color3(0.1, 0.4, 0.8);
        riverWater.waterColor = new BABYLON.Color3(0.1, 0.5, 0.8);
        riverWater.addToRenderList(skybox);
        riverWater.addToRenderList(edgeIslands);
        riverWater.addToRenderList(ground);
        if (settings.reflections) {
            rivers.material = riverWater;
        }
        else {
            rivers.material = waterDiffuseMaterial;
        }

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // edgeIslands.setEnabled(false);
        frame.material = material;
        // frame.setEnabled(false);

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 0.3, 0.2);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        // diamond.material = ruby.material = gold.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 1, 1);
        material.specularColor = new BABYLON.Color3(.8, .8, .8);
        material.alpha = 0.5;
        diamond.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 1, 1);
        material.specularColor = new BABYLON.Color3(.8, .8, .8);
        material.alpha = 0.0;
        scene.getMeshByName("ChestEmitPlane").material = material;

        // ruby.setEnabled(false);

        // showAxis(2);

        let i = 0;

        let portNames = [
            "amsterdam",
            "bombay",
            "bristol",
            "cadiz",
            "genoa",
            "london",
            "marseilles",
            "venice"
        ];
        for (let port of ports) {
            material = new BABYLON.StandardMaterial(scene);
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            let texture = new BABYLON.Texture("assets/docks/" + portNames[i] + "-active.png", scene);
            material.diffuseTexture = texture;
            port.material = material;
            port.material.diffuseTexture.vScale = -1.0;
            i++;
        }
        i = 0;
        for (let safe of safes) {
            material = new BABYLON.StandardMaterial(scene);
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            let texture = new BABYLON.Texture("assets/docks/" + portNames[i] + "-safe-active.png", scene);
            material.diffuseTexture = texture;
            safe.material = material;
            safe.material.diffuseTexture.vScale = -1.0;
            i++;
        }

        let anchor = scene.getMeshByName("Anchor");
        water.addToRenderList(anchor);
        let anchorMaterial = new BABYLON.StandardMaterial(scene);
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

        boatMesh.setEnabled(false);

        // for (let mesh of scene.meshes) {
        //     if (mesh.material !== null)
        //         mesh.material.freeze();
        // }

        engine.hideLoadingUI();
        // scene.debugLayer.show();
    });

    return scene;
};

const scene = createScene();
// createPointerLock(scene);

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});