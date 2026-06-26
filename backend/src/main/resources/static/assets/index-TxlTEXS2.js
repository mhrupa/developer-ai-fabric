(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))o(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();async function p(t,e={}){const n=await fetch(t,{headers:{"content-type":"application/json",...e.headers||{}},...e});if(!n.ok){const o=await n.text();throw new Error(o||`Request failed: ${n.status}`)}return n.json()}async function x(){return p("/api/v1/health")}async function q(){return(await p("/api/v1/agents")).agents||[]}async function N(){return(await p("/api/v1/workflows")).workflows||[]}async function I(){return(await p("/api/v1/runs")).runs||[]}async function C(t){return p("/api/v1/runs",{method:"POST",body:JSON.stringify(t)})}async function A(t){return p(`/api/v1/runs/${t}`)}async function M(t){return p("/api/v1/kb/search",{method:"POST",body:JSON.stringify({query:t})})}function R(){return{viewButtons:document.querySelectorAll("[data-view-target]"),views:document.querySelectorAll(".app-view"),healthStatus:document.querySelector("#health-status"),statusDot:document.querySelector(".status-dot"),agentCount:document.querySelector("#agent-count"),workflowCount:document.querySelector("#workflow-count"),runCount:document.querySelector("#run-count"),agentGrid:document.querySelector("#agent-grid"),workflowMap:document.querySelector("#workflow-map"),nodeInspector:document.querySelector("#node-inspector"),resetLayoutButton:document.querySelector("#reset-layout-button"),runsList:document.querySelector("#runs-list"),runForm:document.querySelector("#run-form"),refreshButton:document.querySelector("#refresh-button"),runDetail:document.querySelector("#run-detail"),selectedRunId:document.querySelector("#selected-run-id"),timeline:document.querySelector("#timeline"),rcaOutput:document.querySelector("#rca-output"),kbForm:document.querySelector("#kb-form"),kbResults:document.querySelector("#kb-results")}}function r(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function H(t){return String(t).split(/[\s-]+/).filter(Boolean).slice(0,2).map(e=>e[0]?.toUpperCase()).join("")}function g(t,e,n){return Math.min(Math.max(t,e),n)}function j({workflowMap:t,activeWorkflowId:e,renderWorkflows:n}){for(const o of t.querySelectorAll(".flow-board")){const s=T(o),a=Array.from(o.querySelectorAll(".flow-node"));for(const i of a){const c=s[i.dataset.stepId]||O(Number(i.dataset.index));y(i,c),i.addEventListener("pointerdown",u=>E(u,o,i))}m(o)}return function(){e()&&(localStorage.removeItem(f(e())),n())}}function E(t,e,n){if(t.button!==0)return;t.preventDefault(),n.setPointerCapture(t.pointerId),n.classList.add("dragging");const o=e.getBoundingClientRect(),s={pointerX:t.clientX,pointerY:t.clientY,nodeX:Number(n.dataset.x||0),nodeY:Number(n.dataset.y||0)},a=c=>{const u={x:g(s.nodeX+c.clientX-s.pointerX,20,o.width-n.offsetWidth-20),y:g(s.nodeY+c.clientY-s.pointerY,20,o.height-n.offsetHeight-20)};y(n,u),m(e)},i=()=>{n.classList.remove("dragging"),n.removeEventListener("pointermove",a),n.removeEventListener("pointerup",i),n.removeEventListener("pointercancel",i),D(e)};n.addEventListener("pointermove",a),n.addEventListener("pointerup",i),n.addEventListener("pointercancel",i)}function m(t){const e=t.querySelector(".flow-lines"),n=Array.from(t.querySelectorAll(".flow-node")).sort((s,a)=>Number(s.dataset.index)-Number(a.dataset.index)),o=[];for(let s=1;s<n.length;s+=1){const a=n[s-1],i=n[s],c={x:Number(a.dataset.x)+a.offsetWidth,y:Number(a.dataset.y)+a.offsetHeight/2},u={x:Number(i.dataset.x),y:Number(i.dataset.y)+i.offsetHeight/2},w=c.x+(u.x-c.x)/2;o.push(`<path class="flow-line" d="M ${c.x} ${c.y} C ${w} ${c.y}, ${w} ${u.y}, ${u.x} ${u.y}" />`)}e.innerHTML=o.join("")}function y(t,e){t.dataset.x=String(e.x),t.dataset.y=String(e.y),t.style.left=`${e.x}px`,t.style.top=`${e.y}px`}function O(t){return{x:44+t*282,y:180+(t%2===0?0:96)}}function T(t){try{return JSON.parse(localStorage.getItem(f(t.dataset.workflowId))||"{}")}catch{return{}}}function D(t){const e={};for(const n of t.querySelectorAll(".flow-node"))e[n.dataset.stepId]={x:Number(n.dataset.x),y:Number(n.dataset.y)};localStorage.setItem(f(t.dataset.workflowId),JSON.stringify(e))}function f(t){return`developer-ai-fabric.canvas.${t}`}function v({state:t,elements:e,onRunSelected:n}){e.agentCount.textContent=t.agents.length,e.workflowCount.textContent=t.workflows.length,e.runCount.textContent=t.runs.length,W(t,e),k(t,e),K(t,e,n)}function h(t,e,n){t.activeView=n;for(const o of e.views)o.classList.toggle("active-view",o.id===n);for(const o of e.viewButtons)o.classList.toggle("active",o.dataset.viewTarget===n)}function P(t,e){t.kbResults.innerHTML=(e||[]).map(n=>`
        <article class="rca-block">
          <strong>${r(n.title)}</strong>
          <p class="small">${r(n.source)} - confidence ${r(n.confidence)}</p>
          <p>${r(n.summary)}</p>
        </article>
      `).join("")}function $(t,e){t.runDetail.classList.remove("hidden"),t.selectedRunId.textContent=e.runId,t.timeline.innerHTML=(e.steps||[]).map(o=>`
        <div class="timeline-item">
          <strong>${r(o.agentName||o.agent)}</strong>
          <span class="small">${r(o.status)} - ${r(o.id)}</span>
          <p>${r(o.output?.summary||o.output?.readiness||"Step completed.")}</p>
        </div>
      `).join("");const n=e.result||{};t.rcaOutput.innerHTML=`
    <div class="rca-block">
      <strong>Summary</strong>
      <p>${r(n.summary||"")}</p>
    </div>
    <div class="rca-block">
      <strong>Suspected Root Cause</strong>
      <p>${r(n.suspectedRootCause||"")}</p>
    </div>
    <div class="rca-block">
      <strong>Confidence</strong>
      <p>${r(n.confidence||"unknown")}</p>
    </div>
    <div class="rca-block">
      <strong>Evidence</strong>
      ${(n.evidence||[]).map(o=>`<p>${r(o.source)}: ${r(o.summary)}</p>`).join("")||"<p>No evidence recorded.</p>"}
    </div>
    <div class="rca-block">
      <strong>Open Questions</strong>
      ${(n.openQuestions||[]).map(o=>`<p>${r(o)}</p>`).join("")||"<p>None.</p>"}
    </div>
  `,t.runDetail.scrollIntoView({behavior:"smooth",block:"start"})}function W(t,e){e.agentGrid.innerHTML=t.agents.map(n=>`
        <article class="agent-card">
          <div>
            <h3>${r(n.name)}</h3>
            <p>${r(n.id)} v${r(n.version||"0.0.0")}</p>
          </div>
          <p>${r(n.description||"")}</p>
          <div class="tag-row">
            ${(n.tools||[]).slice(0,3).map(o=>`<span class="tag">${r(o)}</span>`).join("")}
          </div>
        </article>
      `).join("")}function k(t,e){const n=new Map(t.agents.map(s=>[s.id,s]));t.activeWorkflowId=t.workflows[0]?.id||null,e.workflowMap.innerHTML=t.workflows.map(s=>B(s,n)).join("");for(const s of e.workflowMap.querySelectorAll("[data-agent-id]"))s.addEventListener("click",()=>{const a=n.get(s.dataset.agentId),i=s.dataset.stepId;for(const c of e.workflowMap.querySelectorAll(".flow-node"))c.classList.toggle("selected",c===s);F(e,a,i)});const o=j({workflowMap:e.workflowMap,activeWorkflowId:()=>t.activeWorkflowId,renderWorkflows:()=>k(t,e)});e.resetLayoutButton.onclick=o}function B(t,e){const n=t.steps||[],o=210,s=[];for(const[i,c]of n.entries()){const u=e.get(c.agent);s.push(`
      <button class="flow-node" data-index="${i}" data-step-id="${r(c.id)}" data-agent-id="${r(c.agent)}">
        <span class="node-port in"></span>
        <span class="node-port out"></span>
        <span class="flow-node-header">
          <span class="node-icon">${r(H(u?.name||c.agent))}</span>
          <span>
            <strong>${r(u?.name||c.agent)}</strong>
            <span>${r(c.id)}</span>
          </span>
        </span>
        <span>${r(u?.description||"Agent metadata not found.")}</span>
      </button>
    `)}const a=Math.max(1120,44+n.length*(o+72));return`
    <div class="flow-board" data-workflow-id="${r(t.id)}" style="width: ${a}px;">
      <svg class="flow-lines" viewBox="0 0 ${a} 520" preserveAspectRatio="none"></svg>
      ${s.join("")}
    </div>
  `}function F(t,e,n){if(!e){t.nodeInspector.innerHTML=`
      <h3>${r(n)}</h3>
      <p class="small">Agent metadata was not found for this workflow step.</p>
    `;return}t.nodeInspector.innerHTML=`
    <h3>${r(e.name)}</h3>
    <p class="small">${r(e.id)} v${r(e.version||"0.0.0")}</p>
    <p>${r(e.description||"")}</p>
    <div class="inspector-section">
      <strong>Model policy</strong>
      <div class="tag-row">
        <span class="tag">${r(e.modelPolicy?.defaultTask||"not-set")}</span>
        <span class="tag">local: ${r(e.modelPolicy?.allowLocal??"n/a")}</span>
        <span class="tag">cloud: ${r(e.modelPolicy?.allowCloud??"n/a")}</span>
      </div>
    </div>
    <div class="inspector-section">
      <strong>Tools</strong>
      <div class="tag-row">
        ${(e.tools||[]).map(o=>`<span class="tag">${r(o)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
    <div class="inspector-section">
      <strong>Outputs</strong>
      <div class="tag-row">
        ${(e.outputs||[]).map(o=>`<span class="tag">${r(o)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
  `}function K(t,e,n){if(t.runs.length===0){e.runsList.innerHTML='<p class="small">No runs yet.</p>';return}e.runsList.innerHTML=t.runs.map(o=>`
        <button class="run-item" data-run-id="${r(o.runId)}">
          <strong>${r(o.issueKey||o.runId)}</strong>
          <span class="run-meta">${r(o.service||"unknown service")} - ${r(o.status)}</span>
        </button>
      `).join("");for(const o of e.runsList.querySelectorAll("[data-run-id]"))o.addEventListener("click",()=>n(o.dataset.runId))}const d={agents:[],workflows:[],runs:[],activeWorkflowId:null,activeView:"dashboard"},l=R();for(const t of l.viewButtons)t.addEventListener("click",()=>h(d,l,t.dataset.viewTarget));l.refreshButton.addEventListener("click",S);l.runForm.addEventListener("submit",V);l.kbForm.addEventListener("submit",G);await S();async function S(){await Promise.all([X(),Y(),J(),b()]),v({state:d,elements:l,onRunSelected:L})}async function X(){try{const t=await x();l.healthStatus.textContent=t.status==="ok"?"Connected":"Unknown",l.statusDot.classList.toggle("ok",t.status==="ok")}catch{l.healthStatus.textContent="Offline",l.statusDot.classList.remove("ok")}}async function Y(){d.agents=await q()}async function J(){d.workflows=await N()}async function b(){d.runs=await I()}async function V(t){t.preventDefault();const e=new FormData(l.runForm),n=d.workflows[0]?.id||"rca-analysis",o=await C({workflow:n,input:{jiraIssueKey:e.get("jiraIssueKey"),service:e.get("service"),environment:e.get("environment"),timeWindowHours:Number(e.get("timeWindowHours"))}});await b(),v({state:d,elements:l,onRunSelected:L}),h(d,l,"workflow-execution"),$(l,o)}async function L(t){const e=await A(t);$(l,e)}async function G(t){t.preventDefault();const e=new FormData(l.kbForm),n=await M(e.get("query"));P(l,n.results||[])}
