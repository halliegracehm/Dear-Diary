function useAmbientSound() {
  const ctxRef = useRef(null);
  const nodesRef = useRef([]);

  function stop() {
    nodesRef.current.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
    nodesRef.current = [];
    if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
  }

  function makeNoise(ctx, color = "white") {
    const bufSize = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      if (color === "pink") {
        b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759;
        b2=0.96900*b2+white*0.1538520; b3=0.86650*b3+white*0.3104856;
        b4=0.55000*b4+white*0.5329522; b5=-0.7616*b5-white*0.0168980;
        data[i]=(b0+b1+b2+b3+b4+b5+b6+white*0.5362)/7; b6=white*0.115926;
      } else { data[i] = white; }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    return src;
  }

  function play(sound) {
    stop();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    const nodes = [];

    if (sound.type === "rain") {
      // High-passed pink noise for rain hiss
      const src = makeNoise(ctx, "pink");
      const hi = ctx.createBiquadFilter(); hi.type="highpass"; hi.frequency.value=1200;
      const lo = ctx.createBiquadFilter(); lo.type="lowpass";  lo.frequency.value=6000;
      const g  = ctx.createGain(); g.gain.value = 1.2;
      src.connect(hi); hi.connect(lo); lo.connect(g); g.connect(master);
      src.start(); nodes.push(src);
      // Add random drip pulses
      function drip() {
        if (!ctxRef.current) return;
        const osc = ctx.createOscillator();
        const eg  = ctx.createGain();
        osc.frequency.value = 800 + Math.random()*600;
        osc.type = "sine";
        eg.gain.setValueAtTime(0.08, ctx.currentTime);
        eg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.18);
        osc.connect(eg); eg.connect(master);
        osc.start(); osc.stop(ctx.currentTime+0.18);
        setTimeout(drip, 200 + Math.random()*600);
      }
      drip();
    }

    else if (sound.type === "ocean") {
      // Low rumble + slow amplitude LFO for wave rhythm
      const src = makeNoise(ctx, "pink");
      const lo = ctx.createBiquadFilter(); lo.type="lowpass";  lo.frequency.value=400;
      const mid= ctx.createBiquadFilter(); mid.type="bandpass"; mid.frequency.value=200; mid.Q.value=0.5;
      const g  = ctx.createGain(); g.gain.value=1.4;
      src.connect(lo); lo.connect(mid); mid.connect(g); g.connect(master);
      src.start(); nodes.push(src);
      // LFO for wave swell  ~6s cycle
      const lfo = ctx.createOscillator();
      const lfoG= ctx.createGain(); lfoG.gain.value=0.4;
      lfo.frequency.value = 0.14;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      lfo.start(); nodes.push(lfo);
    }

    else if (sound.type === "forest") {
      // Gentle mid-range filtered noise for breeze
      const src = makeNoise(ctx, "pink");
      const bp = ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=800; bp.Q.value=0.4;
      const g  = ctx.createGain(); g.gain.value=0.7;
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(); nodes.push(src);
      // Bird chirps
      function chirp() {
        if (!ctxRef.current) return;
        const numNotes = 2 + Math.floor(Math.random()*3);
        for (let i=0; i<numNotes; i++) {
          setTimeout(()=>{
            const osc = ctx.createOscillator();
            const eg  = ctx.createGain();
            const baseFreq = 1800 + Math.random()*1400;
            osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(baseFreq*1.3, ctx.currentTime+0.06);
            osc.type = "sine";
            eg.gain.setValueAtTime(0.06, ctx.currentTime);
            eg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.12);
            osc.connect(eg); eg.connect(master);
            osc.start(); osc.stop(ctx.currentTime+0.12);
          }, i*120);
        }
        setTimeout(chirp, 2500 + Math.random()*5000);
      }
      chirp();
    }

    else if (sound.type === "piano") {
      // Soft pad: layered sine tones in a pentatonic chord, slow decay
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.07 / (i+1);
        osc.connect(gain); gain.connect(master);
        osc.start(); nodes.push(osc);
      });
      // Soft arpeggiated plucks every ~4s
      let noteIdx = 0;
      const pluckNotes = [261.63, 329.63, 392.00, 493.88, 523.25];
      function pluck() {
        if (!ctxRef.current) return;
        const osc = ctx.createOscillator();
        const eg  = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = pluckNotes[noteIdx % pluckNotes.length];
        noteIdx++;
        eg.gain.setValueAtTime(0.12, ctx.currentTime);
        eg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+2.5);
        osc.connect(eg); eg.connect(master);
        osc.start(); osc.stop(ctx.currentTime+2.5);
        setTimeout(pluck, 1800 + Math.random()*1200);
      }
      pluck();
    }

    else if (sound.type === "fire") {
      // Deep brown noise for crackle base
      const src = makeNoise(ctx, "white");
      const lo = ctx.createBiquadFilter(); lo.type="lowpass";  lo.frequency.value=180;
      const g  = ctx.createGain(); g.gain.value=1.1;
      src.connect(lo); lo.connect(g); g.connect(master);
      src.start(); nodes.push(src);
      // Mid crackle layer
      const src2 = makeNoise(ctx, "white");
      const bp   = ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=600; bp.Q.value=2;
      const g2   = ctx.createGain(); g2.gain.value=0.3;
      src2.connect(bp); bp.connect(g2); g2.connect(master);
      src2.start(); nodes.push(src2);
      // Random crackle pops
      function pop() {
        if (!ctxRef.current) return;
        const osc = ctx.createOscillator();
        const eg  = ctx.createGain();
        osc.type="sawtooth"; osc.frequency.value=60+Math.random()*80;
        eg.gain.setValueAtTime(0.15, ctx.currentTime);
        eg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.05);
        osc.connect(eg); eg.connect(master);
        osc.start(); osc.stop(ctx.currentTime+0.05);
        setTimeout(pop, 300+Math.random()*1200);
      }
      pop();
    }

    else if (sound.type === "cafe") {
      // Layered band-passed noise for room hum
      [[300,0.8,0.4],[900,1.5,0.2],[2000,2,0.08]].forEach(([freq,Q,gain])=>{
        const src = makeNoise(ctx,"pink");
        const bp  = ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=freq; bp.Q.value=Q;
        const g   = ctx.createGain(); g.gain.value=gain;
        src.connect(bp); bp.connect(g); g.connect(master);
        src.start(); nodes.push(src);
      });
      // Muffled conversational murmur bursts
      function murmur() {
        if (!ctxRef.current) return;
        const src = makeNoise(ctx,"pink");
        const bp  = ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=400+Math.random()*300; bp.Q.value=3;
        const eg  = ctx.createGain();
        const dur = 0.3+Math.random()*0.6;
        eg.gain.setValueAtTime(0, ctx.currentTime);
        eg.gain.linearRampToValueAtTime(0.18, ctx.currentTime+0.05);
        eg.gain.linearRampToValueAtTime(0, ctx.currentTime+dur);
        src.connect(bp); bp.connect(eg); eg.connect(master);
        src.start(); src.stop(ctx.currentTime+dur+0.1);
        setTimeout(murmur, 400+Math.random()*1500);
      }
      murmur();
      // Occasional cup clink
      function clink() {
        if (!ctxRef.current) return;
        if (Math.random()>0.4) {
          const osc=ctx.createOscillator(); const eg=ctx.createGain();
          osc.frequency.value=2200+Math.random()*600; osc.type="sine";
          eg.gain.setValueAtTime(0.06,ctx.currentTime);
          eg.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
          osc.connect(eg); eg.connect(master);
          osc.start(); osc.stop(ctx.currentTime+0.4);
        }
        setTimeout(clink,3000+Math.random()*7000);
      }
      clink();
    }

    nodesRef.current = nodes;
  }

  return { play, stop };
}
