# 한국사학진흥재단 원리금 상환 관리 — GitHub Pages 1차 버전

## 포함 기능
- 원리금 조건 입력
- 원금 균등 / 원리금 균등 계산
- 분기 / 반기 상환
- 거치기간 검증
- 회차별 원금·이자·원리금·잔액 표
- 브라우저 localStorage 기반 기숙사/이력 저장
- Excel 다운로드
- 인쇄
- 대시보드

## GitHub Pages
저장소에 `index.html`, `style.css`, `app.js`를 업로드한 뒤
Settings → Pages → Deploy from branch → `main` / `/ (root)`를 선택하면 됩니다.

## 주의
현재 버전은 서버/DB/로그인/자동 이메일 알림이 없는 GitHub Pages용 프로토타입입니다.
변동금리의 실제 재산정 규칙, 중도변수의 세부 조건, 첨부 공문 자동생성 등은 후속 구현 대상입니다.
계산 결과는 실제 업무 적용 전에 기존 Excel과 대조 검증이 필요합니다.
