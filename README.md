# 웹툰 본문 크기 조절기 / Webtoon Reader Zoom

**웹툰 이미지는 보기 편하게, 댓글과 메뉴는 그대로.**

Webtoon Reader Zoom은 네이버 웹툰 PC 회차 페이지에서 **본문 이미지의 크기만 조절**하는 가벼운 오픈소스 브라우저 확장 프로그램이에요. 브라우저 전체 배율을 바꾸지 않아도 웹툰을 더 편하게 읽을 수 있어요.

> **비공식 독립 프로젝트예요.** NAVER WEBTOON과 제휴·승인·후원 관계가 없어요. 웹툰 작품 이미지나 원본 콘텐츠는 이 저장소에 포함하지 않아요.

## 주요 기능

- 웹툰 본문 이미지를 **25~100%** 크기로 조절해요. 처음 설치하면 50%로 표시해요.
- 웹툰 화면 오른쪽에서 **25% / 50% / 75% / 100%** 버튼으로 바로 크기를 바꿀 수 있어요.
- 화면의 조절바는 접거나 펼칠 수 있어요. 접으면 현재 배율만 표시해요.
- 확장 프로그램 팝업에서는 **5% 단위**로 세밀하게 조절할 수 있어요.
- **댓글, 메뉴, 브라우저 자체 배율은 그대로** 유지해요.
- 선택한 배율과 조절바 상태는 브라우저 로컬 저장소에 기억해요.
- 계정 연동, 광고, 분석 SDK, 확장 프로그램의 외부 서버 통신 기능을 사용하지 않아요.

## 설치 — Chromium (Chrome / Vivaldi / Opera)

1. 저장소에서 **Code → Download ZIP**을 눌러 소스를 받고 압축을 풀어 주세요. (`git clone`으로 내려받아도 돼요.)
2. `chrome://extensions`, `vivaldi://extensions` 또는 `opera://extensions`로 이동해 **개발자 모드**를 켜 주세요.
3. **압축해제된 확장 프로그램 로드**를 선택하고 `extension/chromium/` 폴더를 지정해 주세요.
4. 이미 열어 둔 웹툰 회차가 있다면 새로고침해 주세요.

배포용 ZIP은 아래 `scripts/package.ps1`로 직접 만들 수 있어요. GitHub Releases가 게시되지 않았더라도 로컬 설치는 가능해요.

## 설치 — Firefox (임시 개발용)

1. 소스의 압축을 풀고 `extension/firefox/` 폴더를 준비해 주세요.
2. Firefox에서 `about:debugging` → **현재 Firefox** → **임시 부가 기능 로드**를 선택해 주세요.
3. `extension/firefox/manifest.json` 파일을 선택한 뒤 웹툰 회차를 새로고침해 주세요.

**주의:** 서명되지 않은 Firefox 확장 프로그램은 브라우저를 다시 시작하면 임시 설치가 해제돼요. 정식 설치에는 Mozilla 서명이 필요해요. 현재 Firefox 실브라우저 검증과 스토어 출시는 아직 완료되지 않았어요.

## 프로젝트 구조

```text
extension/
  chromium/       # Chromium용 확장 프로그램
  firefox/        # Firefox용 확장 프로그램
  */content.js    # 웹툰 본문 이미지 크기 조절
  */toolbar.js    # 웹툰 화면 안의 배율 버튼
  */popup.*       # 확장 프로그램 팝업
assets/icon.svg   # 독립 제작 아이콘 원본
scripts/check.mjs # 정적 검사
scripts/package.ps1 # 브라우저별 ZIP 패키징 (PowerShell)
```

외부 라이브러리나 별도 빌드 의존성은 없어요. 브라우저별 API 차이로 `content.js`와 `popup.js`는 일부 다르게 작성되어 있어요. 불필요한 추상화 없이 간단한 구조를 유지하고 있어요.

## 개발과 검증

```powershell
node ./scripts/check.mjs
pwsh -NoProfile -File ./scripts/package.ps1
```

`check.mjs`는 JavaScript 구문, 매니페스트, 필수 파일과 브라우저별 구성 등을 검사해요. **정적 검사 통과가 실제 브라우저 동작이나 스토어 심사 통과를 보장하지는 않아요.**

## 지원 범위와 문제 제보

현재는 네이버 웹툰의 `https://comic.naver.com/webtoon/detail` 회차 페이지를 대상으로 해요. 사이트의 HTML 구조가 변경되면 일부 이미지의 크기 조절이 동작하지 않을 수 있어요.

조절바가 본문을 가린다면 접어서 사용해 주세요. 작동하지 않을 때는 이전 버전의 확장 프로그램이 중복으로 활성화되어 있지 않은지 확인하고, 페이지를 새로고침해 주세요.

문제를 발견하면 사용 중인 브라우저와 버전, 회차 URL(개인정보 제외), 선택한 배율, 예상한 동작을 [GitHub Issues](https://github.com/milkei/webtoon-reader-zoom/issues)에 남겨 주세요.

## 개인정보와 라이선스

- 권한 및 데이터 처리 방식: [PRIVACY.md](PRIVACY.md)
- 소스코드 라이선스: [MIT License](LICENSE)
- 변경 내역: [CHANGELOG.md](CHANGELOG.md)
- 스토어 소개글 초안: [docs/STORE_LISTING.ko.md](docs/STORE_LISTING.ko.md)

기존 Chromium 기반 v0.2에서 웹툰 이미지 143장의 축소 동작을 확인했어요. 이후 v0.5에서는 모의 테스트를 진행했지만, **이번 공개 패키지의 실브라우저 재검증은 아직 완료되지 않았어요.**

---

**English:** Webtoon Reader Zoom is an unofficial, lightweight Manifest V3 extension for resizing Naver Webtoon episode images while keeping navigation and comments unchanged. Chromium source and a Firefox version for temporary installation are included. MIT licensed; no data collection. Not affiliated with NAVER WEBTOON.
