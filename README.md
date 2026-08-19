# 2026-likilion-ds2

## 🔄 협업 프로세스

이슈 생성 → `develop` 브랜치에서 본인 작업 브랜치 생성 → 기능 구현 및 자체 테스트 → `작업 브랜치`에서 `develop` 브랜치로 PR → 리뷰어가 Merge 테스트 및 코드 리뷰 → `develop`에 Merge 

> 💡 **최초 로컬 작업 시**  
> `git fetch` → `git switch develop` 명령어로 브랜치 이동 후 작업을 시작합니다.

---

## 🌿 Branch 규칙

> 💡 **평소 기능 개발에는 `main` 브랜치를 사용하지 않습니다.**
> 
> * 모든 기능 개발은 **`develop`** 브랜치를 기준으로 진행합니다.
> * 작업 브랜치는 `develop`에서 생성하고, PR 역시 `develop`을 대상으로 생성합니다.
> * 배포할 때만 `develop`에서 `main`으로 PR을 생성하여 Merge합니다.

---

## 🔀 Merge 규칙

* `main`, `develop` 브랜치에 **직접 Push 금지!**
* 모든 작업은 **Pull Request**를 통해 Merge
* 기능 개발 PR은 `develop` 브랜치를 대상으로 생성
* `develop` → `main` Pull Request는 배포 시에만 생성

### 📌 Merge 절차

1. Pull Request를 생성하고 팀 채팅방에 알리기
2. 리뷰어는 Merge 테스트 진행 (PR 내용이 정상 작동하는지 확인)
3. 충돌(Conflict) 발생 시, PR 작성자가 충돌 해결 후 다시 Push
4. 문제가 없으면 GitHub에서 **`Merge`** 버튼을 눌러 `develop` 브랜치에 Merge
5. Merge 완료 후 작업 브랜치 삭제

---

## 📂 브랜치 구조 및 역할

* **`main`**: 실제 배포에 사용하는 안정 브랜치 (평상시에는 사용하지 않으며 무조건 `develop` 기준)
* **`develop`**: 개발한 기능을 통합하고 테스트하는 메인 브랜치
* **`feat/*`, `fix/*` 등**: Issue 단위로 작업하는 개인/기능 브랜치

---

## 🛠️ 브랜치 생성 및 삭제

### 브랜치 생성
* GitHub에서 Issue 생성 후 `Create branch` 버튼을 클릭하면 Default branch(`develop`)를 기준으로 작업 브랜치가 생성됩니다.

### 브랜치 삭제
* Merge가 완료된 작업 브랜치는 **리뷰어**가 삭제합니다.  
  *(GitHub Pull Request 화면 하단의 `Delete branch` 버튼 활용)*

---

## 🔍 Code Review

PR 생성 시 **CodeRabbit AI**가 자동으로 코드 리뷰를 수행합니다. 
* 리뷰 코멘트를 확인하고 필요한 경우 수정 사항을 반영한 뒤 머지합니다.
* 추가 리뷰가 필요한 경우 `@coderabbitai`를 멘션하여 요청할 수 있습니다.