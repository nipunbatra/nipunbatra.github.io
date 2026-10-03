/* How CLIP Learns — no runtime dependencies.
   Numerical functions are pure; the renderer only consumes clipLoss() output. */
'use strict';

// 1. DATASET: the first three outputs are the exact toy vectors in the brief.
const DATASET = [
  {name:'cat',caption:'a photo of a cat',color:'#b65338',image:[2,.5,.2],text:[1.6,.8,.4]},
  {name:'dog',caption:'a photo of a dog',color:'#247b7f',image:[.4,2,.1],text:[.7,1.4,.3]},
  {name:'car',caption:'a photo of a car',color:'#616bb0',image:[.2,.3,2],text:[.4,.5,1.5]},
  {name:'bicycle',caption:'a bicycle',color:'#7a8d66',image:[1.5, -0.3, 0.9],text:[1.1, -0.5, 1.2]},
  {name:'airplane',caption:'an airplane',color:'#748b9a',image:[-0.7, 1.3, 1.2],text:[-0.3, 1.6, 0.8]},
  {name:'tree',caption:'a tree',color:'#648260',image:[-1.7, 0.4, 0.7],text:[-1.2, 0.9, 0.9]},
  {name:'shoe',caption:'a shoe',color:'#b69168',image:[-0.4, -1.6, 0.6],text:[-0.8, -1.3, 0.8]},
  {name:'mug',caption:'a mug',color:'#9e7f65',image:[0.8, -1.1, -0.9],text:[1.1, -0.7, -0.6]},
  {name:'banana',caption:'a banana',color:'#b7a54c',image:[1.2, 0.8, -1.1],text:[1.5, 0.4, -0.8]},
  {name:'chair',caption:'a chair',color:'#9b8068',image:[-1.1, 0.8, -1.3],text:[-0.8, 1.2, -1.0]},
  {name:'building',caption:'a building',color:'#7a8797',image:[-0.7, -0.9, -1.5],text:[-0.4, -1.3, -1.1]},
  {name:'bird',caption:'a bird',color:'#7d9290',image:[0.4, 0.5, -1.8],text:[0.8, 0.7, -1.3]}
];
const STAGES = [
  ['data','DATA','THE DATA','How CLIP learns.','Start with an image and its caption. What should make these two representations a good match?','We will calculate the contrastive loss, then use it to update the vectors.'],
  ['batch','BATCH','THE MINIBATCH','Compare every image with every caption.','Pick a few matched pairs. Within this batch, each image competes for its caption.','A batch of N pairs produces N² comparisons. Only N are matched pairs.'],
  ['encode','ENCODE','TWO ENCODERS','Turn images and captions into vectors.','The image encoder and text encoder put their inputs into the same embedding space.','Our toy vectors have three coordinates so we can follow the arithmetic.'],
  ['normalize','NORMALIZE','L2 NORMALIZATION','Give each vector a length of one.','Divide by the L2 norm. The vector keeps its direction, but its length becomes 1.','Click an image or text vector to see each division.'],
  ['similarity','SIMILARITY','PAIRWISE SIMILARITY','Calculate how closely two vectors point.','The dot product of two unit vectors is their cosine similarity. Each cell compares one image with one caption.','The diagonal contains the correct matches. Their scores should beat the alternatives.'],
  ['temperature','TEMPERATURE','FROM SCORES TO LOGITS','Scale the scores before softmax.','Divide each similarity by temperature τ. These scaled scores are the logits.','A smaller temperature makes differences between scores more pronounced.'],
  ['image-text','I → T','IMAGE → TEXT','Which caption belongs to this image?','Choose a row. Its captions compete through softmax, and the correct caption’s probability determines the penalty.','A high probability for the paired caption gives a small negative-log penalty.'],
  ['text-image','T → I','TEXT → IMAGE','Which image belongs to this caption?','Now choose a column. The images compete for one caption, using the same logits.','The scores stay put. The softmax denominator now runs down the column.'],
  ['loss','LOSS','THE SYMMETRIC OBJECTIVE','Average the two retrieval losses.','First average the penalties for each direction. The CLIP loss is the mean of those two averages.','Both tasks matter: finding the caption for an image and the image for a caption.'],
  ['optimize','OPTIMIZE','FOLLOW THE GRADIENT','Use the loss to update the vectors.','Watch one update, then pick another batch. Each pair keeps the changes made when it was last sampled.','Real CLIP updates both encoders. We update these small vectors directly.'],
  ['align','ALIGN','WATCH IT LEARN','Keep learning from new batches.','Follow the selected pairs through each update. After one pass through all 12 pairs, shuffle and start the next epoch.','The current batch changes. The progress chart always evaluates all 12 pairs.']
];
const PROMPTS = [
  ['Start here','Pick a batch and follow its pairs through the calculation.','Pick a batch'],
  ['Try a mismatch','Compare the first image with a caption from a different pair.','Select a negative'],
  ['Follow a caption','Look at the coordinates that the text encoder produces.','Inspect T₁'],
  ['Work through one vector','Select T₁ and check how each coordinate is divided by its norm.','Normalize T₁'],
  ['Build one score','Follow I₁ and T₂ into an off-diagonal dot product.','Trace I₁ × T₂'],
  ['Change one setting','Try τ = 0.07. The pair order stays the same while score differences grow.','Try τ = 0.07'],
  ['Read across a row','Follow an incorrect caption’s probability back to its logit.','Trace a competitor'],
  ['Read down a column','Keep T₁ fixed and compare its candidate images.','Trace a competitor'],
  ['Connect the calculation','Trace the final loss back through both directions to the original pairs.','Trace the loss'],
  ['Take your time','One click selects a batch and applies one gradient update.','Take one step'],
  ['Watch the next batch','Play shows which pairs are picked before each update. Pause to inspect any number.','Play / pause']
];

