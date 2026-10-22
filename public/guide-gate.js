import {createLeadGateway,validFirstName,validEmail} from './lead-gateway.js';
const $=selector=>document.querySelector(selector);
const dialog=$('#guide-gate'),form=$('#gate-form'),email=$('#gate-email'),firstName=$('#gate-first-name'),submit=$('#gate-submit'),status=$('#gate-status'),proceed=$('#gate-continue');
const newsletter=$('#gate-newsletter');
const isLocal=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
const collect=createLeadGateway({mode:isLocal?'demo':'unavailable'});
const buttonLabel='Give it to me!';
if(!isLocal){$('.demo-notice').textContent='The library form is not connected yet. No details will be sent.';$('.gate-fineprint').textContent='Please check back soon.';}
submit.textContent=buttonLabel;
let opener=null,attempt=0,pending=false;
function reset(){attempt++;pending=false;form.reset();newsletter.checked=false;newsletter.disabled=false;form.hidden=false;submit.disabled=false;email.disabled=false;firstName.disabled=false;newsletter.disabled=false;firstName.removeAttribute('aria-invalid');email.removeAttribute('aria-invalid');submit.textContent=buttonLabel;status.textContent='';proceed.hidden=true;dialog.dataset.state='idle';form.removeAttribute('aria-busy');}
function close(){dialog.close();}
function open(event){event.preventDefault();opener=event.currentTarget;reset();proceed.href=opener.href;dialog.showModal();firstName.focus();}
$('#photo-link').addEventListener('click',open);
$('#gate-close').addEventListener('click',close);
dialog.addEventListener('close',()=>{reset();opener?.focus({preventScroll:true});});
dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
dialog.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(el=>!el.hidden&&!el.closest('[hidden]'));
 const first=focusable[0],last=focusable.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(pending)return;
 proceed.hidden=true;email.removeAttribute('aria-invalid');firstName.removeAttribute('aria-invalid');
 if(!validFirstName(firstName.value)){firstName.setAttribute('aria-invalid','true');dialog.dataset.state='error';status.textContent='Enter your first name (up to 80 characters).';firstName.focus();return;}
 if(!email.checkValidity()||!validEmail(email.value.trim())){email.setAttribute('aria-invalid','true');dialog.dataset.state='error';status.textContent='Enter a valid email address.';email.focus();return;}
 const current=++attempt;pending=true;submit.disabled=true;email.disabled=true;firstName.disabled=true;newsletter.disabled=true;form.setAttribute('aria-busy','true');dialog.dataset.state='loading';status.textContent=isLocal?'Previewing… nothing is being sent.':'Checking library access…';submit.textContent=isLocal?'Previewing…':'Please wait…';$('#gate-close').focus();
 try{
  const result=await collect({firstName:firstName.value,email:email.value,guide:$('#selected-title').textContent,newsletterOptIn:newsletter.checked===true});
  if(current!==attempt||!dialog.open)return;
  if(!result.demo&&result.persisted!==true)throw Error('Email collection is not connected yet.');
  dialog.dataset.state='success';form.hidden=true;status.textContent=result.demo?'Demo complete. No name or email was saved or sent. No newsletter signup was made. You can now open the library preview.':'Your details were saved. You can now open the library.';
  proceed.textContent=result.demo?'Open the library preview ↗':'Open the library ↗';proceed.hidden=false;proceed.focus();
 }catch(error){
  if(current!==attempt||!dialog.open)return;
  dialog.dataset.state='error';status.textContent=error.message;email.disabled=false;firstName.disabled=false;newsletter.disabled=false;email.focus();
 }finally{
  if(current===attempt){pending=false;submit.disabled=false;email.disabled=false;firstName.disabled=false;newsletter.disabled=false;submit.textContent=buttonLabel;form.removeAttribute('aria-busy');}
 }
});
