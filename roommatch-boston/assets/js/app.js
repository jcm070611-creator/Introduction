'use strict';
const defaults = { budget: 1500, commute: 25, sunlight: 'bright', security: 'secure', sleep: 'balanced', clean: 'tidy', noise: 'quiet', guests: 'rare', mustSmoke: true, mustBathroom: false, mustCommute: true, mustSecure: false, mustSunlight: false, mustBudget: true };
const keys = Object.keys(defaults);
const $ = id => document.getElementById(id);
let prefs = Object.assign({}, defaults), saved = new Set(), page = 'discover', activeId = null, userName = 'Jane', userSchool = 'Northeastern University';
let chatStore = {}, activeChatId = null;
let currentArea = 'all', currentSchool = 'all', swiped = new Set(), swipeLiked = new Set(), swipePassed = new Set();
let userArea = 'Fenway', userBio = '안녕하세요! 서로 배려하는 룸메이트를 찾고 있어요.', userPhoto = '';
let currentLang = 'ko', accountId = 'jane';
try {
    const a = JSON.parse(localStorage.getItem('rmb_prefs'));
    if (a && typeof a === 'object')
        keys.forEach(k => { if (Object.prototype.hasOwnProperty.call(a, k) && typeof a[k] === typeof defaults[k])
            prefs[k] = a[k]; });
    const ids = JSON.parse(localStorage.getItem('rmb_saved'));
    if (Array.isArray(ids))
        saved = new Set(ids.filter(x => Number.isInteger(x) && profiles.some(p => p.id === x)));
}
catch (e) { }
const label = { bright: '채광 좋음', some: '적당한 채광', secure: '출입 통제', standard: '일반 보안', early: '아침형', balanced: '보통', late: '야행성', tidy: '깔끔', relaxed: '유연함', quiet: '조용함', social: '활기참', rare: '방문 적음', often: '방문 많음', any: '상관없음' };
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function compatibility(p) {
    let rows = [];
    const add = (name, ok, weight, mine, theirs) => rows.push({ name, ok, weight, mine, theirs });
    const eq = (a, b) => a === 'any' || a === b;
    add('월세', p.rent <= prefs.budget, 17, `$${prefs.budget} 이하`, `$${p.rent}`);
    add('학교 통학 시간', p.commute <= prefs.commute, 14, `${prefs.commute}분 이하`, `${p.commute}분`);
    add('비흡연', !p.smoking, 12, '비흡연 선호', p.smoking ? '흡연 허용' : '실내 금연');
    add('개인 화장실', p.bathroom, 10, '있으면 좋음', p.bathroom ? '있음' : '없음');
    add('채광', prefs.sunlight === 'any' || (prefs.sunlight === 'some' && ['some', 'bright'].includes(p.sunlight)) || p.sunlight === prefs.sunlight, 9, label[prefs.sunlight], label[p.sunlight]);
    add('보안', prefs.security === 'any' || prefs.security === 'standard' || p.security === 'secure', 8, label[prefs.security], label[p.security]);
    add('수면 패턴', eq(prefs.sleep, p.sleep), 12, label[prefs.sleep], label[p.sleep]);
    add('청결도', eq(prefs.clean, p.clean), 9, label[prefs.clean], label[p.clean]);
    add('소음', eq(prefs.noise, p.noise), 5, label[prefs.noise], label[p.noise]);
    add('손님 방문', eq(prefs.guests, p.guests), 4, label[prefs.guests], label[p.guests]);
    let blockers = [];
    if (prefs.mustSmoke && p.smoking)
        blockers.push('실내 흡연 금지 조건 불일치');
    if (prefs.mustBathroom && !p.bathroom)
        blockers.push('개인 화장실 없음');
    if (prefs.mustCommute && p.commute > prefs.commute)
        blockers.push('통학 시간 초과');
    if (prefs.mustSecure && p.security !== 'secure')
        blockers.push('출입 보안 조건 불일치');
    if (prefs.mustSunlight && p.sunlight !== 'bright')
        blockers.push('채광 조건 불일치');
    if (prefs.mustBudget && p.rent > prefs.budget)
        blockers.push('예산 초과');
    return { score: Math.round(rows.reduce((n, x) => n + (x.ok ? x.weight : 0), 0) / rows.reduce((n, x) => n + x.weight, 0) * 100), rows, blockers, eligible: blockers.length === 0 };
}
function sorted(arr) { const q = $('search').value.trim().toLowerCase(), only = $('eligible-only').checked, mode = $('sort').value; const list = arr.filter(p => (currentArea === 'all' || p.area === currentArea) && (currentSchool === 'all' || p.school === currentSchool) && (p.name + ' ' + p.school + ' ' + p.area).toLowerCase().includes(q) && (!only || compatibility(p).eligible)); list.sort((a, b) => mode === 'budget' ? a.rent - b.rent : mode === 'commute' ? a.commute - b.commute : Number(compatibility(b).eligible) - Number(compatibility(a).eligible) || compatibility(b).score - compatibility(a).score); return list; }
function personCard(p) { const c = compatibility(p), good = c.rows.filter(x => x.ok).slice(0, 3).map(x => x.name); return `<article class="person-card"><div class="profile-photo" style="background:${p.color}"><img src="${profilePhotos[p.id]}" alt="${p.name} 프로필 사진" loading="lazy" decoding="async" /><button class="save-btn ${saved.has(p.id) ? 'saved' : ''}" data-save="${p.id}" aria-label="${p.name} 저장 토글">${saved.has(p.id) ? '♥ 저장됨' : '♡ 저장'}</button><span class="match-badge ${c.eligible ? '' : 'warn'}">${c.score}% ${c.eligible ? 'MATCH' : '주의'}</span></div><div class="person-top"><h3>${p.name} <span class="age">${p.age}세</span></h3><span class="verified">● </span></div><p class="pmeta">🎓 ${escapeHtml(p.school)}<br>📍 ${p.area} · 통학 ${p.commute}분 (예시)</p><div class="tags">${good.map(x => `<span class="tag">✓ ${x}</span>`).join('')}${c.blockers.length ? `<span class="tag bad">⚠ ${c.blockers[0]}</span>` : ''}</div><div class="pbottom"><span class="rent">$${p.rent.toLocaleString()} <small>/월</small></span><button class="view" data-open="${p.id}">궁합 보기 →</button></div></article>`; }
function render() {
    const ordered = sorted(profiles), eligible = profiles.filter(p => compatibility(p).eligible), top = sorted(profiles).length ? [...sorted(profiles)] : [...profiles].sort((a, b) => Number(compatibility(b).eligible) - Number(compatibility(a).eligible) || compatibility(b).score - compatibility(a).score).slice(0, 3);
    $('stat-total').textContent = profiles.length;
    $('stat-eligible').textContent = eligible.length;
    $('stat-best').textContent = Math.max(...profiles.map(p => compatibility(p).score)) + '%';
    $('result-count').textContent = `(${ordered.length}명)`;
    $('cards').innerHTML = ordered.length ? ordered.map(personCard).join('') : `<div class="no-results"><h3>이 조건에 맞는 후보가 없어요</h3><p>검색어를 바꾸거나 필수 조건을 조정해보세요.</p><button class="outline" data-page="preferences">조건 수정하기</button></div>`;
    $('recommended').innerHTML = top.map(p => `<div class="rec-mini-card" role="button" tabindex="0" data-open="${p.id}"><div class="rec-mini-avatar"><img src="${profilePhotos[p.id]}" alt="${p.name} 예시 프로필" loading="lazy" /></div><div class="rec-mini-info"><b>${p.name}</b><small>${p.school.split(' ')[0]} · ${p.area}</small></div><span class="rec-score-pill">${compatibility(p).score}%</span></div>`).join('');
    $('saved-nav-count').textContent = saved.size;
    $('saved-top-count').textContent = saved.size;
    const nChats = Object.keys(chatStore).filter(id => chatStore[id]?.messages?.length).length;
    $('chat-nav-count').textContent = nChats;
    $('chat-nav-count').hidden = nChats === 0;
    const list = profiles.filter(p => saved.has(p.id));
    $('saved-cards').innerHTML = list.length ? list.map(personCard).join('') : `<div class="empty"><div style="font-size:34px">💌</div><h3>아직 저장한 후보가 없어요</h3><p>룸메이트 카드의 ♡ 버튼을 눌러 후보를 저장하세요.</p><button class="primary" data-page="discover">매칭 프로필 둘러보기 →</button></div>`;
    try {
        localStorage.setItem('rmb_saved', JSON.stringify([...saved]));
        localStorage.setItem('rmb_prefs', JSON.stringify(prefs));
    }
    catch (e) { }
    translateUI();
}
function navigate(name) { page = name; for (const p of ['discover', 'saved', 'preferences', 'messages', 'swipe', 'account'])
    $(p + '-page').classList.toggle('hidden', p !== name); document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === name)); $('crumb-page').textContent = '/ ' + ({ discover: '룸메이트 찾기', saved: '저장한 후보', preferences: '내 조건 설정', messages: '개인 메시지', swipe: '스와이프 매칭', account: '내 프로필' }[name]); if (name === 'preferences')
    fillPrefs(); render(); if (name === 'messages')
    renderMessages(); if (name === 'swipe')
    renderSwipe(); if (name === 'account')
    renderAccount(); translateUI(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function fillPrefs() { for (const k of keys) {
    const el = $(k);
    if (el.type === 'checkbox')
        el.checked = !!prefs[k];
    else
        el.value = prefs[k];
} }
function takePrefs() { for (const k of keys) {
    const el = $(k);
    if (el.type === 'checkbox')
        prefs[k] = el.checked;
    else if (el.type === 'number')
        prefs[k] = Math.max(Number(el.min), Math.min(Number(el.max), Number(el.value) || defaults[k]));
    else
        prefs[k] = el.value;
} render(); }
function showProfile(id) { const p = profiles.find(x => x.id === id); if (!p)
    return; activeId = id; const c = compatibility(p); $('modal').innerHTML = `<div class="modal-top"><div><h2>${p.name}, ${p.age}세 <span class="verified">학생 프로필</span></h2><p>🎓 ${escapeHtml(p.school)} · ${p.area} · 월 $${p.rent}</p></div><button class="close" data-close="1" aria-label="닫기">×</button></div><div class="score-panel"><strong>${c.score}%</strong><span><b>${c.eligible ? '필수 조건 충족' : '필수 조건 불일치'}</b><br>${c.blockers.length ? escapeHtml(c.blockers.join(' · ')) : '선택한 생활 습관과 주거 조건을 비교한 예시 점수입니다.'}</span></div><p class="page-sub">“${p.tag}”</p><h3 style="margin-bottom:8px">나와의 조건 비교</h3><div class="compare">${c.rows.map(r => `<div class="compare-row"><div><small>내 조건 · ${r.name}</small><b>${r.mine}</b></div><div><small>후보 조건</small><b>${r.theirs}</b></div><span title="${r.ok ? '일치' : '차이'}">${r.ok ? '✅' : '⚠️'}</span></div>`).join('')}</div><p class="modal-note">이 비교는 체험용입니다. 매물 확인, 학생 인증 및 실제 신원 확인은 수행되지 않았습니다.</p><div id="draft-slot"></div><div class="modal-btns"><button class="outline" data-save="${p.id}">${saved.has(p.id) ? '♥ 저장 취소' : '♡ 후보 저장'}</button><button class="primary" data-draft="${p.id}">✉ 소개 메시지 작성</button>${chatStore[p.id]?.messages?.length ? `<button class="outline" data-go-chat="${p.id}">💬 대화 이어가기</button>` : ``}</div>`; $('modal-bg').classList.add('open'); document.body.style.overflow = 'hidden'; translateUI(); }
function closeModal() { $('modal-bg').classList.remove('open'); document.body.style.overflow = ''; }
function intro(id) { const p = profiles.find(p => p.id === id); if (!p)
    return; $('draft-slot').innerHTML = `<div class="draft-area"><b style="font-size:12px">✉ ${escapeHtml(p.name)}님에게 보낼 첫 메시지</b><p class="draft-explain">내용을 수정한 뒤 '대화 시작하기'를 누르면 메시지 탭에 대화방이 생성됩니다. 실제 전송되지 않는 데모입니다.</p><textarea id="draft-text" maxlength="750">${currentLang === 'en' ? 'Hi ' + escapeHtml(p.name) + '! I found your RoomMatch profile and thought we might be a good roommate fit. Would you be open to chatting about our habits and housing preferences?' : '안녕하세요 ' + escapeHtml(p.name) + '님! RoomMatch에서 프로필을 보고 연락드려요. 생활 패턴이나 집 조건이 비슷한 것 같아 서로 룸메이트로 잘 맞을지 이야기해보고 싶어요. 편하실 때 연락 부탁드려요!'}</textarea><div class="action-row"><button class="outline" id="copy-intro">메시지 복사</button><button class="primary" data-send-intro="${p.id}">메시지 보내고 대화 시작하기 →</button></div></div>`; $('draft-text').focus(); translateUI(); }
// Local-first demo messaging: no server, no real user messages.
function chatStorageKey() { return 'rmb_chats_v1_' + encodeURIComponent(userName.toLowerCase()); }
function loadChats() { chatStore = {}; activeChatId = null; try {
    const value = JSON.parse(localStorage.getItem(chatStorageKey()) || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [id, data] of Object.entries(value)) {
            if (!profiles.some(p => String(p.id) === id) || !data || !Array.isArray(data.messages))
                continue;
            const items = data.messages.filter(m => m && typeof m.text === 'string' && m.text.trim() && m.text.length <= 1000 && (m.from === 'me' || m.from === 'them') && Number.isFinite(m.ts)).slice(-120);
            if (items.length)
                chatStore[id] = { messages: items };
        }
    }
}
catch (e) {
    chatStore = {};
} const ids = Object.keys(chatStore); if (ids.length)
    activeChatId = Number(ids.sort((a, b) => lastChatTime(Number(b)) - lastChatTime(Number(a)))[0]); }
