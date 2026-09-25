import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:4321';
const b=await chromium.launch();const p=await b.newPage({reducedMotion:'reduce'});
try {
for(const width of [320,390,430,768]) {
 await p.setViewportSize({width,height:844});
 for(const route of ['','schools/','people/','gallery/','hackathons/','consulting/','acknowledge/']) {
  await p.goto(baseURL+'/'+route);await p.evaluate(()=>document.fonts.ready);
  const overlaps=await p.evaluate(()=>{
   const visibleBox = (box, el) => {
     let rect = {left:box.left,right:box.right,top:box.top,bottom:box.bottom};
     for(let parent=el;parent;parent=parent.parentElement){
       const css=getComputedStyle(parent);if(css.visibility==='hidden'||Number(css.opacity)===0)return null;
       const bounds=parent.getBoundingClientRect();
       if(/hidden|auto|scroll|clip/.test(css.overflowX)){rect.left=Math.max(rect.left,bounds.left);rect.right=Math.min(rect.right,bounds.right);}
       if(/hidden|auto|scroll|clip/.test(css.overflowY)){rect.top=Math.max(rect.top,bounds.top);rect.bottom=Math.min(rect.bottom,bounds.bottom);}
     }
     return rect.right>rect.left&&rect.bottom>rect.top?rect:null;
   };
   const texts=[];const walker=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const n=walker.currentNode;if(!n.textContent.trim()||n.parentElement.closest('svg,canvas,style,script'))continue;const r=document.createRange();r.selectNodeContents(n);for(const box of r.getClientRects()){const visible=visibleBox(box,n.parentElement);if(visible)texts.push({box:visible,text:n.textContent.trim().slice(0,40),el:n.parentElement});}}
   const hits=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.el===b.el)continue;const x=Math.min(a.box.right,b.box.right)-Math.max(a.box.left,b.box.left),y=Math.min(a.box.bottom,b.box.bottom)-Math.max(a.box.top,b.box.top);if(x>3&&y>3)hits.push([a.text,b.text]);}return hits;
  });assert.deepEqual(overlaps, [], `${width} ${route}: visible text overlaps`);
  if(route === 'schools/') {
    const boxes = await p.locator('.sk-sky').evaluate(el => {
      const box = s => el.querySelector(s).getBoundingClientRect().toJSON();
      return {globe:box('.sk-sky-fig > svg'), controls:box('.sk-ctrl'), footer:box('.sk-sky-bot'), header:box('.sk-sky-top'), buttons:[...el.querySelectorAll('button')].map(b=>b.getBoundingClientRect().toJSON())};
    });
    assert.ok(boxes.header.bottom <= boxes.globe.top + 1);
    assert.ok(boxes.globe.bottom < boxes.controls.top);
    assert.ok(boxes.controls.bottom < boxes.footer.top);
    for(const button of boxes.buttons) {
      assert.ok(button.width >= 44 && button.height >= 44);
      assert.ok(button.top >= boxes.controls.top && button.bottom <= boxes.controls.bottom);
    }
  }
 }
}
} finally { await b.close(); }
console.log('Mobile text, globe, controls and labels do not overlap at 320, 390, 430 and 768px.');
