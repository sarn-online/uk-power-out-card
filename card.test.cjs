const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('pdf-schedules.json'));
const context={Intl,Date,HTMLElement:class{},customElements:{get:()=>false,define(){}},window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync('power-out-card.js','utf8')+'\nthis.api={periods,clock,LETTERS,ROTA_LEVELS,PowerOutCard};',context);
const {periods,clock,LETTERS,ROTA_LEVELS,PowerOutCard}=context.api;
let checks=0;
for(let l=1;l<=18;l++)for(let r=0;r<18;r++)for(let d=0;d<7;d++){
 const ps=periods(LETTERS[r],l,d);assert.equal(ps[0].start,0);assert.equal(ps.at(-1).end,1440);
 for(let p=0;p<8;p++){assert.equal(ROTA_LEVELS[l-1][r][d*8+p]==='1',data[l-1][r][d*8+p]);checks++;}
 for(const p of ps)for(let m=p.start;m<p.end;m++){
  const idx=m<30?((d+6)%7)*8+7:d*8+Math.floor((m-30)/180);
  assert.equal(p.off,data[l-1][r][idx]);checks++;
 }
}
for(const [s,day,minute] of [['2026-07-05T23:15:00Z',0,15],['2026-03-29T01:30:00Z',6,150],['2026-10-25T01:30:00Z',6,90]]){const c=clock(new Date(s));assert.equal(c.day,day);assert.equal(c.minute,minute);}
// Render and event smoke tests without browser dependencies; full browser render is checked in HA.
const saved=new Map();context.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
const controls={};const card=Object.create(PowerOutCard.prototype);card.shadowRoot={innerHTML:'',querySelector:s=>controls[s]??(controls[s]={setAttribute(){}})};
card.setConfig({title:'Power Out',rota:'N',level:7,storage_key:'test'});
assert.equal((card.shadowRoot.innerHTML.match(/<section class="day">/g)||[]).length,6);
assert(card.shadowRoot.innerHTML.includes('Today’s reference'));assert(card.shadowRoot.innerHTML.includes('09:30 – 12:30'));
controls['#level'].onchange({target:{value:'18'}});assert.equal(card._level,18);assert(card.shadowRoot.innerHTML.includes('No ON periods'));
card.setConfig({rota:'A',level:1,storage_key:'test'});assert.equal(card._level,18);assert.equal(card._letter,'N');
assert.throws(()=>card.setConfig({level:19}));assert.throws(()=>card.setConfig({rota:'F'}));
console.log(`PASS: ${checks.toLocaleString()} source/minute checks across 324 scenarios; UK DST, six-day render, controls and persistence.`);

assert.equal((card.shadowRoot.innerHTML.match(/<section class="day">/g)||[]).length,6);
assert(!card.shadowRoot.innerHTML.includes('<input id="slider"'));
assert(!card.shadowRoot.innerHTML.includes('>Block '));
assert(!card.shadowRoot.innerHTML.includes(' / 18</option>'));
assert(!card.shadowRoot.innerHTML.includes('Reference OFF times · UK time'));
assert(!card.shadowRoot.innerHTML.includes('class="sub">Rota '));
assert.throws(()=>card.setConfig(null));
// Stored garbage must never select a different data row or crash rendering.
saved.set('power-out-card:v1:corrupt','{"rota":"F","level":999}');
card.setConfig({rota:'A',level:1,storage_key:'corrupt',title:'<img src=x onerror=alert(1)>'});
assert.equal(card._letter,'A');assert.equal(card._level,1);
assert(!card.shadowRoot.innerHTML.includes('<img src=x'));
assert(card.shadowRoot.innerHTML.includes('&lt;img'));
console.log('PASS: compact labels, subtitle removal, invalid settings, corrupt preferences and HTML escaping.');
// Verify the native visual editor emits typed configuration updates.
vm.runInContext('this.Editor=PowerOutCardEditor;',context);
context.CustomEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
const fields={};const editor=Object.create(context.Editor.prototype);
editor.shadowRoot={innerHTML:'',querySelector:s=>fields[s]??(fields[s]={})};
let event;editor.dispatchEvent=e=>{event=e;};
editor.setConfig({type:'custom:power-out-card',rota:'N',level:7});
fields['#level'].value='18';fields['#level'].onchange();
assert.equal(event.type,'config-changed');assert.equal(event.detail.config.level,18);assert(event.bubbles&&event.composed);
fields['#title'].value='Reference rota';fields['#title'].onchange();assert.equal(event.detail.config.title,'Reference rota');
console.log('PASS: visual editor event propagation and numeric levels.');
// Shared integration mode must ignore browser preferences and never extend validity.
card.setConfig({entity:'sensor.power_out_reference_supply',rota:'A',level:18,storage_key:'test'});
assert(card.shadowRoot.innerHTML.includes('missing, unavailable or incompatible'));
const attributes={reference_only:true,plan_type:'vrdp_reference',rota:'N',level:7,start_date:'2026-11-14',end_date:'2026-11-15'};
card.hass={states:{'sensor.power_out_reference_supply':{state:'unknown',attributes}}};
assert.equal(card._letter,'N');assert.equal(card._level,7);
assert(card.shadowRoot.innerHTML.includes('Shared Home Assistant reference scenario'));
assert(!card.shadowRoot.innerHTML.includes('aria-label="Rota letter" disabled')); 

