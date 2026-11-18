// Supabase-connected version. No passwords or member account lists are stored in localStorage.
// Publishable key is public by design; Supabase Auth and RLS enforce access controls.
const ROOMMATCH_SUPABASE_URL='https://sjiqhzaymvxzsvdjnger.supabase.co';
const ROOMMATCH_SUPABASE_KEY='sb_publishable_fglzjLQdd_8OVZiT1VaumA_Gq4av7va';
const roommatchDb=window.supabase?.createClient(ROOMMATCH_SUPABASE_URL,ROOMMATCH_SUPABASE_KEY,{
 auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
let loginMethod='email';
function normalizePhone(code,number){return String(code||'')+String(number||'').replace(/\D/g,'');}
function updateLoginAccountHint(){const el=$('gateway-account-status');if(el)el.textContent=roommatchDb?'Supabase 연결 · 개인별 계정':'연결 실패 · 인터넷 연결을 확인해 주세요';}
// Availability is confirmed atomically by Supabase and the database unique constraints, never browser localStorage.
window.roommatchAccountExists=()=>false;
window.roommatchRegisterAccount=async function({name,school,email,phone,area,bio,photo,password,prefs}){
 if(!roommatchDb){formError('계정 서버를 불러오지 못했어요. 인터넷에 연결한 후 다시 시도해 주세요.');return false;}
 const fullPhone=normalizePhone($('ob-dial-code').value,$('ob-phone').value);
 const metadata={full_name:name,school,phone:fullPhone,area,bio,budget:Number(prefs.budget),sleep:prefs.sleep,cleanliness:prefs.clean};
 try{
  const {data,error}=await roommatchDb.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:metadata,emailRedirectTo:window.location.origin+window.location.pathname}});
  if(error){
   const msg=/already|registered|exists|duplicate|unique/i.test(error.message)?'이미 등록된 이메일 또는 전화번호일 수 있어요. 기존 계정으로 로그인하거나 정보를 확인해 주세요.':'가입을 완료하지 못했어요: '+error.message;
   formError(msg,'ob-email');return false;
  }
  // If email confirmation is enabled, Supabase deliberately does not create a session yet.
  // Never claim account access until an authenticated session exists.
  if(!data?.session){return 'pending';}
  const {data:profile,error:profileError}=await roommatchDb.from('member_profiles').select('id').eq('id',data.user.id).maybeSingle();
  if(profileError||!profile){await roommatchDb.auth.signOut();formError('가입 정보 저장을 확인하지 못했어요. 관리자에게 문의해 주세요.');return false;}
  // Only profile photo for this local visit remains local; ID and selfie never uploaded.
  return true;
 }catch(e){formError('계정 서버에 접속하지 못했어요. 인터넷 연결을 확인해 주세요.');return false;}
};
function showAuthGateway(){
 ['landing-screen','onboarding-screen','login-screen','main-app'].forEach(id=>$(id).classList.add('hidden'));
 $('auth-gateway').classList.remove('hidden');$('gateway-login-form').reset();$('gateway-error').textContent='';$('gateway-error').classList.remove('has-error');switchLoginMethod('email');updateLoginAccountHint();window.scrollTo(0,0);
}
function switchLoginMethod(method){loginMethod=method==='mobile'?'mobile':'email';$('gateway-email-field').classList.toggle('hidden',loginMethod!=='email');$('gateway-mobile-field').classList.toggle('hidden',loginMethod!=='mobile');document.querySelectorAll('[data-login-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.loginMode===loginMethod);b.setAttribute('aria-selected',String(b.dataset.loginMode===loginMethod));});$('gateway-error').textContent='';}
function loginError(message,id){$('gateway-error').textContent='⚠ '+message;$('gateway-error').classList.add('has-error');if(id)$(id).focus();return false;}
async function browserLogin(event){
 event.preventDefault();
 if(!roommatchDb)return loginError('계정 서버 연결에 실패했어요. 인터넷 연결을 확인해 주세요.');
 const password=$('gateway-password').value;
 if(!password)return loginError('비밀번호를 입력해 주세요.','gateway-password');
 const email=$('gateway-email').value.trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return loginError('이메일 주소를 입력해 주세요.','gateway-email');
 const submit=$('gateway-login-form').querySelector('[type=submit]');submit.disabled=true;
 try{
  const {data,error}=await roommatchDb.auth.signInWithPassword({email,password});
  if(error)return loginError('로그인 실패: '+error.message);
  const {data:account,error:profileError}=await roommatchDb.from('member_profiles').select('id,full_name,email,phone,school,area,budget,sleep,cleanliness,bio').eq('id',data.user.id).maybeSingle();
  if(profileError||!account){await roommatchDb.auth.signOut();return loginError('등록된 회원 프로필을 찾지 못했어요.');}
  visitContact={email:account.email||email,phone:account.phone||''};accountId=data.user.id;
  $('login-name').value=account.full_name||'';
  $('login-school').value=[...$('login-school').options].some(x=>x.value===account.school)?account.school:'기타 보스턴 지역 학교';
  userName=account.full_name||'';userSchool=account.school||'';userBio=account.bio||'';userArea=account.area||'';userPhoto='';
  prefs={...defaults,budget:account.budget??defaults.budget,sleep:account.sleep||defaults.sleep,clean:account.cleanliness||defaults.clean};
  enter();userName=account.full_name||'';userSchool=account.school||'';userBio=account.bio||'';userArea=account.area||'';updateSidebarAccount();render();
  $('gateway-password').value='';
 }catch(e){loginError('로그인 중 서버 오류가 발생했어요. 다시 시도해 주세요.');}
 finally{submit.disabled=false;}
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
$('gateway-show-password').addEventListener('change',e=>{$('gateway-password').type=e.target.checked?'text':'password';});
document.querySelectorAll('[data-login-mode]').forEach(b=>{if(b.dataset.loginMode==='mobile'){b.disabled=true;b.title='전화번호 로그인은 인증 SMS 연동 이후 제공됩니다.';}else b.addEventListener('click',()=>switchLoginMethod('email'));});
$('gateway-signup-tab').addEventListener('click',showOnboarding);
$('gateway-create').addEventListener('click',showOnboarding);
$('gateway-login-tab').addEventListener('click',showAuthGateway);
$('auth-about').addEventListener('click',showLanding);
$('ob-back-home').addEventListener('click',showAuthGateway);
$('logout').addEventListener('click',async()=>{if(roommatchDb)await roommatchDb.auth.signOut();dismissWelcome();showAuthGateway();});
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
 '.gateway-footnote':['회원가입 정보는 Supabase에 안전하게 저장됩니다. 신분증·셀피는 서버에 저장하지 않습니다.','Accounts are stored with Supabase Auth. ID/selfie verification is a preview only.']
};
function applyGatewayCopy(){const i=currentLang==='en'?1:0;for(const [selector,v] of Object.entries(gatewayCopy)){const e=document.querySelector(selector);if(e)e.innerHTML=v[i];}}
const originalSetLanguageForGateway=setLanguage;
setLanguage=function(lang){originalSetLanguageForGateway(lang);applyGatewayCopy();updateLoginAccountHint();};
clearVisitState();showAuthGateway();applyGatewayCopy();
