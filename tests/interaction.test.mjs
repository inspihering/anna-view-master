import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pause=()=>new Promise(r=>setTimeout(r,20));
class Element{
 constructor(){this.attributes={};this.listeners={};this.style={};this.dataset={};this.children=[];this.tagName='BUTTON';this.classes=new Set();this.classList={add:(...c)=>c.forEach(v=>this.classes.add(v)),remove:(...c)=>c.forEach(v=>this.classes.delete(v)),toggle:()=>{}};}
 setAttribute(k,v){this.attributes[k]=v;} removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,v){this.listeners[k]=v;} append(v){this.children.push(v);} replaceChildren(...v){this.children=v;this.lastChild=v.at(-1);} focus(){document.activeElement=this;}
 fire(type,data={}){return this.listeners[type]?.({target:this,preventDefault(){},...data});}
}
test('lever, reverse, keyboard, touch, all 12 resource frames and reel memory and reduced-motion preference',async()=>{
 const nodes=new Map();const get=k=>{if(!nodes.has(k))nodes.set(k,new Element());return nodes.get(k);};
 const tabs=['content','strategy','creation'].map(k=>{const e=new Element();e.dataset.reel=k;return e;});
 const slots=Array.from({length:14},()=>new Element());
 globalThis.document={querySelector:get,querySelectorAll:s=>s==='[data-reel]'?tabs:slots,createElement:()=>new Element(),createTextNode:text=>({textContent:text}),addEventListener:(k,f)=>get('document').addEventListener(k,f)};
 const media={matches:true,addEventListener:(k,f)=>media.change=f};globalThis.matchMedia=()=>media;
 globalThis.location={origin:'http://127.0.0.1:4173',search:''};globalThis.Image=Element;
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public'+url,import.meta.url)))});
 try{
 await import('../public/app.js');await pause();
 const data=['content','strategy','creation'].map(k=>JSON.parse(readFileSync(new URL(`../public/data/${k}.json`,import.meta.url))));
 let lastGuide=null,lastSticker=null;const seenStickers=new Set();
 const check=(reel,i)=>{const key=`${reel}:${i}`,sticker=get('.personality-sticker').src;if(lastGuide!==null&&lastGuide!==key)assert.notEqual(sticker,lastSticker,'Illustration changes with guide, including seams and reel switches');assert.ok(sticker.startsWith('/assets/kristina/'));lastGuide=key;lastSticker=sticker;seenStickers.add(sticker);const d=data[reel];assert.equal(get('#counter').textContent,`0${i+1} / 0${d.items.length}`);assert.equal(get('#photo-link').href,d.items[i].url);assert.equal(get('#selected-title').textContent,d.items[i].title);assert.equal(get('#guide-description').textContent,d.items[i].description);assert.equal(tabs[reel].attributes['aria-pressed'],'true');};
 check(0,0);
 // Visit every guide, including each collection seam, using both round discs and shortcuts.
 for(let reel=0;reel<3;reel++){
 if(reel){const disc=get('#spare-reels').children.find(e=>e.dataset.collection===data[reel].key);assert.ok(disc);disc.fire('click');await pause();}
 check(reel,0);
 for(let turn=1;turn<=data[reel].items.length;turn++){get('#advance').fire('click');await pause();check(reel,turn%data[reel].items.length);}
 }
 assert.equal(seenStickers.size,6,'All six originals rotate through the guide sequence');
 get('#previous').fire('click');await pause();check(2,2);
 get('document').fire('keydown',{key:'ArrowRight'});await pause();check(2,0);
 get('document').fire('keydown',{key:'ArrowRight',target:{tagName:'INPUT'}});await pause();check(2,0);
 get('.viewer').fire('pointerdown',{pointerType:'touch',clientX:180,clientY:40});get('.viewer').fire('pointerup',{clientX:90,clientY:42});await pause();check(2,1);
 get('.viewer').fire('pointerdown',{pointerType:'touch',clientX:180,clientY:40});get('.viewer').fire('pointercancel');get('.viewer').fire('pointerup',{clientX:90,clientY:42});await pause();check(2,1);
 tabs[1].fire('click');await pause();check(1,0);tabs[2].fire('click');await pause();check(2,1);
 assert.equal(document.activeElement,get('#advance'));assert.ok(get('#announcement').textContent.includes('Guide 2 of 3'));
 media.change({matches:false});get('#advance').fire('click');assert.equal(get('#advance').attributes['aria-disabled'],'true');await new Promise(r=>setTimeout(r,570));assert.equal(get('#advance').attributes['aria-disabled'],undefined);
 }finally{globalThis.fetch=originalFetch;}
});
