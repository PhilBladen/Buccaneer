import { Color3, InstancedMesh, Mesh, PBRMaterial, Scene, StandardMaterial, Texture, Vector2, Vector3, VertexBuffer, VertexData } from "@babylonjs/core";
import { GridMaterial, WaterMaterial } from "@babylonjs/materials";
import { Buccaneer } from "./index";

class Terrain {
    constructor() {

    }

    mergeMeshes(newMeshName: string, meshes: Mesh[]|InstancedMesh[], scene: Scene) {
        let newMesh = new Mesh(newMeshName, scene);

        let vertexData = new VertexData();

        let positions = [];
        let normals = [];
        let indices = [];
        let uvs = [];

        let pureMeshes: Mesh[] = [];
        let instancedMeshes: InstancedMesh[] = [];

        for (let mesh of meshes) {
            if (mesh instanceof InstancedMesh) {
                instancedMeshes.push(mesh);
            } else {
                pureMeshes.push(mesh);
            }
        }

        let orderedMeshes = [];
        for (let instancedMesh of instancedMeshes) {
            orderedMeshes.push(instancedMesh);
        }
        for (let pureMesh of pureMeshes) {
            orderedMeshes.push(pureMesh);
        }

        let indexOffset = 0;
        for (let mesh of orderedMeshes) {
            let worldMatrix = mesh.getWorldMatrix();

            let meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind);
            if (meshPositions == null) {// TODO investigate
                continue;
            }

            let meshIndices = mesh.getIndices();
            let meshNormals = mesh.getVerticesData(VertexBuffer.NormalKind);
            let meshUVs = mesh.getVerticesData(VertexBuffer.UVKind);

            
            for (let f of meshIndices) {
                indices.push(f + indexOffset);
            }

            if (meshUVs != null) {
                for (let uv of meshUVs) {
                    uvs.push(uv);
                }
            } else {
                for (let i = 0; i < meshPositions.length / 3; i += 1) {
                    uvs.push(0);
                    uvs.push(0);
                }
            }
    
            for (let ite = 0; ite != meshPositions.length; ite += 3) {
                let vertex = Vector3.TransformCoordinates(new Vector3(meshPositions[ite], meshPositions[ite + 1], meshPositions[ite + 2]), worldMatrix);
                positions.push(vertex.x);
                positions.push(vertex.y);
                positions.push(vertex.z);
            }

            indexOffset = positions.length / 3;
            
            for (let ite = 0; ite != meshNormals.length; ite += 3) {
                let v = new Vector3(meshNormals[ite], meshNormals[ite + 1], meshNormals[ite + 2]);
                let vertex = Vector3.TransformNormal(v, worldMatrix);
                vertex.normalize();
                normals.push(vertex.x);
                normals.push(vertex.y);
                normals.push(vertex.z);
            }
            
            // VertexData.ComputeNormals(meshPositions, meshIndices, meshNormals);
            // for (let normal of meshNormals) {
            //     normals.push(normal);
            // }

            mesh.dispose();
        }

        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        vertexData.applyToMesh(newMesh);