// 2. MATH: numerically stable forward pass and exact analytical gradients.
const dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0);
const norm=a=>Math.sqrt(dot(a,a));
function l2Normalize(a){const n=norm(a);if(n<1e-12)throw new Error('Cannot normalize a zero vector.');return a.map(x=>x/n);}
const transpose=a=>a[0].map((_,j)=>a.map(row=>row[j]));
const matmul=(a,b)=>a.map(row=>transpose(b).map(col=>dot(row,col)));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const copy=a=>a.map(row=>row.slice());
function softmax(a){const m=Math.max(...a),e=a.map(x=>Math.exp(x-m)),z=e.reduce((s,x)=>s+x,0);return e.map(x=>x/z);}
const rowSoftmax=a=>a.map(softmax);
const columnSoftmax=a=>transpose(rowSoftmax(transpose(a)));
function logSumExp(a){const m=Math.max(...a);return m+Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0));}
// Evaluate cross-entropy from logits to avoid log(0) for confident predictions.
const crossEntropy=(logits,target)=>logSumExp(logits)-logits[target];
function clipLoss(images,texts,tau=.5){
  if(images.length!==texts.length||images.length<1||tau<=0)throw new Error('Invalid batch or temperature.');
  const n=images.length,EI=images.map(l2Normalize),ET=texts.map(l2Normalize);
  const S=matmul(EI,transpose(ET)),L=S.map(row=>row.map(x=>x/tau));
  const P=rowSoftmax(L),Q=columnSoftmax(L),LT=transpose(L);
  const rowLosses=L.map((row,i)=>crossEntropy(row,i));
  const colLosses=LT.map((col,j)=>crossEntropy(col,j));
  const imageLoss=mean(rowLosses),textLoss=mean(colLosses);
  const exp=L.map(row=>row.map(Math.exp));
  const rowDen=exp.map(row=>row.reduce((s,x)=>s+x,0));
  const colDen=transpose(exp).map(col=>col.reduce((s,x)=>s+x,0));
  const positives=S.map((row,i)=>row[i]),negatives=S.flatMap((row,i)=>row.filter((_,j)=>i!==j));
  return {n,EI,ET,S,L,P,Q,exp,rowDen,colDen,rowLosses,colLosses,imageLoss,textLoss,loss:(imageLoss+textLoss)/2,positive:mean(positives),negative:negatives.length?mean(negatives):0};
}
function gradients(images,texts,tau=.5){
  const m=clipLoss(images,texts,tau),n=m.n;
  // G = 1/2 [(P - identity)/N + (Q - identity)/N]. Q is column-normalized.
  const G=m.P.map((row,i)=>row.map((p,j)=>(p+m.Q[i][j]-2*Number(i===j))/(2*n)));
  const dEI=matmul(G,m.ET).map(row=>row.map(x=>x/tau));
  const dET=matmul(transpose(G),m.EI).map(row=>row.map(x=>x/tau));
  // Jacobian-vector product for u=x/||x||: dL/dx=(g-u*(u dot g))/||x||.
  const throughNorm=(raw,unit,g)=>raw.map((x,i)=>g[i].map((v,k)=>(v-unit[i][k]*dot(unit[i],g[i]))/norm(x)));
  return {images:throughNorm(images,m.EI,dEI),texts:throughNorm(texts,m.ET,dET),G};
}
function trainingStep(images,texts,tau=.5,learningRate=.25){
  const g=gradients(images,texts,tau);
  const next=(raw,grad)=>raw.map((row,i)=>row.map((x,k)=>x-learningRate*grad[i][k]));
  const nextImages=next(images,g.images),nextTexts=next(texts,g.texts);
  return {images:nextImages,texts:nextTexts,metrics:clipLoss(nextImages,nextTexts,tau),gradients:g};
}
function makeEpochOrder(epoch=1, first=[]){
  const ids=Array.from({length:DATASET.length},(_,i)=>i);
  if(epoch===1){const prefix=[...new Set(first)];return [...prefix,...ids.filter(i=>!prefix.includes(i))];}
  let seed=(0x9e3779b9 ^ epoch)>>>0;
  const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids;
}
function runMathSanityChecks(){
  let checks=0;const assert=(ok,message)=>{if(!ok)throw new Error(message);checks++;};
  const close=(a,b,eps=1e-9)=>Math.abs(a-b)<eps;
  const images=DATASET.slice(0,3).map(d=>d.image),texts=DATASET.slice(0,3).map(d=>d.text);
  for(const tau of [.05,.07,.5,1])for(const n of [2,3]){
    const I=images.slice(0,n),T=texts.slice(0,n),m=clipLoss(I,T,tau);
    [...m.EI,...m.ET].forEach(v=>assert(close(norm(v),1),'Unit norm'));
    assert(m.S.length===n&&m.S.every(r=>r.length===n),'Matrix shape');
    m.P.forEach(row=>assert(close(row.reduce((s,x)=>s+x,0),1),'Row sum'));
    transpose(m.Q).forEach(col=>assert(close(col.reduce((s,x)=>s+x,0),1),'Column sum'));
    assert(close(m.loss,(m.imageLoss+m.textLoss)/2),'Symmetric loss');
    assert(trainingStep(I,T,tau,.01).metrics.loss<m.loss,'Small step lowers loss');
    const grad=gradients(I,T,tau),epsilon=1e-5;
    // Finite differences independently validate all coordinates of BOTH modalities.
    for(const modality of ['images','texts'])for(let i=0;i<n;i++)for(let k=0;k<3;k++){
      const a=copy(I),b=copy(T),target=modality==='images'?a:b;
      target[i][k]+=epsilon;const plus=clipLoss(a,b,tau).loss;
      target[i][k]-=2*epsilon;const minus=clipLoss(a,b,tau).loss;
      assert(close((plus-minus)/(2*epsilon),grad[modality][i][k],2e-7),`Gradient ${modality} ${i} ${k}`);
    }
  }
  assert(softmax([10000,10001]).every(Number.isFinite),'Stable softmax');
  const result={passed:true,checks,initialLoss:clipLoss(images,texts,.5).loss};
  console.info('CLIP math sanity checks passed',result);return result;
}
const ClipMath={DATASET,makeEpochOrder,dot,l2Normalize,matmul,softmax,rowSoftmax,columnSoftmax,crossEntropy,clipLoss,gradients,trainingStep,runMathSanityChecks};
if(typeof module!=='undefined')module.exports=ClipMath;
if(typeof document!=='undefined')initializeApp();

