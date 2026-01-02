#!/usr/bin/env node
import m from"fs";import a from"path";import{fileURLToPath as b}from"url";const g=b(import.meta.url),S=a.dirname(g),f=a.join(S,"../src/ui");function d(s){const t=s.split(`
`),e={tag:"",description:"",attributes:[],topics:{subscribes:[],publishes:[]},slots:[],methods:[],examples:[]},n=s.match(/\/\/\s*<([\w-]+)>/);if(n)e.tag=n[1];else{const c=s.match(/export class (\w+) extends HTMLElement/);c&&(e.tag=c[1].replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())}const r=s.match(/\/\/\s*<[\w-]+>\s*[—-]\s*(.+)/);r&&(e.description=r[1].trim());const l=s.match(/\/\/\s*Attributes?:\s*([\s\S]*?)(?=\/\/\s*(?:Topics?|Slots?|Usage|$))/);l&&l[1].split(`
`).forEach(o=>{const i=o.match(/\/\/\s*-\s*(\S+):\s*(.+)/);i&&e.attributes.push({name:i[1],description:i[2].trim()})});const p=s.match(/\/\/\s*Topics?:\s*([\s\S]*?)(?=\/\/\s*(?:Slots?|Usage|Data|$))/);p&&p[1].split(`
`).forEach(o=>{const i=o.match(/\/\/\s*-\s*Subscribes?:\s*(.+)/),h=o.match(/\/\/\s*-\s*Publishes?:\s*(.+)/);i?e.topics.subscribes.push(i[1].trim()):h&&e.topics.publishes.push(h[1].trim())});const u=s.match(/\/\/\s*Slots?:\s*([\s\S]*?)(?=\/\/\s*(?:Methods?|Usage|$))/);return u&&u[1].split(`
`).forEach(o=>{const i=o.match(/\/\/\s*-\s*(\S+):\s*(.+)/);i&&e.slots.push({name:i[1],description:i[2].trim()})}),e}function $(s){let t=`/**
`;return t+=` * ${s.tag} - ${s.description}
`,t+=` * 
`,t+=" * @element "+s.tag+`
`,t+=` * @extends {HTMLElement}
`,t+=` * 
`,s.attributes.length>0&&(t+=" * @attr {string} "+s.attributes.map(e=>e.name).join(" - ")+`
`,s.attributes.forEach(e=>{t+=` * @attr {string} ${e.name} - ${e.description}
`}),t+=` * 
`),(s.topics.subscribes.length>0||s.topics.publishes.length>0)&&(t+=` * @pan
`,s.topics.subscribes.forEach(e=>{t+=` * @subscribes ${e}
`}),s.topics.publishes.forEach(e=>{t+=` * @publishes ${e}
`}),t+=` * 
`),s.slots.length>0&&(s.slots.forEach(e=>{t+=` * @slot ${e.name} - ${e.description}
`}),t+=` * 
`),t+=` * @example
`,t+=" * ```html\n",t+=` * <${s.tag}`,s.attributes.length>0&&(t+=`
 *   ${s.attributes[0].name}="value"`),t+=`></${s.tag}>
`,t+=" * ```\n",t+=` */
`,t}function E(s){const t=m.readFileSync(s,"utf8"),e=d(t);if(!e.tag)return console.log(`⚠️  Skipping ${a.basename(s)} - couldn't extract tag name`),!1;const n=t.search(/^(import|export)/m);if(n===-1)return console.log(`⚠️  Skipping ${a.basename(s)} - no import/export found`),!1;const r=t.substring(n),p=$(e)+`
`+r;return m.writeFileSync(s,p,"utf8"),console.log(`✅ Updated ${a.basename(s)}`),!0}function L(){console.log(`🔄 Standardizing JSDoc comments in component files...
`);const s=m.readdirSync(f).filter(n=>n.endsWith(".mjs")).map(n=>a.join(f,n));let t=0,e=0;s.forEach(n=>{E(n)?t++:e++}),console.log(`
✨ Complete! Updated: ${t}, Skipped: ${e}`)}L();
