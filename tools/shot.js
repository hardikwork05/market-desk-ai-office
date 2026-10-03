const {chromium}=require('playwright');
const args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
(async()=>{
  const b=await chromium.launch({args});
  const jobs=JSON.parse(process.argv[2]);
  for(const j of jobs){
    const ctx=await b.newContext({viewport:{width:j.w,height:j.h},deviceScaleFactor:j.dpr||1,hasTouch:!!j.touch});
    const p=await ctx.newPage();
    await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
    p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('['+m.type()+']',m.text())});
    p.on('pageerror',e=>console.log('[pageerror]',e.message));
    await p.goto('http://localhost:8767/'+(j.q||''));
    await p.waitForTimeout(j.wait||3500);
    for(const a of (j.acts||[])){
      if(a.click) await p.click(a.click);
      if(a.xy) await p.mouse.click(a.xy[0],a.xy[1]);
      if(a.eval) console.log('eval:',JSON.stringify(await p.evaluate(a.eval)));
      await p.waitForTimeout(a.wait||2500);
      if(a.shot) await p.screenshot({path:'tools/shots/'+a.shot+'.png',fullPage:!!a.full});
    }
    if(j.shot) await p.screenshot({path:'tools/shots/'+j.shot+'.png',fullPage:!!j.full});
    await ctx.close();
  }
  await b.close();
})().catch(e=>{console.log('ERR',e.message);process.exit(1)});
