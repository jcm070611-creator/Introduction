
'use strict';
// Progressive discovery: 12 visible cards per batch, up to 72 candidates.
function loadMoreRoommates(){
 const total=sorted(profiles).length;
 if(page!=='discover'||feedShown>=total)return;
 feedShown=Math.min(total,feedShown+12);
 render();
}
$('feed-more').addEventListener('click',loadMoreRoommates);
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  if(entries.some(x=>x.isIntersecting) && $('main-app').classList.contains('hidden')===false){
   loadMoreRoommates();
  }
 },{rootMargin:'0px 0px 180px 0px',threshold:0});
 observer.observe($('feed-trigger'));
}


