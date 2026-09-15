import {chromium} from 'playwright';
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const browser=await chromium.launch({headless:true});const page=await browser.newPage();
for(const width of [1440,1024,390]){
 await page.setViewportSize({width,height:900});let baseline;
 for(const route of ['hackathons','schools','people','consulting','gallery','acknowledge']){
  await page.goto(baseURL+'/'+route+'/');await page.locator('.page-header').waitFor();
  if(route==='people')await page.locator('.tp-tier.board').waitFor();
  const data=await page.evaluate(()=>{
   const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
   const h=box('.page-header'),left=box('.ph-split-l'),title=box('.ph-con-title'),lede=box('.ph-con-lede');
   const body=document.querySelector('.page-body');const gap=body?body.getBoundingClientRect().top-h.y-h.h:null;
   return {h,left,title,lede,gap,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  if(!baseline)baseline=data;
  for(const key of ['x','y','w'])if(Math.abs(data.title[key]-baseline.title[key])>1)throw Error(`${width} ${route} title ${key}: ${JSON.stringify(data)}`);
  if(Math.abs(data.left.w-baseline.left.w)>1||data.gap!==null&&Math.abs(data.gap-14)>1||data.overflow)throw Error(`${width} ${route}: ${JSON.stringify(data)}`);
  if(Math.abs(data.lede.y-baseline.lede.y)>1)throw Error(`${width} ${route}: subtitle baseline mismatch`);
 }
 await page.goto(baseURL+'/');await page.locator('.as-hero .as-title').waitFor();
 if(await page.locator('.page-header').count())throw Error('Home lost its original hero');
}
await browser.close();
console.log('Header geometry, content gaps, responsive widths, and original Home layout passed.');
