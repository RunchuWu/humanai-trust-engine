"use client";
import { useEffect, useRef, useState } from "react";
import { defaultStudy, preset, resolveStimulus } from "@/lib/research/config";
import { isOpen, isPrediction, type OpenJudgment, type PredictionJudgment, type Profile, type PublicDataset, type SessionView, type StudyRecord } from "@/lib/research/types";
import PreviewDrafts from "./PreviewDrafts";
import DemoControls from "./DemoControls";
import { useDemoProfile } from "./demo-profile";
import CueControls from "./CueControls";
import StimulusView, { AgentHeader } from "./StimulusView";
import JudgmentForm from "./JudgmentForm";
import OpenJudgmentForm, { OpenReflection } from "./OpenJudgmentForm";
import { request } from "./client";
import styles from "./research.module.css";
export default function CombinedExperience({dataset,study,studyId,mode}:{dataset:PublicDataset;study:StudyRecord|null;studyId:string|null;mode:"fixed"|"user_set"}) {
  const [demoRun,setDemoRun]=useState(0);
  const demoViewport=useRef<HTMLElement>(null);
  const linkedDemoProfile=useDemoProfile(dataset.version,!studyId);
  const [demoOverride,setDemoOverride]=useState<Profile|null>(null);
  const demoProfile=demoOverride??linkedDemoProfile??preset("neutral");
  const config=study?.config??defaultStudy(dataset.trials.map(t=>t.id),dataset.version);
  const [session,setSession]=useState<SessionView|null>(null),[setup,setSetup]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(Boolean(studyId)),[loadFailed,setLoadFailed]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(""),[retry,setRetry]=useState<Record<string,unknown>|null>(null),[ack,setAck]=useState("");
  const [consent,setConsent]=useState(false),[comprehension,setComprehension]=useState("");
  const [ratings,setRatings]=useState<Record<string,number>>({}),[exposureRetry,setExposureRetry]=useState(0);
  const lock=useRef(false), startToken=useRef<string|null>(null), paint=useRef(new Map<string,number>()), active=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!studyId)return;let live=true;async function load(){try{
    const response=await fetch(`/api/research/session?studyId=${encodeURIComponent(studyId!)}`,{cache:"no-store"});
    if(response.ok){const data=await response.json();if(live){setSession(data.session);setSetup(data.session.profile);}}
    else if(response.status!==401)throw new Error("Unable to restore this study. Reload to retry.");
  }catch(e){if(live){setError(e instanceof Error?e.message:"Unable to load the study.");setLoadFailed(true);}}finally{if(live)setLoading(false);}}
  void load();return()=>{live=false;};},[studyId]);
  const trial=dataset.trials.find(t=>t.id===session?.order[session.index]);
  const practice=session?.locked?(!session.practiceComplete?dataset.practice:session.index===4&&!session.numericPracticeComplete?dataset.numericPractice:undefined):undefined;
  const inTask=Boolean(session?.locked&&session.practiceComplete&&!practice&&trial&&session.status==="active");
  const key=inTask?`${session!.id}:${session!.index}:${session!.stage}`:"",trialId=trial?.id,stage=session?.stage;
  useEffect(()=>{if(!studyId||!key||!trialId||!stage||stage==="reflection")return;let live=true;
    const at=paint.current.get(key)??Date.now();paint.current.set(key,at);
    request("/api/research/events",{studyId,kind:"shown",trialId,stage,clientShownAt:at}).then(()=>{if(live){setAck(key);setError("");}}).catch(e=>{if(live)setError(e instanceof Error?e.message:"Unable to record this stage.");});return()=>{live=false;};
  },[studyId,key,trialId,stage,exposureRetry]);
  useEffect(()=>{if(inTask)active.current?.querySelector("h2")?.focus();},[inTask,key]);
  async function send(input:Record<string,unknown>){if(lock.current)return;lock.current=true;setBusy(true);setError("");setRetry(null);
    if(input.kind==="start"){startToken.current??=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,"0")).join("");input={...input,requestToken:startToken.current};}
    try{if(studyId){const result=await request<{session:SessionView}>("/api/research/session",{...input,studyId});setSession(result.session);setSetup(result.session.profile);}
    else if(input.kind==="start")setSession({id:"preview",participantId:"preview",studyId:"preview",configVersion:0,workflow:"two-part-v1",mode:"fixed",profile:demoProfile,allowedDimensions:[],locked:true,practiceComplete:false,numericPracticeComplete:false,index:0,stage:"situation",status:"active",order:config.trialOrder,survey:config.survey});
    else if(session){
      if(input.kind==="practice_initial"&&practice){if(isOpen(practice))setSession({...session,openPracticeInitial:input.judgment as OpenJudgment,openPracticeAdvice:practice});else if(isPrediction(practice))setSession({...session,practiceInitial:input.judgment as PredictionJudgment,practiceAdvice:practice});}
      else if(input.kind==="practice"&&practice)setSession({...session,...(isOpen(practice)?{practiceComplete:true}:{numericPracticeComplete:true})});
      else if(input.kind==="initial"&&trial){if(isOpen(trial))setSession({...session,openInitial:input.judgment as OpenJudgment,openAdvice:trial,stage:"recommendation"});else if(isPrediction(trial))setSession({...session,initialJudgment:input.judgment as PredictionJudgment,advice:trial,stage:"recommendation"});}
      else if(input.kind==="decision"&&trial){if(isOpen(trial))setSession({...session,openFinal:input.judgment as OpenJudgment,stage:"reflection"});else setSession({...session,index:session.index+1,stage:"situation",initialJudgment:undefined,advice:undefined});}
      else if(input.kind==="reflection")setSession({...session,index:session.index+1,stage:"situation",openInitial:undefined,openAdvice:undefined,openFinal:undefined});
      else if(input.kind==="survey")setSession({...session,status:"complete"});
    }}catch(e){setError(e instanceof Error?e.message:"Unable to save. Please retry.");setRetry(input);}finally{lock.current=false;setBusy(false);}}
  const profile=studyId?(session?.profile??preset("neutral")):demoProfile,progress=session?.index??0;
  const ready=!studyId||ack===key;
  const completed=session?.status==="complete";
  const practiceFinal=practice&&(isOpen(practice)?Boolean(session?.openPracticeInitial):Boolean(session?.practiceInitial));
  const practiceShown=practice?(isOpen(practice)?session?.openPracticeAdvice??practice:session?.practiceAdvice??practice):null;
  const demoScreen = !session ? "intro" : completed ? "complete" : practice ? `${practice.id}:${practiceFinal}` : `${session.index}:${session.stage}`;
  useEffect(()=>{
    const viewport=demoViewport.current;
    if(studyId||!viewport)return;
    if(getComputedStyle(viewport).overflowY==="visible"){
      window.scrollTo({top:demoScreen==="intro"?0:viewport.getBoundingClientRect().top+window.scrollY,behavior:"instant"});
    }else viewport.scrollTo({top:0,behavior:"instant"});
  },[studyId,demoScreen,demoRun]);
  return <PreviewDrafts key={demoRun} enabled={!studyId}><div className={!studyId?`${styles.participant} ${styles.demoLayout}`:undefined}>
    {!studyId?<DemoControls dataset={dataset} profile={profile} following={!demoOverride} connected={Boolean(linkedDemoProfile)} onSelect={setDemoOverride} onFollow={()=>setDemoOverride(null)} onRestart={()=>{setDemoRun(run=>run+1);setSession(null);setConsent(false);setComprehension("");setRatings({});setError("");setRetry(null);}}/>:null}
    <main ref={demoViewport} data-testid={!studyId?"participant-demo-phone":undefined} className={`${styles.participant} ${!studyId?styles.demoPhone:""} ${profile.presentation.interfaceVersion && profile.presentation.interfaceVersion !== "cards-v1" ? styles.modernParticipant : ""} ${profile.presentation.interfaceVersion === "cards-v3" ? styles.chatParticipant : ""} ${styles[profile.presentation.appearance]}`}>
    <header className={styles.participantHeader}><a href="/task" className={styles.participantBrand}>Everyday judgments & forecasts<span>Human–AI research</span></a><span>{!studyId?"Preview · no data saved":completed?"Complete":`${progress} / 12 tasks`}</span></header>
    {session?<div className={styles.progress} role="progressbar" aria-label="Tasks completed" aria-valuemin={0} aria-valuemax={12} aria-valuenow={progress}><span style={{width:`${progress/12*100}%`}}/></div>:null}
    {loading?<section className={styles.introCard}><h1>Loading your study…</h1></section>:null}
    {!loading&&!loadFailed&&!session?<section className={styles.introCard}><p className={styles.eyebrow}>TWO PARTS · YOUR VIEW FIRST</p><h1>What do you think?</h1><p className={styles.introLead}>Make your own judgment, consider an AI perspective, then respond in your own words or numbers.</p>
      <div className={styles.introFacts}><span><b>4</b>open judgments</span><span><b>8</b>numeric predictions</span><span><b>2</b>practice tasks</span></div>
      <h2>Part 1 · Open judgments</h2><p>Consider four everyday situations about fairness, privacy, responsibility and shared resources. Write your initial view and reasons, select your position and confidence, then consider an AI perspective. Write your final view, which may stay the same or change. There is no single correct answer. After saving, you may briefly reflect on the AI’s reasoning.</p>
      <h2>Part 2 · Numeric predictions</h2><p>Estimate prices, attendance, drink consumption and durations. Save your estimate and confidence before seeing AI advice, then enter your final estimate and confidence. Actual outcomes are not shown between tasks.</p>
      <p>Each part starts with one practice task. There are 12 main tasks and 2 practices in total, followed by 8 experience ratings. The AI messages are fixed, prewritten perspectives and estimates, not a live conversation. You can disagree or propose another approach.</p>
      <div className={styles.consent}><h2>Your participation</h2><p>{studyId?"The study records your written views, positions, estimates, confidence, any optional reflections, response times and interface configuration under a random ID. Please avoid personal information in your responses. You may stop by closing the page; submitted responses remain in the record. This browser can resume your session.":"This demo does not save your responses. Frozen study links record responses under a random ID."}</p><label className={styles.checkbox}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I have read this information and agree to participate.</label></div>
      <fieldset className={styles.comprehension}><legend>What should you do before seeing the AI perspective?</legend>{[["own","Give my own response and confidence first."],["copy","Wait for the AI and copy its view."]].map(([value,label])=><label className={styles.checkbox} key={value}><input type="radio" name="comprehension" value={value} checked={comprehension===value} onChange={()=>setComprehension(value)}/>{label}</label>)}</fieldset>
      <button className={styles.primary} disabled={!consent||comprehension!=="own"||busy} onClick={()=>void send({kind:"start",mode,consent})}>Start Part 1 practice</button>
    </section>:null}
    {session&&!session.locked&&setup?<section className={styles.setup}><div><h1>Set up your assistant.</h1><p>Your settings stay fixed across both parts.</p><CueControls dataset={dataset} profile={setup} allowed={session.allowedDimensions} onChange={(dimension,level)=>setSetup({...setup,levels:{...setup.levels,[dimension]:level}})}/><button className={styles.primary} disabled={busy} onClick={()=>void send({kind:"lock",levels:setup.levels})}>Confirm settings</button></div><section className={styles.stimulus}><AgentHeader dataset={dataset} trial={dataset.practice} profile={setup}/><p>{resolveStimulus(dataset,dataset.practice,setup).welcome}</p></section></section>:null}
    {practice&&practiceShown&&session?<><section className={styles.practiceIntro}><p className={styles.eyebrow}>{isOpen(practice)?"PART 1 OF 2":"PART 1 COMPLETE · PART 2 OF 2"}</p><h1>{isOpen(practice)?"Try an open judgment.":"Now, make numeric predictions."}</h1><p>{isOpen(practice)?"This practice has no correct answer. Explain your view before seeing the AI perspective.":"Next are eight numerical tasks: two each about price, attendance, drink consumption and time. Try a practice estimate first."}</p><p>Practice is not scored. You do not need to agree with AI to continue.</p></section><StimulusView dataset={dataset} trial={practiceShown} profile={profile} initialResponse={isOpen(practice)?session.openPracticeInitial:session.practiceInitial} stage={practiceFinal?"recommendation":"situation"} actions={isOpen(practice)?<OpenJudgmentForm key={`practice:${practice.id}:${practiceFinal}`} trial={practice} phase={practiceFinal?"final":"initial"} initial={session.openPracticeInitial} disabled={busy} onSubmit={judgment=>void send({kind:practiceFinal?"practice":"practice_initial",trialId:practice.id,judgment})}/>:isPrediction(practice)?<JudgmentForm key={`practice:${practice.id}:${practiceFinal}`} trial={practice} phase={practiceFinal?"final":"initial"} initial={session.practiceInitial} disabled={busy} onSubmit={judgment=>void send({kind:practiceFinal?"practice":"practice_initial",trialId:practice.id,judgment})}/>:null}/></>:null}
    {inTask&&trial&&session?<div ref={active} className={styles.activeTrial}><p className={styles.trialCounter}>{isOpen(trial)?`PART 1 · JUDGMENT ${session.index+1} OF 4`:`PART 2 · PREDICTION ${session.index-3} OF 8`} · {session.stage==="situation"?"YOUR INITIAL RESPONSE":session.stage==="reflection"?"REFLECTION":"YOUR FINAL RESPONSE"}</p>
      {session.stage==="reflection"?<OpenReflection key={trial.id} final={session.openFinal} disabled={busy} onSubmit={text=>void send({kind:"reflection",trialId:trial.id,text})}/>:<StimulusView dataset={dataset} trial={isOpen(trial)?session.openAdvice??trial:session.advice??trial} profile={profile} stage={session.stage} initialResponse={isOpen(trial)?session.openInitial:session.initialJudgment} actions={isOpen(trial)?<OpenJudgmentForm key={key} trial={trial} phase={session.stage==="situation"?"initial":"final"} initial={session.openInitial} disabled={busy||!ready} onSubmit={judgment=>void send({kind:session.stage==="situation"?"initial":"decision",trialId:trial.id,judgment,clientDecidedAt:Date.now()})}/>:isPrediction(trial)?<JudgmentForm key={key} trial={trial} phase={session.stage==="situation"?"initial":"final"} initial={session.initialJudgment} disabled={busy||!ready} onSubmit={judgment=>void send({kind:session.stage==="situation"?"initial":"decision",trialId:trial.id,judgment,clientDecidedAt:Date.now()})}/>:null}/>}</div>:null}
    {session?.index===12&&!completed?<section className={styles.survey}><h1>How did the interaction feel?</h1><p>Think about the assistant across both parts. 1 = Strongly disagree · 7 = Strongly agree.</p>{session.survey.map(item=><fieldset key={item.id}><legend>{item.text}</legend><div className={styles.rating}>{[1,2,3,4,5,6,7].map(value=><label key={value}><input type="radio" name={item.id} value={value} checked={ratings[item.id]===value} onChange={()=>setRatings({...ratings,[item.id]:value})}/><span>{value}</span></label>)}</div></fieldset>)}<button className={styles.primary} disabled={busy||session.survey.some(item=>!ratings[item.id])} onClick={()=>void send({kind:"survey",answers:ratings})}>Finish study</button></section>:null}
    {completed?<section className={styles.introCard}><AgentHeader dataset={dataset} trial={dataset.practice} profile={profile}/><h1>Thank you for taking part.</h1><p>{resolveStimulus(dataset,dataset.practice,profile).closing}</p><p>{studyId?"Your responses to both parts and your experience ratings have been saved.":"You have completed the demo. No responses were saved."}</p><h2>About this study</h2><p>The situations, AI perspectives, estimates and numerical comparison outcomes were constructed in advance. The AI can present different reasonable positions. Open judgments have no answer key; numerical estimates can be more or less close to a particular outcome. Changing toward AI does not, by itself, show greater trust or a better judgment.</p></section>:null}
    {error?<div className={styles.error} role="alert"><p>{error}</p>{loadFailed?<button className={styles.secondary} onClick={()=>window.location.reload()}>Reload study</button>:retry?<button className={styles.secondary} disabled={busy} onClick={()=>void send(retry)}>Retry</button>:inTask?<button className={styles.secondary} onClick={()=>setExposureRetry(x=>x+1)}>Retry loading stage</button>:null}</div>:null}
    <footer className={styles.participantFooter}>Human–AI Trust Engine</footer>
  </main></div></PreviewDrafts>;
}
