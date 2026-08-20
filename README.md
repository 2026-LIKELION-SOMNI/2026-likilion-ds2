## Contributors

<hr>

<div align="center">
<table>
<tr>

<th align="center" width="20%">
<img src="./frontend/src/assets/contributors/yeojin.png" width="100" height="100"><br>
<b>정여진</b><br>
<a href="https://github.com/yejn1402">@yejn1402</a>
</th>

<th align="center" width="20%">
<img src="./frontend/src/assets/contributors/seoyeon.jpeg" width="100" height="100"><br>
<b>김서연</b><br>
<a href="https://github.com/kseooy">@kseooy</a>
</th>

<th align="center" width="20%">
<img src="./frontend/src/assets/contributors/suhyeon.png" width="100" height="100"><br>
<b>유수현</b><br>
<a href="https://github.com/Yoo-Su-Hyeon">@Yoo-Su-Hyeon</a>
</th>

<th align="center" width="20%">
<img src="./frontend/src/assets/contributors/yebin.png" width="100" height="100"><br>
<b>김예빈</b><br>
<a href="https://github.com/y2bnn">@y2bnn</a>
</th>

<th align="center" width="20%">
<img src="./frontend/src/assets/contributors/subin.jpeg" width="100" height="100"><br>
<b>양수빈</b><br>
<a href="https://github.com/chubin925">@chubin925</a>
</th>

</tr>

<tr>
<td align="center"><b>PM</b></td>
<td align="center"><b>BE</b></td>
<td align="center"><b>BE</b></td>
<td align="center"><b>FE</b></td>
<td align="center"><b>FE</b></td>
</tr>

<tr>

<td align="center">
<code>구상 및 기획</code><br>
<code>UI/UX 디자인</code>
</td>

<td align="center">
<code>온보딩</code><br>
<code>이명 프로필</code><br>
<code>음역 매칭</code><br>
<code>AI Sound Fit 알고리즘</code><br>
<code>데일리 체크인</code><br>
<code>마이페이지</code><br>
<code>데이터 관리/초기화</code>
</td>

<td align="center">
<code>사용자 식별 (UUID)</code><br>
<code>사운드 생성/재생</code><br>
<code>케어 루틴</code><br>
<code>개인화 가중치 학습</code><br>
<code>상태 변화 추이/통계</code><br>
<code>AI 분석 리포트 (OpenAI)</code>
</td>

<td align="center">
<code>음역 매칭 및 AI Sound Fit 로직 연동</code><br>
<code>Web Audio API 기반 개인화 사운드·회복 세션 구현</code><br>
<code>사용자 데이터 관리</code><br>
<code>마이페이지</code><br>
<code>배포</code>
</td>

<td align="center">
<code>온보딩</code><br>
<code>홈</code><br>
<code>데일리 체크인</code><br>
<code>CBT 기반 이완 활동</code><br>
<code>세션 결과 평가</code>
</td>

</tr>
</table>
</div>

<br>

## Tech Stack

---

### 📌 기획 / 디자인

<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white"> <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white">

### 📌 백엔드

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"> <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white">

### 📌 프론트엔드

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"> <img src="https://img.shields.io/badge/Web%20Audio%20API-000000?style=for-the-badge"> <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white">

### 📌 서버 / DevOps

<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"> <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"> <img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white"> <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white"> <img src="https://img.shields.io/badge/Gabia-002266?style=for-the-badge">

<br>

## Project Structure

---

```text
2026-likilion-ds2/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # 사용자 식별 및 계정 관리
│   │   ├── onboarding/        # 온보딩 및 초기 안전 문항
│   │   ├── tinnitus/          # 이명 프로필 및 음역 매칭
│   │   ├── sound/             # 개인화 사운드 생성 및 재생
│   │   ├── soundfit/          # AI Sound Fit 알고리즘
│   │   ├── checkin/           # 데일리 체크인
│   │   ├── relaxtion/         # CBT 기반 이완 활동 및 케어 루틴
│   │   ├── feedback/          # 세션 결과 평가 및 피드백
│   │   ├── personalization/   # 개인화 개입 결정 및 AI 분석
│   │   ├── data/              # 사용자 데이터 관리 및 초기화
│   │   ├── mypage/            # 마이페이지 및 설정
│   │   └── home/              # 홈 데이터
│   ├── config/                # Django 프로젝트 설정
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── public/                # PWA 아이콘 및 정적 파일
    ├── src/
    │   ├── api/               # 백엔드 API 요청
    │   ├── app/               # 앱 및 라우터 설정
    │   ├── assets/            # 이미지 · 아이콘 · 오디오
    │   │   └── contributors/  # 팀원 프로필 이미지
    │   ├── audio/             # Web Audio API 오디오 처리
    │   ├── components/        # 공통 및 기능별 UI 컴포넌트
    │   ├── layouts/           # 공통 페이지 레이아웃
    │   ├── mock/              # 프론트엔드 정적 데이터
    │   ├── pages/             # 기능별 페이지
    │   ├── services/          # 서비스 로직
    │   ├── styles/            # 전역 스타일
    │   ├── utils/             # 공통 유틸리티
    │   └── main.tsx
    ├── index.html
    ├── package.json
    └── vite.config.ts         # Vite 및 PWA 설정
```

<br>

## PWA

---

Somni는 **PWA(Progressive Web App)** 를 지원하여 모바일 환경에서 홈 화면에 설치해 앱처럼 사용할 수 있습니다.

- 모바일 홈 화면 설치 지원
- Standalone 모드 지원
- Service Worker 자동 업데이트 적용
- Somni 전용 앱 아이콘 및 테마 적용
- `vite-plugin-pwa` 기반 PWA 구성
