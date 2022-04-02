# Github 관계망 탐색기

Github ID를 검색하여 사용자의 Star 저장소 목록을 가져와 시각적으로 보여줍니다.

![test](assets/test.gif)

## 사용한 기술 스택

- React, TypeScript, Tailwind CSS, Apollo GraphQL, graphql-codegen, D3

## 프로젝트 실행 방법

- [배포 사이트 바로가기](https://github-stars-network-graph.surge.sh)
- 로컬 :

>💡 개발 환경에서 실행하기 위해선 [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)을 필요로 합니다.
>생성한 토큰을 [`.env.example`](./.env.example) 파일의 `REACT_APP_GITHUB_TOKEN=` 뒤에 복사하여 붙여넣은 뒤, `.env`로 파일 이름을 변경합니다. (적용하지 않을 경우, [rate limit](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#checking-your-rate-limit-status)이 있어 시간당 60회 호출만 가능합니다.)

1. 프로젝트를 클론합니다.

   - `git clone https://github.com/Pre-Onboarding-FE-Team07/wanted-codestates-project-7-11.git`

2. 의존성 패키지를 설치하고 [Github GraphQL API로부터 타입 정보를 불러옵니다.](./package.json#L47)
   
   - `yarn`
  
3. 프로그램을 실행합니다.

   - `yarn start`

## 팀 멤버

| 이름                                       | 직책 | 역할                                             |
| ------------------------------------------ | ---- | ------------------------------------------------ |
| [⚡️ 박진용](https://github.com/jinyongp)   | 팀원 | Apollo GraphQL을 사용해 검색 API 호출 함수 작성 |
| [🎨 문선경](https://github.com/dev-seomoon) | 팀원 | 검색 UI 구현 및 API 연동                         |

---

## 구현한 기능 목록

- Github ID를 검색하여 해당 사용자와 함께 즐겨찾기한 저장소 목록을 그래프로 표현합니다. 사용자 노드를 중심으로 주변에 저장소 노드가 연결된 별 모양 그래프를 이룹니다. 여러 사용자가 하나의 저장소를 즐겨찾기했다면 하나의 저장소가 여러 사용자와 연결될 수 있습니다.
- 저장소 노드를 클릭하면 해당 저장소의 소유자가 즐겨찾기한 저장소 목록을 추가로 표시합니다.
  - 저장소의 소유자가 개인이 아닌 단체일 경우 조회하지 않습니다. (색과 커서 타입으로 구별 가능합니다.)
  - 이미 추가된 사용자일 경우 해당 사용자의 정보를 출력합니다. (추가 네트워크 요청은 하지 않습니다.)
- 사용자 노드를 클릭하면 해당 사용자의 정보를 출력합니다.
- 스크롤을 통해 줌을 할 수 있고, 드래그를 통해 이동할 수 있습니다.
- 줌을 멀리하면 대략적인 이미지로 표현되어 성능이 약간 상승합니다.

---

## 구현한 방법

[D3 라이브러리](https://github.com/d3/d3/blob/main/API.md)를 이용하여 [GithubSocialGraph Class](./src/utils/github-social-graph.ts)을 구현했습니다.

  - [d3-force](https://github.com/d3/d3-force/tree/v3.0.0): 네트워크 구현을 위한 정점과 간선을 표현하기 위한 모듈입니다.
  - [d3-selection](https://github.com/d3/d3-selection/tree/v3.0.0): DOM 요소를 데이터 주도적으로 처리하기 위한 모듈입니다.
  - [d3-zoom](https://github.com/d3/d3-zoom/tree/v3.0.0): 화면 이동 및 줌 이벤트를 제어하기 위한 모듈입니다.

`GithubSocialGraph`를 생성하면 다음의 절차를 거칩니다.

```ts
const graph = new GithubSocialGraph('#root');
```

1. 멤버 프로퍼티를 초기화 및 설정합니다.
   
2. 전달 받은 부모 선택자를 통해 `#network` 아이디 요소가 존재하는지 확인합니다.

   - 해당 요소가 존재한다면 이를 `this.root` 요소로 합니다. 존재하지 않는다면 새로운 요소를 생성합니다.

3. `this.root` 아래에 각각의 요소를 묶는 `g` 요소를 생성하고 식별을 위해 적절한 `id`를 붙입니다.

   - `#lines`: 간선 요소 묶음입니다.
   - `#names`: 이름 요소 묶음입니다.
   - `#skeletons`: 화면에서 멀어졌을 때 보여줄 스켈레톤 묶음입니다.
   - `#avatars`: 사용자 아바타 묶음입니다.

4. 시뮬레이션을 생성하고 `tick` 이벤트를 등록합니다.

5. 줌 객체를 생성하고 `zoom` 이벤트를 등록합니다.

6. `resize` 이벤트를 등록합니다. (요소 크기의 변경을 감지하기 위해 [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)를 이용했습니다.)

생성한 `GithubSocialGraph` 인스턴스에 데이터를 추가하면 다음의 절차를 거칩니다.

```ts
graph.push(user);
```
  
1. 입력받은 데이터를 형태에 맞춰 `user`와 `starredRepositories`로 분리합니다.

2. `user`와 `starredRepositories`를 `this.connectNodes` 메서드로 생성하고 연결합니다.

3. `this.updateForce` 메서드를 호출하여 현재 추가된 노드를 시뮬레이션 노드로 변환 및 확장하고 그래프에 그립니다.

4. `this.updateZoom` 메서드를 호출하여 추가한 노드에 맞춰 줌을 다시 설정합니다.

`GithubSocialGraph`는 `EventTarget`을 상속받아 이벤트를 추가할 수 있습니다. 저장소 및 사용자 이름을 클릭했을 때 실행할 이벤트를 등록했습니다. 이벤트가 발생할 때 몇몇 데이터를 함께 전달해야 했으므로 `CustomEvent`를 이용하여 이벤트를 생성했습니다.

## 어려웠던 점 (에러 핸들링)

- 과제 요구 사항엔 Github Rest API가 주어졌지만, 하나의 작업을 위해 두 번 요청(user와 repos)을 해야 하는 `under-fetching` 문제와 불필요한 정보까지 전달받아 네트워크 비용을 낭비하는 `over-fetching` 문제가 있다고 판단하였습니다. 두 가지 문제를 해결하기 위해 GraphQL API를 사용하기로 결정하였습니다. 이에 따라, GraphQL 상태 관리 라이브러리인 Apollo를 선택했고 API로부터 타입 정보를 가져오기 위해 graphql-codegen을 활용했습니다. codegen의 경우, 초기 의존성 패키지 설치를 위해 `yarn` 명령어를 실행하거나, 따로 `yarn generate` 명령어를 실행하면 `src/generated/graphql.ts` 파일이 생성되도록 하였습니다. 용량이 매우 큰 파일이므로 버전 관리에서 제외하였습니다.

- 추가 그래프를 생성하기 위해 API로 전달받은 데이터를 전달할 때, [`TypeError: Cannot add property id, object is not extensible`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_define_property_object_not_extensible) 에러가 발생하는 문제가 있었습니다. 어떤 문제로 발생한건지 확실하지 않아 DevTools의 `Sources` 탭에서 디버깅 기능을 활용하여 문제를 발견했습니다. `d3-force` 모듈의 경우, 노드 객체에 위치 정보 프로퍼티(x, y 등)를 추가하는데 이 과정에서 객체가 확장 불가능하여 발생하는 에러였습니다. 검색 결과, Apollo의 `useReactiveVar`는 데이터의 불변성을 유지하기 위해 [`Object.preventExtensions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions) 처리된 변경 불가능한 객체를 반환하기 때문에 발생하는 문제였습니다. 그리 복잡한 객체를 전달하는 것이 아니므로 `JSON.parse(JSON.stringify(user))` 방법으로 깊은 복사하여 변경 가능한 객체를 전달하는 방식으로 문제를 해결했습니다.

- [`drawAvatars`](./src/utils/github-social-graph.ts#L279): `svg` 내에서 아바타 이미지를 그릴 때 `image` 태그를 이용해보았지만, 일반적인 html처럼 style을 지정할 수 없어 `border-radius` 스타일 속성으로 모서리를 둥글게 만들 수 없었습니다. 해결 방법을 찾던 중 `svg` 태그 안에서 HTML 태그를 사용할 수 있도록 해주는 `foreignObject` 태그를 발견하였고, 해당 태그 내에서 `img` 태그를 사용하여 스타일을 적용하는 방법으로 문제를 해결했습니다. 이 때, 아래 속한 요소는 반드시 `xhtml` 네임스페이스를 가져야 하므로 [d3-namespaces](https://github.com/d3/d3-selection/blob/v3.0.0/README.md#namespaces) 방식에 따라 `.append('xhtml:img')`로 작성하였습니다.
  
- [`drawNames`](./src/utils/github-social-graph.ts#L225): `text` 태그에 배경을 넣어야 할 때도 마찬가지로 `background-color` 속성을 지정할 수 없었습니다. 그래서 배경으로 할 `rect` 요소를 추가로 생성했습니다. `text` 태그의 너비에 따라 `rect`의 너비를 결정해야 했으므로, `getBBox` 메서드를 통해 `text` 태그의 너비 정보를 가져와 노드 객체에 확장한 뒤, 이후에 이 정보를 토대로 `rect` 요소의 너비를 결정하는 방법으로 문제를 해결했습니다.

- 저장소의 소유자가 개인이 아닌 단체(Organization)로 API 요청할 경우, `Could not resolve to a User with the login of '단체명'.` 에러를 응답하는 문제가 있었습니다. API 요청 단계에서 `isInOrganization` 필드를 추가하여, 해당 저장소의 소유자가 개인인지 단체인지 먼저 확인한 다음, 단체라면 클릭하여 요청하지 못하도록 변경하여 문제를 해결했습니다. (예시 자료에선 해당 단체만 노드로 추가되는 모습을 보였으나, 즐겨찾는 저장소가 없으므로 추가될 필요가 없다고 판단하였습니다.)

### 수정이 필요한 부분

- 노드의 개수가 많아질수록 프레임이 떨어지는 것이 보였습니다. DevTools의 Performance 탭에서 확인해보니 text의 구조가 복잡한지 reflow, repaint 연산에 긴 시간을 필요로 하는 모습을 보았습니다. 이를 해결하고자, IntersectionObserver로 현재 뷰포트 내에 보이는 요소에 대해서만 연산하도록 수정해보려고 했으나, [`svg` 요소의 경우 Top-Level 요소가 아니라면 하위 요소에 대해선 IntersectionObserver가 관찰하지 못한다는 문제를 발견했습니다.](https://bugs.chromium.org/p/chromium/issues/detail?id=963246) 여러가지 방법을 시도해보았으나, 마땅한 해결 방법이 없는 관계로 이후 Canvas API를 이용하는 방법으로 문제를 해결해야 할 필요성을 느꼈습니다.
