// Sound: tiny procedural WebAudio SFX — no asset files. The context is created
// lazily (and resumed) on first play, which happens after a user gesture.
export class Sound {
  private ctx: AudioContext | null = null;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  // A short oscillator blip with a pitch sweep and exponential decay.
  private blip(type: OscillatorType, freq: number, dur: number, vol: number, sweep = 0): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + sweep), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  // A decaying noise burst (digging/breaking).
  private noise(dur: number, vol: number): void {
    const ctx = this.ensure();
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.buffer = buf;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  break(): void { this.noise(0.13, 0.3); }
  place(): void { this.blip("square", 300, 0.08, 0.18, 120); }
  hurt(): void { this.blip("sawtooth", 220, 0.18, 0.25, -90); }
  eat(): void { this.blip("triangle", 240, 0.1, 0.2, 50); }
}
