# Release Guide

## 🚀 자동 배포 (권장)

main 브랜치에 push하면 자동으로 npm에 배포됩니다.

### Quick Release

```bash
# 1. 버전 업데이트 (자동으로 commit & tag 생성)
npm version patch   # 1.5.7 → 1.5.8 (버그 수정)
npm version minor   # 1.5.7 → 1.6.0 (새 기능)
npm version major   # 1.5.7 → 2.0.0 (Breaking changes)

# 2. CHANGELOG 업데이트
# CHANGELOG.md 파일 편집

# 3. Push (자동 배포 트리거)
git push origin main --follow-tags

# ✅ GitHub Actions가 자동으로 npm에 배포
```

## 📋 Release 체크리스트

### Before Release

- [ ] 모든 기능 구현 완료
- [ ] 테스트 통과 확인
- [ ] CHANGELOG.md 업데이트
- [ ] README.md 업데이트 (필요시)
- [ ] 로컬 빌드 확인: `npm run build`
- [ ] 버전 번호 결정 (Semantic Versioning)

### Release Process

```bash
# 1. 최신 코드 pull
git pull origin main

# 2. 브랜치가 clean 상태인지 확인
git status

# 3. 버전 업데이트 & 자동 commit
npm version [patch|minor|major] -m "Release v%s"

# 4. CHANGELOG 수동 업데이트
# 버전에 맞는 변경사항 추가

# 5. CHANGELOG commit
git add CHANGELOG.md
git commit --amend --no-edit

# 6. Push (자동 배포 시작)
git push origin main --follow-tags
```

### After Release

- [ ] GitHub Actions 성공 확인
- [ ] npm에서 버전 확인: `npm view i18nexus-tools version`
- [ ] 설치 테스트: `npm install -g i18nexus-tools@latest`
- [ ] GitHub Release 노트 확인

## 🔧 Manual Deployment (비권장)

자동 배포가 실패하거나 수동 배포가 필요한 경우:

```bash
# 1. NPM 로그인
npm login

# 2. 빌드
npm run build

# 3. 배포
npm publish --access public

# 4. Git tag 생성
git tag -a v1.5.7 -m "Release v1.5.7"
git push origin v1.5.7
```

## 📦 Semantic Versioning

버전 번호 규칙: `MAJOR.MINOR.PATCH`

### PATCH (1.5.7 → 1.5.8)

**언제**: 버그 수정, 작은 개선

**예시**:

- 버그 수정
- 타이포 수정
- 성능 최적화
- 문서 업데이트

```bash
npm version patch
```

### MINOR (1.5.7 → 1.6.0)

**언제**: 새로운 기능 추가 (하위 호환성 유지)

**예시**:

- 새로운 CLI 옵션 추가
- 새로운 기능 추가
- API 확장

```bash
npm version minor
```

### MAJOR (1.5.7 → 2.0.0)

**언제**: Breaking changes (하위 호환성 깨짐)

**예시**:

- API 변경
- 기본 동작 변경
- 설정 파일 형식 변경
- 최소 Node.js 버전 상승

```bash
npm version major
```

## 🔍 배포 확인

### GitHub Actions 확인

1. [GitHub Repository](https://github.com/manNomi/i18nexus) → Actions
2. 최신 "Publish to npm" 워크플로우 확인
3. 모든 단계가 ✅ 통과했는지 확인

### npm 확인

```bash
# 최신 버전 확인
npm view i18nexus-tools version

# 버전 히스토리
npm view i18nexus-tools versions

# 패키지 정보
npm info i18nexus-tools

# 설치 테스트
npm install -g i18nexus-tools@latest
i18n-wrapper --help
```

### 설치 테스트 (새 터미널)

```bash
# 임시 디렉토리 생성
mkdir /tmp/test-i18nexus-tools
cd /tmp/test-i18nexus-tools

# 전역 설치 테스트
npm install -g i18nexus-tools@latest

# CLI 동작 확인
i18n-wrapper --help
i18n-extractor --help
i18n-sheets --help

# 정리
cd ~
rm -rf /tmp/test-i18nexus-tools
```

## 🐛 배포 실패 시

### GitHub Actions 실패

1. Actions 탭에서 에러 로그 확인
2. 일반적인 원인:
   - NPM_TOKEN이 만료됨
   - 빌드 에러
   - 버전 충돌

### 해결 방법

```bash
# 로컬에서 빌드 테스트
npm run build

# 에러 수정 후 다시 push
git add .
git commit -m "Fix build error"
git push origin main
```

### 버전 충돌

같은 버전이 이미 npm에 존재하는 경우:

```bash
# 버전 확인
npm view i18nexus-tools versions

# 버전 증가
npm version patch
git push origin main --follow-tags
```

## 🔄 Rollback

### 특정 버전 deprecate

```bash
npm deprecate i18nexus-tools@1.5.8 "This version has issues, please use 1.5.7"
```

### 버전 삭제 (72시간 이내만 가능)

```bash
npm unpublish i18nexus-tools@1.5.8
```

### Hotfix Release

긴급 버그 수정이 필요한 경우:

```bash
# 1. 수정 사항 commit
git add .
git commit -m "Hotfix: critical bug"

# 2. Patch 버전 증가
npm version patch

# 3. 즉시 배포
git push origin main --follow-tags

# ✅ 자동 배포 시작 (보통 2-3분 소요)
```

## 📊 Release 히스토리

최근 릴리스:

- **v1.5.7** (2025-01-26) - Server component detection, Smart data source tracking
- **v1.5.6** (2025-01-21) - Empty string filter
- **v1.5.5** (2025-01-21) - Force mode for upload & extractor

전체 히스토리: [CHANGELOG.md](./CHANGELOG.md)

## 🎯 Next Steps After Release

1. **공지**
   - GitHub Release 노트 확인
   - 팀에 새 버전 공지
2. **모니터링**
   - npm 다운로드 수 확인
   - GitHub Issues 모니터링
3. **문서 업데이트**
   - 필요시 블로그 포스트 작성
   - 예제 업데이트

---

## 📞 도움이 필요하신가요?

- 배포 관련 상세 가이드: [.github/DEPLOYMENT_SETUP.md](./.github/DEPLOYMENT_SETUP.md)
- GitHub Issues: [이슈 등록](https://github.com/manNomi/i18nexus/issues)
