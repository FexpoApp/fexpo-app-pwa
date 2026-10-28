
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176'],{env:{...process.env,VITE_DATA_MODE:'demo'},windowsHide:true,stdio:'ignore'});
try {
for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5176')).ok)break;}catch{} await new Promise(r=>setTimeout(r,250));}
const root = 'docs/qa/2026-10-28';
await fs.mkdir(root,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
for(const theme of ['light','dark']) {
  await page.addInitScript(t=>localStorage.setItem('fexpo-pwa-theme',t),theme);
  for(const [name,path] of process.argv.includes('--routes-only') ? [] : [['home','/'],['catalog','/stands'],['stand','/stands/stand-altura-labs'],['profile','/profile'],['map-general','/map?view=2d'],['map-3d','/map?view=3d'],['map-interior','/map?plan=red-lower&view=2d']]) {
    await page.goto('http://127.0.0.1:5176'+path);
    await page.locator('main').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    if(name==='map-3d') await page.locator('[data-campus-canvas]').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({path:root+'/'+theme+'-'+name+'.png',fullPage:true});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow) errors.push(theme+' '+name+' overflow');
  }
  await page.goto('http://127.0.0.1:5176/map?view=2d');
  await page.getByRole('textbox',{name:'Buscar stands y empresas'}).fill('altura');
  await page.getByRole('button',{name:/Altura Labs/}).click();
  await page.getByRole('combobox',{name:'Punto de inicio del recorrido'}).selectOption('red-lower');
  await page.locator('[data-route=campus]').waitFor({state:'visible'});
  await page.screenshot({path:root+'/'+theme+'-route-campus.png',fullPage:true});
  await page.getByRole('button',{name:'Ver stand en Pabellón Bolivia'}).click();
  await page.locator('[data-route=indoor]').waitFor({state:'visible'});
  if(await page.locator('.indoor-selection').count()) errors.push('Route covered by selection card');
  await page.locator('.route-profile-link').waitFor({state:'visible'});
  await page.screenshot({path:root+'/'+theme+'-route-indoor.png',fullPage:true});
  await page.setViewportSize({width:320,height:844});
  for(const path of process.argv.includes('--routes-only') ? [] : ['/','/stands','/map?view=2d','/stands/stand-altura-labs','/profile']) {
    await page.goto('http://127.0.0.1:5176'+path);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow) errors.push(theme+' 320 '+path+' overflow');
  }
  await page.goto('http://127.0.0.1:5176/');
  await page.screenshot({path:root+'/'+theme+'-home-320.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
}
await page.setViewportSize({width:1440,height:1000});
await page.goto('http://127.0.0.1:5176/');
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:root+'/desktop.png',fullPage:true});
await fs.writeFile(root+'/report.json',JSON.stringify({errors},null,2));
await browser.close();
console.log(JSON.stringify({errors,output:root}));


} finally {server.kill();}


