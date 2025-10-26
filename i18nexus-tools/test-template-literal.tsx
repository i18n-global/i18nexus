import { useTranslation } from "i18nexus";
import React from "react";

const USER_INFO = {
  name: "홍길동",
  role: "관리자",
};

const GREETING = "안녕하세요";

export default function TemplateLiteralTest() {
  const { t } = useTranslation();
  const count = 5;

  return (
    <div>
      {/* 케이스 1: 템플릿 리터럴 내 한국어 문자열 */}
      <h1>{t(`환영합니다`)}</h1>

      {/* 케이스 2: 템플릿 리터럴 + 변수 */}
      <h2>{t(`사용자: ${count}명`)}</h2>

      {/* 케이스 3: 템플릿 리터럴 내 상수 접근 */}
      <p>{t(`이름: ${USER_INFO.name}`)}</p>
      <p>{t(`역할: ${USER_INFO.role}`)}</p>

      {/* 케이스 4: 템플릿 리터럴 내 상수 변수 */}
      <p>{t(`${GREETING}, 반갑습니다`)}</p>

      {/* 케이스 5: 복잡한 템플릿 리터럴 */}
      <p>{t(`총 ${count}개의 항목이 있습니다`)}</p>

      {/* 케이스 6: 멀티라인 템플릿 리터럴 */}
      <pre>
        {t(`
        첫 번째 줄
        두 번째 줄
        세 번째 줄
      `)}
      </pre>
    </div>
  );
}
