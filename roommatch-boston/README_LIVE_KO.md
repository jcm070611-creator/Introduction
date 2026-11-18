# RoomMatch Boston V10 · Supabase 연결 버전

## 현재 상태
- 기존 GitHub Introduction 저장소/Netlify 관리 사이트는 **수정하지 않음**.
- V10의 디자인·추천 프로필·탐색 UI는 유지하고 회원가입/로그인만 Supabase Auth와 연결.
- 브라우저 가상 계정 저장 기능은 제거. 실제 가입은 Supabase `auth.users` + `public.member_profiles`에 기록.
- 이메일은 Supabase Auth의 중복 가입 처리, 전화번호는 DB 고유 인덱스로 중복 방지.
- 학생증/신분증 및 셀피는 **미리보기만** 하고 전송하거나 보관하지 않음. 실제 신원인증 기능은 없음.
- 전화번호 로그인은 SMS 인증 연동이 없으므로 임시 비활성화 (이메일 로그인 사용).
- 프로필 사진 및 매칭·채팅은 기존 데모 방식이 남아 있으며 실제 사용자간 실시간 매칭/채팅이 아님.

## 실행 전 필수 설정
1. Supabase 프로젝트의 SQL Editor에서 **`SUPABASE_SETUP.sql` 실행** (기존 관리자용 schema가 먼저 있어야 함).
2. Authentication → Providers → Email에서 이메일 인증 사용 여부 확인. 기본 메일 발송 제한이 있으니 수업 중 대규모 동시 가입 전에 Custom SMTP를 구성하거나 인증 이메일 발송 한도를 확인해야 함.
3. 파일을 Netlify 또는 GitHub Pages로 호스팅해 HTTPS에서 테스트. **기존 V10에 덮어쓰지 말고 새로운 배포 주소**로 먼저 확인.
4. Supabase Authentication → URL Configuration: 배포한 사용자용 사이트를 Redirect URLs에 추가. 기본 Site URL은 관리자 초대 흐름을 위해 관리자 사이트로 유지해도 됨.
5. 학생 가입 테스트: 실제 신규 이메일/전화번호로 회원가입 후 Supabase → Table Editor → member_profiles에 1건 생성되는지 확인.
6. 동일 이메일로 재가입 시 중복 처리되는지, 다른 이메일+같은 전화번호가 거절되는지 검사.
7. 관리자 사이트에 등록된 3명 중 하나로 로그인해 새 회원이 보이는지 확인. 관리자 대시보드에 자동 새로고침이 없다면 Refresh 클릭.

## 꼭 알아둘 제한
- **현재 배포 중인 GitHub Pages V10은 자동으로 바뀌지 않음**: 학생에게 보내는 링크를 Supabase 연결 버전의 새 배포 주소로 바꾸거나, 테스트 후 기존 배포물을 명시적으로 업데이트해야 함.
- Supabase 이메일 확인 ON 상태에서는 첫 회원가입 후 이메일 링크를 클릭해야 로그인할 수 있음. 이메일을 확인하지 않은 상태에서 프로필은 DB에 이미 만들어질 수 있음.
- Supabase는 보안을 위해 기존 이메일 가입 여부를 숨길 수 있어, 이미 가입된 이메일을 입력하면 가입 성공처럼 응답할 수 있음. 실제 중복 계정/프로필은 생성되지 않음.
- 기존 브라우저 localStorage에 있는 V10 계정은 새 DB로 자동 이전되지 않음.
- 기존 `member_profiles` 테이블의 RLS 정책과 admin_users가 유지되어야 함. DB 권한을 공개(anon select)로 변경하지 말 것.
- 프로젝트의 `sb_publishable_` 키는 클라이언트에 포함해도 되지만 DB 비밀번호나 `sb_secret_` 키는 절대 포함하지 말 것.
