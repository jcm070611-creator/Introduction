'use strict';
// Four-stage local onboarding. ID/selfie files are only previewed in-memory.
let onboardingStep=1;
const ephemeralFiles={id:null,selfie:null,avatar:null};
const ephemeralUrls={id:null,selfie:null,avatar:null};
const STAGE_IDS={1:['ob-name','ob-school','ob-email','ob-phone'],3:['ob-area','ob-budget','ob-commute'],4:['ob-bio']};
function showLanding(){
 $('main-app').classList.add('hidden');$('login-screen').classList.add('hidden');$('onboarding-screen').classList.add('hidden');$('landing-screen').classList.remove('hidden');window.scrollTo(0,0);
}
function showOnboarding(){
 $('landing-screen').classList.add('hidden');$('login-screen').classList.add('hidden');$('main-app').classList.add('hidden');$('onboarding-screen').classList.remove('hidden');onboardingStep=1;updateOnboarding();window.scrollTo(0,0);
}
function updateOnboarding(){
 document.querySelectorAll('.ob-step').forEach(el=>el.classList.toggle('hidden',Number(el.dataset.step)!==onboardingStep));
 document.querySelectorAll('[data-ob-step]').forEach(el=>{const n=Number(el.dataset.obStep);el.classList.toggle('current',n===onboardingStep);el.classList.toggle('done',n<onboardingStep);});
 $('ob-step-counter').textContent=`STEP 0${onboardingStep} / 04`;
 $('ob-prev').classList.toggle('hidden',onboardingStep===1);
 $('ob-next').textContent=onboardingStep===4?(currentLang==='en'?'Find my roommates →':'매칭 시작하기 →'):(currentLang==='en'?'Continue →':'다음 단계 →');
 $('ob-error').textContent='';window.scrollTo(0,0);
}
function formError(message,id){$('ob-error').textContent=message;if(id)$(id)?.focus();return false;}
function checkCurrentStep(){
 const ids=STAGE_IDS[onboardingStep]||[];
 for(const id of ids){const el=$(id);if(!el.checkValidity())return formError(currentLang==='en'?'Please complete this field correctly.':'필수 정보를 올바르게 입력해 주세요.',id);}
 if(onboardingStep===1){const n=$('ob-phone').value.replace(/\D/g,'');if(n.length<10||n.length>15)return formError(currentLang==='en'?'Enter a valid phone number.':'전화번호를 다시 확인해 주세요.','ob-phone');}
 if(onboardingStep===2){if(!ephemeralFiles.id||!ephemeralFiles.selfie)return formError(currentLang==='en'?'Choose both an ID photo and a selfie.':'신분증과 현재 얼굴 사진을 모두 선택해 주세요.');if(!$('ob-consent').checked)return formError(currentLang==='en'?'Please confirm both images are yours.':'두 이미지가 본인 자료인지 확인해 주세요.','ob-consent');}
 if(onboardingStep===3){const b=Number($('ob-budget').value),n=Number($('ob-commute').value);if(!(b>=500&&b<=4000&&n>=5&&n<=90))return formError('예산 또는 통학 시간 범위를 확인해 주세요.');}
 return true;
}
function clearIdentityFiles(){for(const field of ['id','selfie']){ephemeralFiles[field]=null;if(ephemeralUrls[field])URL.revokeObjectURL(ephemeralUrls[field]);ephemeralUrls[field]=null;const input=$(field==='id'?'ob-id':'ob-selfie');input.value='';} $('id-preview').removeAttribute('src');$('selfie-preview').removeAttribute('src');}
function finishOnboarding(){
 const name=$('ob-name').value.trim(),school=$('ob-school').value,email=$('ob-email').value.trim(),phone=$('ob-phone').value.trim();
 // Avoid sensitive document storage. Contact is held only for this tab session.
 visitContact={email,phone};
 accountId=email.toLowerCase();
 $('login-name').value=name;$('login-school').value=Array.from($('login-school').options).some(o=>o.value===school)?school:'기타 보스턴 지역 학교';
 prefs.budget=Number($('ob-budget').value);prefs.commute=Number($('ob-commute').value);prefs.sleep=$('ob-sleep').value;prefs.clean=$('ob-clean').value;prefs.mustSmoke=$('ob-smoke').value==='yes';
 const avatar=ephemeralFiles.avatar;const area=$('ob-area').value,bio=$('ob-bio').value.trim();
 const finish=(photo)=>{
  // Store only non-ID profile details in local storage; files were used for preview only.
  try{localStorage.setItem(userAccountKey(),JSON.stringify({name,school,area,bio,photo:photo||''}));}catch{}
  // Different signup profiles should not inherit somebody else's matching state.
  mutualMatches=new Set();sentLikes=new Set();persistMutual();
  clearIdentityFiles();ephemeralFiles.avatar=null;
  if(ephemeralUrls.avatar){URL.revokeObjectURL(ephemeralUrls.avatar);ephemeralUrls.avatar=null;}
  $('onboarding-screen').classList.add('hidden');enter();
  userName=name;userSchool=school;userBio=bio;userArea=area;
  updateSidebarAccount();render();
 };
 if(avatar){const reader=new FileReader();reader.onload=()=>{const temp=new Image();temp.onload=()=>{const canvas=document.createElement('canvas'),max=460,ratio=Math.min(1,max/Math.max(temp.width,temp.height));canvas.width=Math.round(temp.width*ratio);canvas.height=Math.round(temp.height*ratio);canvas.getContext('2d').drawImage(temp,0,0,canvas.width,canvas.height);finish(canvas.toDataURL('image/jpeg',.7));};temp.src=reader.result;};reader.readAsDataURL(avatar);}else finish('');
}
function filePreview(kind,input){const file=input.files?.[0];if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>5*1024*1024){input.value='';$('ob-error').textContent='JPG, PNG 또는 WebP · 최대 5MB 사진만 사용할 수 있어요.';return;}
 if(ephemeralUrls[kind])URL.revokeObjectURL(ephemeralUrls[kind]);ephemeralFiles[kind]=file;ephemeralUrls[kind]=URL.createObjectURL(file);
 const id=kind==='id'?'id-preview':kind==='selfie'?'selfie-preview':'ob-avatar-preview';const image=$(id);image.src=ephemeralUrls[kind];image.classList.remove('hidden');
 const label=kind==='id'?'id-file-label':kind==='selfie'?'selfie-file-label':null;if(label)$(label).textContent=file.name.length>33?file.name.slice(0,30)+'...':file.name;
 if(kind==='avatar')$('ob-avatar-letter').classList.add('hidden');$('ob-error').textContent='';
}
$('landing-join').addEventListener('click',showOnboarding);
$('landing-search').addEventListener('click',showOnboarding);
$('ob-back-home').addEventListener('click',showLanding);
$('ob-prev').addEventListener('click',()=>{if(onboardingStep>1){onboardingStep--;updateOnboarding();}});
$('ob-form').addEventListener('submit',event=>{event.preventDefault();if(!checkCurrentStep())return;if(onboardingStep<4){onboardingStep++;updateOnboarding();}else finishOnboarding();});
$('ob-id').addEventListener('change',event=>filePreview('id',event.target));
$('ob-selfie').addEventListener('change',event=>filePreview('selfie',event.target));
$('ob-avatar-input').addEventListener('change',event=>filePreview('avatar',event.target));
// Localized landing + signup: keep strings independent from the in-app translation map.
const onboardingI18n={
 join:['무료로 시작하기','Get started'],eyebrow:['보스턴 대학생을 위한 새로운 룸메이트 매칭','A better way for Boston students to find roommates'],hero:['같이 살 사람인데,<br><em>잘 맞는 사람</em>을 찾아야죠.','Find someone you can live with.<br><em>Not just live near.</em>'],heroSub:['학교가 가까운 것만으로는 부족하니까. 생활 패턴, 예산, 지역, 꼭 지켜야 할 기준까지. RoomMatch가 중요한 것부터 맞춰드려요.','Matching goes beyond distance to campus. Compare your routines, budgets, neighborhoods, and deal-breakers before deciding.'],explore:['나와 맞는 룸메이트 찾기 →','Find my roommate →'],free:['3분이면 시작할 수 있어요','Get started in 3 minutes'],perfect:['Your place, your people.','Your place, your people.'],compatible:['생활 습관부터 맞춰보세요','Match your lifestyle first'],how:['내 집을 공유할 사람, 세 단계로 찾아요.','A better roommate in three steps.'],howOne:['학교와 프로필 설정','Build your student profile'],howOneD:['학교와 연락처, 신원 확인 자료를 제출하고 내 프로필을 완성해요.','Add your school, contact details, and identity review materials.'],howTwo:['나에게 중요한 조건 선택','Set your non-negotiables'],howTwoD:['동네, 월세, 채광, 금연 여부, 생활 리듬까지 직접 설정해요.','Choose your neighborhood, rent, daylight, smoking rules, and habits.'],howThree:['서로 관심 있으면 매칭','Match when the feeling is mutual'],howThreeD:['상호 매칭 후 상세 정보와 채팅을 확인할 수 있어요.','Unlock full details and chat after a mutual match.'],backHome:['처음으로','Back to home'],obWelcome:['우리, 좋은 룸메이트를 찾아볼까요?','Ready to find your people?'],obWelcomeSub:['가입을 완료하면 지역과 생활 습관에 맞는 룸메이트를 만나볼 수 있어요.','Complete the steps to browse roommates matched to your lifestyle.'],step1:['학교 · 기본 정보','School & contact'],step2:['신원 확인 자료','Identity documents'],step3:['생활 스타일','Lifestyle preferences'],step4:['프로필 완성','Your profile'],obOne:['먼저, 서로 알아볼까요?','Let’s get to know you.'],obOneSub:['학교와 연락처를 입력해 주세요. 가입 정보는 이후 프로필에 표시됩니다.','Tell us about your school and how we can reach you. Contact info stays private.'],fullName:['이름 *','Full name *'],university:['소속 대학 *','University *'],email:['이메일 *','Email *'],phone:['전화번호 *','Phone *'],privacyContact:['연락처는 프로필의 다른 사용자에게 공개되지 않습니다.','Contact details will not be displayed to other roommates.'],obTwo:['신원 확인 자료 준비','Prepare your identity documents.'],obTwoSub:['신분증 사진과 지금 찍은 셀피를 각각 선택해 주세요.','Select a photo ID and a current selfie.'],idLabel:['학생증 또는 신분증','Student or photo ID'],selfieLabel:['현재 얼굴 사진 (셀피)','Current selfie'],idConsent:['두 사진에 나온 인물이 동일하며 제 자료임을 확인합니다.','I confirm both photos are mine and show the same person.'],idPrivacy:['현재는 사진을 화면에서만 비교하는 가입 미리보기입니다. 실제 얼굴 대조·신원 인증은 수행하지 않으며, 파일은 저장하거나 전송하지 않습니다.','Preview only: photos are shown side-by-side. No actual facial matching or identity verification takes place. Files are not saved or sent.'],obThree:['어떤 집이 잘 맞나요?','What feels like home to you?'],obThreeSub:['이 정보로 처음 보는 추천 룸메이트를 정렬해 드려요.','We’ll use these preferences to rank your matches.'],area:['선호하는 동네 *','Preferred neighborhood *'],budget:['월 최대 예산 ($) *','Maximum monthly rent ($) *'],sleep:['수면 패턴','Sleep schedule'],clean:['청결 기준','Cleanliness'],commute:['최대 통학 시간 (분)','Max commute (minutes)'],mustSmoke:['금연 필수','No smoking required'],obFour:['마지막으로 프로필 완성하기','Add your finishing touches.'],obFourSub:['첫인상은 물론, 어떤 룸메이트를 찾는지도 알려주세요.','Share a little about yourself and the roommate you want to find.'],upload:['프로필 사진 추가','Upload profile photo'],photoOptional:['선택사항 · 나중에 계정에서도 바꿀 수 있어요','Optional · You can change this later'],bio:['자기소개 *','About me *'],review:['프로필을 완성하고 룸메이트를 찾아보세요','Finish your profile and see your matches'],back:['이전','Back'],next:['다음 단계 →','Continue →']
};
const originalSetLanguage=setLanguage;
function applyOnboardingLanguage(){
 const idx=currentLang==='en'?1:0;
 document.querySelectorAll('[data-i18n]').forEach(el=>{const vals=onboardingI18n[el.dataset.i18n];if(!vals)return;if(el.dataset.i18n==='hero')el.innerHTML=vals[idx];else el.textContent=vals[idx];});
 const values={
  'ob-school':{'학교 선택':'Choose university','기타 보스턴 지역 학교':'Other Boston college'},
  'ob-area':{'지역 선택':'Choose neighborhood'},
  'ob-sleep':{'보통':'Balanced','아침형':'Early bird','야행성':'Night owl'},
  'ob-clean':{'정돈된 환경':'Very tidy','유연한 편':'Flexible'},
  'ob-smoke':{'네':'Yes','아니요':'No'}
 };
 for(const [id,names] of Object.entries(values)){
  const el=$(id);for(const opt of el.options){if(!opt.dataset.ko)opt.dataset.ko=opt.textContent;opt.textContent=idx?(names[opt.dataset.ko]||opt.dataset.ko):opt.dataset.ko;}
 }
 updateOnboarding();
}
setLanguage=function(lang){originalSetLanguage(lang);applyOnboardingLanguage();};
applyOnboardingLanguage();
showLanding();
