import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import 'babylonjs-loaders';
// import * from 'babylon.gridMaterial.min.js';
import { GridMaterial, WaterMaterial } from 'babylonjs-materials'
import { createPointerLock } from "./pointerLock.js"
import { isMobileDevice } from './utils.js';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
canvas.onselectstart = function () { return false; }

const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

let selectedBoat = null;
let camera = null;
let boatMesh = null;
let water = null;
let boats = [];

let time = 0;

class Boat {
    constructor(x, z, scene) {
        let self = this;

        const mesh = boatMesh.clone("");
        mesh.setEnabled(true);
        water.addToRenderList(mesh);
        mesh.isPickable = true;
        mesh.position.y = -0.03;

        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnLeftPickTrigger
                },
                function () {
                    self.angle += BABYLON.Tools.ToRadians(45);
                }
            )
        );
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnRightPickTrigger
                },
                function () {
                    self.angle -= BABYLON.Tools.ToRadians(45);
                }
            )
        );

        let CoT = new BABYLON.TransformNode("");
        mesh.setParent(CoT);

        CoT.translate(new BABYLON.Vector3(x, 0, z), settings.gridTileSize, BABYLON.Space.WORLD);
        // CoT.translate(settings.gridOffset, 1, BABYLON.Space.WORLD);
        CoT.translate(new BABYLON.Vector3(0.5, 0, 0.5), settings.gridTileSize, BABYLON.Space.WORLD);
        this.angle = BABYLON.Tools.ToRadians(45 * Math.floor(Math.random() * 8));
        CoT.rotate(BABYLON.Axis.Y, this.angle, BABYLON.Space.WORLD);
        this.CoT = CoT;

        this.splashes = [];
        for (let i = 0; i < 3; i++) {
            let splash = BABYLON.Mesh.CreateGround("", settings.gridTileSize, settings.gridTileSize, 0, scene);
            var splashTexture = new BABYLON.Texture("assets/splash.png", scene);
            splashTexture.hasAlpha = true;
            // groundTexture.vScale = groundTexture.uScale = 4.0;

            var splashMaterial = new BABYLON.StandardMaterial("", scene);
            splashMaterial.diffuseTexture = splashTexture;
            splashMaterial.useAlphaFromDiffuseTexture = true;
            splashMaterial.useSpecularOverAlpha = true;
            // splashMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHATESTANDBLEND;
            splashMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            splash.material = splashMaterial;

            splash.position.x = CoT.position.x;
            splash.position.z = CoT.position.z;

            this.splashes.push(splash);
        }

        // let pbr = new BABYLON.PBRMaterial("pbr", scene);
        // pbr.albedoColor = BABYLON.Color3.FromHexString(colorArray[i]);
        // pbr.reflectivityColor = BABYLON.Color3.FromHexString(colorArray[i]);//new BABYLON.Color3(1.0, 1.0, 1.0);
        // pbr.roughness = 0;
        // pbr.metallic = 0;
        // boat2.material = pbr;

        let mat = new BABYLON.StandardMaterial("boat", scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString(colorArray[Math.floor(Math.random() * colorArray.length)]);
        mat.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
        mat.roughness = 0;
        mesh.material = mat;

        this.offset = Math.random();
    }

    update() {
        for (let i = 0; i < 3; i++) {
            let splash = this.splashes[i];
            let t = time * 0.02 + i * 8;
            splash.scaling.x = splash.scaling.z = 0 + (t % 20) / 10;
            splash.material.alpha = 1 - (t % 20) / 20;

            if (t % 20 == 0)
                splash.rotate(BABYLON.Axis.Y, Math.random() * Math.PI * 2, BABYLON.Space.WORLD);

            t += this.offset * 348;
            let angleDeltaX = Math.sin(t * 0.1) * 0.05;
            let angleDeltaY = Math.sin(t * 0.67) * 0.05;
            let angleDeltaZ = Math.sin(t * 0.315) * 0.05;
            this.CoT.setDirection(BABYLON.Axis.Y, angleDeltaX + this.angle, angleDeltaY + Math.PI / 2, angleDeltaZ);
            // console.log(this.CoT.rotation);
        }
    }
}

const settings = {
    reflectionResolution: 512,
    useAntialiasing: false,
    gridTileSize: 0.81,
    gridOffset: new BABYLON.Vector3(-0.07, 0, 0),
}

