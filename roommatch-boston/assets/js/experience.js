
'use strict';
// RoomMatch Boston: discover, mutual-matching and conversation experience.
// All state below is local to the visitor's browser. No networking is performed.
const RECIPROCAL_IDS = new Set([1, 3, 4, 6, 7, 9, 10, 12, ...profiles.filter(p=>p.id>12&&p.id%4===1).map(p=>p.id)]);
const MUTUAL_STORE = 'rmb_mutual_v5';
const LIKED_STORE = 'rmb_sent_likes_v5';
function restoreIds(key) { try { const ids = JSON.parse(localStorage.getItem(key) || '[]'); return new Set(Array.isArray(ids) ? ids.filter(id => profiles.some(p=>p.id===id)) : []); } catch { return new Set(); } }
let mutualMatches = restoreIds(MUTUAL_STORE);
let sentLikes = restoreIds(LIKED_STORE);
let replyBusy = new Set();
let statusTick = new Map();
let visitContact = {email:'',phone:''};
function isMutual(id) { return mutualMatches.has(Number(id)); }
function band(amount) { const lower=Math.floor(amount/250)*250;return `$${lower.toLocaleString()}–$${(lower+250).toLocaleString()}`; }
function briefCommute(n) { return n<15?'15분 이내':n<30?'15–30분': '30분 이상'; }
function onlineInfo(id) { if(!isMutual(id))return ''; return Number(id)%3!==0 ? '<span class="profile-status"><i class="status-dot"></i>현재 활동 중</span>' : '<span class="profile-status" style="color:#7f91a7">최근 활동</span>'; }
function persistMutual() { try{localStorage.setItem(MUTUAL_STORE,JSON.stringify([...mutualMatches]));localStorage.setItem(LIKED_STORE,JSON.stringify([...sentLikes]));}catch{} }
function likeCandidate(id) {
 id=Number(id); if(!profiles.some(p=>p.id===id))return;
 const already=sentLikes.has(id); sentLikes.add(id); saved.add(id);
 if(RECIPROCAL_IDS.has(id) && !isMutual(id)) {mutualMatches.add(id);toast('💞 서로 관심을 보냈어요! 이제 상세 프로필과 메시지를 볼 수 있어요.');}
 else if(!already) toast('관심을 보냈어요 ♡ 상대의 답변을 기다려보세요.');
 else toast(isMutual(id)?'매칭된 상대예요 💞':'관심을 이미 보냈어요.');
 persistMutual();render();if(page==='swipe') renderSwipe(); if($('modal-bg').classList.contains('open')&&activeId===id)showProfile(id);
}

