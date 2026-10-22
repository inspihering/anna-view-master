import {reelSVG,frameIndices,mod,FRAME_COUNT} from './reel.js';
const $ = selector => document.querySelector(selector);
const collections=['content','strategy','creation'].map(key=>({key,items:[]}));
let active=collections[0], step=0, start=0, busy=false, queuedReel=null, queuedDirection=0;
const positions={content:0,strategy:0,creation:0};
const illustrations=['big-vision-energy','coffee-confetti','deep-work','celebrate-princess-dress','coffee-first','champagne-cheers'].map(name=>`/assets/kristina/${name}.png?v=complete-original`);
let illustrationIndex=-1,lastIllustratedGuide=null;
// Rotate on a genuine guide change, including wraparound and remembered reel positions.
function updateIllustration(index){
  const key=`${active.key}:${index}`;
  if(key===lastIllustratedGuide)return;
  lastIllustratedGuide=key;illustrationIndex=(illustrationIndex+1)%illustrations.length;
  $('.personality-sticker').src=illustrations[illustrationIndex];
}

const items=()=>active.items;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionQuery.matches;
motionQuery.addEventListener('change',event=>{reduced=event.matches;});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,reduced?0:ms));
const headline=text=>String(text||'A view from the reel').replace(/\\U[0-9a-fA-F]{8}/g,'').trim();
const safeURL=url=>{try{const u=new URL(url,location.origin);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#'}};

function selected(){return items()[mod(start+step,active.items.length)];}
function updateSelection(announce=true){
  const index=mod(start+step,active.items.length);
  const item=selected();
  updateIllustration(index);
  $('#counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(active.items.length).padStart(2,'0')}`;
  $('#viewer-label').textContent=active.label;
  $('#viewer-frame').textContent=String(index+1).padStart(2,'0');
  $('#selected-title').textContent=headline(item.title);
  const image=$('#selected-image');
  image.hidden=!item.image;
  $('#empty-photo').hidden=!!item.image;
  if(item.image){image.src=safeURL(item.image);image.alt=item.imageAlt||headline(item.title);}
  else{$('#empty-location').textContent=item.title;}
  const destination=safeURL(item.url);
  $('#photo-link').href=destination;
  $('#photo-link').setAttribute('aria-label',`Explore ${headline(item.title)} — opens library signup`);
  $('#collection-note').textContent=`${active.label} · GUIDE ${index+1} OF ${active.items.length}`;
  $('#guide-description').textContent=item.description;
  document.querySelectorAll('[data-reel]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reel===active.key)));
  if(announce)$('#announcement').textContent=`${active.label}. Guide ${index+1} of ${active.items.length}. ${headline(item.title)}`;
  positions[active.key]=index;
  const next=items()[mod(index+1,active.items.length)];if(next?.image){const preload=new Image();preload.src=next.image;}
}
function renderSpareReels(){
  const holder=$('#spare-reels');holder.replaceChildren();
  // Two alternate discs remain available beside the loaded reel.
  const spare=collections.filter(c=>c!==active).sort((a,b)=>b.number-a.number);
  for(const collection of spare){
    const button=document.createElement('button');button.className='spare';
    button.setAttribute('aria-label',`Load ${collection.label} reel`);
    button.dataset.collection=collection.key;
    button.innerHTML=reelSVG(collection,`spare-${collection.key}`,positions[collection.key]);
    button.addEventListener('click',()=>loadReel(collection.key));holder.append(button);
  }
}
function mountReel(){
  $('#loaded-reel').innerHTML=reelSVG(active,'active',start,true);
  renderSpareReels();updateSelection(false);
}
async function advance(direction=1){
  if(!active.items.length)return;
  if(busy){queuedDirection=direction;return;}
  busy=true;$('#advance').setAttribute('aria-disabled','true');
  step+=direction;
  // Only the slot on the hidden, lower part of the disc is reassigned as the collection loops.
  const indices=frameIndices(step,start,active.items.length);
  document.querySelectorAll('#loaded-reel [data-slot]').forEach((node,i)=>node.setAttribute('href',items()[indices[i]].image||'/assets/unexposed.svg'));
  $('#loaded-reel .rotor').style.transform=`rotate(${-step*360/FRAME_COUNT}deg)`;
  $('.viewer').classList.add('advancing');$('.selected-view').classList.add('changing');
  await sleep(160);updateSelection();$('.selected-view').classList.remove('changing');
  await sleep(380);$('.viewer').classList.remove('advancing');busy=false;$('#advance').removeAttribute('aria-disabled');drainQueue();
}
function drainQueue(){if(queuedReel){const key=queuedReel;queuedReel=null;queuedDirection=0;loadReel(key);}else if(queuedDirection){const direction=queuedDirection;queuedDirection=0;advance(direction);}}
async function loadReel(key){
  const target=collections.find(c=>c.key===key);if(target===active||!target?.items.length)return;
  if(busy){queuedReel=key;return;}
  busy=true;$('.viewer').classList.add('swapping');$('.selected-view').classList.add('changing');
  await sleep(280);active=target;step=0;start=positions[key];mountReel();
  $('.viewer').classList.remove('swapping');$('.selected-view').classList.remove('changing');
  updateSelection();await sleep(300);busy=false;$('#advance').focus({preventScroll:true});drainQueue();
}
$('#advance').addEventListener('click',()=>advance());$('#next').addEventListener('click',()=>advance());$('#previous').addEventListener('click',()=>advance(-1));
document.addEventListener('keydown',event=>{
  if(document.querySelector('#guide-gate')?.open)return;
  if(event.altKey||event.ctrlKey||event.metaKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();advance(event.key==='ArrowRight'?1:-1);}
});
$('#selected-image').addEventListener('error',()=>{
  // Keep the selected link usable even if a remote image has expired.
  $('#selected-image').hidden=true;$('#empty-photo').hidden=false;$('#empty-location').textContent=headline(selected().title);$('#empty-photo small').textContent='Open the original to see this picture';
});
let pointerStart=null;
$('.viewer').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')pointerStart={x:e.clientX,y:e.clientY};});
$('.viewer').addEventListener('pointercancel',()=>{pointerStart=null;});
$('.viewer').addEventListener('pointerup',e=>{if(!pointerStart)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)advance(dx<0?1:-1);});
document.querySelectorAll('[data-reel]').forEach(button=>button.addEventListener('click',()=>loadReel(button.dataset.reel)));
async function init(){
  for(const src of illustrations){const preload=new Image();preload.src=src;}
  const data=await Promise.all(collections.map(c=>fetch(`/data/${c.key}.json`).then(r=>{if(!r.ok)throw Error('Collection unavailable');return r.json()})));
  collections.forEach((c,i)=>Object.assign(c,data[i]));
  const params=new URLSearchParams(location.search);const requested=collections.find(c=>c.key===params.get('reel'));if(requested){active=requested;start=positions[active.key];}
  // Optional local review override; textContent prevents markup injection.
  const previewName=params.get('name')?.trim().slice(0,60);
  if(previewName){
    const parts=previewName.split(/\s+/);const first=parts.shift();
    $('#given-name').textContent=first;$('#family-name').textContent=parts.join(' ');
    $('#footer-name').textContent=previewName;$('#name').setAttribute('aria-label',previewName);document.title=previewName+' · A different point of view';
    collections.forEach(collection=>collection.owner=previewName.toUpperCase());
  }
  mountReel();
}
init().catch(()=>{$('#selected-title').textContent='The reels are taking a moment to load.';$('#collection-note').textContent='Please refresh to try again.';});
