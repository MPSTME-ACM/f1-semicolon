import type { Player } from "../types";

// This class handles all Web Audio API logic
export class AudioEngineManager {
    private audioContext: AudioContext;
    private engineSoundBuffer: AudioBuffer | null = null;
    // Each player now has a source, a main volume control (gain), an LFO for sputtering, and a gain for that LFO
    private playerNodes: Map<string, { source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode, lfoGain: GainNode }> = new Map();

    constructor() {
        this.audioContext = new window.AudioContext();
    }

    public async loadSound(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.engineSoundBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log("Engine sound loaded successfully.");
        } catch (error) {
            console.error("Failed to load engine sound:", error);
        }
    }

    private createPlayerEngine(playerId: string) {
        if (!this.engineSoundBuffer) return;

        // --- Main Volume Node ---
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.connect(this.audioContext.destination);

        // --- Sputter Effect Nodes ---
        const lfo = this.audioContext.createOscillator(); // Low-Frequency Oscillator
        lfo.frequency.setValueAtTime(10, 0); // Sputter at 10hz
        const lfoGain = this.audioContext.createGain(); // Controls intensity of sputter
        lfoGain.gain.setValueAtTime(0, 0); // Start with no sputter
        lfo.connect(lfoGain).connect(gainNode.gain); // LFO modulates the main volume
        lfo.start();

        // --- Audio Source Node ---
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = this.engineSoundBuffer;
        sourceNode.loop = true;
        sourceNode.connect(gainNode);
        sourceNode.start();

        this.playerNodes.set(playerId, { source: sourceNode, gain: gainNode, lfo, lfoGain });
    }

    public updateAllPlayers(players: Player[]) {
        if (!this.engineSoundBuffer) return;
        
        const activePlayerIds = new Set(players.map(p => p.id));

        for (const player of players) {
            if (!this.playerNodes.has(player.id)) {
                this.createPlayerEngine(player.id);
            }
        }

        // The 'updatePlayerState' function now handles both WPM and accuracy
        for (const player of players) {
            this.updatePlayerState(player.id, player.wpm, player.accuracy);
        }
        
        for (const playerId of this.playerNodes.keys()) {
            if (!activePlayerIds.has(playerId)) {
                this.removePlayerEngine(playerId);
            }
        }
    }
    
    // Renamed from updatePlayerWpm to reflect new logic
    private updatePlayerState(playerId: string, wpm: number, accuracy: number) {
    const nodes = this.playerNodes.get(playerId);
    if (!nodes) return;

    // 1. Pitch is still tied to WPM with the doubled effect
    const minPlaybackRate = 0.6;
    const maxPlaybackRate = 4.4;
    const newPlaybackRate = minPlaybackRate + (wpm / 150) * (maxPlaybackRate - minPlaybackRate);

    // 2. Loudness now ONLY depends on WPM
    const baseGain = 0.1 + (wpm / 150) * 0.6;
    const newGain = baseGain; // The accuracy modifier has been removed here

    // 3. Sound Quality (Sputter) is still tied to accuracy
    const sputterIntensity = (1 - (accuracy / 100)) * 0.4;

    // Smoothly apply all changes
    nodes.source.playbackRate.linearRampToValueAtTime(Math.max(minPlaybackRate, newPlaybackRate), this.audioContext.currentTime + 0.1);
    nodes.gain.gain.linearRampToValueAtTime(Math.max(0, newGain), this.audioContext.currentTime + 0.1);
    nodes.lfoGain.gain.linearRampToValueAtTime(sputterIntensity, this.audioContext.currentTime + 0.1);
}
    
    private removePlayerEngine(playerId: string) {
        const nodes = this.playerNodes.get(playerId);
        if (nodes) {
            nodes.source.stop();
            nodes.lfo.stop();
            nodes.source.disconnect();
            nodes.lfo.disconnect();
            nodes.gain.disconnect();
            nodes.lfoGain.disconnect();
            this.playerNodes.delete(playerId);
        }
    }

    public stopAll() {
        this.playerNodes.forEach((nodes) => {
            nodes.source.stop();
            nodes.lfo.stop();
        });
        this.playerNodes.clear();
        this.audioContext.close();
    }
}