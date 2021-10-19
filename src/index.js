import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import { GLTFLoaderAnimationStartMode } from 'babylonjs-loaders';
import 'babylonjs-inspector';
// import "@babylonjs/core/Debug/debugLayer";

// import * from 'babylon.gridMaterial.min.js';
import { GridMaterial, WaterMaterial, CustomMaterial } from 'babylonjs-materials'
import { createPointerLock } from "./pointerLock.js"
import { cosineInterpolate, cosineInterpolateV3D, isMobileDevice, portLocations, showAxis } from './utils.js';
import { Boat } from './boat.js';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
canvas.onselectstart = function () { return false; }

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

// engine.enterFullscreen(); TODO add user option

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
    reflectionResolution: 512,
    riverReflectionResolution: 64,
    useAntialiasing: true,
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

var chestOpen;
var chestClose;

let wasBoatAtPirateIsland = false;
let chestAnimationStartTime = 0;
let createdParticleSystem = false;

const updateGame = function () {
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
            scene.getAnimationGroupByName("ChanceReveal").play();
        }
        else {
            chestClose.play();
            scene.getAnimationGroupByName("ChanceReturn").play();
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
const createScene = function () {
    engine.displayLoadingUI();

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
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                parameter: 'r'
            },
            () => scene.debugLayer.show()
        )
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                parameter: 'a'
            },
            () => showAxis(5, scene)
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
        BABYLON.SceneLoader.AppendAsync("assets/AllIslands.glb"),
        BABYLON.SceneLoader.AppendAsync("assets/Boat.gltf")
    ]).then(function () {
        // scene.debugLayer.show();
        // return;

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
            console.log(ports[i]);
        }
        let safes = [];
        for (let i = 0; i < 8; i++) {
            safes[i] = scene.getMeshByName("Safe" + i);
        }
        let gold = scene.getMeshByName("Gold");
        let diamond = scene.getMeshByName("Diamond");
        let ruby = scene.getMeshByName("Ruby");
        chestLid = scene.getNodeByID("ChestLid");

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
            if (mesh instanceof BABYLON.Mesh)
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
        }
        else {
            sea.material = waterDiffuseMaterial;
            // sea.material.needAlphaTesting = true;
            sea.alphaIndex = 500;
        }

        // let meshes = [];
        // for (let m of scene.meshes) {
        // meshes.push(m);
        // }
        // BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);

        scene.registerBeforeRender(function () {
            updateGame();
        });

        scene.onPointerMove = function () {
            // TODO
        };


        for (let i = 0; i < 8; i++) {
            let port = portLocations[i];
            let boat = new Boat(port.x, port.z, scene, settings, boatIndex++);
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
        }
        else {
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
            // if (port instanceof BABYLON.Mesh) {
            //     const mat1 = new CustomMaterial("", scene);
            //     mat1.AddUniform('uvc','vec2');
            //     mat1.diffuseTexture = new BABYLON.Texture("assets/Merged Map_2048.png", scene);
            //     mat1.Fragment_Custom_Diffuse('result = texture2D(test1,vec2(time*0.01,0.)+vDiffuseUV).rgb;');
            //     //mat1.AddUniform("uvc", "vec2");
            //     // mat1.AddAttribute("uvc");
            //     // sphere.material = mat1;
            //     port.material = material;

            //     mat1.Vertex_Definitions('attribute vec2 uvc;');
            //     mat1.Vertex_Before_PositionUpdated('uvUpdated += uvc;');

            //     // port.registerInstancedBuffer("color", 4);
            //     port.registerInstancedBuffer("uvc", 2);
            //     port.instancedBuffers.uvc = new BABYLON.Vector2(0, 0);
            // }
            // else {
            //     if ('instancedBuffers' in port)
            //         port.instancedBuffers.uvc = new BABYLON.Vector2(1, 0);
            // }

            material = new BABYLON.StandardMaterial("", scene);
            material.specularColor = new BABYLON.Color3(0, 0, 0);

            let portTexture = new BABYLON.Texture("assets/Merged Map_2048.png", scene, true);
            portTexture.vScale = -1;
            portTexture.uOffset = (i % 2) * 0.25;
            portTexture.vOffset = -Math.floor(i / 2) * 0.1416;

            material.diffuseTexture = portTexture;
            port.material = material;
            // portTexture.vOffset = 0.01;
            // port.material.diffuseTexture.
            // material.
            i++;
        }
        i = 0;
        for (let safe of safes) {
            material = new BABYLON.StandardMaterial("", scene);
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            let texture = new BABYLON.Texture("assets/docks/" + portNames[i] + "-safe-active.png", scene);
            material.diffuseTexture = texture;
            safe.material = material;
            safe.material.diffuseTexture.vScale = -1.0;
            i++;
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

        engine.hideLoadingUI();
        scene.debugLayer.show();

        // BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.ModerateDegradationAllowed(),
        //     function () {
        //         console.log("Optimization success");
        //     }, function () {
        //         // FPS target not reached
        //     });
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