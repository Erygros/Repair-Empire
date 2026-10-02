"use client";
import { useEffect, useRef } from "react";
import type { AudioSettings } from "@/game/audio/prototype-audio";
import { createWorkshopAmbience } from "@/game/audio/workshop-ambience";

export function useWorkshopAmbience(active:boolean,settings:AudioSettings) {
  const current=useRef(settings);
  const controller=useRef<ReturnType<typeof createWorkshopAmbience>|null>(null);
  useEffect(()=>{current.current=settings;controller.current?.update(settings);},[settings]);
  useEffect(()=>{
    if(!active||settings.muted||!window.AudioContext)return;
    const stop=()=>{controller.current?.dispose();controller.current=null;};
    const start=()=>{
      if(document.visibilityState!=="visible"){stop();return;}
      if(!controller.current){
        const context=new AudioContext();
        try{controller.current=createWorkshopAmbience(context,current.current);}catch{void context.close().catch(()=>{});return;}
      }
      controller.current.resume();
    };
    start();document.addEventListener("visibilitychange",start);window.addEventListener("pointerdown",start);window.addEventListener("keydown",start);
    return()=>{document.removeEventListener("visibilitychange",start);window.removeEventListener("pointerdown",start);window.removeEventListener("keydown",start);stop();};
  },[active,settings.muted]);
}
