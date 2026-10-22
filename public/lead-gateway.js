// No CRM adapter or credentials are configured in this preview.
export function validEmail(value){return typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);}
export function validFirstName(value){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=80&&!/[\u0000-\u001f\u007f<>]/.test(value);}
export function createLeadGateway({mode='unavailable',persist,timeoutMs=10000,delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 return async ({firstName,email,guide,newsletterOptIn=false})=>{
  const name=typeof firstName==='string'?firstName.trim():'';
  const normalized=typeof email==='string'?email.trim():'';
  if(!validFirstName(name))throw Error('Enter your first name (up to 80 characters).');
  if(!validEmail(normalized))throw Error('Enter a valid email address.');
  if(mode==='demo'){
   if(name!=='Demo'||!['demo@example.com','error@example.com'].includes(normalized.toLowerCase()))throw Error('Use Demo and demo@example.com for this preview. No details are collected.');
   await delay(600);
   if(normalized.toLowerCase()==='error@example.com')throw Error('Demo error: nothing was saved. Try demo@example.com to preview success.');
   return {demo:true,persisted:false};
  }
  if(mode!=='live'||typeof persist!=='function')throw Error('The library form is not connected yet. Please try again later.');
  let timer;const controller=new AbortController();
  try{
   const receipt=await Promise.race([
    Promise.resolve().then(()=>persist({firstName:name,email:normalized,guide,...(newsletterOptIn===true?{newsletterConsent:{requested:true,source:'strategically-lazy-link-in-bio',recordedAt:new Date().toISOString(),label:'Send me the newsletter, too',preserveSuppression:true}}:{})},{signal:controller.signal})),
    new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);})
   ]);
   if(receipt?.persisted!==true)throw Error('missing receipt');
   return {demo:false,persisted:true};
  }catch{throw Error('We could not confirm your details were saved. Please try again.');}
  finally{clearTimeout(timer);}
 };
}
