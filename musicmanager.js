class MusicManager {
    constructor(scene) {
        this.scene = scene;
        this.bgMusic = null;
    }

    playBackgroundMusic() {
        if (!this.bgMusic) {
            this.bgMusic = this.scene.sound.add('bgMusic', { loop: true });
            this.bgMusic.play();
        } else if (!this.bgMusic.isPlaying) {
            this.bgMusic.play();
        }
    }

    stopBackgroundMusic() {
        if (this.bgMusic && this.bgMusic.isPlaying) {
            this.bgMusic.stop();
        }
    }
}

export default MusicManager;