function persistChats() { try {
    localStorage.setItem(chatStorageKey(), JSON.stringify(chatStore));
}
catch (e) {
    toast('브라우저 저장 공간이 부족해 대화가 저장되지 않았어요.');
} }
function lastChatTime(id) { const a = chatStore[id]?.messages || []; return a.length ? a[a.length - 1].ts : 0; }
function chatTime(ts) { return new Date(ts).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }); }
function chatDate(ts) { return new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); }
function appendMessage(id, text, from = 'me') { const p = profiles.find(x => x.id === id); const clean = String(text || '').trim(); if (!p || !clean || clean.length > 750)
    return false; if (!chatStore[id])
    chatStore[id] = { messages: [] }; chatStore[id].messages.push({ text: clean, from, ts: Date.now() }); chatStore[id].messages = chatStore[id].messages.slice(-120); activeChatId = id; persistChats(); return true; }
function startConversation(id) { const text = $('draft-text')?.value || ''; if (!text.trim()) {
    toast('소개 메시지를 입력해 주세요.');
    $('draft-text')?.focus();
    return;
} if (!appendMessage(id, text)) {
    toast('메시지는 750자 이내로 작성해 주세요.');
    return;
} closeModal(); navigate('messages'); toast('데모 대화방이 생성되었어요 💬'); $('chat-compose')?.focus(); }
function openConversation(id) { if (!chatStore[id]?.messages?.length)
    return; activeChatId = id; closeModal(); navigate('messages'); $('chat-compose')?.focus(); }
