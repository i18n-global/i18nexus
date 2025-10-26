# 🚀 자동 배포 설정 완료!

## ✅ 완료된 작업

### 1. GitHub Actions 워크플로우 설정

- ✅ `.github/workflows/npm-publish.yml` 생성
- ✅ main 브랜치 push 시 자동 배포
- ✅ 버전 중복 체크 기능
- ✅ 자동 Git tag 생성
- ✅ 자동 GitHub Release 생성

### 2. npm 배포 설정

- ✅ `.npmignore` 생성 (불필요한 파일 제외)
- ✅ `package.json` 배포 설정 추가
  - `files` 필드: 배포할 파일 명시
  - `publishConfig`: npm 레지스트리 설정
  - `engines`: Node.js 버전 요구사항
  - 키워드 추가 (next.js, server-components 등)

### 3. 문서 작성

- ✅ `.github/DEPLOYMENT_SETUP.md` - 상세 설정 가이드
- ✅ `RELEASE_GUIDE.md` - 릴리스 프로세스 가이드
- ✅ `DEPLOYMENT_COMPLETE.md` - 이 문서

## 🔐 필수: NPM_TOKEN 설정

**아직 완료되지 않았습니다!** 다음 단계를 수행해야 자동 배포가 작동합니다.

### 단계 1: NPM Access Token 생성

1. https://www.npmjs.com 로그인
2. 프로필 → **Access Tokens** 클릭
3. **Generate New Token** → **Classic Token**
4. Token Type: **Automation** 선택
5. 생성된 토큰 복사 (⚠️ 다시 볼 수 없음!)

### 단계 2: GitHub Secret 추가

1. https://github.com/manNomi/i18nexus/settings/secrets/actions
2. **New repository secret** 클릭
3. 입력:
   - Name: `NPM_TOKEN`
   - Secret: 복사한 npm token
4. **Add secret** 클릭

## 🎯 배포 방법

### 옵션 1: 자동 버전 증가 (권장)

```bash
# Patch 버전 (버그 수정)
npm version patch   # 1.5.7 → 1.5.8

# Minor 버전 (새 기능)
npm version minor   # 1.5.7 → 1.6.0

# Major 버전 (Breaking changes)
npm version major   # 1.5.7 → 2.0.0

# Push (자동 배포 시작!)
git push origin main --follow-tags
```

### 옵션 2: 수동 버전 변경

```bash
# 1. package.json 수정
# "version": "1.5.8"

# 2. CHANGELOG.md 업데이트

# 3. Commit & Push
git add .
git commit -m "Release v1.5.8"
git push origin main

# ✅ 자동 배포 시작!
```

## 📊 배포 프로세스 흐름

```
main 브랜치 push
    ↓
GitHub Actions 트리거
    ↓
버전 중복 체크
    ├─ 이미 존재 → ⏭️  스킵
    └─ 새 버전 → 계속
        ↓
    의존성 설치
        ↓
    빌드 (TypeScript → JavaScript)
        ↓
    테스트 실행 (있는 경우)
        ↓
    npm publish
        ↓
    Git tag 생성 (v1.5.7)
        ↓
    GitHub Release 생성
        ↓
    ✅ 배포 완료!
```

## 🔍 배포 확인 방법

### 1. GitHub Actions 확인

```
https://github.com/manNomi/i18nexus/actions
```

- 최신 "Publish to npm" 워크플로우 상태 확인
- 각 단계별 로그 확인 가능

### 2. npm 확인

```bash
# 최신 버전 확인
npm view i18nexus-tools version

# 모든 버전 보기
npm view i18nexus-tools versions

# 설치 테스트
npm install -g i18nexus-tools@latest
i18n-wrapper --help
```

### 3. GitHub Release 확인

```
https://github.com/manNomi/i18nexus/releases
```

## 📋 첫 배포 체크리스트

현재 v1.5.7이 준비되어 있으므로, NPM_TOKEN만 설정하면 바로 배포 가능합니다.

- [x] v1.5.7 코드 작성 완료
- [x] CHANGELOG.md 업데이트 완료
- [x] README.md 업데이트 완료
- [x] 빌드 성공 확인 (`npm run build`)
- [x] GitHub Actions 워크플로우 설정
- [x] `.npmignore` 설정
- [x] `package.json` 배포 설정
- [ ] **NPM_TOKEN Secret 설정** ← 👈 이것만 하면 됨!
- [ ] main 브랜치에 push

## 🚀 첫 배포 실행

NPM_TOKEN 설정 후:

```bash
# 1. 현재 디렉토리 확인
pwd
# /Users/manwook-han/Desktop/i18nexus/i18nexus-tools

# 2. Git 상태 확인
git status

# 3. 모든 변경사항 commit
git add .
git commit -m "Setup auto-deployment with GitHub Actions"

# 4. Main 브랜치에 push (자동 배포 시작!)
git push origin main

# 5. GitHub Actions 확인
# https://github.com/manNomi/i18nexus/actions
```

## 📦 배포될 파일 목록

다음 파일들만 npm 패키지에 포함됩니다:

```
i18nexus-tools@1.5.7/
├── dist/                  # 빌드된 JavaScript
│   ├── bin/              # CLI 실행 파일
│   └── scripts/          # 유틸리티 모듈
├── README.md             # 사용 가이드
├── CHANGELOG.md          # 변경 이력
└── package.json          # 패키지 정보
```

**제외되는 파일** (`.npmignore`):

- 소스 파일 (`src/`, `bin/`, `scripts/`)
- 테스트 파일 (`test-*.tsx`)
- 문서 (`docs/`, `*.md` except README & CHANGELOG)
- 설정 파일 (`.github/`, `tsconfig.json`)

## 🎉 다음 버전 배포 (v1.5.8+)

이후 배포는 매우 간단합니다:

```bash
# 코드 수정 후

# 버전 업데이트
npm version patch

# Push
git push origin main --follow-tags

# ✅ 자동으로 배포됨!
```

## 📚 상세 가이드

- **배포 설정**: [.github/DEPLOYMENT_SETUP.md](./.github/DEPLOYMENT_SETUP.md)
- **릴리스 가이드**: [RELEASE_GUIDE.md](./RELEASE_GUIDE.md)
- **개선 사항**: [IMPROVEMENTS_v1.5.7.md](./IMPROVEMENTS_v1.5.7.md)
- **요약**: [SUMMARY_v1.5.7.md](./SUMMARY_v1.5.7.md)

## 🐛 문제 해결

### "npm publish failed"

→ NPM_TOKEN이 올바르게 설정되었는지 확인

### "Version already exists"

→ `npm version patch`로 버전 증가

### "Build failed"

→ 로컬에서 `npm run build` 실행하여 에러 확인

### 더 많은 문제 해결

→ [.github/DEPLOYMENT_SETUP.md](./.github/DEPLOYMENT_SETUP.md#-문제-해결)

## 📞 지원

- GitHub Issues: https://github.com/manNomi/i18nexus/issues
- 문서: [README.md](./README.md)

---

## 🎯 현재 상태

**버전**: 1.5.7  
**상태**: 배포 준비 완료 ✅  
**필요 작업**: NPM_TOKEN Secret 설정만 하면 바로 배포 가능!

**설정이 완료되면 main 브랜치에 push하는 것만으로 자동 배포가 시작됩니다!** 🚀
