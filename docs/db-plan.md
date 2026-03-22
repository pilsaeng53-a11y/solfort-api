# DB Plan

## 목적
- 유저 상태 저장
- AI 시그널 히스토리 저장
- 즐겨찾기/설정 저장
- 포지션/주문 히스토리 저장
- 알림 저장

## 구분
### 저장 안 하는 것
- 실시간 호가 전체 틱 데이터
- 전체 체결 틱 데이터
- 전체 kline WS 원본 스트림

### 저장하는 것
- users
- user_settings
- watchlists
- ai_signal_history
- positions
- order_history
- notifications

## 다음 단계
1. Neon 연결
2. DATABASE_URL 설정
3. schema.sql 실행
4. 라우트 테스트
