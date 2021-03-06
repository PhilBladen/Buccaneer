import { Color3, Mesh, PBRMaterial, Scene, StandardMaterial } from "@babylonjs/core";

class AssetManager {
    scene: Scene;

    assets : Mesh[];
    barrel : Mesh;
    gold : Mesh;
    diamond : Mesh;
    ruby : Mesh;
    pearl : Mesh;

    load(scene: Scene) {
        this.scene = scene;

        let container = scene.getNodeByName("Assets");

        this.assets = [];
        for (let child of container.getChildren()) {
            if (child.name == "Barrel") {
                this.barrel = <Mesh> child;
            }
            if (child.name == "Gold") {
                this.gold = <Mesh> child;
            }
            if (child.name == "Ruby") {
                this.ruby = <Mesh> child;
                this.ruby.alphaIndex = 10000;
            }
            if (child.name == "Pearl") {
                this.pearl = <Mesh> child;
                let mat = <PBRMaterial> this.pearl.material;
                mat.specularIntensity = 10;
            }
        }

        // let material = new StandardMaterial("", this.scene);
        // material.specularColor = new Color3(1, 1, 1);
        // material.specularPower = 10;
        // material.diffuseColor = new Color3(0.5, 0.0, 0);//new Color3(0.1, 0.1, 0.1);/
        // material.emissiveColor = new Color3(0.1, 0.0, 0);//new Color3(0.5, 0.5, 0.5);
        // material.alpha = 0.9;
        // material.backFaceCulling = true;
        // this.ruby.material = material;

        
        let material = new PBRMaterial("", this.scene);
        // material.spec = new Color3(1, 1, 1);
        // material.specularPower = 0.1;
        // material.useSpecularOverAlpha = true;
        // material.specularIntensity = 0.5;
        material.albedoColor = new Color3(0.1, 0, 0);//new Color3(0.5, 0, 0);
        material.emissiveColor = new Color3(0.1, 0, 0);
        material.backFaceCulling = true;
        // material.alpha = 0.9;
        material.metallic = 0.0;
        material.roughness = 0; 
        material.indexOfRefraction = 2.4;
        // material.transparencyMode = PBRMaterial.MATERIAL_ALPHATESTANDBLEND;
        // material.refractionTexture = scene.environmentTexture;
        // material.subSurface.isRefractionEnabled = true;
        this.ruby.material = material;

        this.diamond = this.ruby.clone("Diamond");
        this.diamond.material = material.clone("");
        (<PBRMaterial>this.diamond.material).albedoColor = new Color3(1, 1, 1);
        (<PBRMaterial>this.diamond.material).emissiveColor = new Color3(0.1, 0.1, 0.1);
        (<PBRMaterial>this.diamond.material).alpha = 0.9;
        // (<PBRMaterial>this.diamond.material).indexOfRefraction = 2.4;
        (<PBRMaterial>this.diamond.material).transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;

        container.setEnabled(false);
    }

    getRubyInstance() {
        // let inst = this.ruby.clone();
        // inst.setEnabled(true);
        // for (let child of inst.getChildren()) {
        //     child.setEnabled(true);
        // }

        

        
        let inst = this.ruby.createInstance("Ruby instance");
        return inst;
        // return this.ruby.createInstance("Instance");
    }

    getDiamondInstance() {
        // let inst = this.ruby.clone();
        // inst.setEnabled(true);
        // for (let child of inst.getChildren()) {
        //     child.setEnabled(true);
        // }

        

        
        let inst = this.diamond.createInstance("Diamond instance");
        return inst;
        // return this.ruby.createInstance("Instance");
    }

    getGoldInstance() {
        // let inst = this.gold.clone();
        // inst.setEnabled(true);
        // for (let child of inst.getChildren()) {
        //     child.setEnabled(true);
        // }
        // return inst;
        return this.gold.createInstance("Gold instance");
    }

    getBarrelInstance() {
        let inst = this.barrel.clone("Barrel clone");
        inst.setEnabled(true);
        for (let child of inst.getChildren()) {
            child.setEnabled(true);
        }
        return inst;
    }

    getPearlInstance() {
        return this.pearl.createInstance("Peal instance");
    }
}

export {
    AssetManager
}