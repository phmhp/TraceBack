let audio: AudioContext | undefined
export function sound(kind: 'tap' | 'link' | 'success' | 'oops' | 'start' | 'gear' | 'crash', volume: number) {
  if (volume <= 0) return
  try {
    audio ??= new AudioContext()
    void audio.resume()
    const notes = kind === 'success' ? [523,659,784,1046] : kind === 'oops' ? [330,247] : kind === 'link' ? [660,880] : kind === 'start' ? [110,165,220,440] : kind === 'gear' ? [180,260] : kind === 'crash' ? [130,80,55] : [600]
    notes.forEach((freq, i) => {
      const oscillator = audio!.createOscillator(), gain = audio!.createGain(), start = audio!.currentTime + i * .09
      oscillator.type = kind === 'crash' ? 'triangle' : 'sine'; oscillator.frequency.value = freq
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume * .12, start + .008); gain.gain.exponentialRampToValueAtTime(.001, start + .16)
      oscillator.connect(gain); gain.connect(audio!.destination); oscillator.start(start); oscillator.stop(start + .18)
    })
  } catch { /* Audio is optional; blocked audio must not interrupt a lesson. */ }
}

/** Quiet synthesized EV inverter/motor feedback, following actual telemetry. */
export function motorSound(volume: number) {
  let oscillator: OscillatorNode | undefined, gain: GainNode | undefined
  try {
    if (volume > 0) {
      audio ??= new AudioContext(); void audio.resume()
      oscillator = audio.createOscillator(); gain = audio.createGain()
      oscillator.type = 'sine'; oscillator.frequency.value = 90; gain.gain.value = 0
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start()
    }
  } catch { /* Muted/unsupported audio never blocks driving. */ }
  return {
    update(enabled: boolean, speed: number, accelerator: number) {
      if (!audio || !gain || !oscillator) return
      oscillator.frequency.setTargetAtTime(90 + Math.min(120, Math.abs(speed)) * 5 + accelerator * 85, audio.currentTime, .1)
      gain.gain.setTargetAtTime(enabled ? volume * (.012 + accelerator * .025) : 0, audio.currentTime, .07)
    },
    stop() { try { oscillator?.stop(); oscillator?.disconnect(); gain?.disconnect() } catch { /* Already disposed. */ } },
  }
}
