import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

// Execute the actual component handler with controlled hooks, browser APIs and timers.
// Deferred promises deliberately run repeated handlers before a React rerender.
function fixture(share?: (data: unknown) => Promise<void>, clipboard: (text: string) => Promise<void> = async () => {}) {
  const states: unknown[] = [], refs: {current: unknown}[] = [];
  let stateIndex = 0, refIndex = 0;
  const cleanups: (() => void)[] = [];
  let effectIndex = 0;
  const effectDeps: unknown[][] = [];
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  const location = { href: '' };
  const exports: {default?: (props: object) => {key: string; type: (props: object) => {props: {children: {props: {onClick: () => void; children: unknown; title: string}}[]}}; props: object}} = {};
  const componentModule = {exports};
  const jsx = (type: unknown, props: object, key?: string) => ({type,props,key});
  vm.runInNewContext(transformSync(readFileSync('components/ShareAction.tsx','utf8'), {loader:'tsx',format:'cjs',jsx:'automatic'}).code, {
    exports, module: componentModule, DOMException, navigator: {share, clipboard:{writeText:clipboard}}, window:{location},
    setTimeout: (fn: () => void, delay: number) => {assert.equal(delay,4000); timers.set(++nextTimer,fn); return nextTimer;},
    clearTimeout: (id: number) => timers.delete(id),
    require: (name: string) => name === 'react' ? {
      useState: (initial: unknown) => {const i=stateIndex++; if (!(i in states)) states[i]=initial; return [states[i],(value: unknown) => {states[i]=value;}];},
      useRef: (initial: unknown) => {const i=refIndex++; return refs[i] ??= {current:initial};},
      useEffect: (fn: () => (() => void), deps: unknown[]) => {const i=effectIndex++; if (!effectDeps[i] || deps.some((v,j) => v !== effectDeps[i][j])) {cleanups[i]?.();cleanups[i]=fn();effectDeps[i]=deps;}},
    } : name === 'react/jsx-runtime' ? {jsx,jsxs:jsx} : {Check:'check',Share2:'share'},
  });
  const props = {title:'A & B',text:'Final 100–107',url:'https://varsityvue.com/games/a%2Fb'};
  const component = componentModule.exports.default!;
  function render(text?: string) {if (text !== undefined) props.text=text;stateIndex=refIndex=effectIndex=0; return (component(props) as unknown as {props:{children:{props:{onClick:()=>void;children:unknown;title:string}}[]}}).props.children;}
  return {render, timers, location, unmount: () => cleanups.forEach(fn => fn()), };
}
const flush = async () => {await new Promise(resolve => setImmediate(resolve));};

test('pending native share ignores repeated handler calls before rerender, then clears guard',async () => {
  let resolve!: () => void, reject!: (error: Error) => void, calls=0, copies=0;
  const f=fixture(() => {calls++; return new Promise<void>((a,b) => {resolve=a;reject=b;});},async () => {copies++;});
  const click=f.render()[0].props.onClick;
  click();click();assert.equal(calls,1);assert.equal(copies,0);
  resolve();await flush();click();assert.equal(calls,2);
  reject(new DOMException('Cancelled','AbortError'));await flush();assert.equal(copies,0);
  click();assert.equal(calls,3);reject(new Error('Unavailable'));await flush();assert.equal(copies,1);
  click();assert.equal(calls,4);resolve();await flush();f.unmount();
});
test('clipboard feedback expires, resets on another attempt and cleans up on unmount',async () => {
  const f=fixture();let children=f.render();children[0].props.onClick();await flush();
  children=f.render();assert.equal(children[1].props.children,'Link copied');assert.equal(f.timers.size,1);
  children[0].props.onClick();await flush();assert.equal(f.timers.size,1);
  const [id, expire]=[...f.timers.entries()][0];f.timers.delete(id);expire();assert.equal(f.render()[1].props.children,'');
  f.render()[0].props.onClick();await flush();
  assert.equal(f.render('Updated score')[1].props.children,'');assert.equal(f.timers.size,0);
  f.render()[0].props.onClick();await flush();f.unmount();assert.equal(f.timers.size,0);
});
test('unmounted pending share does not fall back or publish stale feedback',async () => {
  let reject!: (error: Error) => void, copies=0;
  const f=fixture(() => new Promise<void>((_,r) => {reject=r;}),async () => {copies++;});
  f.render()[0].props.onClick();f.unmount();reject(new Error('Unavailable'));await flush();
  assert.equal(copies,0);assert.equal(f.timers.size,0);
});
test('clipboard rejection retains encoded email fallback and releases guard',async () => {
  let copies=0;
  const f=fixture(undefined,async () => {copies++;throw new Error('Blocked');});
  const click=f.render()[0].props.onClick;click();await flush();
  assert.equal(f.location.href,'mailto:?subject=A%20%26%20B&body=Final%20100%E2%80%93107%0Ahttps%3A%2F%2Fvarsityvue.com%2Fgames%2Fa%252Fb');
  click();await flush();assert.equal(copies,2);f.unmount();
});

test('content change during pending share keeps guard and rejects obsolete fallback',async () => {
  let reject!: (error: Error) => void, shares=0, copies=0;
  const f=fixture(() => {shares++;return new Promise<void>((_,r) => {reject=r;});},async () => {copies++;});
  f.render()[0].props.onClick();
  f.render('Updated score')[0].props.onClick();assert.equal(shares,1);
  reject(new Error('Unavailable'));await flush();assert.equal(copies,0);
  f.render()[0].props.onClick();assert.equal(shares,2);
  f.unmount();reject(new Error('Unavailable'));await flush();
});
