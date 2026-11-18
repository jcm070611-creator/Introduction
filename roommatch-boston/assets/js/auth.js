

'use strict';
// Local browser-only credential demonstration. It does not provide real authentication.
const ROOMMATCH_ACCOUNT_KEY='rmb_browser_accounts_v7';
let loginMethod='email';
function readBrowserAccounts(){try{const v=JSON.parse(localStorage.getItem(ROOMMATCH_ACCOUNT_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return [];}}
function normalizePhone(code,number){return (code||'')+String(number||'').replace(/\D/g,'');}
window.roommatchAccountExists=(email,code,phone)=>readBrowserAccounts().some(a=>a.email===String(email).trim().toLowerCase()||a.phone===normalizePhone(code,phone));
function makeSalt(){const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}
async function hashDemoPassword(password,salt){const bytes=new TextEncoder().encode(salt+':'+password),hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');}
window.roommatchRegisterAccount=async function({name,school,email,phone,area,bio,photo,password,prefs}){
 try{
  if(!crypto?.subtle){formError('이 브라우저에서 로컬 로그인 기능을 사용할 수 없어요.');return false;}
  const accounts=readBrowserAccounts(),dial=$('ob-dial-code').value,fullPhone=normalizePhone(dial,$('ob-phone').value);
  if(accounts.some(a=>a.email===email.toLowerCase()||a.phone===fullPhone)){formError('이미 가입된 계정입니다. 로그인 탭에서 로그인해 주세요.','ob-email');return false;}
  const salt=makeSalt(),hash=await hashDemoPassword(password,salt);
  // ID/selfie files are not stored. Registration is browser-local and is never sent to a server.
  accounts.push({name,school,email:email.trim().toLowerCase(),phone:fullPhone,displayPhone:phone,area,bio,photo:photo||'',prefs,salt,hash});
  localStorage.setItem(ROOMMATCH_ACCOUNT_KEY,JSON.stringify(accounts));
  return true;
 }catch(e){formError('브라우저 저장소를 사용할 수 없어요. 저장 공간과 권한을 확인해 주세요.');return false;}
};
function showAuthGateway(){
 ['landing-screen','onboarding-screen','login-screen','main-app'].forEach(id=>$(id).classList.add('hidden'));
 $('auth-gateway').classList.remove('hidden');$('gateway-login-form').reset();$('gateway-error').textContent='';$('gateway-error').classList.remove('has-error');switchLoginMethod('email');window.scrollTo(0,0);
}
function switchLoginMethod(method){loginMethod=method==='mobile'?'mobile':'email';$('gateway-email-field').classList.toggle('hidden',loginMethod!=='email');$('gateway-mobile-field').classList.toggle('hidden',loginMethod!=='mobile');document.querySelectorAll('[data-login-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.loginMode===loginMethod);b.setAttribute('aria-selected',String(b.dataset.loginMode===loginMethod));});$('gateway-error').textContent='';}
function loginError(message,id){$('gateway-error').textContent='⚠ '+message;$('gateway-error').classList.add('has-error');if(id)$(id).focus();return false;}
async function browserLogin(event){
 event.preventDefault();const password=$('gateway-password').value;if(!password)return loginError('비밀번호를 입력해 주세요.','gateway-password');
 let account;
 if(loginMethod==='email'){
  const email=$('gateway-email').value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return loginError('이메일 형식이 올바르지 않아요. 예: name@university.edu','gateway-email');
  account=readBrowserAccounts().find(a=>a.email===email);
 }else{
  const num=$('gateway-phone').value.replace(/\D/g,'');if(num.length<9||num.length>13)return loginError('전화번호를 숫자 9~13자리로 입력해 주세요.','gateway-phone');
  account=readBrowserAccounts().find(a=>a.phone===normalizePhone($('gateway-dial').value,num));
 }
 if(!account)return loginError('이 브라우저에 등록된 계정이 없어요. 옆의 회원가입을 이용해 주세요.');
 const hash=await hashDemoPassword(password,account.salt);if(hash!==account.hash)return loginError('비밀번호가 일치하지 않아요. 다시 확인해 주세요.','gateway-password');
 visitContact={email:account.email,phone:account.displayPhone};accountId=account.email;
 $('login-name').value=account.name;$('login-school').value=[...$('login-school').options].some(x=>x.value===account.school)?account.school:'기타 보스턴 지역 학교';
 userName=account.name;userSchool=account.school;userBio=account.bio;userArea=account.area;userPhoto=account.photo||'';
 prefs={...defaults,...account.prefs};
 // Enter with no auto-login on a subsequent reload.
 enter();userName=account.name;userSchool=account.school;userBio=account.bio;userArea=account.area;userPhoto=account.photo||'';updateSidebarAccount();render();
 $('gateway-password').value='';
}
// Each new page load starts at login. Unsubmitted drafts, session and exploration state are cleared.
function clearVisitState(){
 try{Object.keys(localStorage).filter(k=>['rmb_prefs','rmb_saved','rmb_mutual_v5','rmb_sent_likes_v5'].includes(k)||k.startsWith('rmb_chats_v1_')).forEach(k=>localStorage.removeItem(k));}catch{}
 prefs={...defaults};saved=new Set();mutualMatches=new Set();sentLikes=new Set();swiped=new Set();swipeLiked=new Set();swipePassed=new Set();chatStore={};activeChatId=null;feedShown=12;visitContact={email:'',phone:''};
}
function showRoomMatchWelcome(){const panel=$('welcome-overlay');panel.classList.remove('hidden');document.body.classList.add('welcome-open');}
function dismissWelcome(){ $('welcome-overlay').classList.add('hidden');document.body.classList.remove('welcome-open'); }
window.showRoomMatchWelcome=showRoomMatchWelcome;
$('welcome-dismiss').addEventListener('click',dismissWelcome);
document.querySelectorAll('[data-welcome-page]').forEach(el=>el.addEventListener('click',()=>{dismissWelcome();navigate(el.dataset.welcomePage);}));
$('gateway-login-form').addEventListener('submit',browserLogin);
document.querySelectorAll('[data-login-mode]').forEach(b=>b.addEventListener('click',()=>switchLoginMethod(b.dataset.loginMode)));
$('gateway-signup-tab').addEventListener('click',showOnboarding);
$('gateway-create').addEventListener('click',showOnboarding);
$('gateway-login-tab').addEventListener('click',showAuthGateway);
$('auth-about').addEventListener('click',showLanding);
$('ob-back-home').addEventListener('click',showAuthGateway);
$('logout').addEventListener('click',()=>{dismissWelcome();showAuthGateway();});
// Intro page still links to the signup flow.
const gatewayCopy={
 '#auth-about':['서비스 소개 ↗','About RoomMatch ↗'],
 '#gateway-login-tab':['로그인 <small>Log In</small>','Log In <small>Welcome back</small>'],
 '#gateway-signup-tab':['회원가입 <small>Sign Up</small>','Sign Up <small>Join RoomMatch</small>'],
 '.gateway-intro':['계정이 있다면 로그인하고, 처음이라면 회원가입을 시작하세요.','Already have an account? Log in here, or choose Sign Up to get started.'],
 '.gateway-pitch h1':['같이 살 사람을 찾을 때,<br><em>잘 맞는 사람부터.</em>','Finding a roommate?<br><em>Start with someone who fits.</em>'],
 '.gateway-pitch p':['보스턴 학생들을 위한 스마트 룸메이트 매칭. 학교부터 생활 습관까지, 나에게 맞는 룸메이트를 찾아보세요.','Find students in Boston who fit your schedule, lifestyle and neighborhood preferences.'],
 '#gateway-email-field>span':['이메일 주소','Email address'],
 '#gateway-mobile-field .gateway-phone>span':['전화번호','Phone number'],
 '#gateway-password+span':['비밀번호','Password'],
 '.gateway-submit':['로그인하기 <span>→</span>','Log in <span>→</span>'],
 '#gateway-create':['새 계정 만들기 <span>→</span>','Create an account <span>→</span>'],
 '.gateway-footnote':['현재 계정 로그인은 이 브라우저에서 만든 계정만 지원합니다. 실제 로그인·본인 인증 서비스는 연결되지 않았습니다.','Only accounts created in this browser can sign in. Real account and identity authentication are not connected.']
};
function applyGatewayCopy(){const i=currentLang==='en'?1:0;for(const [selector,v] of Object.entries(gatewayCopy)){const e=document.querySelector(selector);if(e)e.innerHTML=v[i];}}
const originalSetLanguageForGateway=setLanguage;
setLanguage=function(lang){originalSetLanguageForGateway(lang);applyGatewayCopy();};
clearVisitState();showAuthGateway();applyGatewayCopy();


