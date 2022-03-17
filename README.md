# Github 관계망 탐색기

Github ID를 검색하여 사용자의 Star 저장소 목록을 가져와 시각적으로 보여줍니다.

## 사용한 기술 스택

- React, TypeScript, TailwindCSS, Apollo & GraphQL & GraphQL-codegen

## 프로젝트 실행 방법

- 배포 사이트 : https://github-stars-network-graph.surge.sh/
- 로컬 :

1. `git clone https://github.com/Pre-Onboarding-FE-Team07/wanted-codestates-project-7-11.git`
2. `yarn`
3. `yarn start`

## 팀 멤버

| 이름                                       | 직책 | 역할                                             |
| ------------------------------------------ | ---- | ------------------------------------------------ |
| [⚡️박진용](https://github.com/jinyongp)   | 팀원 | Apollo, GraphQL을 사용해 검색 API 호출 함수 작성 |
| [🎨문선경](https://github.com/dev-seomoon) | 팀원 | 검색 UI 구현 및 API 연동                         |

---

## 구현한 기능 목록

- Github ID 검색 기능

- **구현 완료했지만 프로젝트에 미적용된 기능**
  - 사용자(검색한 Github ID의 사용자)가 Star를 누른 저장소들의 관계를 네트워크 그래프로 나타내는 기능
  - 스크롤을 통해 그래프를 줌인/줌아웃하는 기능
  - 드래그를 통해 그래프를 탐색하는 기능
  - 사용자 추가 검색 기능, 서로 다른 사용자 간에 공통으로 Star를 누른 저장소 그래프에 링크로 나타내는 기능

---

### 구현한 방법

### 어려웠던 점 (에러 핸들링)

### References
