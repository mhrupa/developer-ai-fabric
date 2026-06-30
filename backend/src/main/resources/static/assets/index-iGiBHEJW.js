(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function n(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=n(r);fetch(r.href,a)}})();async function g(t,e={}){const n=await fetch(t,{headers:{"content-type":"application/json",...e.headers||{}},...e});if(!n.ok){const o=await n.text();throw new Error(o||`Request failed: ${n.status}`)}return n.json()}async function B(){return g("/api/v1/health")}async function J(){return(await g("/api/v1/agents")).agents||[]}async function K(){return(await g("/api/v1/workflows")).workflows||[]}async function X(){return(await g("/api/v1/skills")).skills||[]}async function Y(){return(await g("/api/v1/kb/sources")).sources||[]}async function U(t){return(await g("/api/v1/agents",{method:"POST",body:JSON.stringify(t)})).agent}async function V(t){return(await g("/api/v1/skills",{method:"POST",body:JSON.stringify(t)})).skill}async function G(t){return(await g("/api/v1/workflows",{method:"POST",body:JSON.stringify(t)})).workflow}async function Q(t){return(await g("/api/v1/kb/sources",{method:"POST",body:JSON.stringify(t)})).source}async function z(){return(await g("/api/v1/runs")).runs||[]}async function Z(t){return g("/api/v1/runs",{method:"POST",body:JSON.stringify(t)})}async function tt(t){return g(`/api/v1/runs/${t}`)}async function et(t,e="local-user"){return g(`/api/v1/runs/${t}/approve`,{method:"POST",body:JSON.stringify({approver:e})})}async function nt(t,e){return g(`/api/v1/runs/${t}/steps/${e}/rerun`,{method:"POST",body:JSON.stringify({})})}async function ot(t){return g("/api/v1/kb/search",{method:"POST",body:JSON.stringify({query:t})})}function rt(){return{viewButtons:document.querySelectorAll("[data-view-target]"),views:document.querySelectorAll(".app-view"),healthStatus:document.querySelector("#health-status"),statusDot:document.querySelector(".status-dot"),appMessage:document.querySelector("#app-message"),agentCount:document.querySelector("#agent-count"),workflowCount:document.querySelector("#workflow-count"),runCount:document.querySelector("#run-count"),agentGrid:document.querySelector("#agent-grid"),workflowMap:document.querySelector("#workflow-map"),nodeInspector:document.querySelector("#node-inspector"),resetLayoutButton:document.querySelector("#reset-layout-button"),runsList:document.querySelector("#runs-list"),runForm:document.querySelector("#run-form"),runWorkflowSelect:document.querySelector("#run-workflow-select"),agentForm:document.querySelector("#agent-form"),skillForm:document.querySelector("#skill-form"),workflowForm:document.querySelector("#workflow-form"),workflowAgentSelect:document.querySelector("#workflow-agent-select"),workflowAgentList:document.querySelector("#workflow-agent-list"),addWorkflowStepButton:document.querySelector("#add-workflow-step-button"),workflowStepList:document.querySelector("#workflow-step-list"),kbSourceForm:document.querySelector("#kb-source-form"),skillList:document.querySelector("#skill-list"),kbSourceList:document.querySelector("#kb-source-list"),refreshButton:document.querySelector("#refresh-button"),runDetail:document.querySelector("#run-detail"),selectedRunId:document.querySelector("#selected-run-id"),runActions:document.querySelector("#run-actions"),runContext:document.querySelector("#run-context"),timeline:document.querySelector("#timeline"),rcaOutput:document.querySelector("#rca-output"),evidenceOutput:document.querySelector("#evidence-output"),eventLog:document.querySelector("#event-log"),kbForm:document.querySelector("#kb-form"),kbResults:document.querySelector("#kb-results")}}function s(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function M(t){return String(t).split(/[\s-]+/).filter(Boolean).slice(0,2).map(e=>e[0]?.toUpperCase()).join("")}function A(t,e,n){return Math.min(Math.max(t,e),n)}function st({workflowMap:t,activeWorkflowId:e,renderWorkflows:n,onConnectionCreate:o}){for(const r of t.querySelectorAll(".flow-board")){const a=dt(r),i=Array.from(r.querySelectorAll(".flow-node"));for(const c of i){const u=a[c.dataset.stepId]||lt(Number(c.dataset.index));x(c,u),c.addEventListener("pointerdown",p=>at(p,r,c))}for(const c of r.querySelectorAll(".node-port.out"))c.addEventListener("pointerdown",u=>it(u,r,c,o));C(r)}return function(){e()&&(localStorage.removeItem(D(e())),n())}}function at(t,e,n){if(t.button!==0||t.target.closest(".node-port"))return;n.setPointerCapture(t.pointerId);const o=e.getBoundingClientRect(),r={pointerX:t.clientX,pointerY:t.clientY,nodeX:Number(n.dataset.x||0),nodeY:Number(n.dataset.y||0)};let a=!1;const i=u=>{const p=u.clientX-r.pointerX,f=u.clientY-r.pointerY;if(!a&&Math.hypot(p,f)<4)return;a=!0,n.classList.add("dragging");const m={x:A(r.nodeX+p,20,o.width-n.offsetWidth-20),y:A(r.nodeY+f,20,o.height-n.offsetHeight-20)};x(n,m),C(e)},c=()=>{n.classList.remove("dragging"),n.removeEventListener("pointermove",i),n.removeEventListener("pointerup",c),n.removeEventListener("pointercancel",c),a&&ut(e)};n.addEventListener("pointermove",i),n.addEventListener("pointerup",c),n.addEventListener("pointercancel",c)}function it(t,e,n,o){if(t.button!==0)return;const r=n.closest(".flow-node");if(!r)return;t.preventDefault(),t.stopPropagation(),n.setPointerCapture(t.pointerId),e.classList.add("linking"),r.classList.add("connection-source");const a=e.querySelector(".flow-lines"),i=$(e,n),c=document.createElementNS("http://www.w3.org/2000/svg","path");c.setAttribute("class","flow-line preview-line"),a.append(c);const u=f=>{const m=ct(e,f),y=O(f.clientX,f.clientY,r);q(e,y),c.setAttribute("d",I(i,m))},p=f=>{const m=O(f.clientX,f.clientY,r);c.remove(),e.classList.remove("linking"),r.classList.remove("connection-source"),q(e,null),n.removeEventListener("pointermove",u),n.removeEventListener("pointerup",p),n.removeEventListener("pointercancel",p),m&&o?.(r.dataset.stepId,m.dataset.stepId)};n.addEventListener("pointermove",u),n.addEventListener("pointerup",p),n.addEventListener("pointercancel",p)}function C(t){const e=t.querySelector(".flow-lines"),n=Array.from(t.querySelectorAll(".flow-node")),o=new Map(n.map(a=>[a.dataset.stepId,a])),r=[];for(const a of n.filter(i=>i.dataset.stepId!=="__start")){const i=(a.dataset.dependsOn||"").split(",").filter(Boolean);for(const c of i){const u=o.get(c);if(!u)continue;const p=u.querySelector(".node-port.out"),f=a.querySelector(".node-port.in");if(!p||!f)continue;const m=$(t,p),y=$(t,f);r.push(`<path class="flow-line" d="${I(m,y)}" />`)}}e.innerHTML=r.join("")}function $(t,e){const n=t.getBoundingClientRect(),o=e.getBoundingClientRect();return{x:o.left+o.width/2-n.left,y:o.top+o.height/2-n.top}}function ct(t,e){const n=t.getBoundingClientRect();return{x:e.clientX-n.left,y:e.clientY-n.top}}function O(t,e,n){const r=document.elementFromPoint(t,e)?.closest?.(".flow-node");return!r||r===n||r.dataset.stepId==="__start"?null:r}function q(t,e){for(const n of t.querySelectorAll(".flow-node"))n.classList.toggle("connection-target",n===e)}function I(t,e){const n=t.x+(e.x-t.x)/2;return`M ${t.x} ${t.y} C ${n} ${t.y}, ${n} ${e.y}, ${e.x} ${e.y}`}function x(t,e){t.dataset.x=String(e.x),t.dataset.y=String(e.y),t.style.left=`${e.x}px`,t.style.top=`${e.y}px`}function lt(t){return t<0?{x:44,y:210}:{x:360+t*310,y:150+t%3*118}}function dt(t){try{return JSON.parse(localStorage.getItem(D(t.dataset.workflowId))||"{}")}catch{return{}}}function ut(t){const e={};for(const n of t.querySelectorAll(".flow-node"))e[n.dataset.stepId]={x:Number(n.dataset.x),y:Number(n.dataset.y)};localStorage.setItem(D(t.dataset.workflowId),JSON.stringify(e))}function D(t){return`developer-ai-fabric.canvas.${t}`}function pt({state:t,elements:e,onRunSelected:n,onWorkflowStepMove:o,onWorkflowStepRemove:r,onWorkflowStepSelected:a,onWorkflowConnectionCreate:i}){e.agentCount.textContent=t.agents.length,e.workflowCount.textContent=t.workflows.length,e.runCount.textContent=t.runs.length,mt(t,e),vt(t,e),gt(t,e),yt(t,e,o,r,a),R(t,e,a,i),kt(t,e),Lt(t,e,n)}function N(t,e,n){t.activeView=n;for(const o of e.views)o.classList.toggle("active-view",o.id===n);for(const o of e.viewButtons)o.classList.toggle("active",o.dataset.viewTarget===n)}function ft(t,e){t.kbResults.innerHTML=(e||[]).map(n=>`
        <article class="rca-block">
          <strong>${s(n.title)}</strong>
          <p class="small">${s(n.source)} - confidence ${s(n.confidence)}</p>
          <p>${s(n.summary)}</p>
        </article>
      `).join("")}function wt(t,e,n={}){if(!e)return;t.runDetail.classList.remove("hidden"),t.selectedRunId.textContent=e.runId,t.runContext.innerHTML=`
    <article class="run-context-card">
      <span>Workflow</span>
      <strong>${s(e.workflowName||e.workflow||"unknown")}</strong>
    </article>
    <article class="run-context-card">
      <span>Status</span>
      <strong>${s(e.status||"unknown")}</strong>
    </article>
    <article class="run-context-card">
      <span>Issue</span>
      <strong>${s(e.input?.jiraIssueKey||e.result?.issueKey||"unknown")}</strong>
    </article>
    <article class="run-context-card">
      <span>Service</span>
      <strong>${s(e.input?.service||e.result?.service||"unknown")}</strong>
    </article>
  `,t.timeline.innerHTML=(e.steps||[]).map(a=>`
        <div class="timeline-item step-card">
          <div class="step-card-head">
            <div>
              <strong>${s(a.agentName||a.agent)}</strong>
              <span class="small">${s(a.status)} - ${s(a.id)}</span>
            </div>
            <button class="secondary-button compact-button" data-rerun-step="${s(a.id)}" type="button">Rerun Step</button>
          </div>
          <p>${s(a.output?.summary||a.output?.readiness||a.output?.suspectedRootCause||"Step completed.")}</p>
          <div class="contract-grid">
            <div>
              <span class="contract-label">Inputs</span>
              <div class="tag-row">${b(a.contract?.inputFields||[])}</div>
            </div>
            <div>
              <span class="contract-label">Outputs</span>
              <div class="tag-row">${b(a.contract?.outputs||[])}</div>
            </div>
            <div>
              <span class="contract-label">Tools</span>
              <div class="tag-row">${b(a.contract?.tools||[])}</div>
            </div>
            <div>
              <span class="contract-label">Policy</span>
              <div class="tag-row">
                <span class="tag">timeout ${s(a.contract?.timeoutSeconds||0)}s</span>
                <span class="tag">retries ${s(a.contract?.maxRetries??0)}</span>
                <span class="tag">${a.contract?.sideEffects?"side effects":"read only"}</span>
              </div>
            </div>
          </div>
          <details class="json-details">
            <summary>Output JSON</summary>
            <pre>${s(Ot(a.output||{}))}</pre>
          </details>
        </div>
      `).join("");const o=e.approval||{};t.runActions.innerHTML=`
    <div class="approval-strip ${o.status==="approved"?"approved":""}">
      <div>
        <strong>Approval ${s(o.status||"pending")}</strong>
        <span>Required before side-effect actions such as posting back to Jira.</span>
      </div>
      <button id="approve-run-button" class="secondary-button" type="button" ${o.status==="approved"?"disabled":""}>Approve</button>
    </div>
  `,t.runActions.querySelector("#approve-run-button")?.addEventListener("click",()=>n.onApprove?.(e.runId));for(const a of t.timeline.querySelectorAll("[data-rerun-step]"))a.addEventListener("click",()=>n.onRerunStep?.(e.runId,a.dataset.rerunStep));const r=e.result||{};t.rcaOutput.innerHTML=`
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
      ${(r.evidence||[]).map(a=>`<p>${s(a.source)}: ${s(a.summary)}</p>`).join("")||"<p>No evidence recorded.</p>"}
    </div>
    <div class="rca-block">
      <strong>Repository Context</strong>
      ${At(r)}
    </div>
    <div class="rca-block">
      <strong>Open Questions</strong>
      ${(r.openQuestions||[]).map(a=>`<p>${s(a)}</p>`).join("")||"<p>None.</p>"}
    </div>
  `,t.evidenceOutput.innerHTML=Dt(r.evidence||[]),t.eventLog.innerHTML=(e.events||[]).slice().reverse().map(a=>`
        <article class="event-row">
          <strong>${s(a.type||"event")}</strong>
          <span>${s(a.createdAt||"")}</span>
          <code>${s(a.stepId||a.agent||a.action||a.workflow||"")}</code>
        </article>
      `).join(""),t.runDetail.scrollIntoView({behavior:"smooth",block:"start"})}function v(t,e,n="info"){t.appMessage.textContent=e,t.appMessage.className=`app-message ${n}`,window.setTimeout(()=>{t.appMessage.classList.add("hidden")},5e3)}function gt(t,e){e.agentGrid.innerHTML=t.agents.map(n=>`
        <article class="agent-card">
          <div>
            <h3>${s(n.name)}</h3>
            <p>${s(n.id)} v${s(n.version||"0.0.0")}</p>
          </div>
          <p>${s(n.description||"")}</p>
          <div class="tag-row">
            ${(n.tools||[]).slice(0,3).map(o=>`<span class="tag">${s(o)}</span>`).join("")}
          </div>
        </article>
      `).join("")}function mt(t,e){if(e.skillList){if(t.skills.length===0){e.skillList.innerHTML=`
      <div class="empty-state">
        <strong>No local skills yet</strong>
        <span>Saved skills will appear here.</span>
      </div>
    `;return}e.skillList.innerHTML=t.skills.map(n=>`
        <article class="registry-item">
          <strong>${s(n.name)}</strong>
          <span>${s(n.id)} - ${s(n.toolBinding||"no tool binding")}</span>
        </article>
      `).join("")}}function vt(t,e){if(e.kbSourceList){if(t.kbSources.length===0){e.kbSourceList.innerHTML='<p class="small">No KB sources configured yet.</p>';return}e.kbSourceList.innerHTML=t.kbSources.map(n=>`
        <article class="registry-item">
          <strong>${s(n.name)}</strong>
          <span>${s(n.type)} - ${s(n.url)}</span>
        </article>
      `).join("")}}function kt(t,e){if(!e.runWorkflowSelect)return;const n=e.runWorkflowSelect.value||t.workflows[0]?.id||"";e.runWorkflowSelect.innerHTML=t.workflows.map(o=>`<option value="${s(o.id)}">${s(o.name||o.id)}</option>`).join(""),t.workflows.some(o=>o.id===n)&&(e.runWorkflowSelect.value=n)}function yt(t,e,n,o,r){if(!e.workflowAgentSelect||!e.workflowStepList)return;if(e.workflowAgentSelect.innerHTML=t.agents.map(i=>`<option value="${s(i.id)}">${s(i.name)} (${s(i.id)})</option>`).join(""),e.workflowAgentList&&(e.workflowAgentList.innerHTML=t.agents.map(i=>`
          <button class="agent-palette-item" draggable="true" data-drag-agent-id="${s(i.id)}" type="button">
            <span class="palette-agent-icon">${s(M(i.name||i.id))}</span>
            <span>
              <strong>${s(i.name||i.id)}</strong>
              <em>${s(i.modelPolicy?.defaultTask||"agent")}</em>
            </span>
          </button>
        `).join("")),t.workflowDraftSteps.length===0){e.workflowStepList.innerHTML=`
      <div class="empty-state compact-empty">
        <strong>No steps added</strong>
        <span>Add at least one agent step before saving.</span>
      </div>
    `;return}const a=new Map(t.agents.map(i=>[i.id,i]));e.workflowStepList.innerHTML=t.workflowDraftSteps.map((i,c)=>{const u=a.get(i.agent),p=i.dependsOn?.length?`child of ${i.dependsOn.map(m=>m==="__start"?"Start":m).join(", ")}`:"unconnected";return`
        <div class="workflow-step-row${i.id===t.selectedWorkflowStepId?" selected-step":""}" data-select-step="${s(i.id)}">
          <span>${c+1}</span>
          <strong>${s(u?.name||i.agent)}</strong>
          <em>${s(p)}</em>
          <button class="secondary-button compact-button" data-step-move="${c}" data-direction="-1" type="button">Up</button>
          <button class="secondary-button compact-button" data-step-move="${c}" data-direction="1" type="button">Down</button>
          <button class="secondary-button compact-button danger-button" data-step-remove="${c}" type="button">Remove</button>
        </div>
      `}).join("");for(const i of e.workflowStepList.querySelectorAll("[data-step-move]"))i.addEventListener("click",()=>n?.(Number(i.dataset.stepMove),Number(i.dataset.direction)));for(const i of e.workflowStepList.querySelectorAll("[data-step-remove]"))i.addEventListener("click",()=>o?.(Number(i.dataset.stepRemove)));for(const i of e.workflowStepList.querySelectorAll("[data-select-step]"))i.addEventListener("click",c=>{c.target.closest("button")||r?.(i.dataset.selectStep)})}function R(t,e,n,o){const r=new Map(t.agents.map(c=>[c.id,c])),a=bt(t,e);t.activeWorkflowId=a.id,e.workflowMap.innerHTML=ht(a,r);for(const c of e.workflowMap.querySelectorAll("[data-agent-id]"))c.addEventListener("click",()=>{if(c.dataset.agentId==="__start"){for(const f of e.workflowMap.querySelectorAll(".flow-node"))f.classList.toggle("selected",f===c);n?.("__start"),St(e);return}const u=r.get(c.dataset.agentId),p=c.dataset.stepId;for(const f of e.workflowMap.querySelectorAll(".flow-node"))f.classList.toggle("selected",f===c);n?.(p),$t(e,u,p)});const i=st({workflowMap:e.workflowMap,activeWorkflowId:()=>t.activeWorkflowId,renderWorkflows:()=>R(t,e,n,o),onConnectionCreate:o});e.resetLayoutButton.onclick=i}function St(t){t.nodeInspector.innerHTML=`
    <h3>Start</h3>
    <p class="small">Entry point for the local agent orchestrator.</p>
    <div class="inspector-section">
      <strong>Guardrails</strong>
      <div class="tag-row">
        <span class="tag">approval required</span>
        <span class="tag">local execution</span>
      </div>
    </div>
  `}function ht(t,e){const n=t.steps||[],o=260,a=[`
      <button class="flow-node start-flow-node${n.some(c=>(c.dependsOn||[]).includes("__start"))?" has-output":""}" data-index="-1" data-step-id="__start" data-agent-id="__start" type="button">
        <span class="node-port out"></span>
        <span class="start-play">▶</span>
        <strong>Start</strong>
      </button>
    `];for(const[c,u]of n.entries()){const p=e.get(u.agent),f=c===0?"intent-node":"agent-node",m=u.id===t.selectedStepId?" selected":"",y=(u.dependsOn||[]).length>0?" has-input":"",H=n.some(_=>(_.dependsOn||[]).includes(u.id))?" has-output":"";a.push(`
      <button class="flow-node ${f}${m}${y}${H}" data-index="${c}" data-step-id="${s(u.id)}" data-agent-id="${s(u.agent)}" data-depends-on="${s((u.dependsOn||[]).join(","))}" type="button">
        <span class="node-port in"></span>
        <span class="node-port out"></span>
        <span class="flow-node-header">
          <span class="node-icon">${s(M(p?.name||u.agent))}</span>
          <span>
            <strong>${s(p?.name||u.agent)}</strong>
            <span class="model-pill">${s(p?.modelPolicy?.defaultTask||u.id)}</span>
          </span>
        </span>
      </button>
    `)}const i=Math.max(1280,44+(n.length+1)*(o+110));return`
    <div class="flow-board" data-workflow-id="${s(t.id)}" style="width: ${i}px;">
      <svg class="flow-lines" viewBox="0 0 ${i} 690" preserveAspectRatio="none"></svg>
      ${a.join("")}
    </div>
  `}function bt(t,e){const n=e.workflowForm,o=n?.elements?.name?.value||t.workflows[0]?.name||"Agentic Workflow";return{id:n?.elements?.id?.value||t.workflows[0]?.id||"agentic-workflow",name:o,steps:t.workflowDraftSteps,selectedStepId:t.selectedWorkflowStepId}}function $t(t,e,n){if(!e){t.nodeInspector.innerHTML=`
      <h3>${s(n)}</h3>
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
        ${(e.tools||[]).map(o=>`<span class="tag">${s(o)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
    <div class="inspector-section">
      <strong>Outputs</strong>
      <div class="tag-row">
        ${(e.outputs||[]).map(o=>`<span class="tag">${s(o)}</span>`).join("")||'<span class="tag">none</span>'}
      </div>
    </div>
  `}function Lt(t,e,n){if(t.runs.length===0){e.runsList.innerHTML='<p class="small">No runs yet.</p>';return}e.runsList.innerHTML=t.runs.map(o=>`
        <button class="run-item${t.selectedRun?.runId===o.runId?" selected-run":""}" data-run-id="${s(o.runId)}">
          <strong>${s(o.issueKey||o.runId)}</strong>
          <span class="run-meta">${s(o.workflowId||"workflow")} - ${s(o.service||"unknown service")} - ${s(o.status)}</span>
        </button>
      `).join("");for(const o of e.runsList.querySelectorAll("[data-run-id]"))o.addEventListener("click",()=>n(o.dataset.runId))}function b(t){return t?.length?t.map(e=>`<span class="tag">${s(e)}</span>`).join(""):'<span class="tag">none</span>'}function Dt(t){return t.length?t.map(e=>`
        <article class="rca-block">
          <strong>${s(e.source||"evidence")}</strong>
          <p>${s(e.summary||"")}</p>
          <span class="small">confidence ${s(e.confidence||"unknown")}</span>
        </article>
      `).join(""):'<div class="rca-block"><p>No evidence recorded.</p></div>'}function At(t){const e=t.impactedFiles||[],n=t.recentChanges||[],o=t.testSuggestions||[];return!e.length&&!n.length&&!o.length?"<p>No repository context recorded.</p>":`
    <div class="repo-context-grid">
      <div>
        <span class="contract-label">Impacted Files</span>
        ${e.map(r=>`<code class="path-chip">${s(r)}</code>`).join("")||"<p>None.</p>"}
      </div>
      <div>
        <span class="contract-label">Recent Changes</span>
        ${n.map(r=>`<p><strong>${s(r.hash||"")}</strong> ${s(r.message||r)}</p>`).join("")||"<p>None.</p>"}
      </div>
      <div>
        <span class="contract-label">Test Suggestions</span>
        ${o.map(r=>`<p>${s(r)}</p>`).join("")||"<p>None.</p>"}
      </div>
    </div>
  `}function Ot(t){return JSON.stringify(t,null,2)}const l={agents:[],workflows:[],skills:[],kbSources:[],runs:[],workflowDraftSteps:[{id:"bug-intake",agent:"bug-intake",dependsOn:[]},{id:"service-resolver",agent:"service-resolver",dependsOn:["bug-intake"]},{id:"kb-retriever",agent:"kb-retriever",dependsOn:["service-resolver"]},{id:"rca-writer",agent:"rca-writer",dependsOn:["kb-retriever"]},{id:"reviewer",agent:"reviewer",dependsOn:["rca-writer"]}],selectedWorkflowStepId:null,selectedRun:null,activeWorkflowId:null,activeView:"dashboard"},d=rt();for(const t of d.viewButtons)t.addEventListener("click",()=>N(l,d,t.dataset.viewTarget));d.refreshButton.addEventListener("click",T);d.runForm.addEventListener("submit",Mt);d.agentForm.addEventListener("submit",Ct);d.skillForm.addEventListener("submit",It);d.workflowForm.addEventListener("submit",xt);d.addWorkflowStepButton.addEventListener("click",Et);d.workflowMap.addEventListener("dragover",Wt);d.workflowMap.addEventListener("dragleave",Ft);d.workflowMap.addEventListener("drop",Pt);d.kbSourceForm.addEventListener("submit",Nt);d.kbForm.addEventListener("submit",Tt);await T();async function T(){await Promise.all([qt(),E(),F(),W(),P(),S()]),Jt(),w()}async function qt(){try{const t=await B();d.healthStatus.textContent=t.status==="ok"?"Connected":"Unknown",d.statusDot.classList.toggle("ok",t.status==="ok")}catch{d.healthStatus.textContent="Offline",d.statusDot.classList.remove("ok")}}async function E(){l.agents=await J()}async function W(){l.workflows=await K()}async function F(){l.skills=await X()}async function P(){l.kbSources=await Y()}async function S(){l.runs=await z()}async function Mt(t){t.preventDefault(),await k(async()=>{const e=new FormData(d.runForm),n=e.get("workflow")||l.workflows[0]?.id||"rca-analysis",o=await Z({workflow:n,input:{jiraIssueKey:e.get("jiraIssueKey"),service:e.get("service"),environment:e.get("environment"),timeWindowHours:Number(e.get("timeWindowHours"))}});l.selectedRun=o,await S(),w(),N(l,d,"workflow-execution"),h()})}async function Ct(t){t.preventDefault(),await k(async()=>{const e=new FormData(d.agentForm);await U({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,version:"1.0.0",modelPolicy:{defaultTask:e.get("defaultTask")||"general",allowLocal:!0,allowCloud:!0},tools:L(e.get("tools")),outputs:L(e.get("outputs"))}),await E(),w(),v(d,"Agent saved.")})}async function It(t){t.preventDefault(),await k(async()=>{const e=new FormData(d.skillForm);await V({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,toolBinding:e.get("toolBinding"),outputs:L(e.get("outputs"))}),await F(),w(),v(d,"Skill saved.")})}async function xt(t){t.preventDefault(),await k(async()=>{Zt();const e=new FormData(d.workflowForm);await G({id:e.get("id"),name:e.get("name"),description:`${e.get("name")} created from the local dashboard.`,orchestration:{mode:"deterministic-graph",strategy:"sequential",allowAgentDelegation:!1,requireApprovalForSideEffects:!0},steps:l.workflowDraftSteps.map((n,o)=>({id:n.id,agent:n.agent,dependsOn:(n.dependsOn||[]).filter(r=>r!=="__start")}))}),await W(),w(),v(d,"Workflow saved with guardrails enabled.")})}async function Nt(t){t.preventDefault(),await k(async()=>{const e=new FormData(d.kbSourceForm);await Q({id:e.get("id"),name:e.get("name"),type:e.get("type"),url:e.get("url")}),await P(),w(),v(d,"KB source saved.")})}async function Rt(t){const e=await tt(t);l.selectedRun=e,w(),h()}async function Tt(t){t.preventDefault(),await k(async()=>{const e=new FormData(d.kbForm),n=await ot(e.get("query"));ft(d,n.results||[])})}function Et(){const t=d.workflowAgentSelect.value;t&&(Gt(t),w())}function Wt(t){Array.from(t.dataTransfer.types).includes("application/x-agent-id")&&(t.preventDefault(),d.workflowMap.classList.add("drop-ready"))}function Ft(t){d.workflowMap.contains(t.relatedTarget)||d.workflowMap.classList.remove("drop-ready")}function Pt(t){const e=t.dataTransfer.getData("application/x-agent-id");if(!e)return;t.preventDefault(),d.workflowMap.classList.remove("drop-ready");const n=[...l.workflowDraftSteps,j(e)],o=n.at(-1).id;Ut(o,t),l.workflowDraftSteps=n,l.selectedWorkflowStepId=o,w(),v(d,`Added ${e}. Create connections manually when ready.`)}function jt(t,e){const n=t+e;if(n<0||n>=l.workflowDraftSteps.length)return;const o=[...l.workflowDraftSteps];[o[t],o[n]]=[o[n],o[t]],l.workflowDraftSteps=o,w()}function Ht(t){const e=l.workflowDraftSteps[t];l.workflowDraftSteps=l.workflowDraftSteps.filter((n,o)=>o!==t).map(n=>({...n,dependsOn:(n.dependsOn||[]).filter(o=>o!==e?.id)})),l.selectedWorkflowStepId===e?.id&&(l.selectedWorkflowStepId=null),w()}async function _t(t){await k(async()=>{l.selectedRun=await et(t),await S(),w(),h(),v(d,"Run approved for side-effect actions.")})}async function Bt(t,e){await k(async()=>{l.selectedRun=await nt(t,e),await S(),w(),h(),v(d,`Step rerun completed: ${e}`)})}function h(){wt(d,l.selectedRun,{onApprove:_t,onRerunStep:Bt})}function w(){pt({state:l,elements:d,onRunSelected:Rt,onWorkflowStepMove:jt,onWorkflowStepRemove:Ht,onWorkflowStepSelected:Qt,onWorkflowConnectionCreate:zt}),Yt()}function Jt(){const t=l.workflows.find(e=>e.id===d.workflowForm.elements.id.value)||l.workflows[0];t?.steps?.length&&(l.workflowDraftSteps=t.steps.map((e,n)=>({id:e.id,agent:e.agent,dependsOn:e.dependsOn||(n===0?[]:[t.steps[n-1].id])})),l.selectedWorkflowStepId=l.workflowDraftSteps[0]?.id||null)}async function k(t){try{await t()}catch(e){v(d,Kt(e),"error")}}function Kt(t){try{return JSON.parse(t.message).error||t.message}catch{return t.message}}function Xt(t,e,n){const o=t.slice(0,n).filter(r=>r===e).length;return o===0?e:`${e}-${o+1}`}function Yt(){for(const t of d.workflowAgentList?.querySelectorAll("[data-drag-agent-id]")||[])t.addEventListener("dragstart",e=>{e.dataTransfer.setData("application/x-agent-id",t.dataset.dragAgentId),e.dataTransfer.effectAllowed="copy",t.classList.add("dragging-agent")}),t.addEventListener("dragend",()=>{t.classList.remove("dragging-agent"),d.workflowMap.classList.remove("drop-ready")})}function Ut(t,e){const n=d.workflowMap.querySelector(".flow-board");if(!n)return;const o=n.getBoundingClientRect(),r=Math.max(24,e.clientX-o.left-130),a=Math.max(24,e.clientY-o.top-72),i=`developer-ai-fabric.canvas.${Vt()}`;let c={};try{c=JSON.parse(localStorage.getItem(i)||"{}")}catch{c={}}c[t]={x:r,y:a},localStorage.setItem(i,JSON.stringify(c))}function Vt(){return d.workflowForm?.elements?.id?.value||l.workflows[0]?.id||"agentic-workflow"}function Gt(t){const e=j(t);l.workflowDraftSteps=[...l.workflowDraftSteps,e],l.selectedWorkflowStepId=e.id}function j(t){const e=l.workflowDraftSteps.length;return{id:Xt([...l.workflowDraftSteps.map(o=>o.agent),t],t,e),agent:t,dependsOn:[]}}function Qt(t){l.selectedWorkflowStepId=t==="__start"?null:t,w()}function zt(t,e){if(!t||!e||t===e)return;if(t==="__start"){l.workflowDraftSteps=l.workflowDraftSteps.map(o=>o.id===e?{...o,dependsOn:["__start"]}:o),l.selectedWorkflowStepId=e,w(),v(d,`Connected Start to ${e}.`);return}let n=!1;l.workflowDraftSteps=l.workflowDraftSteps.map(o=>{if(o.id!==e)return o;const r=new Set(o.dependsOn||[]);return r.has(t)?(r.delete(t),n=!0):r.add(t),{...o,dependsOn:Array.from(r)}}),l.selectedWorkflowStepId=e,w(),v(d,`${n?"Removed connection":"Connected"} ${t} ${n?"from":"to"} ${e}.`)}function Zt(){if(l.workflowDraftSteps.length===0)throw new Error("Workflow must include at least one step.");const t=new Set(l.workflowDraftSteps.map(e=>e.id));for(const e of l.workflowDraftSteps)for(const n of e.dependsOn||[]){if(n!=="__start"&&!t.has(n))throw new Error(`Unknown dependency: ${n}`);if(n===e.id)throw new Error(`Step cannot depend on itself: ${e.id}`)}if(te(l.workflowDraftSteps))throw new Error("Workflow dependency graph contains a cycle.")}function te(t){const e=new Set(t.map(i=>i.id)),n=new Map(t.map(i=>[i.id,0])),o=new Map;for(const i of t)for(const c of i.dependsOn||[])c==="__start"||!e.has(c)||(n.set(i.id,n.get(i.id)+1),o.set(c,[...o.get(c)||[],i.id]));const r=[...n.entries()].filter(([,i])=>i===0).map(([i])=>i);let a=0;for(;r.length>0;){const i=r.shift();a+=1;for(const c of o.get(i)||[]){const u=n.get(c)-1;n.set(c,u),u===0&&r.push(c)}}return a!==t.length}function L(t){return String(t||"").split(",").map(e=>e.trim()).filter(Boolean)}
