import test from 'node:test';
import assert from 'node:assert/strict';
class Element{
 constructor(id){this.id=id;this.listeners={};this.attributes={};this.dataset={};this.value='';this.hidden=false;this.disabled=false;}
 addEventListener(k,f){this.listeners[k]=f;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 focus(){document.activeElement=this;}
 checkValidity(){return this.value.includes('@');}
 showModal(){this.open=true;}
 close(){this.open=false;this.fire('close');}
 reset(){for(const id of ['#gate-first-name','#gate-email'])document.querySelector(id).value='';}
 fire(type,data={}){return this.listeners[type]?.({preventDefault(){},currentTarget:this,...data});}
}
test('capture prevents duplicate submission and stale completion after close, validates and restores focus',async()=>{
 const nodes=new Map();const get=k=>{if(!nodes.has(k))nodes.set(k,new Element(k));return nodes.get(k);};
 globalThis.document={querySelector:get};globalThis.location={hostname:'127.0.0.1'};
 await import('../public/guide-gate.js');
 const dialog=get('#guide-gate'),form=get('#gate-form'),name=get('#gate-first-name'),email=get('#gate-email'),go=get('#gate-continue'),opener=get('#photo-link');
 opener.href='https://library.strategically-lazy.com/guides/instagram-saves-system';opener.fire('click');assert.equal(go.href,opener.href);assert.equal(document.activeElement,name);
 await form.fire('submit');assert.equal(name.attributes['aria-invalid'],'true');assert.equal(go.hidden,true);
 name.value='Demo';email.value='demo@example.com';const pending=form.fire('submit');
 assert.equal(get('#gate-submit').disabled,true);assert.equal(form.attributes['aria-busy'],'true');
 await form.fire('submit');assert.equal(dialog.dataset.state,'loading');
 dialog.fire('cancel');assert.equal(document.activeElement,opener);assert.equal(name.value,'');
 opener.fire('click');await pending;assert.equal(go.hidden,true);assert.equal(dialog.dataset.state,'idle');
 name.value='Demo';email.value='error@example.com';await form.fire('submit');assert.equal(dialog.dataset.state,'error');assert.equal(go.hidden,true);
 email.value='demo@example.com';await form.fire('submit');assert.equal(dialog.dataset.state,'success');assert.equal(go.hidden,false);assert.match(get('#gate-status').textContent,/No name or email was saved/);
});
