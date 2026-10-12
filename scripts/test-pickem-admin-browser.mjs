// Actual client components; isolated router/server responses, never production credentials.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {build}=require('esbuild'); const {chromium}=require('playwright');
const bundle=await build({stdin:{contents:`
import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
import {WeekNavigation,AdminActionForm} from './app/internal/pickem/submissions/controls';
import Recovery from './app/internal/pickem/submissions/error';
const weeks=[{id:'11',season:2026,week:11,status:'open'},{id:'7',season:2026,week:7,status:'open'}];
window.writes=0; window.mode='success'; window.fields=[];
function App(){const [week,setWeek]=useState('11');const [nonce,setNonce]=useState(0);const [failed,setFailed]=useState(false);
window.router={push:async url=>{await new Promise(r=>setTimeout(r,200));setWeek(new URL(url,location.href).searchParams.get('week'));},replace:async url=>{await new Promise(r=>setTimeout(r,200));if(window.failRefresh){setFailed(true);return;}setNonce(n=>n+1);}};
const action=async (_state,form)=>{window.writes++;window.fields.push(Object.fromEntries(form));await new Promise(r=>setTimeout(r,200));if(window.mode==='throw')throw Error('transport');if(window.mode==='reject')return {status:'rejected',message:'Record notification before deciding this claim'};return {status:'recorded',message:'Operation recorded. Refresh status before performing another operation.'};};
if(failed)return <Recovery reset={()=>{window.failRefresh=false;setFailed(false);setNonce(n=>n+1)}}/>;
return <WeekNavigation key={week+':'+nonce} weeks={weeks} selected={week}><h2>Cash contest status · Week {week}</h2>{[1,2].map(i=><AdminActionForm key={i} action={action}><input name="week_id" type="hidden" value={week}/><input name="reason" defaultValue="Reviewed"/><button>Record decision {i}</button></AdminActionForm>)}</WeekNavigation>}
createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'router-fixture',setup(build){build.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export function useRouter(){return window.router}',loader:'js'}));}}]});
if(process.argv.includes('--dom')) {
 const {JSDOM}=require(process.env.PICKEM_DOM_MODULE ?? 'jsdom');
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/internal/pickem/submissions?week=11',runScripts:'dangerously'});
 const {window}=dom;window.eval(bundle.outputFiles[0].text);
 const wait=async check=>{for(let i=0;i<200;i++){if(check())return;await new Promise(r=>setTimeout(r,10));}throw Error('DOM condition timed out')};
 const buttons=()=>[...window.document.querySelectorAll('button')];const button=name=>buttons().find(b=>b.textContent===name);const disabled=name=>button(name)?.disabled || button(name)?.closest('fieldset')?.disabled;
 await wait(()=>button('View week'));
 const select=window.document.querySelector('select');select.value='7';select.dispatchEvent(new window.Event('change',{bubbles:true}));
 await wait(()=>window.document.querySelector('h2').closest('[hidden]'));
 button('View week').click();await wait(()=>button('Loading week…'));assert.equal(button('Loading week…').disabled,true);
 await wait(()=>window.document.querySelector('h2')?.textContent.endsWith('Week 7'));
 button('Record decision 1').click();button('Record decision 1').click();button('Record decision 2').click();await wait(()=>disabled('Record decision 2'));
 await wait(()=>window.document.querySelector('[role="status"]')?.textContent.includes('Operation recorded'));
 assert.equal(window.writes,1);assert.deepEqual(JSON.parse(JSON.stringify(window.fields[0])),{week_id:'7',reason:'Reviewed'});
 window.failRefresh=true;button('Refresh status (does not resubmit)').click();await wait(()=>button('Retry loading status'));assert.equal(window.writes,1);button('Retry loading status').click();await wait(()=>button('Record decision 1')&&!disabled('Record decision 1'));
 window.mode='reject';button('Record decision 1').click();await wait(()=>window.document.querySelector('[role="alert"]'));assert.equal(disabled('Record decision 1'),false);
 window.mode='throw';button('Record decision 1').click();await wait(()=>window.document.querySelector('[role="alert"]')?.textContent.includes('response was lost'));assert.equal(disabled('Record decision 2'),true);
 button('Refresh status (does not resubmit)').click();await wait(()=>button('Record decision 1')&&!disabled('Record decision 1'));assert.equal(window.writes,3);
 dom.window.close();console.log('PASS DOM integration: slow week navigation, stale-data hiding, complete FormData, shared duplicate lock, business rejection, lost response, successful write / failed refresh, recovery without replay');process.exit(0);
}
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:'<div id="root"></div><script src="/fixture.js"></script>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{const fallback=process.env.PICKEM_CHROMIUM_MODULE ? require(process.env.PICKEM_CHROMIUM_MODULE).default : null;browser=await chromium.launch({headless:true,...(fallback ? {executablePath:process.env.PICKEM_CHROMIUM_EXECUTABLE ?? await fallback.executablePath(),args:process.env.PICKEM_CHROMIUM_EXECUTABLE ? ["--no-sandbox", "--no-zygote", "--single-process", "--disable-gpu", "--disable-software-rasterizer"] : fallback.args} : {})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
await page.getByRole('combobox').selectOption('7');assert.equal(await page.getByRole('heading').count(),0);await page.getByRole('button',{name:'View week',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Loading week…'}).isDisabled(),true);await page.getByRole('heading',{name:'Cash contest status · Week 7'}).waitFor();
await page.getByRole('button',{name:'Record decision 1',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Record decision 2',exact:true}).isDisabled(),true);await page.getByText('Operation recorded.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>window.writes),1);assert.deepEqual(await page.evaluate(()=>window.fields[0]),{week_id:'7',reason:'Reviewed'});
await page.evaluate(()=>window.failRefresh=true);await page.getByRole('button',{name:'Refresh status (does not resubmit)',exact:true}).click();await page.getByRole('heading',{name:'Pick ’Em status could not be loaded'}).waitFor();assert.equal(await page.evaluate(()=>window.writes),1);await page.getByRole('button',{name:'Retry loading status'}).click();assert.equal(await page.getByRole('button',{name:'Record decision 1',exact:true}).isEnabled(),true);
await page.evaluate(()=>window.mode='reject');await page.getByRole('button',{name:'Record decision 1',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'Record decision 1',exact:true}).isEnabled(),true);
await page.evaluate(()=>window.mode='throw');await page.getByRole('button',{name:'Record decision 1',exact:true}).click();await page.getByText('The response was lost.',{exact:false}).waitFor();assert.equal(await page.getByRole('button',{name:'Record decision 2',exact:true}).isDisabled(),true);await page.getByRole('button',{name:'Refresh status (does not resubmit)',exact:true}).click();await page.waitForFunction(()=>document.querySelector('fieldset')?.disabled===false);assert.equal(await page.evaluate(()=>window.writes),3);assert.deepEqual(errors,[]);console.log('PASS: week selection, slow responses, stale-data hiding, FormData, shared duplicate lock, rejection, lost response, post-write refresh failure and recovery');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
