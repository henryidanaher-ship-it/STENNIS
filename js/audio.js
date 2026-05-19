const Audio = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function tone(type, freq, duration, vol = 0.3, freqEnd = null) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd !== null) osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + duration);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }

  function arpeggio(notes, duration, type = 'sine', vol = 0.3) {
    const ac = getCtx();
    notes.forEach((freq, i) => {
      const t = ac.currentTime + i * duration;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration);
    });
  }

  return {
    kick()    { tone('sawtooth', 220, 0.08, 0.25, 80); },
    shoot()   { tone('sawtooth', 300, 0.10, 0.28, 100); },
    bounce()  { tone('sine', 140, 0.12, 0.2, 60); },
    netHit()  { tone('square', 180, 0.15, 0.22); },
    point()   { arpeggio([330, 392, 523], 0.13); },
    win()     { arpeggio([330, 392, 494, 523, 659], 0.13, 'sine', 0.3); },
    lose()    { arpeggio([330, 277, 220], 0.18, 'sine', 0.3); }
  };
})();
