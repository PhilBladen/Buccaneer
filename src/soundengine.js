import * as BABYLON from 'babylonjs';

class SoundEngine {
    loadSound(fileName, volume) {
        let sound = new BABYLON.Sound(fileName, "assets/sounds/" + fileName, this.scene, function() {
            sound.setVolume(volume)
        });
        return sound;
    }

    init(scene) {
        this.scene = scene;

        this.whaleSounds = [];
        for (let i = 0; i < 6; i++) {
            this.whaleSounds.push(this.loadSound("whale" + (i + 1) + ".wav", 0.5));
        }

        this.timeToNextAmbientSound = Date.now() + Math.random() * 10000;

        let waterSound = new BABYLON.Sound("water", "assets/sounds/water.mp3", scene, function() {
            waterSound.play();
        }, { loop: true });

        let music = new BABYLON.Sound("music", "assets/sounds/Heartbeat.mp3", scene, function() {
            music.setVolume(0.5);
            music.play();
        }, { loop: false });

        this.chestOpenSound = this.loadSound("chestopen.wav", 1.0);
        this.chestCloseSound = this.loadSound("chestclose.wav", 1.0);
        this.boatRotateSound = this.loadSound("boat-rotate.wav", 0.5);
    }

    doAmbientSounds() {
        if (Date.now() >= this.timeToNextAmbientSound) {
            let index = Math.floor(Math.random() * 6);
            this.whaleSounds[index].play();
            this.timeToNextAmbientSound = Date.now() + Math.random() * 20000; // + 30000;
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
}

export {
    SoundEngine
}