// Public cards show only a broad price and commuting range. Precise details stay gated.
personCard = function(p) {
 const c=compatibility(p), matched=isMutual(p.id);
 const tags=c.rows.filter(x=>x.ok).slice(0,2).map(x=>`<span class="tag">✓ ${escapeHtml(x.name)}</span>`).join('');
 return `<article class="person-card"><div class="profile-photo" style="background:${p.color}"><img src="${profilePhotos[p.id]}" alt="${escapeHtml(p.name)} 프로필" loading="lazy" decoding="async"/><button class="save-btn ${saved.has(p.id)?'saved':''}" data-save="${p.id}" aria-label="저장">${saved.has(p.id)?'♥ 저장됨':'♡ 저장'}</button><span class="match-badge ${c.eligible?'':'warn'}">${c.score}% ${c.eligible?'MATCH':'조건 확인'}</span></div><div class="person-top"><h3>${escapeHtml(p.name)} <span class="age">${p.age}세</span></h3><span class="verified">${matched?'♥ 서로 매칭':'● 학생 커뮤니티'}</span></div><p class="pmeta">🎓 ${escapeHtml(p.school)}<br>📍 ${escapeHtml(p.area)} · 통학 ${matched?p.commute+'분':briefCommute(p.commute)}</p><div class="tags">${tags}${c.blockers.length?`<span class="tag bad">⚠ 조건 차이</span>`:''}</div><div class="pbottom"><span class="rent">${matched?'$'+p.rent.toLocaleString():band(p.rent)} <small>/월</small></span><button class="view" data-open="${p.id}">${matched?'상세 보기':'프로필 보기'} →</button></div><div class="profile-actions-extra" style="margin-top:10px"><button class="match-request-btn ${sentLikes.has(p.id)?'waiting':''}" data-like="${p.id}">${matched?'💞 매칭 완료':sentLikes.has(p.id)?'♡ 관심 보냄':'♡ 관심 보내기'}</button>${matched?`<button class="outline" data-open="${p.id}">💬 메시지</button>`:''}</div></article>`;
};
const originalRender=render;
render=function(){originalRender();const total=$('stat-total');if(total)total.textContent=profiles.length; const mini=$('recommended'); if(mini){const picks=sorted(profiles).slice(0,6);mini.innerHTML=picks.map(p=>`<div class="rec-mini-card" role="button" tabindex="0" data-open="${p.id}"><div class="rec-mini-avatar"><img src="${profilePhotos[p.id]}" alt="${escapeHtml(p.name)}" loading="lazy" /></div><div class="rec-mini-info"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.school.split(' ')[0])} · ${p.area}</small></div><span class="rec-score-pill">${compatibility(p).score}%</span></div>`).join('');}
};
// 
showProfile=function(id){
 const p=profiles.find(x=>x.id===Number(id));if(!p)return;
 activeId=p.id;const c=compatibility(p),mutual=isMutual(p.id);
 const rows=mutual?`<h3>생활 패턴 자세히 비교</h3><div class="compare">${c.rows.map(r=>`<div class="compare-row"><div><small>내 조건 · ${escapeHtml(r.name)}</small><b>${escapeHtml(r.mine)}</b></div><div><small>상대 조건</small><b>${escapeHtml(r.theirs)}</b></div><span>${r.ok?'✅':'⚠️'}</span></div>`).join('')}</div><p class="modal-note">실제 동거 조건과 매물 정보는 상대와 직접 확인해 주세요.</p>`:`<div class="match-locked">🔒 <b>상호 매칭 후 상세 정보 공개</b><br>정확한 예산, 통학 시간, 생활 습관 세부 정보와 활동 상태는 서로 관심을 표시한 후 확인할 수 있어요.</div>`;
 $('modal').innerHTML=`<div class="modal-top"><div><h2>${escapeHtml(p.name)}, ${p.age}세 ${mutual?'<span class="verified">💞 서로 매칭</span>':''}</h2><p>🎓 ${escapeHtml(p.school)} · ${escapeHtml(p.area)} ${mutual?'· 월 $'+p.rent:''}</p></div><button class="close" data-close="1" aria-label="닫기">×</button></div><div class="score-panel"><strong>${c.score}%</strong><span><b>${c.eligible?'생활 습관이 잘 맞아요':'몇 가지 조건이 달라요'}</b><br>${mutual?(c.blockers.length?escapeHtml(c.blockers.join(' · ')):'함께 편하게 지낼 수 있는 조건을 찾아보세요.'):'매칭 점수는 등록한 선호도에 따라 계산됩니다.'}</span></div><p class="page-sub">“${escapeHtml(p.tag)}”</p>${mutual?`<div class="match-success">💞 서로 매칭되었어요 · ${onlineInfo(p.id)}</div>`:''}${rows}<div id="draft-slot"></div><div class="modal-btns"><button class="outline" data-save="${p.id}">${saved.has(p.id)?'♥ 저장 취소':'♡ 저장하기'}</button>${mutual?`<button class="primary" data-draft="${p.id}">✉ 소개 메시지 작성</button>${chatStore[p.id]?.messages?.length?`<button class="outline" data-go-chat="${p.id}">💬 대화 이어가기</button>`:''}`:`<button class="primary" data-like="${p.id}">${sentLikes.has(p.id)?'♡ 관심 요청됨':'💞 관심 보내고 매칭하기'}</button>`}</div>`;
 $('modal-bg').classList.add('open');document.body.style.overflow='hidden';translateUI();
};
intro=function(id){const p=profiles.find(x=>x.id===id);if(!p)return;if(!isMutual(id)){toast('서로 매칭된 후 메시지를 보낼 수 있어요.');return;}
 $('draft-slot').innerHTML=`<div class="draft-area"><b>✉ ${escapeHtml(p.name)}님에게 첫 인사 보내기</b><p class="draft-explain">인사를 나누고 룸메이트 생활 스타일을 이야기해 보세요.</p><textarea id="draft-text" maxlength="750">안녕하세요 ${escapeHtml(p.name)}님! RoomMatch에서 매칭되어 반가워요 😊 혹시 선호하는 입주 시기와 생활 패턴을 이야기해볼 수 있을까요?</textarea><div class="action-row"><button class="outline" id="copy-intro">메시지 복사</button><button class="primary" data-send-intro="${p.id}">메시지 보내기 →</button></div></div>`;
 $('draft-text')?.focus();translateUI();
};
// Existing chat persistence is reused. New items add read and readByThem state.
const appendMessageBase=appendMessage;
appendMessage=function(id,text,from='me'){
 const done=appendMessageBase(id,text,from);
 if(done){const m=chatStore[id].messages.at(-1);if(from==='me')m.readByThem=false;else m.read=(page==='messages'&&activeChatId===id);persistChats();}
 return done;
};
function markThreadRead(id){const items=chatStore[id]?.messages||[];let touched=false;for(const m of items){if(m.from==='them'&&!m.read){m.read=true;touched=true;}}if(touched)persistChats();}
function queueAutoReply(id){if(replyBusy.has(id))return;replyBusy.add(id);setTimeout(()=>{
  if(!chatStore[id]){replyBusy.delete(id);return;}
  const last=chatStore[id].messages.filter(m=>m.from==='me').at(-1);
  if(last){last.readByThem=true;persistChats();}
  if(page==='messages'&&activeChatId===id)renderMessages();
  setTimeout(()=>{
   const lastUser=chatStore[id]?.messages?.filter(m=>m.from==='me').at(-1);
   if(!lastUser){replyBusy.delete(id);return;}
   appendMessage(id,makeContextualReply(id,lastUser.text),'them');replyBusy.delete(id);
   if(page==='messages')renderMessages();else render();
  },1500+id%4*300);
 },520+id%3*180);
}
function makeContextualReply(id,message){
 const p=profiles.find(x=>x.id===Number(id));if(!p)return '';
 const txt=message.toLowerCase(),count=chatStore[id].messages.filter(m=>m.from==='them').length,ko=currentLang!=='en';
 const patterns=[
  {rx:/(월세|예산|rent|budget|가격|price)/,ko:`저는 월 $${p.rent.toLocaleString()} 정도 생각하고 있어요! 예산은 어느 정도로 보고 계세요?`,en:`I'm budgeting around $${p.rent.toLocaleString()} a month. What's your range?`},
  {rx:/(입주|이사|언제|move|lease|date|term)/,ko:'저도 학기 시작 전후에 입주하는 게 편할 것 같아요! 언제부터 생각하세요?',en:'I am thinking around the start of the semester. When are you hoping to move in?'},
  {rx:/(청소|깔끔|clean|tidy|mess)/,ko:'저도 공용 공간은 깔끔하면 좋겠어요. 청소 당번을 같이 정하면 어떨까요?',en:'I like keeping shared spaces clean. How about a simple chore schedule?'},
  {rx:/(잠|수면|sleep|noise|소음|조용)/,ko:`저는 ${p.sleep==='late'?'늦게 자는 편':p.sleep==='early'?'일찍 자는 편':'자정 전후에 자는 편'}이에요. 조용한 시간을 미리 정하면 좋겠어요 😊`,en:'Quiet hours sound important to me too! What time do you usually go to sleep?'},
  {rx:/(학교|campus|class|통학|commute|northeastern)/,ko:`저는 ${p.school}에 다녀요! ${p.area} 쪽을 보고 있어요. 어디가 편하세요?`,en:`I go to ${p.school} and am looking near ${p.area}. What area works for you?`},
  {rx:/(안녕|hello|hi|hey|반가워|nice to meet)/,ko:`안녕하세요! 매칭되어 반가워요 😊 저는 ${p.area} 쪽 집을 알아보고 있어요. 어느 동네를 생각하고 계세요?`,en:`Hey! Nice to match 😊 I'm looking around ${p.area}. What neighborhood are you considering?`},
  {rx:/(취미|weekend|hobby|주말|음악|운동)/,ko:'주말에는 쉬거나 음악 듣는 걸 좋아해요! 같이 살면 서로의 개인 시간도 존중하고 싶어요.',en:'I usually relax or listen to music on weekends! I also value everyone having their own space.'}
 ];
 const found=patterns.find(x=>x.rx.test(txt));if(found)return ko?found.ko:found.en;
 const koOptions=['좋아요! 서로의 생활 패턴을 미리 이야기해 보면 좋겠어요. 보통 몇 시에 주무세요?','저도 그 부분이 궁금했어요 😊 집을 볼 때 가장 중요하게 생각하는 건 뭔가요?','맞아요! 룸메이트끼리 어떤 규칙을 정해두면 좋을까요?','좋은 생각이에요. 저는 서로 개인 시간을 배려하는 게 중요한 것 같아요.'];
 const enOptions=['That sounds good! What does your typical weekday look like?','I was wondering about that too 😊 What matters most to you in an apartment?','Agreed! What kind of roommate rules would work for you?','I like that idea. I think respecting each other’s space is important.'];
 return (ko?koOptions:enOptions)[count%4];
}
startConversation=function(id){if(!isMutual(id)){toast('상호 매칭 후 채팅을 시작할 수 있어요.');return;}const message=$('draft-text')?.value.trim()||'';if(!message){toast('소개 메시지를 입력해 주세요.');return;}if(appendMessage(id,message)){closeModal();navigate('messages');queueAutoReply(id);toast('대화를 시작했어요 💬');}};
sendChat=function(){const el=$('chat-compose'),id=activeChatId;if(!el||!id||!isMutual(id))return;const message=el.value.trim();if(!message)return;if(appendMessage(id,message)){renderMessages();queueAutoReply(id);$('chat-compose')?.focus();}};
sampleReply=function(){if(activeChatId&&isMutual(activeChatId))queueAutoReply(activeChatId);};
openConversation=function(id){if(!isMutual(id)){toast('서로 매칭 후 메시지를 확인할 수 있어요.');return;}if(!chatStore[id]?.messages?.length){appendMessage(id,currentLang==='en'?'Hi! Great to match. How are you?':'안녕하세요! 매칭되어 반가워요 😊');queueAutoReply(id);}activeChatId=id;closeModal();navigate('messages');markThreadRead(id);$('chat-compose')?.focus();};
renderMessages=function(){
 const ids=Object.keys(chatStore).map(Number).filter(id=>isMutual(id)&&chatStore[id]?.messages?.length).sort((a,b)=>lastChatTime(b)-lastChatTime(a));
 $('chat-total').textContent=ids.length;const q=($('chat-search').value||'').trim().toLowerCase();
 const visible=ids.filter(id=>{const p=profiles.find(p=>p.id===id);return p&&(p.name+' '+p.school).toLowerCase().includes(q);});
 $('chat-threads').innerHTML=visible.length?visible.map(id=>{const p=profiles.find(x=>x.id===id),last=chatStore[id].messages.at(-1),unread=chatStore[id].messages.filter(m=>m.from==='them'&&!m.read).length;
 return `<button class="chat-thread ${activeChatId===id?'active':''}" data-thread="${id}"><img class="chat-avatar" src="${profilePhotos[id]}" alt=""><div class="chat-thread-info"><div class="chat-thread-line"><span class="chat-thread-name">${escapeHtml(p.name)} ${unread?`<span class="chat-unread">${unread}</span>`:''}</span><span class="chat-thread-time">${chatTime(last.ts)}</span></div><div class="chat-thread-school">${escapeHtml(p.school)}</div><div class="chat-thread-preview">${last.from==='me'?'나: ':''}${escapeHtml(last.text)}</div></div></button>`;}).join(''):`<div class="chat-list-empty">${ids.length?'일치하는 대화가 없어요.':'상호 매칭된 상대와 첫 인사를 나누면 여기에 대화가 표시됩니다.'}</div>`;
 if(!ids.length){$('chat-room').innerHTML='<div class="chat-empty"><div class="chat-empty-icon">💌</div><h3>새로운 대화를 시작해 보세요</h3><p>서로 관심을 보낸 후 메시지를 주고받을 수 있어요.</p><button class="primary" data-page="swipe">스와이프 매칭하기 →</button></div>';return;}
 if(!activeChatId||!ids.includes(activeChatId))activeChatId=ids[0];
 markThreadRead(activeChatId);
 const p=profiles.find(x=>x.id===activeChatId),messages=chatStore[activeChatId].messages;let prev='';
 const bubbles=messages.map(m=>{const date=chatDate(m.ts),sep=date!==prev?`<div class="chat-day">${date}</div>`:'';prev=date;
 return `${sep}<div class="chat-row ${m.from==='me'?'mine':'theirs'}">${m.from==='them'?`<img class="chat-avatar" src="${profilePhotos[p.id]}" alt="">`:''}<div class="chat-bubble-wrap"><div class="chat-bubble" data-no-translate>${escapeHtml(m.text)}</div><span class="chat-timestamp ${m.readByThem?'read':''}">${chatTime(m.ts)}${m.from==='me'?(m.readByThem?' · 읽음':' · 전송됨'):''}</span></div></div>`;}).join('');
 const writing=replyBusy.has(activeChatId)?`<div class="typing-status">${escapeHtml(p.name)}님이 작성 중입니다 <span class="typing-dots"><i></i><i></i><i></i></span></div>`:'';
 $('chat-room').innerHTML=`<div class="chat-room-header"><img class="chat-avatar" src="${profilePhotos[p.id]}" alt=""><div class="chat-contact"><b>${escapeHtml(p.name)} <span class="verified">💞 매칭됨</span></b><small>${onlineInfo(p.id)} · ${escapeHtml(p.school)}</small></div><button class="chat-header-action" data-open="${p.id}">상세 프로필 ↗</button></div><div class="chat-messages" id="chat-message-list" role="log" aria-live="polite">${bubbles}${writing}</div><div class="chat-compose-bar"><div class="chat-compose-wrap"><textarea id="chat-compose" class="chat-compose" rows="2" maxlength="750" placeholder="메시지를 입력하세요..." aria-label="메시지 입력"></textarea><button id="send-chat" class="chat-send">보내기 ↑</button></div><div class="chat-compose-hint"><span>Enter 전송 · Shift + Enter 줄바꿈</span></div></div>`;
 const sc=$('chat-message-list');if(sc)sc.scrollTop=sc.scrollHeight;translateUI();
};
// A right swipe checks for a reciprocal match. A left swipe simply skips.
swipeDecision=function(action){const p=swipeCandidates()[0];if(!p)return;swiped.add(p.id);if(action==='like'){swipeLiked.add(p.id);likeCandidate(p.id);}else{swipePassed.add(p.id);toast('다음 룸메이트를 볼게요.');}renderSwipe();};
document.addEventListener('click',event=>{const b=event.target.closest('[data-like]');if(b)likeCandidate(Number(b.dataset.like));});
document.addEventListener('click',event=>{const b=event.target.closest('[data-thread]');if(b){markThreadRead(Number(b.dataset.thread));renderMessages();}});
const originalAccountRender=renderAccount;
renderAccount=function(){originalAccountRender();const el=$('account-contact-fields');if(el)el.innerHTML=`<b>가입 연락처</b><br>✉ ${visitContact.email?escapeHtml(visitContact.email):'미등록'}<br>☎ ${visitContact.phone?escapeHtml(visitContact.phone):'미등록'}<br><small>🔒 다른 룸메이트에게 공개되지 않습니다.</small>`;};
$('logout').addEventListener('click',()=>{$('login-screen').classList.add('hidden');$('landing-screen').classList.remove('hidden');$('onboarding-screen').classList.add('hidden');visitContact={email:'',phone:''};window.scrollTo(0,0);});
const contactTarget=document.querySelector('.account-editor');
if(contactTarget){const el=document.createElement('div');el.id='account-contact-fields';el.className='account-contact-meta';contactTarget.appendChild(el);}
render();

