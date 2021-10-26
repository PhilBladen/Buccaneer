import { Mesh } from "@babylonjs/core";

class AssetManager {
    assets : Mesh[];
    barrel : Mesh;
    gold : Mesh;
    ruby : Mesh;

    load(scene) {
        let container = scene.getNodeByName("Assets");

        this.assets = [];
        for (let child of container.getChildren()) {
            if (child.name == "Barrel") {
                this.barrel = child;
            }
            if (child.name == "Gold") {
                this.gold = child;
            }
            if (child.name == "Ruby") {
                this.ruby = child;
                this.ruby.alphaIndex = 10000;
            }
        }

        container.setEnabled(false);

        console.log(this);
    }

    getRubyInstance() {
        return this.ruby.createInstance("Instance");
    }

    getGoldInstance() {
        return this.gold.createInstance("Instance");
    }

    getBarrelInstance() {
        let inst = this.barrel.clone();
        inst.setEnabled(true);
        for (let child of inst.getChildren()) {
            child.setEnabled(true);
        }
        return inst;
    }
}

export {
    AssetManager
}