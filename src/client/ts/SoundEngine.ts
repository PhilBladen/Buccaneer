import * as BABYLON from "@babylonjs/core";
import { Scene, Sound } from "@babylonjs/core";

class SoundEngine {
    scene : Scene;
    whaleSounds : Sound[];
    timeToNextAmbientSound : number;
    chestOpenSound : Sound;
    chestCloseSound : Sound;
    boatRotateSound : Sound;
    buttonSound : Sound;
    buttonHoverSound : Sound;

    loadSound(fileName : string, volume : number) {
        let sound = new BABYLON.Sound(fileName, "assets/sounds/" + fileName, this.scene, function() {
            sound.setVolume(volume)
        });
        return sound;
    }

    init(scene) {
        this.scene = scene;

        this.whaleSounds = [];
        for (let i = 0; i < 6; i++) {
            this.whaleSounds.push(this.loadSound("whale" + (i + 1) + ".mp3", 0.5));
        }

        this.timeToNextAmbientSound = Date.now() + 5000 + Math.random() * 10000;

        let waterSound = new BABYLON.Sound("water", "assets/sounds/water.mp3", scene, function() {
            waterSound.play();
        }, { loop: true });

        let music = new BABYLON.Sound("music", "assets/sounds/music1.mp3", scene, function() {
            music.setVolume(0.5);
            music.play();
        }, { loop: false });

        this.chestOpenSound = this.loadSound("chestopen.mp3", 1.0);
        this.chestCloseSound = this.loadSound("chestclose.mp3", 1.0);
        this.boatRotateSound = this.loadSound("boat-rotate.mp3", 0.5);
        this.buttonSound = this.loadSound("button.mp3", 0.5);
        this.buttonHoverSound = this.loadSound("buttonhover.mp3", 0.5);
    }

    doAmbientSounds() {
        if (Date.now() >= this.timeToNextAmbientSound) {
            let index = Math.floor(Math.random() * 6);
            this.whaleSounds[index].play();
            this.timeToNextAmbientSound = Date.now() + 5000 + Math.random() * 20000; // + 30000;
        }
    }

    chestOpen() {
        this.chestOpenSound.play();
    }

    chestClose() {
        this.chestCloseSound.play();
    }

    boatRotate() {
        this.boatRotateSound.stop();
        this.boatRotateSound.play();
    }

    buttonClick() {
        this.buttonSound.play();
    }

    buttonHover() {
        this.buttonHoverSound.play();
    }
}

export {
    SoundEngine
}