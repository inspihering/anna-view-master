import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('hosting policy blocks arbitrary scripts, framing and native form submission; links use verified HTTPS destinations',()=>{
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
 const headers=Object.fromEntries(config.headers.find(r=>r.source==='/(.*)').headers.map(h=>[h.key,h.value]));
 assert.match(headers['Content-Security-Policy'],/script-src 'self';/);
 assert.match(headers['Content-Security-Policy'],/form-action 'none'/);
 assert.match(headers['Content-Security-Policy'],/frame-ancestors 'none'/);
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/<a\b[^>]*>/g)){
  const tag=match[0];if(tag.includes('target="_blank"'))assert.match(tag,/rel="noopener noreferrer"/);
  const href=tag.match(/href="([^"]+)"/)?.[1];if(href&&!href.startsWith('#'))assert.ok(href.startsWith('https://'));
 }
 assert.match(html,/https:\/\/cage-or-business\.vercel\.app\//);
 assert.ok(!html.includes('12 GUIDES. THREE REELS.'));
});