        return newMesh;
    };

    loadTerrain(buccaneer: Buccaneer) {
        let scene = buccaneer.scene;

        var sea = scene.getMeshByName("Sea");
        var castle = scene.getMeshByName("Castle");
        var edgeIslands = scene.getMeshByName("Grass");
        let rivers = scene.getMeshByName("Rivers");
        let frame = scene.getMeshByName("Frame");
        let gold = scene.getMeshByName("Gold");
        let diamond = scene.getMeshByName("Diamond");
        let ruby = scene.getMeshByName("Ruby");

        let terrainTexture = new Texture("assets/Merged Map_2048.png", scene, true, false);
        let terrainMaterial = new PBRMaterial("Terrain material", scene);
        terrainMaterial.metallic = 0.0;
        terrainMaterial.albedoTexture = terrainTexture;
        terrainMaterial.backFaceCulling = true;

        // let terrainMaterial = new StandardMaterial("Terrain material", scene);
        // terrainMaterial.diffuseTexture = terrainTexture;
        // terrainMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        // terrainMaterial.backFaceCulling = true;
        // terrainMaterial.transparencyMode = StandardMaterial.MATERIAL_ALPHATEST;

        let cardTexture = new Texture("assets/Cards_MergedMap_1024.png", scene, true, false);
        let cardMaterial = new StandardMaterial("Card material", scene);
        cardMaterial.diffuseTexture = cardTexture;
        cardMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        scene.getMeshByName("Face").material = cardMaterial;


        var groundTexture = new Texture("assets/sand.jpg", scene);
        groundTexture.vScale = groundTexture.uScale = 4.0;
        var groundMaterial = new StandardMaterial("Ground material", scene);
        groundMaterial.diffuseTexture = groundTexture;
        groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        var ground = sea.clone("Ground", null);
        ground.position.y = -0.19;
        ground.material = groundMaterial;

        let gridMaterial = new GridMaterial("Grid", scene);
        var grid = sea.clone("Grid", null);
        grid.isPickable = false;

        grid.position.y = 0.001;
        gridMaterial.lineColor = new Color3(1, 1, 1);
        gridMaterial.majorUnitFrequency = 1;
        gridMaterial.gridRatio = buccaneer.settings.gridTileSize;
        gridMaterial.opacity = 0.2;
        grid.material = gridMaterial;

        let water = new WaterMaterial("Water", scene, new Vector2(buccaneer.settings.reflectionResolution, buccaneer.settings.reflectionResolution));
        water.backFaceCulling = true;
        water.bumpTexture = new Texture("assets/waterbump.png", scene);
        water.windForce = -5;
        water.waveHeight = 0.0;
        water.bumpHeight = 0.05;
        water.waveLength = 0.2;
        water.colorBlendFactor = 0.5;
        water.waterColor = new Color3(0.1, 0.5, 0.8);
        buccaneer.water = water;

        for (let mesh of scene.meshes) {
            mesh.isPickable = false;
        }

        // Water reflections:
        // water.addToRenderList(skybox);
        water.addToRenderList(ground);

        let terrainParent = scene.getNodeByName("TerrainParent");
        let terrainMeshes = [];
        for (let mesh of terrainParent.getChildren(undefined, false)) {
            if (mesh instanceof Mesh || mesh instanceof InstancedMesh) {
                terrainMeshes.push(mesh);
            }
        }

        let terrainMesh = this.mergeMeshes("Terrain", terrainMeshes, scene);
        terrainMesh.isPickable = false;
        terrainMesh.material = terrainMaterial;
        // terrainMaterial.freeze();
        // scene.onAfterRenderObservable.add(() => {
            // scene.onAfterRenderObservable.clear();
            // terrainMaterial.freeze();
            // console.log("Frozen");
        // });
        water.addToRenderList(terrainMesh);

        // for (let mesh of terrainMeshes) {
        //     if (mesh instanceof Mesh || mesh instanceof InstancedMesh) {
        //         water.addToRenderList(mesh);
        //     }
        //     if (mesh instanceof Mesh)
        //         mesh.material = terrainMaterial;
        // }

        // sea.material = water;
        sea.isPickable = false;

        let waterDiffuseMaterial = new StandardMaterial("", scene);
        waterDiffuseMaterial.diffuseColor = new Color3(0.1, 0.4, 0.8);
        waterDiffuseMaterial.specularColor = new Color3(0.8, 0.8, 0.8);
        waterDiffuseMaterial.alpha = 0.8;

        if (buccaneer.settings.reflections) {
            sea.material = water;
        } else {
            sea.material = waterDiffuseMaterial;
            // sea.material.needAlphaTesting = true;
            sea.alphaIndex = 500;
        }

        let material;

        // let material = new StandardMaterial("", scene);
        // let grassTexture = new Texture("assets/grasscolors.png", scene);
        // // material.diffuseTexture = grassTexture;
        // material.diffuseColor = new Color3(69 / 100, 100 / 100, 50 / 100);
        // material.specularColor = new Color3(0, 0, 0);
        // edgeIslands.material = material;
        // // edgeIslands.material.specularColor = new Color3(0, 0, 0);


        // material = new StandardMaterial("Castle", scene);
        // material.diffuseColor = new Color3(1, 0.8, 0.6);
        // material.specularColor = new Color3(0, 0, 0);
        // castle.material = material;

        // material = new StandardMaterial("Sand", scene);
        // material.diffuseColor = new Color3(1, 0.9, 0.7);
        // material.specularColor = new Color3(0, 0, 0);
        // sand.material = material;

        material = new StandardMaterial("River", scene);
        material.diffuseColor = new Color3(0.1, 0.6, 0.8);
        material.specularColor = new Color3(0, 0, 0);
        rivers.material = material;

        if (buccaneer.settings.reflections) {
            rivers.material = water;
        } else {
            rivers.material = waterDiffuseMaterial;
        }

        material = new StandardMaterial("Frame", scene);
        material.diffuseColor = new Color3(0.4, 0.4, 0.4);
        material.specularColor = new Color3(0, 0, 0);
        // edgeIslands.setEnabled(false);
        frame.material = material;
        // frame.setEnabled(false);

        // material = new StandardMaterial("Diamond", scene);
        // material.diffuseColor = new Color3(1.0, 1, 1);
        // material.specularColor = new Color3(.8, .8, .8);
        // material.alpha = 0.5;
        // diamond.material = material;

        material = new StandardMaterial("", scene);
        material.diffuseColor = new Color3(1.0, 1, 1);
        material.specularColor = new Color3(.8, .8, .8);
        material.alpha = 0.0;
        scene.getMeshByName("ChestEmitPlane").setEnabled(false);// = material;

        let anchor = scene.getMeshByName("Anchor");
        water.addToRenderList(anchor);
        let anchorMaterial = new StandardMaterial("", scene);
        anchorMaterial.diffuseTexture = new Texture("assets/Anchor_Plain.png", scene);
        anchorMaterial.diffuseTexture.hasAlpha = true;
        anchorMaterial.useAlphaFromDiffuseTexture = true;
        anchorMaterial.specularColor = new Color3(0, 0, 0);
        anchor.material = anchorMaterial;
        anchor.alphaIndex = 100;
    }
}

export {
    Terrain
}