function renderMessages() {
    const ids = Object.keys(chatStore).filter(id => chatStore[id]?.messages?.length).map(Number).sort((a, b) => lastChatTime(b) - lastChatTime(a));
    $('chat-total').textContent = ids.length;
    const q = ($('chat-search')?.value || '').trim().toLowerCase();
    const visible = ids.filter(id => { const p = profiles.find(p => p.id === id); return p && (p.name + ' ' + p.school).toLowerCase().includes(q); });
    $('chat-threads').innerHTML = visible.length ? visible.map(id => { const p = profiles.find(p => p.id === id), last = chatStore[id].messages.at(-1); return `<button class="chat-thread ${activeChatId === id ? 'active' : ''}" data-thread="${id}" aria-label="${escapeHtml(p.name)}님과의 대화 열기"><img class="chat-avatar" src="${profilePhotos[id]}" alt="${escapeHtml(p.name)} 예시 사진"><div class="chat-thread-info"><div class="chat-thread-line"><span class="chat-thread-name">${escapeHtml(p.name)}</span><span class="chat-thread-time">${chatTime(last.ts)}</span></div><div class="chat-thread-school">${escapeHtml(p.school)}</div><div class="chat-thread-preview">${last.from === 'me' ? '나: ' : '답장: '}${escapeHtml(last.text)}</div></div></button>`; }).join('') : `<div class="chat-list-empty">${ids.length ? '검색 결과가 없어요.' : '아직 시작된 대화가 없어요.'}</div>`;
    if (!ids.length) {
        $('chat-room').innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">💬</div><h3>아직 대화가 없어요</h3><p>룸메이트 프로필에서 '소개 메시지 작성'을 눌러 첫 메시지를 보내보세요.</p><button class="primary" data-page="discover">룸메이트 찾아보기 →</button></div>`;
        translateUI();
        return;
    }
    if (!activeChatId || !chatStore[activeChatId])
        activeChatId = ids[0];
    const p = profiles.find(p => p.id === activeChatId), messages = chatStore[activeChatId].messages;
    let lastDate = '';
    const bubbleHtml = messages.map(m => { const date = chatDate(m.ts), dateLine = date !== lastDate ? `<div class="chat-day">${date}</div>` : ''; lastDate = date; return `${dateLine}<div class="chat-row ${m.from === 'me' ? 'mine' : 'theirs'}">${m.from === 'them' ? `<img class="chat-avatar" src="${profilePhotos[p.id]}" alt="">` : ''}<div class="chat-bubble-wrap"><div class="chat-bubble" data-no-translate>${escapeHtml(m.text)}</div><span class="chat-timestamp">${chatTime(m.ts)}${m.from === 'me' ? ' · 전송됨' : ''}</span></div></div>`; }).join('');
    $('chat-room').innerHTML = `<div class="chat-room-header"><img class="chat-avatar" src="${profilePhotos[p.id]}" alt="${escapeHtml(p.name)} 예시 사진"><div class="chat-contact"><b>${escapeHtml(p.name)} <span class="verified">학생 프로필</span></b><small>${escapeHtml(p.school)} · 매칭 ${compatibility(p).score}%</small></div><button class="chat-header-action" data-open="${p.id}">프로필 보기 ↗</button></div><div class="chat-messages" id="chat-message-list" role="log" aria-live="polite">${bubbleHtml}</div><div class="chat-compose-bar"><div class="chat-compose-wrap"><textarea class="chat-compose" id="chat-compose" maxlength="750" rows="2" placeholder="${escapeHtml(p.name)}님에게 메시지를 입력하세요..." aria-label="메시지 입력"></textarea><button id="send-chat" class="chat-send">보내기 ↑</button></div><div class="chat-compose-hint"><span>Enter 전송 · Shift + Enter 줄바꿈 · 이 브라우저에만 저장</span><button class="chat-sample-reply" id="sample-reply">↩ 답장 받기</button></div></div>`;
    const log = $('chat-message-list');
    if (log)
        log.scrollTop = log.scrollHeight;
    translateUI();
}
function sendChat() { const el = $('chat-compose'); if (!el || !activeChatId)
    return; const msg = el.value.trim(); if (!msg) {
    el.focus();
    return;
} if (!appendMessage(activeChatId, msg)) {
    toast('메시지는 750자 이내로 작성해 주세요.');
    return;
} renderMessages(); $('chat-compose')?.focus(); }
function sampleReply() { if (!activeChatId)
    return; const options = ['안녕하세요! 연락해 주셔서 감사해요 😊 집을 구하는 시기랑 예산이 어떻게 되세요?', '저도 생활 패턴이 잘 맞는 룸메이트를 찾고 있어요. 보통 몇 시쯤 주무세요?', '좋아요! 청소나 손님 초대에 대한 규칙도 미리 이야기해 보면 좋겠어요.', '반가워요! 혹시 선호하는 동네나 학교까지의 통학 시간 기준이 있나요?']; const total = chatStore[activeChatId]?.messages?.filter(x => x.from === 'them').length || 0; if (appendMessage(activeChatId, options[total % options.length], 'them')) {
    renderMessages();
    toast('답장이 도착했어요.');
} }
let toastTimeout;
function toast(msg) { $('toast').textContent = msg; $('toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('toast').classList.remove('show'), 2300); }
function enter() { userName = $('login-name').value.trim() || 'Jane'; userSchool = $('login-school').value; loadChats(); $('user-name').textContent = userName; $('user-school').textContent = userSchool.replace(' University', '').replace(' College of Music', ''); $('user-initial').textContent = userName.slice(0, 1).toUpperCase(); $('login-screen').classList.add('hidden'); $('main-app').classList.remove('hidden'); loadAccount(); renderFilters(); navigate('discover'); }
$('enter-demo').addEventListener('click', enter);
$('quick-demo').addEventListener('click', enter);
$('login-name').addEventListener('keydown', e => { if (e.key === 'Enter')
    enter(); });
$('logout').addEventListener('click', () => { $('main-app').classList.add('hidden'); $('login-screen').classList.remove('hidden'); closeModal(); window.scrollTo(0, 0); });
$('hero-browse').addEventListener('click', () => $('candidates').scrollIntoView({ behavior: 'smooth' }));
$('apply-prefs').addEventListener('click', () => { takePrefs(); navigate('discover'); toast('조건이 적용되었어요 ✓'); });
$('reset-prefs').addEventListener('click', () => { prefs = { ...defaults }; fillPrefs(); render(); toast('기본 조건으로 초기화했어요'); });
$('chat-search').addEventListener('input', renderMessages);
$('search').addEventListener('input', render);
$('sort').addEventListener('change', render);
$('eligible-only').addEventListener('change', render);
document.querySelectorAll('#preferences-page input,#preferences-page select').forEach(el => el.addEventListener('change', takePrefs));
document.addEventListener('click', async (e) => { const el = e.target.closest('button,[role="button"]'); if (!el)
    return; if (el.dataset.page)
    navigate(el.dataset.page); if (el.dataset.open)
    showProfile(Number(el.dataset.open)); if (el.dataset.close)
    closeModal(); if (el.dataset.save) {
    const id = Number(el.dataset.save);
    saved.has(id) ? saved.delete(id) : saved.add(id);
    render();
    if (page === 'swipe')
        renderSwipe();
    if ($('modal-bg').classList.contains('open') && activeId === id)
        showProfile(id);
    else
        toast(saved.has(id) ? '후보를 저장했어요 ♡' : '저장을 취소했어요');
} if (el.dataset.draft)
    intro(Number(el.dataset.draft)); if (el.dataset.sendIntro)
    startConversation(Number(el.dataset.sendIntro)); if (el.dataset.goChat)
    openConversation(Number(el.dataset.goChat)); if (el.dataset.thread) {
    activeChatId = Number(el.dataset.thread);
    renderMessages();
    $('chat-compose')?.focus();
} if (el.id === 'send-chat')
    sendChat(); if (el.id === 'sample-reply')
    sampleReply(); if (el.id === 'copy-intro') {
    const txt = $('draft-text').value;
    try {
        await navigator.clipboard.writeText(txt);
        toast('메시지를 복사했어요');
    }
    catch {
        const field = $('draft-text');
        field.focus();
        field.select();
        toast('메시지를 선택했어요. 복사하세요.');
    }
} });
document.addEventListener('keydown', e => { if (e.target.id === 'chat-compose' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendChat();
    return;
} if (e.key === 'Escape')
    closeModal(); if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) {
    e.preventDefault();
    showProfile(Number(e.target.dataset.open));
} });
$('modal-bg').addEventListener('click', e => { if (e.target.id === 'modal-bg')
    closeModal(); });
fillPrefs();
render();
// ===== RoomMatch Boston v4: location/school filters, swipe deck, account & bilingual UI =====
const AREAS = ['all', 'Fenway', 'Allston', 'Brookline', 'Back Bay', 'Mission Hill', 'Symphony'];
const SCHOOLS = ['all', 'Northeastern University', 'Boston University', 'Boston College', 'Berklee College of Music', 'Emerson College'];
function flabel(v) { return v === 'all' ? '전체' : v; }
function optHtml(values) { return values.map(v => `<option value="${escapeHtml(v)}">${v === 'all' ? '전체' : escapeHtml(v)}</option>`).join(''); }
function renderFilters() {
    $('area-chips').innerHTML = AREAS.map(a => `<button class="filter-chip ${currentArea === a ? 'active' : ''}" data-area="${escapeHtml(a)}" aria-pressed="${currentArea === a}">${a === 'all' ? '🌐 전체 지역' : '📍 ' + a}</button>`).join('');
    $('school-chips').innerHTML = SCHOOLS.map(a => `<button class="filter-chip ${currentSchool === a ? 'active' : ''}" data-school="${escapeHtml(a)}" aria-pressed="${currentSchool === a}">${a === 'all' ? '🎓 전체 학교' : escapeHtml(a.replace(' University', '').replace(' College of Music', '').replace(' College', ''))}</button>`).join('');
    $('swipe-area').innerHTML = optHtml(AREAS);
    $('swipe-area').value = currentArea;
    $('swipe-school').innerHTML = optHtml(SCHOOLS);
    $('swipe-school').value = currentSchool;
    $('current-filter').textContent = `${currentArea === 'all' ? '전체 지역' : currentArea} · ${currentSchool === 'all' ? '전체 학교' : currentSchool}`;
    $('area-count').textContent = profiles.filter(p => currentArea === 'all' || p.area === currentArea).length + '명';
    $('school-count').textContent = profiles.filter(p => currentSchool === 'all' || p.school === currentSchool).length + '명';
    translateUI();
}
function selectArea(v) { if (!AREAS.includes(v))
    return; currentArea = v; swiped.clear(); swipeLiked.clear(); swipePassed.clear(); renderFilters(); render(); renderSwipe(); translateUI(); }
function selectSchool(v) { if (!SCHOOLS.includes(v))
    return; currentSchool = v; swiped.clear(); swipeLiked.clear(); swipePassed.clear(); renderFilters(); render(); renderSwipe(); translateUI(); }
function swipeCandidates() { return sorted(profiles).filter(p => !swiped.has(p.id)); }
let dragOriginX = null, dragDelta = 0, dragPointer = null;
function renderSwipe() {
    const stack = swipeCandidates(), p = stack[0];
    $('swipe-liked').textContent = swipeLiked.size;
    $('swipe-passed').textContent = swipePassed.size;
    $('swipe-remaining').textContent = stack.length;
    for (const id of ['swipe-pass', 'swipe-details', 'swipe-like'])
        $(id).disabled = !p;
    if (!p) {
        $('swipe-deck').innerHTML = `<div class="swipe-empty"><div>✨</div><h2>모든 후보를 확인했어요!</h2><p>다른 동네나 학교를 선택하거나 다시 보기 버튼을 눌러주세요.</p><button class="primary" id="swipe-start-over">↺ 다시 보기</button></div>`;
        translateUI();
        return;
    }
    const c = compatibility(p), next = stack[1];
    $('swipe-deck').innerHTML = `${next ? `<div class="swipe-card swipe-back"><img src="${profilePhotos[next.id]}" alt=""/></div>` : ''}<article class="swipe-card swipe-front" id="swipe-front" tabindex="0" role="group" aria-label="${escapeHtml(p.name)} swipe card"><img class="swipe-photo" src="${profilePhotos[p.id]}" alt="${escapeHtml(p.name)} AI 생성 예시 사진" draggable="false"/><div class="swipe-shadow"></div><div class="swipe-overlay pass">NOPE</div><div class="swipe-overlay like">LIKE ♥</div><div class="swipe-tag-top">${c.score}% MATCH</div><div class="swipe-card-caption"><div class="swipe-name">${escapeHtml(p.name)} <span>${p.age}세</span></div><p>🎓 ${escapeHtml(p.school)}</p><p>📍 ${escapeHtml(p.area)} · ${typeof isMutual==='function'&&isMutual(p.id)?'$'+p.rent.toLocaleString():band(p.rent)}/월</p><div class="swipe-mini-tags"><span>🚌 ${typeof isMutual==='function'&&isMutual(p.id)?p.commute+'분':briefCommute(p.commute)}</span><span>${typeof isMutual==='function'&&isMutual(p.id)?(p.smoking ? '🚬 흡연' : '🚭 비흡연'):'🔒 습관 공개 대기'}</span><span>${typeof isMutual==='function'&&isMutual(p.id)?(p.bathroom ? '🚿 개인 욕실' : '🏡 공용 욕실'):'🔒 생활 조건'}</span></div><div class="swipe-photo-desc">“${escapeHtml(p.tag)}”</div></div></article>`;
    const card = $('swipe-front');
    card.addEventListener('pointerdown', e => { if (e.button !== 0)
        return; dragOriginX = e.clientX; dragDelta = 0; dragPointer = e.pointerId; card.setPointerCapture(e.pointerId); card.classList.add('dragging'); });
    card.addEventListener('pointermove', e => { if (dragPointer !== e.pointerId || dragOriginX === null)
        return; dragDelta = e.clientX - dragOriginX; card.style.transform = `translateX(${dragDelta}px) rotate(${Math.max(-19, Math.min(19, dragDelta / 16))}deg)`; card.querySelector('.swipe-overlay.like').style.opacity = Math.min(1, Math.max(0, dragDelta / 125)); card.querySelector('.swipe-overlay.pass').style.opacity = Math.min(1, Math.max(0, -dragDelta / 125)); });
    const finish = (e) => { if (dragPointer !== e.pointerId)
        return; card.classList.remove('dragging'); if (Math.abs(dragDelta) > 90)
        swipeDecision(dragDelta > 0 ? 'like' : 'pass');
    else {
        card.style.transform = '';
        card.querySelectorAll('.swipe-overlay').forEach(x => x.style.opacity = '0');
    } dragOriginX = null; dragPointer = null; dragDelta = 0; };
    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);
    translateUI();
}
function swipeDecision(action) { const p = swipeCandidates()[0]; if (!p)
    return; swiped.add(p.id); if (action === 'like') {
    swipeLiked.add(p.id);
    saved.add(p.id);
    toast(`${p.name}님을 저장했어요 ♥`);
    render();
}
else {
    swipePassed.add(p.id);
    toast(`${p.name}님 패스`);
} renderSwipe(); }
function resetSwipe() { swiped.clear(); swipeLiked.clear(); swipePassed.clear(); renderSwipe(); toast('후보를 처음부터 다시 볼 수 있어요.'); }
function userAccountKey() { return 'rmb_account_v2_' + encodeURIComponent(accountId); }
function loadAccount() { userPhoto = ''; userBio = '안녕하세요! 서로 배려하는 룸메이트를 찾고 있어요.'; userArea = 'Fenway'; try {
    const d = JSON.parse(localStorage.getItem(userAccountKey()) || '{}');
    if (d && typeof d === 'object') {
        if (typeof d.name === 'string' && d.name.trim())
            userName = d.name.slice(0, 32);
        if (typeof d.school === 'string')
            userSchool = d.school;
        if (typeof d.area === 'string' && AREAS.includes(d.area))
            userArea = d.area;
        if (typeof d.bio === 'string')
            userBio = d.bio.slice(0, 450);
        if (typeof d.photo === 'string' && d.photo.startsWith('data:image/') && d.photo.length < 420000)
            userPhoto = d.photo;
    }
}
catch (e) { } updateSidebarAccount(); }
function updateSidebarAccount() { $('user-name').textContent = userName; $('user-school').textContent = userSchool.replace(' University', '').replace(' College of Music', ''); const bubble = $('user-initial'); bubble.textContent = userPhoto ? '' : userName.slice(0, 1).toUpperCase(); bubble.style.backgroundImage = userPhoto ? `url("${userPhoto}")` : ''; bubble.classList.toggle('has-photo', !!userPhoto); }
function drawAccountAvatar() { const elems = [$('account-avatar-preview'), $('account-card-photo')]; elems.forEach(el => { el.textContent = userPhoto ? '' : userName.slice(0, 1).toUpperCase(); el.style.backgroundImage = userPhoto ? `url("${userPhoto}")` : ''; el.classList.toggle('has-photo', !!userPhoto); }); }
function renderAccount() { if (!$('account-area').options.length)
    $('account-area').innerHTML = optHtml(AREAS.filter(a => a !== 'all')); $('account-name').value = userName; if (!Array.from($('account-school').options).some(o => o.value === userSchool)) {
    const o = document.createElement('option');
    o.textContent = userSchool;
    $('account-school').append(o);
} $('account-school').value = userSchool; $('account-area').value = userArea; $('account-bio').value = userBio; updateAccountPreview(); translateUI(); }
function updateAccountPreview() { const name = $('account-name').value.trim() || userName; const school = $('account-school').value; const area = $('account-area').value; const bio = $('account-bio').value.trim(); $('account-card-name').textContent = name; $('account-card-school').textContent = school; $('account-card-area').textContent = '📍 ' + area; $('account-card-bio').textContent = bio || '안녕하세요! 서로 배려하는 룸메이트를 찾고 있어요.'; drawAccountAvatar(); }
function saveAccount() { const name = $('account-name').value.trim(); if (!name) {
    toast('이름을 입력해 주세요.');
    $('account-name').focus();
    return;
} userName = name; userSchool = $('account-school').value; userArea = $('account-area').value; userBio = $('account-bio').value.trim().slice(0, 450); try {
    localStorage.setItem(userAccountKey(), JSON.stringify({ name: userName, school: userSchool, area: userArea, bio: userBio, photo: userPhoto }));
    toast('프로필이 저장되었어요 ✓');
}
catch (e) {
    toast('저장 공간이 부족해요. 사진 크기를 줄여주세요.');
} updateSidebarAccount(); renderAccount(); }
async function uploadProfilePhoto(file) {
    if (!file)
        return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        toast('JPG, PNG 또는 WebP 사진만 가능해요.');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast('사진 크기는 5MB 이하여야 해요.');
        return;
    }
    try {
        let img = await createImageBitmap(file);
        const max = 540, scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        userPhoto = c.toDataURL('image/jpeg', 0.72);
        img.close?.();
        drawAccountAvatar();
        updateAccountPreview();
        toast('사진을 선택했어요. 저장 버튼을 눌러주세요.');
    }
    catch (e) {
        toast('사진을 읽지 못했어요. 다른 파일을 사용해 주세요.');
    }
}
// Translation keeps the original Korean markup and swaps only display text.
const TRANSLATIONS = {
    '룸메이트 찾기': 'Find roommates', '저장한 후보': 'Saved matches', '내 조건 설정': 'My preferences', '메시지': 'Messages', '스와이프 매칭': 'Swipe matches', '내 프로필': 'My profile', '나가기': 'Sign out',
    '지역별 · 학교별 찾기': 'Browse by area & school', '지역 또는 학교를 선택하면 아래 후보 목록과 매칭 카드가 바뀝니다.': 'Choose an area or university to update the candidates and swipe deck.',
    '보스턴 지역': 'Boston areas', '학교별': 'By university', '전체 지역': 'All areas', '전체 학교': 'All universities', '전체': 'All', '필터 초기화': 'Clear filters', '나에게 추천하는 룸메이트': 'Recommended for you',
    '내 생활 방식과 잘 맞는': 'Find a roommate who matches', '룸메이트를 찾아보세요 ✨': 'your lifestyle ✨', '보스턴 유학생들의 라이프스타일을 기준으로 매칭해요. 필수 조건에 안 맞는 항목도 투명하게 보여드려요.': 'Find roommates based on student lifestyles in Boston. We show any deal-breakers upfront.',
    '내 조건 설정하기': 'Set preferences', '추천 프로필 보기 ↓': 'See recommendations ↓', '데모 프로필': 'Demo profiles', '필수 조건 충족': 'Meets must-haves', '최고 매칭 점수': 'Top match score', '조건 수정하기 →': 'Edit preferences →',
    '룸메이트 탐색': 'Explore roommates', '점수와 실제 생활 조건을 함께 비교해보세요.': 'Compare scores and lifestyle needs side by side.', '궁합 높은 순': 'Best matches', '월세 낮은 순': 'Lowest rent', '통학 짧은 순': 'Shortest commute', '필수 조건 충족만 보기': 'Only show eligible matches', '조건 수정하기': 'Change preferences',
    '저장한 룸메이트': 'Saved roommates', '관심 있는 후보를 모아 편하게 비교하세요. 저장 내용은 이 브라우저에만 남아요.': 'Keep your favorite roommates in one place. Saved locally in this browser.',
    '내 룸메이트 조건': 'Roommate preferences', '우선순위가 높은 조건을 설정하면 매칭 점수가 즉시 업데이트됩니다.': 'Set your priorities to update match scores instantly.', '집과 위치': 'Housing & location', '예산과 위치, 기본 생활 환경을 골라주세요.': 'Choose your budget, commute, and housing preferences.', '월 최대 월세 ($)': 'Max monthly rent ($)', '1인당 월세 기준': 'Per-person monthly rent',
    '최대 통학 시간 (분)': 'Max commute (minutes)', '데모 프로필상의 예시 수치': 'Example values from demo profiles', '채광 선호': 'Natural light', '햇빛 잘 드는 방': 'Bright sunny room', '적당한 자연광': 'Some natural light', '출입 보안': 'Building security', '출입 통제 / 보안 중요': 'Secure access / high security', '일반 출입 보안도 가능': 'Standard security is fine', '상관없음': 'Any', '생활 습관': 'Lifestyle', '생활 패턴이 가까울수록 매칭 점수가 올라갑니다.': 'Closer lifestyle habits lead to higher match scores.',
    '수면 패턴': 'Sleep schedule', '보통 (12시 전후 취침)': 'Balanced (around midnight)', '일찍 자고 일찍 일어남': 'Early sleeper', '늦게 자는 편': 'Night owl', '청결도': 'Cleanliness', '깔끔하게 유지': 'Very tidy', '유연한 편': 'Flexible', '소음': 'Noise', '조용한 집 선호': 'Quiet home', '활기찬 집도 괜찮음': 'Lively is fine', '친구·손님 방문': 'Guest visits', '가끔만': 'Occasionally', '자주 와도 괜찮음': 'Often is fine',
    '절대 양보할 수 없는 조건': 'Non-negotiables', '선택된 조건이 맞지 않으면 매칭 점수가 높아도 주의 표시가 나타납니다.': 'Candidates who miss a must-have get a warning, even with a high score.', '실내 흡연 금지 필수': 'No indoor smoking', '개인 화장실 필수': 'Private bathroom required', '통학 시간 제한 필수': 'Commute limit required', '출입 통제·보안 필수': 'Secure building required', '좋은 채광 필수': 'Bright room required', '예산 초과 불가': 'Within budget only', '기본값으로 초기화': 'Reset to defaults', '매칭 결과 확인 →': 'See matches →',
    '개인 메시지': 'Direct messages', '관심 있는 룸메이트와의 대화를 연습해보세요. 소개 메시지를 보내면 여기에 대화방이 만들어져요.': 'Practice chatting with potential roommates. An introduction starts a conversation here.', '대화 목록': 'Conversations', '메시지': 'Demo messages',
    '스와이프 매칭': 'Swipe matches', '틴더처럼 카드를 넘겨보세요. 왼쪽은 패스, 오른쪽은 관심 표시! 카드를 직접 드래그해도 돼요.': 'Swipe through profiles: left to pass, right to like. You can drag cards with your mouse or finger.', '전체 후보 보기': 'Browse all profiles', '오른쪽으로 스와이프한 후보는': 'Right-swiped profiles are added to', '에 추가됩니다. 이 기능은 체험용이며 상대방에게 알림이 가지 않습니다.': 'This is a demo and does not notify anyone.', '지역': 'Area', '학교': 'University', '다시 보기': 'Start over', '남은 프로필': 'Profiles left', '관심 표시': 'Liked', '패스': 'Passed', '오늘의 발견': 'Your discoveries', '어떻게 사용하나요?': 'How it works', '사진을 좌우로 넘겨보고 마음에 드는 후보를 저장하세요. 자세한 조건은 ⓘ에서 비교할 수 있어요.': 'Swipe left or right. Likes are saved; tap ⓘ to compare preferences.', '저장한 후보 보기 →': 'View saved →', '프로필 비교': 'Profile details',
    '내 프로필 & 계정 소개': 'My profile & bio', '사진을 올리고 간단한 자기소개를 작성하면 내 프로필 미리보기에 반영돼요.': 'Upload a photo and write a short bio to preview your own profile.', '프로필 사진': 'Profile photo', '사진 업로드': 'Upload photo', '기본 사진으로 변경': 'Remove photo', '이름': 'Name', '재학 중인 학교': 'University', '거주 희망 지역': 'Preferred neighborhood', '내 소개': 'About me', '변경사항 저장': 'Save changes', '프로필이 저장되었어요 ✓': 'Profile saved ✓',
    '룸메이트 시작하기': 'Get started', 'RoomMatch 시작하기': 'Get started with RoomMatch', '데모 이름과 학교를 선택해 매칭 화면을 체험하세요.': 'Enter a demo name and university to explore matching.', '룸메이트 찾기 시작 →': 'Start matching →', '샘플 계정으로 바로 둘러보기': 'Explore with a demo account', '보스턴 한인 유학생을 위한 룸메이트 매칭': 'Roommate matching for Korean students in Boston', '나와 잘 맞는 룸메이트,': 'Your ideal roommate,', '조건부터 확인하세요.': 'starts with shared expectations.', '같은 학교에 다니는 것보다 중요한 건 생활 방식이 잘 맞는지예요. 예산, 흡연, 청결도, 수면 패턴부터 개인 화장실, 채광, 안전, 통학 시간까지. 중요한 조건을 먼저 비교하고 결정하세요.': 'Compatibility matters beyond going to the same school. Compare budget, smoking, cleaning, sleep, bathroom, sunlight, safety, and commute.', '실제 계정 생성·학교 인증·외부 사용자에게 메시지 전송은 제공되지 않아요.': 'This demo does not create real accounts, verify schools, or send messages to people.', '어떤 룸메이트가 잘 맞을까요?': 'Who is your ideal roommate?', '필수 조건(Must-haves)을 정하면 해당 조건을 충족하지 못하는 후보가 따로 표시돼요.': 'Set your must-haves to flag candidates who do not meet them.', '* 모든 프로필과 매칭 점수는 시연용 가상 데이터입니다.': '* All profiles and scores are fictional demo data.',
    '안녕하세요! 서로 배려하는 룸메이트를 찾고 있어요.': 'Hi! I’m looking for a thoughtful, respectful roommate.', '모든 후보를 확인했어요!': 'You have seen everyone!', '다른 동네나 학교를 선택하거나 다시 보기 버튼을 눌러주세요.': 'Choose another neighborhood or school, or tap Start over.', '사진을 선택했어요. 저장 버튼을 눌러주세요.': 'Photo selected. Press Save to keep it.', '프로필이 저장되었어요': 'Profile saved',
    '아직 저장한 후보가 없어요': 'No saved matches yet', '룸메이트 카드의 ♡ 버튼을 눌러 후보를 저장하세요.': 'Tap ♡ on any roommate card to save them.', '매칭 프로필 둘러보기 →': 'Browse profiles →',
    '주거 희망 지역': 'Preferred neighborhood', '월': 'month', '세': 'y/o', '분': 'min', '명': ' people', '예시': 'demo', '주의': 'Warning', '사진': 'Photo',
    '학생 프로필': 'Fictional profile', '내 조건 ·': 'Your preference ·', '후보 조건': 'Their preference', '나와의 조건 비교': 'Side-by-side compatibility', '필수 조건 불일치': 'Does not meet must-haves', '선택한 생활 습관과 주거 조건을 비교한 예시 점수입니다.': 'Illustrative score based on lifestyle and housing preferences.', '궁합 보기 →': 'View match →', '저장됨': 'Saved', '후보 저장': 'Save match', '저장 취소': 'Remove saved', '소개 메시지 작성': 'Write introduction', '대화 이어가기': 'Continue chat', '개인 화장실': 'Private bathroom', '비흡연': 'Non-smoker', '청결도': 'Cleanliness', '월세': 'Rent', '학교 통학 시간': 'Commute to campus', '채광': 'Sunlight', '보안': 'Security', '손님 방문': 'Guests',
    '아직 대화가 없어요': 'No conversations yet', '룸메이트 프로필에서': 'From a roommate profile', '소개 메시지 작성': 'Write introduction', '을 눌러 첫 메시지를 보내보세요.': 'to start a chat.', '룸메이트 찾아보기 →': 'Explore roommates →',
    '대화 시작하기': 'Start conversation', '메시지 보내고 대화 시작하기 →': 'Send & start conversation →', '메시지 복사': 'Copy message', '답장 받기': 'Get sample reply', '전송': 'Send', '후보 프로필': 'View profile', '이 채팅은 이 브라우저에만 저장되며 실제 사용자에게 전송되지 않습니다.': 'Chats stay in this browser and are not sent to real people.',
};
// Longest matches first; pass-through any words not yet defined (e.g. proper names).
Object.assign(TRANSLATIONS, {
    "기타 보스턴 지역 학교": "Other Boston-area schools",
    "🧪 체험용 시제품: 프로필, 학교, 예산, 지역과 통학 시간은 모두 예시이며, 실제 학생·매물·신원 인증 정보를 나타내지 않습니다.": "🧪 Demo prototype: Profiles, schools, budgets, locations and commute times are fictional examples, not verified listings or real students.",
    "RoomMatch Boston · Innovation class MVP · 점수는 예시 선호도 비교이며 안전성, 학생 신분 또는 실제 동거 적합성을 보장하지 않습니다. 프로필 사진은 AI 생성 예시입니다.": "RoomMatch Boston · Innovation class MVP · Scores are illustrative and do not guarantee safety, student identity, or roommate fit. Candidate photos are AI generated.",
    "통학": "Commute ", "♡ 저장": "♡ Save", "♥ 저장됨": "♥ Saved", "실내 흡연 금지 조건 불일치": "Smoking rule mismatch", "예산 초과": "Over budget", "통학 시간 초과": "Commute exceeds limit", "개인 욕실": "Private bathroom", "공용 욕실": "Shared bathroom", "최대 5MB": "up to 5 MB",
    "데모 계정의 사진은 이 브라우저에만 저장됩니다.": "The demo photo is stored in this browser only.",
    "사진과 소개는 이 브라우저의 데모 미리보기에만 적용되며, 다른 사용자에게 공개되지 않습니다.": "Your photo and bio are shown only in this browser, not published to other users.",
    "아직 시작된 대화가 없어요.": "No conversations started yet.",
    "'답장 받기'는 가상의 답장을 보여주는 기능이에요.": "'Get sample reply' displays a simulated response.",
    "조용한 환경에서 공부하는 걸 좋아해요.": "I enjoy studying in a quiet home.",
    "친구들과 요리하고 이야기 나누는 게 좋아요.": "I enjoy cooking and chatting with friends.",
    "정돈된 공간과 햇빛 좋은 방을 선호해요.": "I prefer an organized room with natural light.",
    "주중에는 조용하게, 주말에는 여유롭게 지내요.": "I keep weekdays quiet and weekends relaxed.",
    "활기찬 하우스 분위기를 좋아해요.": "I enjoy a lively, social home.",
    "생활 규칙을 정하고 서로 배려하는 룸메이트를 원해요.": "I prefer shared house rules and considerate roommates.",
    "이 비교는 체험용입니다. 매물 확인, 학생 인증 및 실제 신원 확인은 수행되지 않았습니다.": "This is a demo comparison. No real listings, student status, or identities have been verified.",
    "이하": "or less", "비흡연 선호": "Prefer non-smoking", "실내 금연": "No indoor smoking", "흡연 허용": "Smoking permitted", "있으면 좋음": "Preferred", "있음": "Yes", "없음": "No", "채광 좋음": "Bright sunlight", "적당한 채광": "Moderate sunlight", "출입 통제": "Secure entry", "일반 보안": "Standard security", "아침형": "Early bird", "보통": "Balanced", "야행성": "Night owl", "깔끔": "Very tidy", "유연함": "Flexible", "조용함": "Quiet", "활기참": "Social", "방문 적음": "Rare visits", "방문 많음": "Frequent visits",
    "아직 대화가 없어요": "No conversations yet", "월세": "Rent", "데모 대화방이 생성되었어요": "Demo conversation started", "내 조건": "My preferences", "후보 조건": "Candidate preferences", "스와이프 매칭": "Swipe matches", "모든 후보를 확인했어요!": "All profiles reviewed!", "↺ 다시 보기": "↺ Start over"
});
const TRANS_KEYS = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);
var I18N_ORIGINAL = new WeakMap(), I18N_ATTRS = new WeakMap();
function transText(original) {
    let s = String(original);
    for (const key of TRANS_KEYS)
        if (s.includes(key))
            s = s.split(key).join(TRANSLATIONS[key]);
    return s;
}
function translateUI() {
    if (!I18N_ORIGINAL)
        return;
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-lang]').forEach(b => { const on = b.dataset.lang === currentLang; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while (n = walk.nextNode()) {
        if (n.parentElement?.closest('script,style,[data-no-translate],.chat-bubble,.chat-thread-preview'))
            continue;
        let cached = I18N_ORIGINAL.get(n);
        if (!cached) {
            cached = { source: n.nodeValue, last: n.nodeValue };
            I18N_ORIGINAL.set(n, cached);
        }
        else if (n.nodeValue !== cached.source && n.nodeValue !== cached.last) {
            cached.source = n.nodeValue;
        }
        if (!cached.source.trim())
            continue;
        const newValue = currentLang === 'en' ? transText(cached.source) : cached.source;
        if (n.nodeValue !== newValue)
            n.nodeValue = newValue;
        cached.last = newValue;
    }
    document.querySelectorAll('input[placeholder],textarea[placeholder],select[aria-label],button[aria-label],.chat-search[placeholder]').forEach(el => { let original = I18N_ATTRS.get(el); if (!original) {
        original = {};
        for (const key of ['placeholder', 'aria-label'])
            if (el.hasAttribute(key))
                original[key] = el.getAttribute(key);
        I18N_ATTRS.set(el, original);
    } for (const [k, v] of Object.entries(original))
        el.setAttribute(k, currentLang === 'en' ? transText(v) : v); });
}
function setLanguage(lang) { if (lang !== 'ko' && lang !== 'en')
    return; currentLang = lang; try {
    localStorage.setItem('rmb_language', lang);
}
catch (e) { } translateUI(); }
try {
    const storedLang = localStorage.getItem('rmb_language');
    if (storedLang === 'ko' || storedLang === 'en')
        currentLang = storedLang;
}
catch (e) { }
$('swipe-area').addEventListener('change', e => selectArea(e.target.value));
$('swipe-school').addEventListener('change', e => selectSchool(e.target.value));
$('clear-category').addEventListener('click', () => { currentArea = 'all'; currentSchool = 'all'; resetSwipe(); renderFilters(); render(); translateUI(); });
$('swipe-pass').addEventListener('click', () => swipeDecision('pass'));
$('swipe-like').addEventListener('click', () => swipeDecision('like'));
$('swipe-details').addEventListener('click', () => { const p = swipeCandidates()[0]; if (p)
    showProfile(p.id); });
