import test from 'node:test';
import assert from 'node:assert/strict';
import {createLeadGateway,validEmail,validFirstName} from '../public/lead-gateway.js';
const delay=async()=>{};
test('email validation rejects missing and malformed values',()=>{
 for(const value of ['',null,'hello','a@','a b@example.com','a@example','a'.repeat(255)+'@example.com'])assert.equal(validEmail(value),false);
 assert.equal(validEmail('demo@example.com'),true);
});
test('demo uses only synthetic addresses, never persists, and exercises errors',async()=>{
 let persisted=false;const collect=createLeadGateway({mode:'demo',delay,persist:async()=>{persisted=true;}});
 assert.deepEqual(await collect({firstName:'Demo',email:'demo@example.com',guide:'Test guide'}),{demo:true,persisted:false});
 await assert.rejects(collect({firstName:'Demo',email:'error@example.com'}),/Demo error/);
 await assert.rejects(collect({firstName:'Demo',email:'person@example.org'}),/No details/);
 assert.equal(persisted,false);
});
test('live seam fails closed without confirmed persistence',async()=>{
 await assert.rejects(createLeadGateway({mode:'live'})({firstName:'Demo',email:'demo@example.com'}),/not connected/);
 await assert.rejects(createLeadGateway({mode:'live',persist:async()=>({ok:true})})({firstName:'Demo',email:'demo@example.com'}),/could not confirm/);
 await assert.rejects(createLeadGateway({mode:'live',persist:async()=>{throw Error('offline');}})({firstName:'Demo',email:'demo@example.com'}),/could not confirm/);
 assert.deepEqual(await createLeadGateway({mode:'live',persist:async()=>({persisted:true})})({firstName:'Demo',email:'demo@example.com'}),{demo:false,persisted:true});
});

test('first names accept international names and reject blank, markup and controls',()=>{
 for(const value of ['', '  ', null, '<script>', 'a\u0000b', 'x'.repeat(81)])assert.equal(validFirstName(value),false);
 for(const value of ['Demo','Élodie','李',"D’Arcy",'Mary Jane'])assert.equal(validFirstName(value),true);
});
test('live adapter receives normalized first name and email; timeout fails closed',async()=>{
 let received;
 await createLeadGateway({mode:'live',persist:async value=>{received=value;return {persisted:true};}})({firstName:' Demo ',email:' demo@example.com ',guide:'Guide'});
 assert.deepEqual(received,{firstName:'Demo',email:'demo@example.com',guide:'Guide'});
 await assert.rejects(createLeadGateway({mode:'live',timeoutMs:5,persist:()=>new Promise(()=>{})})({firstName:'Demo',email:'demo@example.com'}),/could not confirm/);
 await assert.rejects(createLeadGateway()({firstName:'Demo',email:'demo@example.com'}),/not connected/);
});

test('newsletter is optional and only explicit opt-in carries separate consent metadata',async()=>{
 const received=[];const collect=createLeadGateway({mode:'live',persist:async value=>{received.push(value);return {persisted:true};}});
 for(const newsletterOptIn of [false,undefined,'true',true])await collect({firstName:'Demo',email:'demo@example.com',newsletterOptIn});
 for(const value of received.slice(0,3))assert.equal('newsletterConsent' in value,false);
 const consent=received[3].newsletterConsent;assert.equal(consent.requested,true);assert.equal(consent.preserveSuppression,true);assert.equal(consent.source,'strategically-lazy-link-in-bio');assert.ok(Number.isFinite(Date.parse(consent.recordedAt)));
});
