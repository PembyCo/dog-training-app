// Create clicker sound using Web Audio API (since we can't include an audio file directly)
function createClickerSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create a more realistic clicker sound
    const clickerSound = () => {
      // Create the click sound (two quick oscillators with different characteristics)
      const makeClick = (type, freq, attack, release, gain) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = type;
        osc.frequency.value = freq;
        
        const now = audioCtx.currentTime;
        
        // Very quick attack and release for a sharp click
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(gain, now + attack);
        gainNode.gain.linearRampToValueAtTime(0, now + attack + release);
        
        osc.start(now);
        osc.stop(now + attack + release + 0.01);
      };
      
      // First part of the click - metallic "tick" sound
      makeClick('square', 3500, 0.001, 0.02, 0.15);
      
      // Second part of the click - slightly lower "tock" sound that follows immediately
      setTimeout(() => {
        makeClick('sine', 2200, 0.001, 0.03, 0.2);
      }, 10);
    };
    
    return clickerSound;
  } catch (error) {
    console.error("Web Audio API not supported:", error);
    return () => console.log("Clicker sound not available");
  }
}

window.clickerSound = createClickerSound(); 