$('swipe-reset').addEventListener('click', resetSwipe);
$('save-account').addEventListener('click', saveAccount);
$('account-photo').addEventListener('change', e => { uploadProfilePhoto(e.target.files?.[0]); e.target.value = ''; });
$('remove-photo').addEventListener('click', () => { userPhoto = ''; drawAccountAvatar(); updateAccountPreview(); toast('기본 사진으로 변경했어요. 저장을 눌러주세요.'); });
['account-name', 'account-school', 'account-area', 'account-bio'].forEach(id => $(id).addEventListener('input', updateAccountPreview));
document.addEventListener('click', e => { const x = e.target.closest('button'); if (!x)
    return; if (x.dataset.area)
    selectArea(x.dataset.area); if (x.dataset.school)
    selectSchool(x.dataset.school); if (x.dataset.lang)
    setLanguage(x.dataset.lang); if (x.id === 'swipe-start-over')
    resetSwipe(); });
document.addEventListener('keydown', e => { if (page !== 'swipe' || $('modal-bg').classList.contains('open') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))
    return; if (e.key === 'ArrowLeft') {
    e.preventDefault();
    swipeDecision('pass');
} if (e.key === 'ArrowRight') {
    e.preventDefault();
    swipeDecision('like');
} });
renderFilters();
translateUI();
