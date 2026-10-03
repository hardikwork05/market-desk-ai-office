const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for (const url of process.argv.slice(2)) {
  const p=await b.newPage({viewport:{width:1280,height:720}});
  await p.route(/fonts\./,r=>r.abort());p.on('pageerror',e=>console.log('[pageerror]',e.message));
  // hide the stage as soon as it exists, as when the page loads in a collapsed or hidden pane
  await p.addInitScript(()=>{new MutationObserver(()=>{const s=document.getElementById('stage');if(s&&!window.__z){window.__z=1;s.style.display='none';setTimeout(()=>{s.style.display='';},1500);}}).observe(document,{childList:true,subtree:true});});
  await p.goto(url);await p.waitForTimeout(4500);
  console.log(url, await p.evaluate(()=>[...document.querySelectorAll('.tag')].slice(0,2).map(t=>t.style.visibility+' '+(t.style.transform||'NO TRANSFORM'))));
  await p.close();
}
await b.close()})();