// Extend Korean/English support for newly introduced match and chat labels.
Object.assign(TRANSLATIONS, {
 '관심 보내기':'Send like','관심 보냄':'Like sent','매칭 완료':'Matched','서로 매칭':'Mutual match','매칭됨':'Matched',
 '프로필 보기':'View profile','상세 보기':'View details','메시지 보내기':'Send message','소개 메시지 작성':'Write introduction',
 '상세 프로필':'Full profile','현재 활동 중':'Online now','최근 활동':'Recently active','작성 중입니다':'is typing',
 '읽음':'Read','전송됨':'Sent','활동 중':'Online','상호 매칭 후 상세 정보 공개':'Full details unlock after matching',
 '정확한 예산, 통학 시간, 생활 습관 세부 정보와 활동 상태는 서로 관심을 표시한 후 확인할 수 있어요.':'Exact rent, commute, lifestyle details, and activity status unlock after a mutual match.',
 '매칭 점수는 등록한 선호도에 따라 계산됩니다.':'Compatibility is based on your preferences.',
 '생활 패턴 자세히 비교':'Compare lifestyle details','대화 이어가기':'Continue chat','관심 보내고 매칭하기':'Like to match',
 '메시지를 입력하세요...':'Write a message...','새로운 대화를 시작해 보세요':'Start a new conversation',
 '상호 매칭된 상대와 첫 인사를 나누면 여기에 대화가 표시됩니다.':'Your conversations with mutual matches will appear here.',
 '서로 관심을 보낸 후 메시지를 주고받을 수 있어요.':'You can message each other after a mutual match.',
 '대화 목록':'Conversations','가입 연락처':'Contact information','다른 룸메이트에게 공개되지 않습니다.':'Hidden from other roommates.'
});
TRANS_KEYS.push(...Object.keys(TRANSLATIONS).filter(key=>!TRANS_KEYS.includes(key)));
TRANS_KEYS.sort((a,b)=>b.length-a.length);


