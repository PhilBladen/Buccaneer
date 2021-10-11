import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import 'babylonjs-loaders';

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

// Add your code here matching the playground format
const createScene = function () {

    const scene = new BABYLON.Scene(engine);

    // BABYLON.SceneLoader.ImportMesh("", "/assets/", "AllIslands.gltf");
    // BABYLON.SceneLoader.ImportMesh("", "/assets/", "Boat.gltf");

    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 100;
    camera.attachControl(canvas, true);
    // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));
    const ambientLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.5;

    let light = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(1, -1, -1), scene);
    light.position = new BABYLON.Vector3(-25, 10, -1);
    light.intensity = 0.5;

    var pipeline = new BABYLON.DefaultRenderingPipeline(
        "defaultPipeline", // The name of the pipeline
        true, // Do you want the pipeline to use HDR texture?
        scene, // The scene instance
        [camera] // The list of cameras to be attached to
    );
    pipeline.samples = 16;

    engine.displayLoadingUI();

    Promise.all([
        BABYLON.SceneLoader.AppendAsync("/assets/AllIslands.gltf"),
        BABYLON.SceneLoader.AppendAsync("/assets/Boat.gltf")
    ]).then(function () {
        var boat = scene.getMeshByName("Boat");
        var sea = scene.getMeshByName("Sea");
        var castle = scene.getMeshByName("group_0.004");
        var edgeIslands = scene.getMeshByName("EdgeIslands");

        // console.log(edgeIslands);

        // treasureIsland.setEnabled(false);

        var shadowGenerator = new BABYLON.ShadowGenerator(4096, light);
        shadowGenerator.getShadowMap().renderList.push(boat);
        shadowGenerator.getShadowMap().renderList.push(castle);
        shadowGenerator.getShadowMap().renderList.push(edgeIslands);
        shadowGenerator.useExponentialShadowMap = true;
        shadowGenerator.useBlurExponentialShadowMap = true;
        // shadowGenerator.usePoissonSampling = true;
        sea.receiveShadows = true;
        // castle.receiveShadows = true;
        // edgeIslands.receiveShadows = true;
        // sea.showBoundingBox = true;

        var spinnerPivotParent = new BABYLON.TransformNode("spinnerPivotParent");
        spinnerPivotParent.translate(new BABYLON.Vector3(0, 0, 3), 1, BABYLON.Space.LOCAL);
        boat.setParent(spinnerPivotParent);

        BABYLON.Animation.CreateAndStartAnimation("spinnerRotation", spinnerPivotParent, "rotation.y", 30, 120, BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(360), 1);

        var material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.8, 1.0);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        sea.material = material;

        // var waterMaterial = new BABYLON.WaterMaterial("water_material", scene);
        // waterMaterial.windForce = 45; // Represents the wind force applied on the water surface
        // waterMaterial.waveHeight = 1.3; // Represents the height of the waves
        // waterMaterial.bumpHeight = 0.3; // According to the bump map, represents the pertubation of reflection and refraction
        // waterMaterial.windDirection = new BABYLON.Vector2(1.0, 1.0); // The wind direction on the water surface (on width and height)
        // waterMaterial.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6); // Represents the water color mixed with the reflected and refracted world
        // waterMaterial.colorBlendFactor = 2.0; // Factor to determine how the water color is blended with the reflected and refracted world
        // waterMaterial.waveLength = 0.1; // The lenght of waves. With smaller values, more waves are generated
        // sea.material = waterMaterial;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(1.0, 0.0, 0.0);
        material.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
        boat.material = material;

        material = new BABYLON.StandardMaterial(scene);
        material.diffuseColor = new BABYLON.Color3(69 / 100, 100 / 100, 50 / 100);
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        edgeIslands.material = material;

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

        showAxis(5);

        engine.hideLoadingUI();
    });

    return scene;
};

const scene = createScene(); //Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});