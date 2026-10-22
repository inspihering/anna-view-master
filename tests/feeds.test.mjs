import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {getFeeds} from '../lib/feeds.mjs';
import {frameIndices,mod,reelSVG} from '../public/reel.js';

test('curated preview never fetches external feeds',async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Unexpected network request');};
 try{assert.equal((await getFeeds()).status,'disabled');}finally{globalThis.fetch=original;}
});
test('all reel frames use local destination cards and approved destinations',()=>{
 const counts={content:5,strategy:4,creation:3};const ids=new Set();
 assert.deepEqual(readdirSync(new URL('../public/data/',import.meta.url)).sort(),Object.keys(counts).map(k=>k+'.json').sort());
 for(const [key,count] of Object.entries(counts)){
 const data=JSON.parse(readFileSync(new URL(`../public/data/${key}.json`,import.meta.url)));
 assert.equal(data.status,'curated');assert.equal(data.items.length,count);assert.equal(data.action,'Open the library');
 for(const item of data.items){assert.equal(new URL(item.url).origin,'https://library.strategically-lazy.com');assert.ok(new URL(item.url).pathname.startsWith('/guides/'));assert.ok(!ids.has(item.id));ids.add(item.id);assert.ok(item.title);assert.ok(item.description);assert.ok(readFileSync(new URL('../public'+item.image,import.meta.url)).length>0);}
 }assert.equal(ids.size,12);
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 for(const url of ['https://www.linkedin.com/in/kristina-rowland-815b5a2a4/','https://www.strategically-lazy.com/','https://substack.com/@kristinarowland'])assert.ok(html.includes(`href="${url}"`));

});
test('reel traverses forward/backward across seams for short and long collections',()=>{
 for(const count of [2,4,10,20,50]){
 const items=Array.from({length:count},(_,id)=>({image:`/photo-${id}.jpg`}));
 const mounted=[...reelSVG({items,sceneLabels:['Scene']},'test',1,true).matchAll(/data-slot="\d+" href="\/photo-(\d+)\.jpg"/g)].map(m=>Number(m[1]));
 assert.deepEqual(mounted,frameIndices(0,1,count));
 for(let step=-100;step<=150;step++){
 const indices=frameIndices(step,1,count);assert.equal(indices[mod(step,14)],mod(1+step,count));assert.ok(indices.every(n=>n>=0&&n<count));
 assert.ok(indices.filter((v,i)=>v!==frameIndices(step+1,1,count)[i]).length<=1);
 }
 }
});
test('reel labels escape markup and contain no inherited identity',()=>{
 const svg=reelSVG({label:'<script>',subtitle:'A & B',number:1,sceneLabels:['Scene'],items:[{image:'/a.png'}]},'test');
 assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('KRISTINA ROWLAND'));assert.ok(!/ANNA|LE INDEX/.test(svg));
});