const updateGame = function () {
    // console.log("yoo");

    time++;

    for (let boat of boats) {
        // console.log(boat);
        boat.update();
    }

    if (camera.beta > 1.5)
        camera.beta = 1.5;

    camera.target.y = 0;


    if (selectedBoat !== null) {
        selectedBoat.rotate(new BABYLON.Vector3(0, 1, 0), 0.02, BABYLON.Space.WORLD);
    }
}


// show axis
var showAxis = function (size) {
    var makeTextPlane = function (text, color, size) {
        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
        var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
        plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
        plane.material.backFaceCulling = false;
        plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
        plane.material.diffuseTexture = dynamicTexture;
        return plane;
    };

    var axisX = BABYLON.Mesh.CreateLines("axisX", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
        new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
    ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    var xChar = makeTextPlane("X", "red", size / 10);
    xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
    var axisY = BABYLON.Mesh.CreateLines("axisY", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
        new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
    ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    var yChar = makeTextPlane("Y", "green", size / 10);
    yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
    var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
        new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
        new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
    ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
    var zChar = makeTextPlane("Z", "blue", size / 10);
    zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
};

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
            function () { console.log('r button was pressed'); }
        )
    );

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
        boatMesh.setEnabled(false);

        var sea = scene.getMeshByName("Sea");
        var castle = scene.getMeshByName("Castle");
        var edgeIslands = scene.getMeshByName("EdgeIslands");
        let cardMesh = scene.getMeshByName("Card");
        let sand = scene.getMeshByName("Sand");
        let needles = scene.getMeshByName("Needles");
        let splash = scene.getMeshByName("Splash");
        splash.setEnabled(false);

        // cardMesh.setEnabled(false);
        cardMesh.actionManager = new BABYLON.ActionManager(scene);
        cardMesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnPickTrigger
            },
            function () {
                cardMesh.setEnabled(false);
            }
        ));

        // for (let mesh of scene.meshes)
        // mesh.isPickable = false;

        var groundTexture = new BABYLON.Texture("assets/sand.jpg", scene);
        groundTexture.vScale = groundTexture.uScale = 4.0;

        var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = groundTexture;
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        var ground = sea.clone();
        ground.position.y = -0.19;
        ground.material = groundMaterial;
        ground.material.backFaceCulling = false;

        let gridMaterial = new GridMaterial("grid", scene);
        var grid = sea.clone();

        let gridBounds = grid.getBoundingInfo();
        let min = gridBounds.minimum;
        let max = gridBounds.maximum;
        let width = max.x - min.x;
        let depth = max.z - min.z;

        console.log("Min: " + min);
        console.log("Max: " + max);

        grid.position.y = 0.001;
        // gridMaterial.mainColor = new BABYLON.Color4(1, 0, 0, 0);
        gridMaterial.lineColor = new BABYLON.Color3(1, 1, 1);
        gridMaterial.majorUnitFrequency = 1;
        // gridMaterial.minorUnitVisibility = 1;
        gridMaterial.gridRatio = 0.81;// width * 0.25;//2 * 0.81 / 23.125;//0.072;
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
        water.addToRenderList(skybox);
        water.addToRenderList(ground);
        water.addToRenderList(needles);
        sea.material = water;

        water.addToRenderList(edgeIslands);
        water.addToRenderList(castle);

        let matWhite = new BABYLON.StandardMaterial(scene);
        matWhite.diffuseColor = new BABYLON.Color3(1, 0, 0);
        matWhite.specularColor = new BABYLON.Color3(0, 0, 0);
        matWhite.alpha = 0.1;
        let selectionSquare = BABYLON.Mesh.CreateGround("square2", settings.gridTileSize, settings.gridTileSize, 0, scene);
        // let selectionSquare = BABYLON.Mesh.CreateGround("square2", 1, 1, 0, scene);
        selectionSquare.material = matWhite;
        selectionSquare.position.y = 0;
        selectionSquare.position.x = settings.gridTileSize * 4.5;// - settings.gridOffset.x;
        selectionSquare.position.z = settings.gridTileSize * 4.5;// + settings.gridOffset.z;

        scene.registerBeforeRender(function () {
            updateGame();
        });

        scene.onPointerMove = function () {
            // TODO
        };

        
        for (let i = 0; i < 8; i++) {
            boats.push(new Boat(Math.floor(Math.random() * 24) - 12, Math.floor(Math.random() * 24) - 12, scene));
        }
        
        let material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(69 / 100, 100 / 100, 50 / 100);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        edgeIslands.material = material;


        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        castle.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1, 0.9, 0.7);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        sand.material = material;

        // showAxis(5);

        engine.hideLoadingUI();
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