function initializeApp(){
  // 3. STATE: every visible calculation derives from current, computed once per update.
  const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
  const sub=n=>String(n).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]);
  const label=(kind,i)=>kind+sub(i+1);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={stage:0,n:3,order:[0,1,2],images:[],texts:[],tau:.5,lr:.25,decimals:3,selected:[0,0],vector:['I',0],direction:'row',focus:false,expanded:false,step:0,history:[],playing:false,speed:1,autoplay:false,yaw:-.6,pitch:.34,poolImages:[],poolTexts:[],epoch:1,epochOrder:[],batchCursor:0,stepsInBatch:0,rotateBatches:true,phase:'ready',visited:[],lastUpdate:null};
  let current,initial,playTimer,storyTimer,traceTimers=[];
  let pairNodes=[],matrix,geometry,beforeMatrix,afterMatrix,beforeGeometry,afterGeometry,liveRow,liveColumn;
  const f=x=>{const v=Math.abs(x)<.5*10**(-state.decimals)?0:x;return v.toFixed(state.decimals);};
  const vec=a=>'['+a.map(f).join(', ')+']';
  const fmtExp=x=>state.decimals===8&&x>1e5?x.toExponential(5):f(x);
  const activeData=()=>state.order.slice(0,state.n).map(i=>DATASET[i]);
  const setVisible=(id,show)=>{$(id).hidden=!show;};
  const announcement=text=>{$('announcement').textContent=text;};
  const makeSvg=(name,attributes={})=>{const el=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attributes))el.setAttribute(k,v);return el;};

  // 4. ORIGINAL VECTOR ILLUSTRATIONS: kept local, legible, and independent of fonts.
  const drawings={
    cat:'<path d="M20 32 17 12 32 23Q40 19 48 23L63 12 60 33Q68 59 41 64Q12 61 20 32Z" fill="currentColor" opacity=".75"/><path d="m26 36 7 2m15 0 7-2M38 46l4 4 4-4m-4 4v6m-17-8 10 2m-9 5 9-2m14-3 10-2m-10 5 10 2" fill="none" stroke="#fff9ee" stroke-width="2.5"/><circle cx="31" cy="38" r="2" fill="#3c4336"/><circle cx="52" cy="38" r="2" fill="#3c4336"/>',
    dog:'<path d="M22 24Q40 10 57 24L59 53Q42 71 23 54Z" fill="#bf9b74"/><path d="M23 22Q4 18 11 50L24 45M57 22Q77 17 70 49L57 44" fill="currentColor"/><ellipse cx="41" cy="48" rx="12" ry="11" fill="#f6e8cc"/><path d="m35 43 13 0-6 7Z" fill="#435047"/><circle cx="30" cy="33" r="2.5" fill="#435047"/><circle cx="53" cy="33" r="2.5" fill="#435047"/>',
    car:'<path d="m12 39 9-17h34l13 17 5 3v17H8V44Z" fill="currentColor" opacity=".85"/><path d="m26 26-6 13h38L49 26Z" fill="#e9edeb"/><path d="M39 26v13" stroke="currentColor" stroke-width="3"/><rect x="11" y="44" width="9" height="5" rx="2" fill="#e9dba1"/><rect x="60" y="44" width="9" height="5" rx="2" fill="#e9dba1"/><circle cx="23" cy="57" r="8" fill="#3d4846"/><circle cx="59" cy="57" r="8" fill="#3d4846"/><circle cx="23" cy="57" r="3" fill="#ced6d1"/><circle cx="59" cy="57" r="3" fill="#ced6d1"/>',
    bicycle:'<g fill="none" stroke="currentColor" stroke-width="3"><circle cx="21" cy="53" r="14"/><circle cx="61" cy="53" r="14"/><path d="m21 53 13-25 14 25H21l27-21 13 21-9-32h10M29 26h14"/></g>',
    airplane:'<path d="m7 43 26-9 2-23q5-7 10 0l2 23 26 9v7L47 45l-2 17 10 8H26l10-8-2-17L7 50Z" fill="currentColor"/>',
    tree:'<path d="M37 41h8v29h-8z" fill="#a18562"/><path d="M40 8 15 41h12L12 54h57L54 40h11Z" fill="currentColor"/><path d="M40 22v34" stroke="#d0d6b4" stroke-width="2"/>',
    shoe:'<path d="M11 22h18q0 13 18 17l20 7q9 3 8 14H8q-4-16 3-38Z" fill="currentColor"/><path d="M8 57h68v8H8Z" fill="#e3dcc8"/><path d="m32 30 7-2m-3 8 7-2m-2 8 7-3" stroke="#fff9ee" stroke-width="3"/>',
    mug:'<path d="M57 28h9q18 14-1 26h-9" fill="none" stroke="currentColor" stroke-width="6"/><path d="M15 23h45v35q-1 13-23 13T15 58Z" fill="currentColor"/><ellipse cx="37" cy="24" rx="22" ry="5" fill="#ded2b4"/><path d="M30 16q-7-6 0-11m15 11q-7-6 0-11" fill="none" stroke="#aaa995" stroke-width="2"/>',
    banana:'<path d="M62 12Q85 69 21 70L10 61Q54 66 59 14Z" fill="#d9c068"/><path d="M15 62q39-1 48-42" fill="none" stroke="currentColor" stroke-width="2"/><path d="m59 15 2-8 5 1-2 9M12 59l-5 2 4 6" fill="#81734c"/>',
    chair:'<path d="M20 11h40v35H20zM17 47h47v9H17z" fill="currentColor"/><path d="M23 53v20m35-20v20M25 18v20m10-20v20m10-20v20m10-20v20" stroke="currentColor" stroke-width="5"/><path d="M28 16v25m12-25v25m12-25v25" stroke="#f5f2e8" stroke-width="3"/>',
    building:'<path d="M16 10h49v64H16Z" fill="currentColor"/><g fill="#e9eadf"><path d="M23 19h10v10H23zm22 0h10v10H45zM23 37h10v10H23zm22 0h10v10H45zM35 56h11v18H35Z"/></g>',
    bird:'<path d="M15 37q8 3 15 0 3-26 26-21 14 3 12 21-2 26-26 26-20 0-27-26Z" fill="currentColor"/><path d="m66 25 12 6-12 7" fill="#c8a064"/><path d="M32 35q22-5 14 16-13 6-14-16Z" fill="#d1dad0"/><circle cx="57" cy="26" r="2.5" fill="#33483e"/><path d="m36 63-3 10m14-10 3 10" stroke="#9f855f" stroke-width="2"/>'
  };
  function illustration(d){return `<svg class="illustration" viewBox="0 0 82 82" role="img" aria-label="${d.name} illustration" style="color:${d.color}"><rect x="1" y="1" width="80" height="80" rx="17" fill="${d.color}" opacity=".07"/>${drawings[d.name]}</svg>`;}

  // 5. REUSABLE SVG MATRIX. Cell nodes survive stage and temperature changes.
  class Matrix{
    constructor(host,interactive=true){this.host=host;this.interactive=interactive;this.cells=[];this.n=0;this.frame=0;this.svg=null;}
    build(n){
      this.n=n;this.cells=[];this.host.replaceChildren();this.svg=makeSvg('svg',{viewBox:'0 0 440 330',role:'group','aria-label':'Image rows and text columns'});this.host.append(this.svg);
      const axis=makeSvg('text',{x:254,y:19,'text-anchor':'middle',class:'matrix-axis'});axis.textContent='TEXT CANDIDATES';this.svg.append(axis);
      this.labels=[];
      const cw=326/n,ch=235/n;
      for(let j=0;j<n;j++){const t=makeSvg('text',{x:89+(j+.5)*cw,y:44,'text-anchor':'middle',class:'matrix-label'});this.svg.append(t);this.labels.push({node:t,kind:'T',idx:j});}
      for(let i=0;i<n;i++){
        const t=makeSvg('text',{x:64,y:59+(i+.5)*ch+5,'text-anchor':'end',class:'matrix-label'});this.svg.append(t);this.labels.push({node:t,kind:'I',idx:i});
        for(let j=0;j<n;j++){
          const group=makeSvg('g',{class:'matrix-cell'+(i===j?' diagonal':''),'data-i':i,'data-j':j,tabindex:this.interactive?'0':'-1',role:this.interactive?'button':'img'});
          const rect=makeSvg('rect',{x:89+j*cw+3,y:59+i*ch+3,width:cw-6,height:ch-6,rx:7,fill:'#eff3e8'});
          const number=makeSvg('text',{x:89+(j+.5)*cw,y:59+(i+.5)*ch+2,'text-anchor':'middle'});
          const small=makeSvg('text',{x:89+(j+.5)*cw,y:59+(i+.5)*ch+20,'text-anchor':'middle',class:'cell-sub'});
          group.append(rect,number,small);this.svg.append(group);
          const cell={i,j,group,rect,number,small,value:0};this.cells.push(cell);
          if(this.interactive){group.addEventListener('pointerenter',()=>selectCell(i,j,false));group.addEventListener('focus',()=>selectCell(i,j,false));group.addEventListener('click',()=>selectCell(i,j,true));group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCell(i,j,true);}});}
        }
      }
      const bottom=makeSvg('text',{x:252,y:320,'text-anchor':'middle',class:'matrix-axis'});bottom.textContent='DIAGONAL = PAIRED PARTNERS';this.svg.append(bottom);
    }
    update(values,{kind='S',mode='values',animate=true,selection=true}={}){
      if(this.n!==values.length)this.build(values.length);
      const data=activeData();this.labels.forEach(l=>{l.node.textContent=label(l.kind,l.idx);l.node.style.fill=data[l.idx].color;});
      cancelAnimationFrame(this.frame);const start=performance.now(),duration=reduced||!animate?0:260;
      const starts=this.cells.map(c=>c.value);
      this.cells.forEach((c,k)=>{
        const v=values[c.i][c.j];c.target=v;
        const strength=kind==='S'?(v+1)/2:kind==='L'?(v*state.tau+1)/2:v;
        c.rect.setAttribute('fill',mode==='matches'?(c.i===c.j?'#dfe9cb':'#f0f2ed'):`color-mix(in srgb, #b0c785 ${Math.round(12+60*Math.max(0,Math.min(1,strength)))}%, #fafbf7)`);
        c.small.textContent=mode==='matches'?(c.i===c.j?'positive':'negative'):(c.i===c.j?'correct pair':`${label('I',c.i)} · ${label('T',c.j)}`);
        c.number.style.fontSize=state.decimals>5?'13px':state.decimals>3?'18px':'23px';
        c.group.setAttribute('aria-label',`${label('I',c.i)} ${data[c.i].name}, ${label('T',c.j)} ${data[c.j].caption}, ${kind} ${v.toFixed(8)}${c.i===c.j?', correct pair':''}`);
      });
      const tick=now=>{const t=duration?Math.min(1,(now-start)/duration):1,ease=1-(1-t)**3;this.cells.forEach((c,k)=>{c.value=starts[k]+(c.target-starts[k])*ease;c.number.textContent=mode==='matches'?`${label('I',c.i)}↔${label('T',c.j)}`:f(c.value);if(mode==='matches')c.number.style.fontSize='17px';});if(t<1)this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
      if(selection)this.highlight();
    }
    highlight(){const [i,j]=state.selected;this.cells.forEach(c=>{c.group.classList.toggle('selected',c.i===i&&c.j===j);const match=state.direction==='row'?c.i===i:c.j===j;c.group.classList.toggle('dimmed',(state.focus||[6,7].includes(state.stage))&&!match);});}
    pulseDiagonal(i){this.cells.filter(c=>c.i===c.j&&(i===undefined||c.i===i)).forEach(c=>{c.group.classList.remove('trace-flash');void c.group.getBoundingClientRect();c.group.classList.add('trace-flash');});}
  }

  // 6. GEOMETRY: draggable orthographic 3D projection drawn with SVG.
  class Geometry{
    constructor(host){this.host=host;this.svg=makeSvg('svg',{viewBox:'0 0 260 226',class:'geometry-svg',role:'img','aria-label':'Rotatable three dimensional embedding vectors',tabindex:'0'});host.replaceChildren(this.svg);this.data=null;let drag=null;
      this.svg.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];this.svg.setPointerCapture(e.pointerId);});
      this.svg.addEventListener('pointermove',e=>{if(!drag)return;state.yaw+=(e.clientX-drag[0])*.012;state.pitch=Math.max(-1.4,Math.min(1.4,state.pitch+(e.clientY-drag[1])*.01));drag=[e.clientX,e.clientY];renderGeometry();});
      this.svg.addEventListener('pointerup',()=>{drag=null;});this.svg.addEventListener('pointercancel',()=>{drag=null;});
      this.svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();state.yaw+=(e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0);state.pitch+=(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0);renderGeometry();});
    }
    project(v){const c=Math.cos(state.yaw),s=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);const x=v[0]*c-v[2]*s,z=v[0]*s+v[2]*c,y=v[1]*cp-z*sp;return [130+80*x,119-80*y,v[1]*sp+z*cp];}
    update(data){this.data=data;this.svg.replaceChildren();const ring=makeSvg('circle',{cx:130,cy:119,r:80,fill:'#f4f6ef',stroke:'#dce3d4'});this.svg.append(ring);
      for(let axis=0;axis<3;axis++){
        const points=[];for(let k=0;k<=64;k++){const v=[0,0,0];v[(axis+1)%3]=Math.cos(k*Math.PI/32);v[(axis+2)%3]=Math.sin(k*Math.PI/32);points.push(this.project(v));}
        this.svg.append(makeSvg('path',{d:points.map((p,k)=>(k?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '),fill:'none',stroke:'#dde3d5','stroke-width':.8}));
        const v=[0,0,0];v[axis]=1.15;const p=this.project(v);this.svg.append(makeSvg('line',{x1:130,y1:119,x2:p[0],y2:p[1],stroke:'#b9c6ac','stroke-width':1}));const t=makeSvg('text',{x:p[0]+4,y:p[1]+4,fill:'#8e9b83','font-size':9});t.textContent=['x','y','z'][axis];this.svg.append(t);
      }
      const list=[];for(let i=0;i<data.n;i++)for(const kind of ['I','T'])list.push({i,kind,p:this.project(kind==='I'?data.EI[i]:data.ET[i])});
      list.sort((a,b)=>a.p[2]-b.p[2]).forEach(({i,kind,p})=>{const color=activeData()[i].color;const line=makeSvg('line',{x1:130,y1:119,x2:p[0],y2:p[1],stroke:color,'stroke-width':kind==='I'?2.6:1.8,'stroke-dasharray':kind==='T'?'4 3':'none'});this.svg.append(line);const marker=kind==='I'?makeSvg('circle',{cx:p[0],cy:p[1],r:3.5,fill:color}):makeSvg('rect',{x:p[0]-3,y:p[1]-3,width:6,height:6,fill:'#fff',stroke:color,'stroke-width':1.7});this.svg.append(marker);const t=makeSvg('text',{x:p[0]+(kind==='I'?-5:5),y:p[1]+(kind==='I'?-9:14),'text-anchor':kind==='I'?'end':'start',fill:color,'font-size':11});t.textContent=label(kind,i);this.svg.append(t);});
      this.svg.append(makeSvg('circle',{cx:130,cy:119,r:2.5,fill:'#58684b'}));
    }
  }

  function syncActiveVectors(){
    state.images=state.order.slice(0,state.n).map(id=>state.poolImages[id].slice());
    state.texts=state.order.slice(0,state.n).map(id=>state.poolTexts[id].slice());
  }
  function snapshot(){return {images:copy(state.poolImages),texts:copy(state.poolTexts)};}
  function resetVectors(){
    state.poolImages=DATASET.map(d=>d.image.slice());state.poolTexts=DATASET.map(d=>d.text.slice());
    state.epoch=1;state.epochOrder=makeEpochOrder(1,state.order.slice(0,state.n));state.batchCursor=0;
    state.order=state.epochOrder.slice(0,state.n);state.stepsInBatch=0;state.visited=[];state.lastUpdate=null;state.phase='ready';
    syncActiveVectors();state.step=0;state.history=[snapshot()];state.selected=[0,0];state.vector=['I',0];recompute();
  }
  function recompute(){
    current=clipLoss(state.images,state.texts,state.tau);
    const data=activeData();initial=clipLoss(data.map(d=>d.image),data.map(d=>d.text),state.tau);
  }
  function advanceBatch(){
    state.batchCursor+=state.n;
    if(state.batchCursor>=DATASET.length){state.epoch++;state.epochOrder=makeEpochOrder(state.epoch);state.batchCursor=0;state.visited=[];}
    state.order=state.epochOrder.slice(state.batchCursor,state.batchCursor+state.n);
    state.stepsInBatch=0;state.lastUpdate=null;state.selected=[0,0];state.vector=['I',0];state.phase='picked';
    syncActiveVectors();recompute();sourceCards();
    announcement(`Epoch ${state.epoch}. Batch ${state.batchCursor/state.n+1}: ${activeData().map(d=>d.name).join(', ')}.`);
  }
  function nextBatch(){pause();cancelTrace();advanceBatch();renderAll();pulseBatch();}
  function pulseBatch(){if(!reduced)pairNodes.forEach((node,i)=>node.animate([{opacity:.3,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:i*65}));}
  function renderBatchJourney(){
    const visible=state.stage===1||state.stage>=9;setVisible('batch-journey',visible);if(!visible)return;
    const ids=state.order.slice(0,state.n),batches=DATASET.length/state.n,updating=state.phase==='updated';
    $('batch-counter').textContent=`Epoch ${state.epoch} · batch ${state.batchCursor/state.n+1} of ${batches}`;
    $('batch-pool').querySelectorAll('[data-pool-id]').forEach(el=>{const id=+el.dataset.poolId,idx=ids.indexOf(id);el.classList.toggle('in-batch',idx>=0);el.classList.toggle('seen',state.visited.includes(id));el.querySelector('.pool-state').textContent=idx>=0?`${label('I',idx)} ↔ ${label('T',idx)}`:state.visited.includes(id)?'visited':'waiting';});
    $('batch-selection').textContent=activeData().map(d=>d.name).join(' + ');
    $('batch-progress').textContent=`${state.visited.length} / ${DATASET.length} pairs visited this epoch`;
    $('batch-phase').textContent=state.stage===1?'Selected for this calculation':updating?'Updated these pairs':state.playing?'Picking the next batch':'Ready to compare';
    $('batch-journey').dataset.phase=state.phase;
    const nextCursor=state.batchCursor+state.n,nextIds=nextCursor<DATASET.length?state.epochOrder.slice(nextCursor,nextCursor+state.n):makeEpochOrder(state.epoch+1).slice(0,state.n);
    $('up-next').textContent='Next: '+nextIds.map(id=>DATASET[id].name).join(', ');
    setVisible('rotate-batch-label',state.stage>=9);$('rotate-batches').checked=state.rotateBatches;
    $('batch-explanation').textContent=state.stage===1?`Only these ${state.n} pairs enter the matrix below. Each pair stays together when the dataset is shuffled.`:state.rotateBatches?'Each update picks another batch. The chart evaluates all 12 pairs, using the same candidates every time.':'This batch stays selected while you train. Turn on new batches to continue through the dataset.';
  }
  function sourceCards(){
    const data=activeData();$('source-pairs').dataset.ids=state.order.slice(0,state.n).join(',');$('source-pairs').innerHTML=data.map((d,i)=>`<div class="source-card" style="--pair:${d.color}" data-source="${i}"><div class="source-pair-top">${illustration(d)}<div><div class="pair-name">${label('I',i)} ↔ ${label('T',i)} · ${d.name}</div><div class="pair-caption">“${d.caption}”</div></div></div><div class="source-vectors"><button class="vector-button" data-vector="I,${i}"></button><button class="vector-button" data-vector="T,${i}"></button><span class="unit-badge"></span></div></div>`).join('');
    pairNodes=[...$('source-pairs').children];$('source-pairs').querySelectorAll('[data-vector]').forEach(b=>b.addEventListener('click',()=>{const [kind,k]=b.dataset.vector.split(',');state.vector=[kind,+k];state.selected=kind==='I'?[+k,state.selected[1]]:[state.selected[0],+k];renderSelection();}));
  }
  function renderSources(){
    if(pairNodes.length!==state.n||$('source-pairs').dataset.ids!==state.order.slice(0,state.n).join(','))sourceCards();const normalized=state.stage>=3;
    pairNodes.forEach((node,i)=>{node.querySelector('.source-vectors').hidden=state.stage<2||(state.stage>=9&&!state.expanded);node.querySelectorAll('[data-vector]').forEach(b=>{const kind=b.dataset.vector[0],v=kind==='I'?(normalized?current.EI:state.images):(normalized?current.ET:state.texts);b.textContent=`${label(kind,i)} ${vec(v[i])}`;b.classList.toggle('selected',(kind==='I'?state.selected[0]:state.selected[1])===i);});node.querySelector('.unit-badge').textContent=normalized?'‖I‖ = ‖T‖ = 1 ✓':'';node.classList.toggle('linked',state.selected.includes(i));node.style.opacity=state.focus&&!state.selected.includes(i)?'.35':'1';});
    $('source-title').textContent=state.stage>=3?'NORMALIZED VECTORS':state.stage===2?'ENCODER INPUTS':'THE MINIBATCH';$('batch-badge').textContent=`N = ${state.n}`;
    setVisible('batch-controls',state.stage===1);
    $('source-note').textContent=state.stage===1?'The selected image and caption stay together. I₁ and T₁ refer to the first pair in this batch.':state.stage===2?'Raw toy encoder outputs. Real CLIP has much larger embedding dimensions.':`Color identifies a pair; I is an image and T is its caption. ${state.stage>=4?'Select a matrix cell to trace both vectors.':''}`;
    setVisible('geometry-wrap',[3,4,5,9,10].includes(state.stage));
  }
  function renderVectorView(){
    const normalized=state.stage===3;
    $('vector-view').innerHTML=`<div class="vector-matrices">${['I','T'].map(kind=>`<div>${!normalized?`<div class="encoder-block">${kind==='I'?'Image':'Text'} encoder</div><div style="height:20px"></div>`:''}<h3 class="equation">${normalized?'E<sub>'+kind+'</sub>':kind+' vectors'} <small>∈ ℝ<sup>${state.n}×3</sup></small></h3><div class="vector-bracket">${activeData().map((d,i)=>`<button style="--pair:${d.color}" class="${state.vector[0]===kind&&state.vector[1]===i?'selected':''}" data-select-vector="${kind},${i}">${label(kind,i)}<br>${vec((normalized?(kind==='I'?current.EI:current.ET):(kind==='I'?state.images:state.texts))[i])}</button>`).join('')}</div>${normalized?'<p class="small-note">Each row has norm 1 ✓</p>':''}</div>`).join('')}</div>`;
    $('vector-view').querySelectorAll('[data-select-vector]').forEach(b=>b.onclick=()=>{const [kind,k]=b.dataset.selectVector.split(',');state.vector=[kind,+k];state.selected=kind==='I'?[+k,state.selected[1]]:[state.selected[0],+k];renderSelection();});
  }
  function matrixConfig(){
    const s=state.stage,dir=state.direction==='row';
    if(s===1)return {values:current.S,title:'ALL PAIRWISE COMPARISONS',equation:`${state.n} images × ${state.n} texts = ${state.n**2} comparisons`,caption:`${state.n} positive pairs · ${state.n**2-state.n} in-batch negatives`,mode:'matches',kind:'S'};
    if(s===2||s===3)return {title:s===2?'RAW ENCODER OUTPUTS':'NORMALIZED EMBEDDING MATRICES',equation:s===2?'Image + text → ℝ³':'x̂ = x / ‖x‖₂',caption:s===2?'The coordinates below are toy outputs, not measurements from a pretrained CLIP.':'Normalization changes length, not direction.'};
    if(s===4||s>=9)return {values:current.S,title:'COSINE SIMILARITY',equation:'S = Eᵢ Eₜᵀ',caption:'Click any cell · outlined diagonal = correct image/caption pairs',kind:'S'};
    if(s===5)return {values:current.L,title:'TEMPERATURE-SCALED LOGITS',equation:`L = S / τ = S / ${state.tau.toFixed(2)}`,caption:'Each cell still compares the same image and caption.',kind:'L'};
    return {values:dir?current.P:current.Q,title:dir?'ROW SOFTMAX · P(T | I)':'COLUMN SOFTMAX · Q(I | T)',equation:dir?'Each row sums to 1 →':'Each column sums to 1 ↓',caption:dir?'Fix an image. All captions in this row compete.':'Fix a caption. All images in this column compete.',kind:dir?'P':'Q'};
  }
  function renderMatrix(animate=true){
    const c=matrixConfig();$('matrix-title').textContent=c.title||'';$('matrix-equation').textContent=c.equation||'';$('matrix-caption').textContent=c.caption||'';
    setVisible('main-matrix',![2,3].includes(state.stage));setVisible('vector-view',[2,3].includes(state.stage));
    if(c.values)matrix.update(c.values,{...c,animate});else renderVectorView();
    setVisible('direction-switch',state.stage>=6&&state.stage<=8);
    document.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.direction===state.direction)));
    setVisible('temperature-control',state.stage===5);
    $('temperature-value').textContent=state.tau.toFixed(2);$('temperature').value=state.tau;$('settings-temperature').value=state.tau;
    setVisible('training-controls',state.stage>=9);setVisible('matrix-sweep',[1,4].includes(state.stage));
    $('precision-toggle').textContent=state.decimals===8?'More digits · 8 dp':`Rounded · ${state.decimals} dp`;$('precision-toggle').setAttribute('aria-pressed',String(state.decimals===8));
  }
  const calcHeader=(tag,title)=>`<div class="calc-eyebrow"><span>${tag}</span><span>${String(state.stage+1).padStart(2,'0')} / 11</span></div><h2>${title}</h2>`;
  function renderCalculation(){
    const [i,j]=state.selected,s=state.stage,dir=state.direction==='row',idx=dir?i:j,n=state.n;
    let html='';
    if(s===1)html=calcHeader('THE TRAINING SIGNAL','Partners and competitors.')+`<p>Each image has one paired caption in this batch. The other captions are its alternatives.</p><div class="pair-tally"><div><strong>${n}</strong><span>positive pairs</span></div><div><strong>${n*n-n}</strong><span>in-batch negatives</span></div></div><div class="result-line"><span>${label('I',i)} ↔ ${label('T',j)}</span><strong style="font-size:17px">${i===j?'Positive pair':'Negative pair'}</strong></div><p>A minibatch of <i>N</i> matched pairs gives <i>N</i>² similarities, with only <i>N</i> positives.</p><p class="small-note">The indices belong to this batch. When you pick another batch, I₁ and T₁ refer to its first pair.</p>`;
    if(s===2)html=calcHeader('A SHARED COORDINATE SYSTEM','Compare the encoder outputs.')+`<div class="calc-steps"><div><b>1</b><span>Image → image encoder → Iᵢ</span></div><div><b>2</b><span>Caption → text encoder → Tᵢ</span></div><div><b>3</b><span>Both vectors have three coordinates.</span></div></div><p>The encoders are different functions. Their outputs live in the same embedding space so that we can compare them.</p><div class="result-line"><span>Our toy dimension</span><strong>d = 3</strong></div><p>Real CLIP models use much larger embedding dimensions. Three dimensions let us show every calculation and vector.</p>`;
    if(s===3){const [kind,k]=state.vector,raw=(kind==='I'?state.images:state.texts)[k],unit=(kind==='I'?current.EI:current.ET)[k];html=calcHeader('CLICK ANY VECTOR','Normalize '+label(kind,k)+'.')+`<div class="norm-detail">${label(kind,k)} = ${vec(raw)}<br><br>‖${label(kind,k)}‖₂<br>= √(${raw.map(x=>`(${f(x)})²`).join(' + ')})<br>= √${f(dot(raw,raw))}<br>= <strong>${f(norm(raw))}</strong></div><div class="calc-equation equation">x̂ = x / ‖x‖₂</div><div class="math-line">${raw.map(x=>`${f(x)} / ${f(norm(raw))} = ${f(x/norm(raw))}`).join('<br>')}</div><div class="result-line"><span>Normalized ${label(kind,k)}<br><span class="math-line">${vec(unit)}</span></span></div><div class="unit-result"><span>‖${label(kind,k)}‖ = ${f(norm(unit))} ✓</span></div>`;}
    if(s===4)html=calcHeader('BUILD ONE CELL',`${label('I',i)} meets ${label('T',j)}.`)+`<p>${activeData()[i].name} image × “${activeData()[j].caption}”</p><div class="calc-equation equation">S<sub>${i+1}${j+1}</sub> = Î<sub>${i+1}</sub>ᵀ T̂<sub>${j+1}</sub></div><div class="math-line">${current.EI[i].map((v,k)=>`(${f(v)} × ${f(current.ET[j][k])})`).join('<br>+ ')}<br><br>= ${current.EI[i].map((v,k)=>f(v*current.ET[j][k])).join(' + ')}</div><div class="result-line"><span>Cosine similarity</span><strong>${f(current.S[i][j])}</strong></div><p>${i===j?'This is a paired match on the diagonal.':'This is a mismatched pair, an in-batch negative.'} The target is to make matching pairs score higher than their competitors.</p>`;
    if(s===5)html=calcHeader('SCALE THIS SIMILARITY',`S${sub(i+1)}${sub(j+1)} → L${sub(i+1)}${sub(j+1)}`)+`<div class="calc-equation equation">L<sub>${i+1}${j+1}</sub> = S<sub>${i+1}${j+1}</sub> / τ</div><div class="math-line">${f(current.S[i][j])} / ${state.tau.toFixed(2)}<br>= ${f(current.L[i][j])}</div><div class="result-line"><span>Scale s = 1 / τ</span><strong>${f(1/state.tau)}</strong></div><p>Temperature changes the scale of the logits, preserving the ranking of similarities.</p><p>Smaller τ makes softmax sharper; larger τ spreads probability more evenly.</p><p class="small-note">CLIP starts with a temperature of 0.07 and learns its logit scale. Here, training keeps τ at the value you choose.</p>`;
    if(s===6||s===7)html=renderSoftmax(idx,dir);
    if(s===8)html=calcHeader('AVERAGE THE TWO DIRECTIONS','The symmetric CLIP loss.')+`<p>Each direction averages ${n} correct-match penalties. Then we give the two directions equal weight.</p><div class="loss-summary"><div class="direction-loss">Image → Text<strong>${f(current.imageLoss)}</strong><div class="math-line">(${current.rowLosses.map(f).join(' + ')}) / ${n}</div></div><div class="direction-loss">Text → Image<strong>${f(current.textLoss)}</strong><div class="math-line">(${current.colLosses.map(f).join(' + ')}) / ${n}</div></div></div><svg class="merge-lines" viewBox="0 0 300 30" aria-hidden="true"><path d="M70 0Q70 20 150 26M230 0Q230 20 150 26" fill="none" stroke="#b1c59a" stroke-width="1.5"/></svg><div class="big-loss" id="final-loss"><small>SYMMETRIC CLIP LOSS</small><strong>${f(current.loss)}</strong><div class="formula equation">(${f(current.imageLoss)} + ${f(current.textLoss)}) / 2</div></div><button id="trace-loss" class="secondary trace-button">Trace the entire loss ↶</button><div id="trace-status" class="trace-status">Follow each loss term back to the original pairs.</div><p class="small-note">All logs are natural. Values on screen are rounded; all calculations use full precision.</p>`;
    if(s>=9){
      const update=state.lastUpdate;
      const updateLine=update?`<div class="update-receipt"><span>This batch, one update</span><strong>${f(clipLoss(update.images,update.texts,state.tau).loss)} <span>→</span> ${f(current.loss)}</strong><small>Same pairs and temperature on both sides.</small></div>`:`<div class="update-receipt"><span>Before the next update</span><strong>${f(current.loss)}</strong><small>${activeData().map(d=>d.name).join(', ')}</small></div>`;
      html=calcHeader('TRAINING ON THE SELECTED BATCH',state.phase==='picked'?'First, choose the pairs.':'Now update their vectors.')+`<div class="metrics"><div class="metric">Gradient updates<strong>${state.step}</strong></div><div class="metric">Current batch loss<strong>${f(current.loss)}</strong><span>${n} pairs in this calculation</span></div><div class="metric">Mean positive similarity<strong>${f(current.positive)}</strong><span>${signed(current.positive-initial.positive)} vs these pairs at the start</span></div><div class="metric">Mean negative similarity<strong>${f(current.negative)}</strong><span>${signed(current.negative-initial.negative)} vs these pairs at the start</span></div></div>${updateLine}${lossChart()}<p class="small-note">Real CLIP updates both neural-network encoders. Here, each example has its own toy image and text vectors. We update only the sampled vectors and keep their values for later batches.</p><div class="result-line"><span>Learning rate ${state.lr} · τ ${state.tau.toFixed(2)}</span><span>All gradients computed</span></div>`;
    }
    $('calculation-panel').innerHTML=html;bindCalculation();
  }
  function signed(x){return (x>=0?'+':'−')+f(Math.abs(x));}
  function renderSoftmax(idx,dir){
    const n=state.n,kind=dir?'I':'T',candidate=dir?'T':'I',probs=dir?current.P[idx]:current.Q.map(row=>row[idx]),logits=dir?current.L[idx]:current.L.map(row=>row[idx]),exps=dir?current.exp[idx]:current.exp.map(row=>row[idx]),den=dir?current.rowDen[idx]:current.colDen[idx],losses=dir?current.rowLosses:current.colLosses;
    const pair=k=>dir?`${idx},${k}`:`${k},${idx}`;
    return calcHeader(dir?'SOFTMAX ACROSS ROWS →':'SOFTMAX DOWN COLUMNS ↓',`For ${label(kind,idx)}, which ${dir?'caption':'image'}?`)+`<div class="example-selector">${activeData().map((d,k)=>`<button data-example="${k}" aria-pressed="${k===idx}">${label(kind,k)} · ${d.name}</button>`).join('')}</div><div class="equation calc-equation" style="font-size:17px;margin:8px 0;padding-bottom:9px">${dir?'P(Tⱼ | Iᵢ)':'Q(Iᵢ | Tⱼ)'} = exp(Lᵢⱼ) / ∑${dir?'ₖ exp(Lᵢₖ)':'ₖ exp(Lₖⱼ)'}</div><table class="flow-table"><thead><tr><th></th>${probs.map((_,k)=>`<th style="color:${activeData()[k].color}">${label(candidate,k)}</th>`).join('')}</tr></thead><tbody>${[['Logit',logits],['↓ exp',exps],['↓ ÷ sum',probs]].map(([title,values],row)=>`<tr><th>${title}</th>${values.map((v,k)=>`<td data-pair="${pair(k)}" class="${k===idx?'correct ':''}${(dir?state.selected[1]:state.selected[0])===k?'trace-lit':''}" tabindex="0">${row===1?fmtExp(v):f(v)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="denominator"><small>SOFTMAX DENOMINATOR · ${dir?'this row':'this column'}</small>${exps.map(fmtExp).join(' + ')}<br>= <strong>${fmtExp(den)}</strong></div><div class="target-line"><span>Correct target: ${label(candidate,idx)}</span><code>[${probs.map((_,k)=>+(k===idx)).join(', ')}]</code></div><div class="result-line"><span>−ln ${f(probs[idx])}</span><strong>${f(losses[idx])}</strong></div><div class="loss-terms" aria-label="Individual example losses">${losses.map((loss,k)=>`<button class="loss-term ${k===idx?'active':''}" data-loss-term="${k}"><span>${label(kind,k)} → ${label(candidate,k)}</span><strong>${f(loss)}</strong></button>`).join('')}</div><p><strong>Average:</strong> (${losses.map(f).join(' + ')}) / ${n} = <strong>${f(dir?current.imageLoss:current.textLoss)}</strong></p>`;
  }
  function bindCalculation(){
    $('calculation-panel').querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{const k=+b.dataset.example;state.selected=[k,k];renderSelection();matrix.pulseDiagonal(k);});
    $('calculation-panel').querySelectorAll('[data-loss-term]').forEach(b=>{b.onclick=()=>{const k=+b.dataset.lossTerm;state.selected=[k,k];renderSelection();matrix.pulseDiagonal(k);};});
    $('calculation-panel').querySelectorAll('[data-pair]').forEach(b=>{const handler=()=>{const [i,j]=b.dataset.pair.split(',').map(Number);selectCell(i,j,false,true);};b.addEventListener('pointerenter',handler);b.addEventListener('focus',handler);});
    if($('trace-loss'))$('trace-loss').onclick=traceLoss;
  }
  function selectCell(i,j,clicked,fromTable=false){
    if(i>=state.n||j>=state.n)return;
    if(state.selected[0]===i&&state.selected[1]===j&&!clicked)return;
    state.selected=[i,j];state.vector=['I',i];
    matrix.highlight();if(state.stage===10){liveRow.highlight();liveColumn.highlight();}renderSources();renderProvenance();
    if(!fromTable)renderCalculation();else $('calculation-panel').querySelectorAll('[data-pair]').forEach(el=>el.classList.toggle('trace-lit',el.dataset.pair===`${i},${j}`));
    if(clicked){announcement(`Tracing ${label('I',i)} and ${label('T',j)}.`);$('provenance-chain').animate([{opacity:.45},{opacity:1}],{duration:reduced?0:300});}
  }
  function renderSelection(){renderSources();matrix.highlight();if([2,3].includes(state.stage))renderVectorView();renderCalculation();renderProvenance();}

  // 7. PROVENANCE: a cell's identity is shared across raw vectors, S, L, and P/Q.
  function renderProvenance(){
    const [i,j]=state.selected,dir=state.direction==='row',p=dir?current.P[i][j]:current.Q[i][j],den=dir?current.rowDen[i]:current.colDen[j];
    setVisible('provenance',state.stage>=4);$('trace-pair').textContent=`/ ${label('I',i)} × ${label('T',j)} · ${i===j?'matched':'mismatched'}`;
    const flow='<svg viewBox="0 0 22 10" aria-hidden="true"><path d="M0 5H19m-4-3 4 3-4 3" fill="none"/></svg>';
    const nodes=[
      ['inputs','Paired data → unit vectors',`${label('I',i)} · ${label('T',j)}`,`${activeData()[i].name} image × ${activeData()[j].name} caption`],
      ['similarity','Dot product → cosine',f(current.S[i][j]),`S${sub(i+1)}${sub(j+1)} = Î${sub(i+1)}ᵀT̂${sub(j+1)}`],
      ['logit',`Divide by τ = ${state.tau.toFixed(2)}`,f(current.L[i][j]),`L${sub(i+1)}${sub(j+1)} · same cell`],
      ['exponential','Exponentiate',fmtExp(current.exp[i][j]),`exp(L${sub(i+1)}${sub(j+1)})`],
      ['probability',`Divide by ${dir?'row':'column'} sum`,f(p),`÷ ${fmtExp(den)} → ${dir?'P(T | I)':'Q(I | T)'}`]
    ];
    $('provenance-chain').innerHTML=nodes.map(([key,title,value,note],k)=>`<div class="trace-node ${((state.stage===4&&k===1)||(state.stage===5&&k===2)||(state.stage>=6&&k===4))?'hot':''}" data-trace="${key}">${title}<strong>${value}</strong><small>${note}</small>${k<4?flow:''}</div>`).join('');
    const rawI=state.images[i],rawT=state.texts[j];
    $('full-calculations').innerHTML=`<div class="provenance-details"><div data-trace="raw"><h3>1. The original pair and encoder outputs</h3>${label('I',i)} = ${activeData()[i].name} image → ${vec(rawI)}<br>${label('T',j)} = “${activeData()[j].caption}” → ${vec(rawT)}<br><br><h3>2. L2 normalization</h3>‖${label('I',i)}‖ = √(${rawI.map(x=>`(${f(x)})²`).join(' + ')}) = ${f(norm(rawI))}<br>Î${sub(i+1)} = ${vec(current.EI[i])}<br>‖${label('T',j)}‖ = √(${rawT.map(x=>`(${f(x)})²`).join(' + ')}) = ${f(norm(rawT))}<br>T̂${sub(j+1)} = ${vec(current.ET[j])}</div><div><h3>3. Dot product → temperature → exponential</h3>${current.EI[i].map((v,k)=>`(${f(v)} × ${f(current.ET[j][k])})`).join(' + ')} = ${f(current.S[i][j])}<br>${f(current.S[i][j])} / ${state.tau.toFixed(2)} = ${f(current.L[i][j])}<br>exp(${f(current.L[i][j])}) = ${fmtExp(current.exp[i][j])}<br><br><h3>4. Two probabilities from the same numerator.</h3>Row sum = ${current.exp[i].map(fmtExp).join(' + ')} = ${fmtExp(current.rowDen[i])}<br>P(T${sub(j+1)} | I${sub(i+1)}) = ${fmtExp(current.exp[i][j])} / ${fmtExp(current.rowDen[i])} = ${f(current.P[i][j])}<br>Column sum = ${current.exp.map(row=>fmtExp(row[j])).join(' + ')} = ${fmtExp(current.colDen[j])}<br>Q(I${sub(i+1)} | T${sub(j+1)}) = ${fmtExp(current.exp[i][j])} / ${fmtExp(current.colDen[j])} = ${f(current.Q[i][j])}</div></div>`;
    setVisible('full-calculations',state.expanded);if(state.stage>=9)pairNodes.forEach(node=>{node.querySelector('.source-vectors').hidden=!state.expanded;});$('expand-calculations').textContent=state.expanded?'Collapse calculations −':'Expand calculations +';$('expand-calculations').setAttribute('aria-expanded',String(state.expanded));
  }
  function cancelTrace(){traceTimers.forEach(clearTimeout);traceTimers=[];document.querySelectorAll('.trace-active').forEach(el=>el.classList.remove('trace-active'));}
  function traceLoss(){
    cancelTrace();state.expanded=true;renderProvenance();
    const seq=[['#final-loss','Start with the symmetric CLIP loss.'],['.direction-loss','Two averages: image → text and text → image.'],['.matrix-cell.diagonal','Only correct-match probabilities enter the cross-entropies.'],['[data-trace="probability"]','Softmax divides each exponential by its row or column sum.'],['[data-trace="exponential"]','Exponentiate the logits.'],['[data-trace="logit"]','Each logit is a temperature-scaled similarity.'],['[data-trace="similarity"]','Each similarity is a dot product of unit vectors.'],['[data-trace="inputs"]','Normalize the image and text embeddings.'],['[data-trace="raw"]','Trace back to encoder outputs and the original paired data.']];
    seq.forEach(([selector,message],k)=>traceTimers.push(setTimeout(()=>{document.querySelectorAll('.trace-active').forEach(el=>el.classList.remove('trace-active'));document.querySelectorAll(selector).forEach(el=>el.classList.add('trace-active'));if($('trace-status'))$('trace-status').textContent=message;announcement(message);},k*(reduced?120:850))));
    traceTimers.push(setTimeout(()=>{cancelTrace();if($('trace-status'))$('trace-status').textContent='Every number is computed from the same paired vectors.';},seq.length*(reduced?120:850)));
  }

  // 8. TRAINING AND LIVE METRICS.
  function lossChart(){
    const values=state.history.map(h=>clipLoss(h.images,h.texts,state.tau).loss),max=Math.max(...values,1e-6)*1.1;
    const pts=values.map((v,i)=>`${35+i/Math.max(1,values.length-1)*275},${112-v/max*87}`);
    return `<svg class="loss-chart" viewBox="0 0 330 145" role="img" aria-label="Loss on all 12 pairs over ${state.step} gradient steps, from ${f(values[0])} to ${f(values.at(-1))}"><text x="35" y="12">All 12 pairs · fixed evaluation · τ = ${state.tau.toFixed(2)}</text><path d="M35 25V112H310" fill="none" stroke="#cbd6bd"/><path d="M35 69H310" fill="none" stroke="#e8eddf" stroke-dasharray="3 4"/><text x="2" y="30">${max.toFixed(2)}</text><text x="14" y="115">0</text><path d="M${pts.join('L')}" fill="none" stroke="#68884f" stroke-width="2.2"/><circle cx="${35+(values.length>1?275:0)}" cy="${112-values.at(-1)/max*87}" r="3" fill="#426c42"/><text x="35" y="130">0</text><text x="310" y="130" text-anchor="end">${state.step} steps</text></svg>`;
  }
  function trainOne(){
    if(state.step>=1000){pause();announcement('Reached 1,000 updates. Reset to start again.');return;}
    if(state.rotateBatches&&state.stepsInBatch>0)advanceBatch();
    state.lastUpdate={images:copy(state.images),texts:copy(state.texts)};
    const result=trainingStep(state.images,state.texts,state.tau,state.lr);
    state.order.slice(0,state.n).forEach((id,i)=>{state.poolImages[id]=result.images[i];state.poolTexts[id]=result.texts[i];if(!state.visited.includes(id))state.visited.push(id);});
    syncActiveVectors();state.step++;state.stepsInBatch++;state.phase='updated';
    state.history.push(snapshot());recompute();renderAll(false);
    if(state.step>=1000)pause();
  }
  function scheduleTraining(remaining=null){
    clearTimeout(playTimer);if(!state.playing)return;
    if(state.rotateBatches&&state.stepsInBatch>0)advanceBatch();
    state.phase='picked';renderAll();pulseBatch();
    playTimer=setTimeout(()=>{
      if(!state.playing)return;trainOne();
      if(remaining!==null){remaining--;if(remaining<=0){pause();return;}}
      if(state.playing)playTimer=setTimeout(()=>scheduleTraining(remaining),950/state.speed);
    },500/state.speed);
  }
  function play(steps=null){if(state.stage<9)go(10);if(state.step>=1000)return;pauseStory();state.playing=true;$('play').textContent='Ⅱ Pause';scheduleTraining(steps);}
  function pause(){clearTimeout(playTimer);state.playing=false;$('play').textContent='▶ Train';renderBatchJourney();}
  function resetTraining(){pause();cancelTrace();state.order=[0,1,2];resetVectors();sourceCards();renderAll(false);announcement('All twelve pairs restored to their starting vectors.');}
  function renderGeometry(){if(state.stage>=3)geometry.update(current);if(state.stage===10&&beforeGeometry){beforeGeometry.update(initial);afterGeometry.update(current);}}
  function renderComparison(){
    const show=state.stage===10;setVisible('live-probabilities',show);if(show){liveRow.update(current.P,{kind:'P'});liveColumn.update(current.Q,{kind:'Q'});}setVisible('comparison',show);setVisible('algorithm-summary',show);if(!show)return;
    if(!$('before-matrix')){
      $('comparison').innerHTML=['before','after'].map(key=>`<div class="compare-panel"><header><span>${key==='before'?'BEFORE TRAINING':'AFTER TRAINING'}</span><span id="${key}-step" class="muted"></span></header><div class="compare-visuals"><div id="${key}-matrix" class="matrix-host"></div><div id="${key}-geometry"></div></div><div class="compare-loss"><span>CLIP loss <small>(same τ)</small></span><strong id="${key}-loss"></strong></div><div id="${key}-probabilities" class="small-note"></div></div>`).join('');
      beforeMatrix=new Matrix($('before-matrix'),false);afterMatrix=new Matrix($('after-matrix'),false);beforeGeometry=new Geometry($('before-geometry'));afterGeometry=new Geometry($('after-geometry'));
    }
    beforeMatrix.update(initial.S,{kind:'S',animate:false,selection:false});afterMatrix.update(current.S,{kind:'S',selection:false});beforeGeometry.update(initial);afterGeometry.update(current);
    $('before-loss').textContent=f(initial.loss);$('after-loss').textContent=f(current.loss);$('before-step').textContent='STEP 0';$('after-step').textContent=`STEP ${state.step}`;
    for(const [key,m]of [['before',initial],['after',current]])$(''+key+'-probabilities').innerHTML=`Correct probabilities, I → T: <strong>${m.P.map((r,i)=>f(r[i])).join(' · ')}</strong><br>Correct probabilities, T → I: <strong>${m.Q.map((r,i)=>f(r[i])).join(' · ')}</strong>`;
  }

  // 9. NAVIGATION AND CONTROLS.
  function renderAll(animate=true){renderBatchJourney();renderSources();renderMatrix(animate);renderCalculation();renderProvenance();renderComparison();renderGeometry();$('play').textContent=state.playing?'Ⅱ Pause':'▶ Train';}
  function go(stage,updateHash=true){
    stage=Math.max(0,Math.min(10,stage));const oldStage=state.stage;const pairPositions=oldStage===0?[...document.querySelectorAll('.dataset-card')].slice(0,3).map(el=>el.getBoundingClientRect()):[];cancelTrace();document.body.dataset.stage=stage;if(stage<9)pause();state.stage=stage;
    if(stage===6)state.direction='row';if(stage===7)state.direction='column';
    const prompt=PROMPTS[stage];$('try-label').textContent=prompt[0];$('try-description').textContent=prompt[1];$('try-action').textContent=prompt[2];
    const data=STAGES[stage];$('chapter').textContent=String(stage+1).padStart(2,'0')+' / '+data[2];$('stage-title').textContent=data[3];$('stage-description').textContent=data[4];$('stage-takeaway').textContent=data[5];
    $('stage-nav').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('visited',i<stage);if(i===stage)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    setVisible('dataset-view',stage===0);setVisible('workspace',stage!==0);$('previous').disabled=stage===0;$('next').disabled=stage===10;$('step-count').textContent=`Step ${stage+1} of 11`;
    if(oldStage===0&&stage===1&&!reduced)pairNodes.forEach((node,i)=>{const prev=pairPositions[state.order[i]],now=node.getBoundingClientRect();if(prev)node.animate([{transform:`translate(${prev.x-now.x}px,${prev.y-now.y}px)`,opacity:.4},{transform:'translate(0,0)',opacity:1}],{duration:600,delay:i*70,easing:'cubic-bezier(.16,1,.3,1)'});});
    if(updateHash)history.replaceState(null,'','#'+data[0]);renderAll();window.scrollTo({top:0,behavior:'instant'});announcement(`${stage+1} of 11. ${data[3]}`);
    // Retain the matrix node; transition its numbers and flash the active transform.
    if(!reduced)$('stage-title').animate([{opacity:.3,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:230});
  }
  function setTemperature(value){const v=Number(value);if(!Number.isFinite(v))return;state.tau=Math.min(1,Math.max(.05,v));cancelTrace();recompute();renderAll();}
  function pauseStory(){clearInterval(storyTimer);state.autoplay=false;$('autoplay').textContent='▶ Auto-play the story';}
  function toggleStory(){if(state.autoplay){pauseStory();return;}pause();state.autoplay=true;$('autoplay').textContent='Ⅱ Pause auto-play';if(state.stage===10)go(0);storyTimer=setInterval(()=>{if(state.stage===10){pauseStory();return;}go(state.stage+1);},7000);}
  function toggleDrawer(id,trigger){const drawer=$(id);if(drawer.open){drawer.close();}else{pause();pauseStory();drawer.showModal();}$(trigger).setAttribute('aria-expanded',String(drawer.open));}
  function setFocus(value){state.focus=value;$('focus-toggle').setAttribute('aria-pressed',String(value));if(value&&state.stage<6)go(6);renderSelection();announcement(value?'Focus mode. Select an image row or text column.':'Focus mode off.');}

  $('batch-pool').innerHTML=DATASET.map((d,i)=>`<div class="pool-pair" data-pool-id="${i}" style="--pair:${d.color}">${illustration(d)}<span class="pool-name">${d.name}</span><span class="pool-state">waiting</span></div>`).join('');
  $('next-batch').onclick=nextBatch;
  $('rotate-batches').onchange=e=>{state.rotateBatches=e.target.checked;pause();renderBatchJourney();};
  $('try-action').onclick=()=>{
    const s=state.stage;
    if(s===0)go(1);
    else if([1,4,6].includes(s))selectCell(0,1,true);
    else if([2,3].includes(s)){state.vector=['T',0];state.selected=[0,0];renderSelection();}
    else if(s===5)setTemperature(.07);
    else if(s===7)selectCell(1,0,true);
    else if(s===8)traceLoss();
    else if(s===9){pause();trainOne();}
    else state.playing?pause():play();
  };
  $('dataset-grid').innerHTML=DATASET.map((d,i)=>`<div class="dataset-card ${i<3?'featured':''}" style="--pair:${d.color}"><span class="pair-index">${String(i+1).padStart(2,'0')}</span>${illustration(d)}<span class="pair-link"></span><p>“${d.caption}”</p></div>`).join('');
  $('stage-nav').innerHTML=STAGES.map((s,i)=>`<button data-stage="${i}" aria-label="Step ${i+1}: ${s[1]}"><span>${String(i+1).padStart(2,'0')}</span>${s[1]}</button>`).join('');
  $('stage-nav').querySelectorAll('button').forEach(b=>b.onclick=()=>{pauseStory();go(+b.dataset.stage);});
  $('previous').onclick=()=>{pauseStory();go(state.stage-1);};$('next').onclick=()=>{pauseStory();go(state.stage+1);};document.querySelector('[data-action=next]').onclick=()=>go(1);
  $('batch-size').onchange=e=>{pause();state.n=+e.target.value;resetVectors();sourceCards();renderAll();};
  $('shuffle').onclick=()=>{pause();state.order=state.order.slice(1).concat(state.order[0]);state.epochOrder.splice(state.batchCursor,state.n,...state.order);state.selected=[0,0];state.vector=['I',0];state.lastUpdate=null;syncActiveVectors();recompute();sourceCards();renderAll();if(!reduced)pairNodes.forEach((node,i)=>node.animate([{opacity:.2,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:i*65}));announcement('Pairs shuffled together. Matrix indices follow the new order.');};
  $('matrix-sweep').onclick=()=>{cancelTrace();for(let k=0;k<state.n**2;k++)traceTimers.push(setTimeout(()=>{selectCell(Math.floor(k/state.n),k%state.n,true);matrix.cells[k].group.classList.add('trace-flash');},k*650));};
  $('temperature').oninput=e=>setTemperature(e.target.value);$('clip-temperature').onclick=()=>setTemperature(.07);$('settings-temperature').onchange=e=>setTemperature(e.target.value);
  $('learning-rate').onchange=e=>{state.lr=Math.max(.001,Math.min(1,Number(e.target.value)||.25));e.target.value=state.lr;renderCalculation();};
  $('decimal-places').onchange=e=>{state.decimals=+e.target.value;renderAll(false);};$('precision-toggle').onclick=()=>{state.decimals=state.decimals===8?3:8;$('decimal-places').value=state.decimals;renderAll(false);};
  document.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>{cancelTrace();state.direction=b.dataset.direction;if([6,7].includes(state.stage))go(state.direction==='row'?6:7);else renderAll();});
  $('focus-toggle').onclick=()=>setFocus(!state.focus);
  $('expand-calculations').onclick=()=>{state.expanded=!state.expanded;$('show-calculations').checked=state.expanded;renderProvenance();};
  $('show-calculations').onchange=e=>{state.expanded=e.target.checked;renderProvenance();};$('show-equations').onchange=e=>document.body.classList.toggle('hide-equations',!e.target.checked);
  $('one-step').onclick=()=>{pause();trainOne();};$('ten-steps').onclick=()=>play(10);$('play').onclick=()=>state.playing?pause():play();$('reset-training').onclick=resetTraining;$('speed').onchange=e=>{state.speed=+e.target.value;};
  $('controls-toggle').onclick=()=>toggleDrawer('controls-drawer','controls-toggle');$('math-toggle').onclick=()=>toggleDrawer('math-drawer','math-toggle');
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  ['controls','math'].forEach(id=>$(id+'-drawer').addEventListener('close',()=>$(id+'-toggle').setAttribute('aria-expanded','false')));
  $('autoplay').onclick=()=>{toggleStory();$('controls-drawer').close();};
  $('reset-all').onclick=()=>{pauseStory();state.tau=.5;state.lr=.25;state.n=3;state.order=[0,1,2];state.decimals=3;state.focus=false;state.expanded=false;state.direction='row';state.speed=1;state.rotateBatches=true;$('rotate-batches').checked=true;$('batch-size').value=3;$('learning-rate').value=.25;$('decimal-places').value=3;$('speed').value=1;$('show-calculations').checked=false;$('show-equations').checked=true;document.body.classList.remove('hide-equations');$('focus-toggle').setAttribute('aria-pressed','false');sourceCards();resetTraining();$('controls-drawer').close();go(0);};
  window.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea,dialog'))return;if(e.code==='Space'&&e.target.closest('button,a,[role=button]'))return;if(e.key==='ArrowRight'){e.preventDefault();pauseStory();go(state.stage+1);}if(e.key==='ArrowLeft'){e.preventDefault();pauseStory();go(state.stage-1);}if(e.code==='Space'){e.preventDefault();if(state.stage>=9)state.playing?pause():play();else toggleStory();}if(e.key.toLowerCase()==='r')resetTraining();});
  window.addEventListener('hashchange',()=>{const idx=STAGES.findIndex(s=>s[0]===location.hash.slice(1));if(idx>=0)go(idx,false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();pauseStory();cancelTrace();}});
  liveRow=new Matrix($('live-row'));liveColumn=new Matrix($('live-column'));matrix=new Matrix($('main-matrix'));geometry=new Geometry($('geometry'));resetVectors();sourceCards();
  const idx=STAGES.findIndex(s=>s[0]===location.hash.slice(1));go(idx>=0?idx:0,false);
  const checks=runMathSanityChecks();
  // Small public interface for reproducible classroom demonstrations and verification.
  window.clipLab={math:ClipMath,checks,go,step:trainOne,pause,reset:resetTraining,setTemperature,nextBatch,getState:()=>structuredClone({...state,history:undefined}),getMetrics:()=>structuredClone(current)};
}
