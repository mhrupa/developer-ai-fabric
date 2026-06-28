(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function o(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(r){if(r.ep)return;r.ep=!0;const i=o(r);fetch(r.href,i)}})();async function g(t,e={}){const o=await fetch(t,{headers:{"content-type":"application/json",...e.headers||{}},...e});if(!o.ok){const n=await o.text();throw new Error(n||`Request failed: ${o.status}`)}return o.json()}async function _(){return g("/api/v1/health")}async function j(){return(await g("/api/v1/agents")).agents||[]}async function K(){return(await g("/api/v1/workflows")).workflows||[]}async function J(){return(await g("/api/v1/skills")).skills||[]}async function X(){return(await g("/api/v1/kb/sources")).sources||[]}async function Y(t){return(await g("/api/v1/agents",{method:"POST",body:JSON.stringify(t)})).agent}async function U(t){return(await g("/api/v1/skills",{method:"POST",body:JSON.stringify(t)})).skill}async function V(t){return(await g("/api/v1/workflows",{method:"POST",body:JSON.stringify(t)})).workflow}async function G(t){return(await g("/api/v1/kb/sources",{method:"POST",body:JSON.stringify(t)})).source}async function Q(){return(await g("/api/v1/runs")).runs||[]}async function z(t){return g("/api/v1/runs",{method:"POST",body:JSON.stringify(t)})}async function Z(t){return g(`/api/v1/runs/${t}`)}async function tt(t,e="local-user"){return g(`/api/v1/runs/${t}/approve`,{method:"POST",body:JSON.stringify({approver:e})})}async function et(t,e){return g(`/api/v1/runs/${t}/steps/${e}/rerun`,{method:"POST",body:JSON.stringify({})})}async function ot(t){return g("/api/v1/kb/search",{method:"POST",body:JSON.stringify({query:t})})}function nt(){return{viewButtons:document.querySelectorAll("[data-view-target]"),views:document.querySelectorAll(".app-view"),healthStatus:document.querySelector("#health-status"),statusDot:document.querySelector(".status-dot"),appMessage:document.querySelector("#app-message"),agentCount:document.querySelector("#agent-count"),workflowCount:document.querySelector("#workflow-count"),runCount:document.querySelector("#run-count"),agentGrid:document.querySelector("#agent-grid"),workflowMap:document.querySelector("#workflow-map"),nodeInspector:document.querySelector("#node-inspector"),resetLayoutButton:document.querySelector("#reset-layout-button"),runsList:document.querySelector("#runs-list"),runForm:document.querySelector("#run-form"),agentForm:document.querySelector("#agent-form"),skillForm:document.querySelector("#skill-form"),workflowForm:document.querySelector("#workflow-form"),workflowAgentSelect:document.querySelector("#workflow-agent-select"),workflowAgentList:document.querySelector("#workflow-agent-list"),addWorkflowStepButton:document.querySelector("#add-workflow-step-button"),workflowStepList:document.querySelector("#workflow-step-list"),kbSourceForm:document.querySelector("#kb-source-form"),skillList:document.querySelector("#skill-list"),kbSourceList:document.querySelector("#kb-source-list"),refreshButton:document.querySelector("#refresh-button"),runDetail:document.querySelector("#run-detail"),selectedRunId:document.querySelector("#selected-run-id"),runActions:document.querySelector("#run-actions"),timeline:document.querySelector("#timeline"),rcaOutput:document.querySelector("#rca-output"),kbForm:document.querySelector("#kb-form"),kbResults:document.querySelector("#kb-results")}}function s(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function O(t){return String(t).split(/[\s-]+/).filter(Boolean).slice(0,2).map(e=>e[0]?.toUpperCase()).join("")}function A(t,e,o){return Math.min(Math.max(t,e),o)}function rt({workflowMap:t,activeWorkflowId:e,renderWorkflows:o,onConnectionCreate:n}){for(const r of t.querySelectorAll(".flow-board")){const i=lt(r),a=Array.from(r.querySelectorAll(".flow-node"));for(const c of a){const u=i[c.dataset.stepId]||ct(Number(c.dataset.index));R(c,u),c.addEventListener("pointerdown",p=>st(p,r,c))}for(const c of r.querySelectorAll(".node-port.out"))c.addEventListener("pointerdown",u=>at(u,r,c,n));M(r)}return function(){e()&&(localStorage.removeItem($(e())),o())}}function st(t,e,o){if(t.button!==0||t.target.closest(".node-port"))return;o.setPointerCapture(t.pointerId);const n=e.getBoundingClientRect(),r={pointerX:t.clientX,pointerY:t.clientY,nodeX:Number(o.dataset.x||0),nodeY:Number(o.dataset.y||0)};let i=!1;const a=u=>{const p=u.clientX-r.pointerX,f=u.clientY-r.pointerY;if(!i&&Math.hypot(p,f)<4)return;i=!0,o.classList.add("dragging");const m={x:A(r.nodeX+p,20,n.width-o.offsetWidth-20),y:A(r.nodeY+f,20,n.height-o.offsetHeight-20)};R(o,m),M(e)},c=()=>{o.classList.remove("dragging"),o.removeEventListener("pointermove",a),o.removeEventListener("pointerup",c),o.removeEventListener("pointercancel",c),i&&dt(e)};o.addEventListener("pointermove",a),o.addEventListener("pointerup",c),o.addEventListener("pointercancel",c)}function at(t,e,o,n){if(t.button!==0)return;const r=o.closest(".flow-node");if(!r)return;t.preventDefault(),t.stopPropagation(),o.setPointerCapture(t.pointerId),e.classList.add("linking"),r.classList.add("connection-source");const i=e.querySelector(".flow-lines"),a=b(e,o),c=document.createElementNS("http://www.w3.org/2000/svg","path");c.setAttribute("class","flow-line preview-line"),i.append(c);const u=f=>{const m=it(e,f),k=D(f.clientX,f.clientY,r);q(e,k),c.setAttribute("d",C(a,m))},p=f=>{const m=D(f.clientX,f.clientY,r);c.remove(),e.classList.remove("linking"),r.classList.remove("connection-source"),q(e,null),o.removeEventListener("pointermove",u),o.removeEventListener("pointerup",p),o.removeEventListener("pointercancel",p),m&&n?.(r.dataset.stepId,m.dataset.stepId)};o.addEventListener("pointermove",u),o.addEventListener("pointerup",p),o.addEventListener("pointercancel",p)}function M(t){const e=t.querySelector(".flow-lines"),o=Array.from(t.querySelectorAll(".flow-node")),n=new Map(o.map(i=>[i.dataset.stepId,i])),r=[];for(const i of o.filter(a=>a.dataset.stepId!=="__start")){const a=(i.dataset.dependsOn||"").split(",").filter(Boolean);for(const c of a){const u=n.get(c);if(!u)continue;const p=u.querySelector(".node-port.out"),f=i.querySelector(".node-port.in");if(!p||!f)continue;const m=b(t,p),k=b(t,f);r.push(`<path class="flow-line" d="${C(m,k)}" />`)}}e.innerHTML=r.join("")}function b(t,e){const o=t.getBoundingClientRect(),n=e.getBoundingClientRect();return{x:n.left+n.width/2-o.left,y:n.top+n.height/2-o.top}}function it(t,e){const o=t.getBoundingClientRect();return{x:e.clientX-o.left,y:e.clientY-o.top}}function D(t,e,o){const r=document.elementFromPoint(t,e)?.closest?.(".flow-node");return!r||r===o||r.dataset.stepId==="__start"?null:r}function q(t,e){for(const o of t.querySelectorAll(".flow-node"))o.classList.toggle("connection-target",o===e)}function C(t,e){const o=t.x+(e.x-t.x)/2;return`M ${t.x} ${t.y} C ${o} ${t.y}, ${o} ${e.y}, ${e.x} ${e.y}`}function R(t,e){t.dataset.x=String(e.x),t.dataset.y=String(e.y),t.style.left=`${e.x}px`,t.style.top=`${e.y}px`}function ct(t){return t<0?{x:44,y:210}:{x:360+t*310,y:150+t%3*118}}function lt(t){try{return JSON.parse(localStorage.getItem($(t.dataset.workflowId))||"{}")}catch{return{}}}function dt(t){const e={};for(const o of t.querySelectorAll(".flow-node"))e[o.dataset.stepId]={x:Number(o.dataset.x),y:Number(o.dataset.y)};localStorage.setItem($(t.dataset.workflowId),JSON.stringify(e))}function $(t){return`developer-ai-fabric.canvas.${t}`}function ut({state:t,elements:e,onRunSelected:o,onWorkflowStepMove:n,onWorkflowStepRemove:r,onWorkflowStepSelected:i,onWorkflowConnectionCreate:a}){e.agentCount.textContent=t.agents.length,e.workflowCount.textContent=t.workflows.length,e.runCount.textContent=t.runs.length,gt(t,e),mt(t,e),wt(t,e),vt(t,e,n,r,i),I(t,e,i,a),bt(t,e,o)}function T(t,e,o){t.activeView=o;for(const n of e.views)n.classList.toggle("active-view",n.id===o);for(const n of e.viewButtons)n.classList.toggle("active",n.dataset.viewTarget===o)}function pt(t,e){t.kbResults.innerHTML=(e||[]).map(o=>`
        <article class="rca-block">
          <strong>${s(o.title)}</strong>
          <p class="small">${s(o.source)} - confidence ${s(o.confidence)}</p>
          <p>${s(o.summary)}</p>
        </article>
      `).join("")}function ft(t,e,o={}){t.runDetail.classList.remove("hidden"),t.selectedRunId.textContent=e.runId,t.timeline.innerHTML=(e.steps||[]).map(i=>`
        <div class="timeline-item">
          <strong>${s(i.agentName||i.agent)}</strong>
          <span class="small">${s(i.status)} - ${s(i.id)}</span>
          <p>${s(i.output?.summary||i.output?.readiness||"Step completed.")}</p>
          <button class="secondary-button compact-button" data-rerun-step="${s(i.id)}" type="button">Rerun Step</button>
        </div>
      `).join("");const n=e.approval||{};t.runActions.innerHTML=`
    <div class="approval-strip ${n.status==="approved"?"approved":""}">
      <div>
        <strong>Approval ${s(n.status||"pending")}</strong>
        <span>Required before side-effect actions such as posting back to Jira.</span>
      </div>
      <button id="approve-run-button" class="secondary-button" type="button" ${n.status==="approved"?"disabled":""}>Approve</button>
    </div>
  `,t.runActions.querySelector("#approve-run-button")?.addEventListener("click",()=>o.onApprove?.(e.runId));for(const i of t.timeline.querySelectorAll("[data-rerun-step]"))i.addEventListener("click",()=>o.onRerunStep?.(e.runId,i.dataset.rerunStep));const r=e.result||{};t.rcaOutput.innerHTML=`
    <div class="rca-block">
      <strong>Summary</strong>
      <p>${s(r.summary||"")}</p>
    </div>
    <div class="rca-block">
      <strong>Suspected Root Cause</strong>
      <p>${s(r.suspectedRootCause||"")}</p>
    </div>
    <div class="rca-block">
      <strong>Confidence</strong>
      <p>${s(r.confidence||"unknown")}</p>
    </div>
    <div class="rca-block">
      <strong>Evidence</strong>
      ${(r.evidence||[]).map(i=>`<p>${s(i.source)}: ${s(i.summary)}</p>`).join("")||"<p>No evidence recorded.</p>"}
    </div>
    <div class="rca-block">
      <strong>Open Questions</strong>
      ${(r.openQuestions||[]).map(i=>`<p>${s(i)}</p>`).join("")||"<p>None.</p>"}
    </div>
  `,t.runDetail.scrollIntoView({behavior:"smooth",block:"start"})}function v(t,e,o="info"){t.appMessage.textContent=e,t.appMessage.className=`app-message ${o}`,window.setTimeout(()=>{t.appMessage.classList.add("hidden")},5e3)}function wt(t,e){e.agentGrid.innerHTML=t.agents.map(o=>`
        <article class="agent-card">
          <div>
            <h3>${s(o.name)}</h3>
            <p>${s(o.id)} v${s(o.version||"0.0.0")}</p>
          </div>
          <p>${s(o.description||"")}</p>
          <div class="tag-row">
            ${(o.tools||[]).slice(0,3).map(n=>`<span class="tag">${s(n)}</span>`).join("")}
          </div>
        </article>
      `).join("")}function gt(t,e){if(e.skillList){if(t.skills.length===0){e.skillList.innerHTML=`
      <div class="empty-state">
        <strong>No local skills yet</strong>
        <span>Saved skills will appear here.</span>
      </div>
    `;return}e.skillList.innerHTML=t.skills.map(o=>`
        <article class="registry-item">
          <strong>${s(o.name)}</strong>
          <span>${s(o.id)} - ${s(o.toolBinding||"no tool binding")}</span>
        </article>
      `).join("")}}function mt(t,e){if(e.kbSourceList){if(t.kbSources.length===0){e.kbSourceList.innerHTML='<p class="small">No KB sources configured yet.</p>';return}e.kbSourceList.innerHTML=t.kbSources.map(o=>`
        <article class="registry-item">
          <strong>${s(o.name)}</strong>
          <span>${s(o.type)} - ${s(o.url)}</span>
        </article>
      `).join("")}}function vt(t,e,o,n,r){if(!e.workflowAgentSelect||!e.workflowStepList)return;if(e.workflowAgentSelect.innerHTML=t.agents.map(a=>`<option value="${s(a.id)}">${s(a.name)} (${s(a.id)})</option>`).join(""),e.workflowAgentList&&(e.workflowAgentList.innerHTML=t.agents.map(a=>`
          <button class="agent-palette-item" draggable="true" data-drag-agent-id="${s(a.id)}" type="button">
            <span class="palette-agent-icon">${s(O(a.name||a.id))}</span>
            <span>
              <strong>${s(a.name||a.id)}</strong>
              <em>${s(a.modelPolicy?.defaultTask||"agent")}</em>
            </span>
          </button>
        `).join("")),t.workflowDraftSteps.length===0){e.workflowStepList.innerHTML=`
      <div class="empty-state compact-empty">
        <strong>No steps added</strong>
        <span>Add at least one agent step before saving.</span>
      </div>
    `;return}const i=new Map(t.agents.map(a=>[a.id,a]));e.workflowStepList.innerHTML=t.workflowDraftSteps.map((a,c)=>{const u=i.get(a.agent),p=a.dependsOn?.length?`child of ${a.dependsOn.map(m=>m==="__start"?"Start":m).join(", ")}`:"unconnected";return`
        <div class="workflow-step-row${a.id===t.selectedWorkflowStepId?" selected-step":""}" data-select-step="${s(a.id)}">
          <span>${c+1}</span>
          <strong>${s(u?.name||a.agent)}</strong>
          <em>${s(p)}</em>
          <button class="secondary-button compact-button" data-step-move="${c}" data-direction="-1" type="button">Up</button>
          <button class="secondary-button compact-button" data-step-move="${c}" data-direction="1" type="button">Down</button>
          <button class="secondary-button compact-button danger-button" data-step-remove="${c}" type="button">Remove</button>
        </div>
      `}).join("");for(const a of e.workflowStepList.querySelectorAll("[data-step-move]"))a.addEventListener("click",()=>o?.(Number(a.dataset.stepMove),Number(a.dataset.direction)));for(const a of e.workflowStepList.querySelectorAll("[data-step-remove]"))a.addEventListener("click",()=>n?.(Number(a.dataset.stepRemove)));for(const a of e.workflowStepList.querySelectorAll("[data-select-step]"))a.addEventListener("click",c=>{c.target.closest("button")||r?.(a.dataset.selectStep)})}function I(t,e,o,n){const r=new Map(t.agents.map(c=>[c.id,c])),i=St(t,e);t.activeWorkflowId=i.id,e.workflowMap.innerHTML=kt(i,r);for(const c of e.workflowMap.querySelectorAll("[data-agent-id]"))c.addEventListener("click",()=>{if(c.dataset.agentId==="__start"){for(const f of e.workflowMap.querySelectorAll(".flow-node"))f.classList.toggle("selected",f===c);o?.("__start"),yt(e);return}const u=r.get(c.dataset.agentId),p=c.dataset.stepId;for(const f of e.workflowMap.querySelectorAll(".flow-node"))f.classList.toggle("selected",f===c);o?.(p),ht(e,u,p)});const a=rt({workflowMap:e.workflowMap,activeWorkflowId:()=>t.activeWorkflowId,renderWorkflows:()=>I(t,e,o,n),onConnectionCreate:n});e.resetLayoutButton.onclick=a}function yt(t){t.nodeInspector.innerHTML=`
    <h3>Start</h3>
    <p class="small">Entry point for the local agent orchestrator.</p>
    <div class="inspector-section">
      <strong>Guardrails</strong>
      <div class="tag-row">
        <span class="tag">approval required</span>
        <span class="tag">local execution</span>
      </div>
    </div>
  `}function kt(t,e){const o=t.steps||[],n=260,i=[`
      <button class="flow-node start-flow-node${o.some(c=>(c.dependsOn||[]).includes("__start"))?" has-output":""}" data-index="-1" data-step-id="__start" data-agent-id="__start" type="button">
        <span class="node-port out"></span>
        <span class="start-play">▶</span>
        <strong>Start</strong>
      </button>
    `];for(const[c,u]of o.entries()){const p=e.get(u.agent),f=c===0?"intent-node":"agent-node",m=u.id===t.selectedStepId?" selected":"",k=(u.dependsOn||[]).length>0?" has-input":"",H=o.some(B=>(B.dependsOn||[]).includes(u.id))?" has-output":"";i.push(`
      <button class="flow-node ${f}${m}${k}${H}" data-index="${c}" data-step-id="${s(u.id)}" data-agent-id="${s(u.agent)}" data-depends-on="${s((u.dependsOn||[]).join(","))}" type="button">
        <span class="node-port in"></span>
        <span class="node-port out"></span>
        <span class="flow-node-header">
          <span class="node-icon">${s(O(p?.name||u.agent))}</span>
          <span>
            <strong>${s(p?.name||u.agent)}</strong>
            <span class="model-pill">${s(p?.modelPolicy?.defaultTask||u.id)}</span>
          </span>
        </span>
      </button>
    `)}const a=Math.max(1280,44+(o.length+1)*(n+110));return`
    <div class="flow-board" data-workflow-id="${s(t.id)}" style="width: ${a}px;">
      <svg class="flow-lines" viewBox="0 0 ${a} 690" preserveAspectRatio="none"></svg>
      ${i.join("")}
    </div>
  `}function St(t,e){const o=e.workflowForm,n=o?.elements?.name?.value||t.workflows[0]?.name||"Agentic Workflow";return{id:o?.elements?.id?.value||t.workflows[0]?.id||"agentic-workflow",name:n,steps:t.workflowDraftSteps,selectedStepId:t.selectedWorkflowStepId}}function ht(t,e,o){if(!e){t.nodeInspector.innerHTML=`
      <h3>${s(o)}</h3>
      <p class="small">Agent metadata was not found for this workflow step.</p>
    `;return}t.nodeInspector.innerHTML=`
    <h3>${s(e.name)}</h3>
    <p class="small">${s(e.id)} v${s(e.version||"0.0.0")}</p>
    <p>${s(e.description||"")}</p>
    <div class="inspector-section">
      <strong>Model policy</strong>
      <div class="tag-row">
        <span class="tag">${s(e.modelPolicy?.defaultTask||"not-set")}</span>
        <span class="tag">local: ${s(e.modelPolicy?.allowLocal??"n/a")}</span>
        <span class="tag">cloud: ${s(e.modelPolicy?.allowCloud??"n/a")}</span>
      </div>
    </div>
    <div class="inspector-section">
      <strong>Tools</strong>
      <div class="tag-row">
        ${(e.tools||[]).map(n=>`<span class="tag">${s(n)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
    <div class="inspector-section">
      <strong>Outputs</strong>
      <div class="tag-row">
        ${(e.outputs||[]).map(n=>`<span class="tag">${s(n)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
  `}function bt(t,e,o){if(t.runs.length===0){e.runsList.innerHTML='<p class="small">No runs yet.</p>';return}e.runsList.innerHTML=t.runs.map(n=>`
        <button class="run-item" data-run-id="${s(n.runId)}">
          <strong>${s(n.issueKey||n.runId)}</strong>
          <span class="run-meta">${s(n.service||"unknown service")} - ${s(n.status)}</span>
        </button>
      `).join("");for(const n of e.runsList.querySelectorAll("[data-run-id]"))n.addEventListener("click",()=>o(n.dataset.runId))}const d={agents:[],workflows:[],skills:[],kbSources:[],runs:[],workflowDraftSteps:[{id:"bug-intake",agent:"bug-intake",dependsOn:[]},{id:"service-resolver",agent:"service-resolver",dependsOn:["bug-intake"]},{id:"kb-retriever",agent:"kb-retriever",dependsOn:["service-resolver"]},{id:"rca-writer",agent:"rca-writer",dependsOn:["kb-retriever"]},{id:"reviewer",agent:"reviewer",dependsOn:["rca-writer"]}],selectedWorkflowStepId:null,selectedRun:null,activeWorkflowId:null,activeView:"dashboard"},l=nt();for(const t of l.viewButtons)t.addEventListener("click",()=>T(d,l,t.dataset.viewTarget));l.refreshButton.addEventListener("click",N);l.runForm.addEventListener("submit",$t);l.agentForm.addEventListener("submit",At);l.skillForm.addEventListener("submit",Dt);l.workflowForm.addEventListener("submit",qt);l.addWorkflowStepButton.addEventListener("click",Rt);l.workflowMap.addEventListener("dragover",Tt);l.workflowMap.addEventListener("dragleave",It);l.workflowMap.addEventListener("drop",Nt);l.kbSourceForm.addEventListener("submit",Ot);l.kbForm.addEventListener("submit",Ct);await N();async function N(){await Promise.all([Lt(),E(),F(),x(),W(),S()]),Pt(),w()}async function Lt(){try{const t=await _();l.healthStatus.textContent=t.status==="ok"?"Connected":"Unknown",l.statusDot.classList.toggle("ok",t.status==="ok")}catch{l.healthStatus.textContent="Offline",l.statusDot.classList.remove("ok")}}async function E(){d.agents=await j()}async function x(){d.workflows=await K()}async function F(){d.skills=await J()}async function W(){d.kbSources=await X()}async function S(){d.runs=await Q()}async function $t(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.runForm),o=d.workflows[0]?.id||"rca-analysis",n=await z({workflow:o,input:{jiraIssueKey:e.get("jiraIssueKey"),service:e.get("service"),environment:e.get("environment"),timeWindowHours:Number(e.get("timeWindowHours"))}});d.selectedRun=n,await S(),w(),T(d,l,"workflow-execution"),h()})}async function At(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.agentForm);await Y({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,version:"1.0.0",modelPolicy:{defaultTask:e.get("defaultTask")||"general",allowLocal:!0,allowCloud:!0},tools:L(e.get("tools")),outputs:L(e.get("outputs"))}),await E(),w(),v(l,"Agent saved.")})}async function Dt(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.skillForm);await U({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,toolBinding:e.get("toolBinding"),outputs:L(e.get("outputs"))}),await F(),w(),v(l,"Skill saved.")})}async function qt(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.workflowForm);await V({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,orchestration:{mode:"deterministic-graph",strategy:"sequential",allowAgentDelegation:!1,requireApprovalForSideEffects:!0},steps:d.workflowDraftSteps.map((o,n)=>({id:o.id,agent:o.agent,dependsOn:(o.dependsOn||[]).filter(r=>r!=="__start")}))}),await x(),w(),v(l,"Workflow saved with guardrails enabled.")})}async function Ot(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.kbSourceForm);await G({id:e.get("id"),name:e.get("name"),type:e.get("type"),url:e.get("url")}),await W(),w(),v(l,"KB source saved.")})}async function Mt(t){const e=await Z(t);d.selectedRun=e,h()}async function Ct(t){t.preventDefault(),await y(async()=>{const e=new FormData(l.kbForm),o=await ot(e.get("query"));pt(l,o.results||[])})}function Rt(){const t=l.workflowAgentSelect.value;t&&(Jt(t),w())}function Tt(t){Array.from(t.dataTransfer.types).includes("application/x-agent-id")&&(t.preventDefault(),l.workflowMap.classList.add("drop-ready"))}function It(t){l.workflowMap.contains(t.relatedTarget)||l.workflowMap.classList.remove("drop-ready")}function Nt(t){const e=t.dataTransfer.getData("application/x-agent-id");if(!e)return;t.preventDefault(),l.workflowMap.classList.remove("drop-ready");const o=[...d.workflowDraftSteps,P(e)],n=o.at(-1).id;jt(n,t),d.workflowDraftSteps=o,d.selectedWorkflowStepId=n,w(),v(l,`Added ${e}. Create connections manually when ready.`)}function Et(t,e){const o=t+e;if(o<0||o>=d.workflowDraftSteps.length)return;const n=[...d.workflowDraftSteps];[n[t],n[o]]=[n[o],n[t]],d.workflowDraftSteps=n,w()}function xt(t){const e=d.workflowDraftSteps[t];d.workflowDraftSteps=d.workflowDraftSteps.filter((o,n)=>n!==t).map(o=>({...o,dependsOn:(o.dependsOn||[]).filter(n=>n!==e?.id)})),d.selectedWorkflowStepId===e?.id&&(d.selectedWorkflowStepId=null),w()}async function Ft(t){await y(async()=>{d.selectedRun=await tt(t),await S(),w(),h(),v(l,"Run approved for side-effect actions.")})}async function Wt(t,e){await y(async()=>{d.selectedRun=await et(t,e),await S(),w(),h(),v(l,`Step rerun completed: ${e}`)})}function h(){ft(l,d.selectedRun,{onApprove:Ft,onRerunStep:Wt})}function w(){ut({state:d,elements:l,onRunSelected:Mt,onWorkflowStepMove:Et,onWorkflowStepRemove:xt,onWorkflowStepSelected:Xt,onWorkflowConnectionCreate:Yt}),_t()}function Pt(){const t=d.workflows.find(e=>e.id===l.workflowForm.elements.id.value)||d.workflows[0];t?.steps?.length&&(d.workflowDraftSteps=t.steps.map((e,o)=>({id:e.id,agent:e.agent,dependsOn:e.dependsOn||(o===0?[]:[t.steps[o-1].id])})),d.selectedWorkflowStepId=d.workflowDraftSteps[0]?.id||null)}async function y(t){try{await t()}catch(e){v(l,Ht(e),"error")}}function Ht(t){try{return JSON.parse(t.message).error||t.message}catch{return t.message}}function Bt(t,e,o){const n=t.slice(0,o).filter(r=>r===e).length;return n===0?e:`${e}-${n+1}`}function _t(){for(const t of l.workflowAgentList?.querySelectorAll("[data-drag-agent-id]")||[])t.addEventListener("dragstart",e=>{e.dataTransfer.setData("application/x-agent-id",t.dataset.dragAgentId),e.dataTransfer.effectAllowed="copy",t.classList.add("dragging-agent")}),t.addEventListener("dragend",()=>{t.classList.remove("dragging-agent"),l.workflowMap.classList.remove("drop-ready")})}function jt(t,e){const o=l.workflowMap.querySelector(".flow-board");if(!o)return;const n=o.getBoundingClientRect(),r=Math.max(24,e.clientX-n.left-130),i=Math.max(24,e.clientY-n.top-72),a=`developer-ai-fabric.canvas.${Kt()}`;let c={};try{c=JSON.parse(localStorage.getItem(a)||"{}")}catch{c={}}c[t]={x:r,y:i},localStorage.setItem(a,JSON.stringify(c))}function Kt(){return l.workflowForm?.elements?.id?.value||d.workflows[0]?.id||"agentic-workflow"}function Jt(t){const e=P(t);d.workflowDraftSteps=[...d.workflowDraftSteps,e],d.selectedWorkflowStepId=e.id}function P(t){const e=d.workflowDraftSteps.length;return{id:Bt([...d.workflowDraftSteps.map(n=>n.agent),t],t,e),agent:t,dependsOn:[]}}function Xt(t){d.selectedWorkflowStepId=t==="__start"?null:t,w()}function Yt(t,e){if(!t||!e||t===e)return;if(t==="__start"){d.workflowDraftSteps=d.workflowDraftSteps.map(n=>n.id===e?{...n,dependsOn:["__start"]}:n),d.selectedWorkflowStepId=e,w(),v(l,`Connected Start to ${e}.`);return}let o=!1;d.workflowDraftSteps=d.workflowDraftSteps.map(n=>{if(n.id!==e)return n;const r=new Set(n.dependsOn||[]);return r.has(t)?(r.delete(t),o=!0):r.add(t),{...n,dependsOn:Array.from(r)}}),d.selectedWorkflowStepId=e,w(),v(l,`${o?"Removed connection":"Connected"} ${t} ${o?"from":"to"} ${e}.`)}function L(t){return String(t||"").split(",").map(e=>e.trim()).filter(Boolean)}
