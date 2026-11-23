export type BracketView = {scale:number;x:number;y:number};
type Point = {x:number;y:number};
export function zoomBracketAt(view:BracketView,factor:number,anchor:Point):BracketView {
 const scale=Math.max(.025,Math.min(2.5,view.scale*factor));const ratio=scale/view.scale;
 return {scale,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio};
}
export function pinchBracket(view:BracketView,beforeA:Point,beforeB:Point,afterA:Point,afterB:Point):BracketView {
 const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
 const beforeDistance=distance(beforeA,beforeB);if(beforeDistance===0)return view;
 const before={x:(beforeA.x+beforeB.x)/2,y:(beforeA.y+beforeB.y)/2};
 const after={x:(afterA.x+afterB.x)/2,y:(afterA.y+afterB.y)/2};
 const zoomed=zoomBracketAt(view,distance(afterA,afterB)/beforeDistance,before);
 return {...zoomed,x:zoomed.x+after.x-before.x,y:zoomed.y+after.y-before.y};
}

export type BracketBounds = {x:number;y:number;width:number;height:number};
export function constrainBracketView(view:BracketView,content:BracketBounds,viewport:{width:number;height:number},margin=24):BracketView {
 const availableWidth=Math.max(1,viewport.width-margin*2),availableHeight=Math.max(1,viewport.height-margin*2);
 const minScale=Math.min(2.5,availableWidth/Math.max(1,content.width),availableHeight/Math.max(1,content.height));
 const scale=Math.max(minScale,Math.min(2.5,view.scale));
 const clampAxis=(offset:number,start:number,length:number,size:number)=>{
  const scaled=length*scale;
  if(scaled<=size-margin*2)return (size-scaled)/2-start*scale;
  const low=size-margin-(start+length)*scale,high=margin-start*scale;
  return Math.max(low,Math.min(high,offset));
 };
 return {scale,x:clampAxis(view.x,content.x,content.width,viewport.width),y:clampAxis(view.y,content.y,content.height,viewport.height)};
}
