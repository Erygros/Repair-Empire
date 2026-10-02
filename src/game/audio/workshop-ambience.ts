import type { AudioSettings } from "./prototype-audio";

export function getWorkshopAmbienceVolume(settings:AudioSettings, visible:boolean) {
  return settings.muted||!visible ? 0 : Math.min(1,Math.max(0,settings.master)) * Math.min(1,Math.max(0,settings.ambience)) * .16;
}

/** Owns its sources and context; disposal is immediate when leaving the room. */
export function createWorkshopAmbience(context:AudioContext,settings:AudioSettings) {
  const output=context.createGain(),air=context.createBiquadFilter(),airGain=context.createGain();
  output.gain.value=getWorkshopAmbienceVolume(settings,true);output.connect(context.destination);
  air.type="lowpass";air.frequency.value=650;air.Q.value=.3;airGain.gain.value=.6;
  const buffer=context.createBuffer(1,context.sampleRate*3,context.sampleRate),samples=buffer.getChannelData(0);
  let last=0;
  for(let i=0;i<samples.length;i++){last=(last+(Math.random()*2-1)*.035)/1.035;samples[i]=last*4;}
  const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;noise.connect(air).connect(airGain).connect(output);noise.start();
  const fan=context.createOscillator(),fanGain=context.createGain();fan.type="sine";fan.frequency.value=92;fanGain.gain.value=.12;fan.connect(fanGain).connect(output);fan.start();
  const motor=context.createOscillator(),motorGain=context.createGain();motor.type="triangle";motor.frequency.value=138;motorGain.gain.value=.025;motor.connect(motorGain).connect(output);motor.start();
  const pulses=new Set<OscillatorNode>();
  let disposed=false;
  const tap=()=>{
    if(disposed||context.state!=="running")return;
    const hammer=context.createOscillator(),gain=context.createGain();hammer.type="triangle";hammer.frequency.setValueAtTime(1050,context.currentTime);hammer.frequency.exponentialRampToValueAtTime(340,context.currentTime+.07);
    gain.gain.setValueAtTime(.1,context.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.12);hammer.connect(gain).connect(output);pulses.add(hammer);
    hammer.onended=()=>{pulses.delete(hammer);hammer.disconnect();gain.disconnect();};hammer.start();hammer.stop(context.currentTime+.13);
  };
  const timer=setInterval(tap,5800);
  return {
    update(next:AudioSettings){if(!disposed)output.gain.setTargetAtTime(getWorkshopAmbienceVolume(next,true),context.currentTime,.08);},
    resume(){if(!disposed&&context.state==="suspended")void context.resume().catch(()=>{});},
    dispose(){
      if(disposed)return;disposed=true;clearInterval(timer);output.gain.value=0;
      for(const source of [noise,fan,motor,...pulses]){try{source.stop();}catch{}source.disconnect();}
      for(const node of [air,airGain,fanGain,motorGain,output])node.disconnect();
      void context.close().catch(()=>{});
    },
  };
}