for(const [iso,day,known] of [['2026-11-13',4,0],['2026-11-14',5,1410],['2026-11-15',6,1440],['2026-11-16',0,30],['2026-11-17',1,0]]){
 const ps=card._referencePeriods(day,iso);
 assert.equal(ps.reduce((n,p)=>n+p.end-p.start,0),1440);
 assert.equal(ps.filter(p=>p.off!==null).reduce((n,p)=>n+p.end-p.start,0),known);
 assert(!card.windows(ps).includes('ON all day')||known===1440);
}
const changed={...attributes,rota:'U',level:18};
card.hass={states:{'sensor.power_out_reference_supply':{state:'on',attributes:changed}}};
assert.equal(card._letter,'U');assert.equal(card._level,18);
card.hass={states:{'sensor.power_out_reference_supply':{state:'unavailable',attributes:changed}}};
assert(card.shadowRoot.innerHTML.includes('missing, unavailable or incompatible'));
assert(!card.shadowRoot.innerHTML.includes('Today’s reference'));
card.hass={states:{'sensor.power_out_reference_supply':{state:'on',attributes:{...attributes,plan_type:'lldp'}}}};
assert(!card.shadowRoot.innerHTML.includes('Today’s reference'));
assert.throws(()=>card.setConfig({entity:'switch.kettle'}));
console.log('PASS: shared settings, updates, finite validity and missing/incompatible entities.');

// An unknown remainder must not imply an ON interval at continuous level 18.
card.setConfig({entity:'sensor.power_out_reference_supply'});
card.hass={states:{'sensor.power_out_reference_supply':{state:'on',attributes:changed}}};
const partial=card._referencePeriods(5,'2026-11-14');
assert(card.windows(partial).includes('No ON periods within validity'));
assert(!card.windows(partial).includes('ON only in the remaining valid periods'));
console.log('PASS: partial-validity level 18 never implies an ON period.');

(async()=>{
 const calls=[],resolvers=[];const fields={};
 const fast=Object.create(PowerOutCard.prototype);
 fast.shadowRoot={innerHTML:'',querySelector:s=>fields[s]??(fields[s]={setAttribute(){}})};
 fast.setConfig({entity:'sensor.power_out_reference_supply'});
 const source={states:{'sensor.power_out_reference_supply':{state:'on',attributes}},
  callService:(domain,service,data)=>{calls.push({domain,service,data});return new Promise(resolve=>resolvers.push(resolve));}};
 fast.hass=source;
 const first=fields['#level-slider'].oninput({target:{value:'6'}});
 assert.equal(fast._level,6);assert(fast.shadowRoot.innerHTML.includes('Saving shared settings'));
 assert(!fast.shadowRoot.innerHTML.includes('aria-label="Reference level" disabled'));
 await Promise.resolve();assert.equal(calls[0].data.level,6);
 const second=fields['#level-slider'].oninput({target:{value:'7'}});
 const third=fields['#level-slider'].oninput({target:{value:'8'}});
 assert.equal(fast._level,8);
 fast.hass={...source,states:{'sensor.power_out_reference_supply':{state:'on',attributes:{...attributes,level:6}}}};
 assert.equal(fast._level,8); // Old acknowledgement cannot overwrite the newest preview.
 resolvers[0]();await first;await second;await Promise.resolve();
 assert.equal(calls.length,2);assert.equal(calls[1].data.level,8); // Intermediate 7 was coalesced.
 fast.hass={...source,states:{'sensor.power_out_reference_supply':{state:'on',attributes:{...attributes,level:8}}}};
 resolvers[1]();await third;
 assert(!fast.shadowRoot.innerHTML.includes('Saving shared settings'));
 assert(!('rota' in calls[1].data));assert(!('start_date' in calls[1].data));
 fast._hass.callService=async()=>{throw Error('<img src=x> denied');};
 await fields['#level'].onchange({target:{value:'9'}});
 assert.equal(fast._level,8);assert(fast.shadowRoot.innerHTML.includes('Could not save'));
 assert(fast.shadowRoot.innerHTML.includes('&lt;img src=x&gt;'));assert(!fast.shadowRoot.innerHTML.includes('<img src=x>'));
 assert(fast.shadowRoot.innerHTML.indexOf('id="shared-info"')>fast.shadowRoot.innerHTML.indexOf('id="about"'));
 const plain=Object.create(PowerOutCard.prototype),plainFields={};
 plain.shadowRoot={innerHTML:'',querySelector:s=>plainFields[s]??(plainFields[s]={})};
 plain.setConfig({rota:'N',level:5,storage_key:'slider'});
 await plainFields['#level-slider'].oninput({target:{value:'18'}});
 assert.equal(plain._level,18);assert(plain.shadowRoot.innerHTML.includes('No ON periods'));
 console.log('PASS: immediate slider preview, latest-value saves, stale acknowledgement protection, rollback and bottom metadata.');
})().catch(error=>{console.error(error);process.exitCode=1;});
