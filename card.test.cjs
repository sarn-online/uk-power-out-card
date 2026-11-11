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
