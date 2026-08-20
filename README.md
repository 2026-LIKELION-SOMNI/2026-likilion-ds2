## Contributors
<hr>

<div align="center">

<table align="center">
  <tr>
    <th align="center"><b>정여진</b><br><a href="https://github.com/yejn1402">@yejn1402</a></th>
    <th align="center"><b>김서연</b><br><a href="https://github.com/naeuun">@naeuun</a></th>
    <th align="center"><b>유수현</b><br><a href="https://github.com/Yoo-Su-Hyeon">@Yoo-Su-Hyeon</a></th>
    <th align="center"><b>김예빈</b><br><a href="https://github.com/y2bnn">@y2bnn</a></th>
    <th align="center"><b>양수빈</b><br><a href="https://github.com/chubin925">@chubin925</a></th>
  </tr>
  <tr>
    <td align="center">PM</td>
    <td align="center">BE</td>
    <td align="center">BE</td>
    <td align="center">FE</td>
    <td align="center">FE</td>
  </tr>
  <tr>
    <td align="center"><code>구상 및 기획</code><br><code>UI/UX 디자인</code></td>
    <td align="center"><code>온보딩</code><br><code>이명 프로필 / 음역 매칭</code><br><code>사운드 피팅 알고리즘</code><br><code>데일리 체크인</code><br><code>마이페이지</code><br><code>데이터 관리 / 초기화</code></td>
    <td align="center"><code>사용자 식별 (UUID)</code><br><code>사운드 생성 및 재생</code><br><code>케어 루틴</code><br><code>피드백 수집</code><br><code>개인화 가중치 학습</code><br><code>상태 변화 추이 / 통계</code><br><code>OpenAI 기반 AI 분석 리포트</code></td>
    <td align="center"><code>음역 매칭 및 AI Sound Fit 로직 연동</code><br><code>Web Audio API 기반 개인화 사운드·회복 세션 구현</code><br><code>사용자 데이터 관리</code></td>
    <td align="center"><code>데일리 체크인</code><br><code>CBT 기반 이완 활동</code><br><code>세션 결과 평가</code></td>
  </tr>
</table>

</div>


## Tech Stack
---

📌 **기획/디자인**  
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white"> <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white">

📌 **백엔드**  
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">

📌 **프론트엔드**  
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">

📌 **서버**  
<img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"> <img src="https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white"> <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">


## Project Structure
---

```text
hackathon/
├── backend/                  
│   ├── apps/                 
│   │   ├── accounts/         # 사용자 식별 및 계정 관리
│   │   ├── onboarding/       # 온보딩 및 초기 안전 문항
│   │   ├── tinnitus/         # 이명 프로필 등록 및 음역 매칭
│   │   ├── sound/            # 노치 필터 사운드 생성 및 관리
│   │   ├── soundfit/         # 사운드 피팅 알고리즘
│   │   ├── checkin/          # 데일리 불쾌도·긴장도 체크인
│   │   ├── relaxtion/        # 케어 루틴 (호흡/주의전환)
│   │   ├── feedback/         # 케어 결과 피드백 수집
│   │   ├── personalization/  # 개인화 가중치 학습
│   │   ├── data/             # 건강 데이터 및 초기화 관리
│   │   ├── mypage/           # 마이페이지 및 설정
│   │   └── home/             # 메인 홈 데이터
│   ├── config/               
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                 
    ├── public/               
    ├── src/                  
    ├── index.html            
    ├── package.json          
    └── vite.config.ts        
