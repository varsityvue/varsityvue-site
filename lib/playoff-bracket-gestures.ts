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
