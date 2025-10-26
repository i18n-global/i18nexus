import { useTranslation } from "i18nexus";
import React from "react";

const USER_INFO = {
  name: "홍길동",
  age: 25,
};

export default function InterpolationTest() {
  const { t } = useTranslation();
  const count = 5;
  const userName = t("김철수");

  return (
    <div>
      {/* 케이스 1: 단순 변수 */}
      <h1>{t("환영합니다 {{userName}}님", { userName: userName })}</h1>

      {/* 케이스 2: 숫자 변수 */}
      <p>{t("총 {{count}}개의 항목이 있습니다", { count: count })}</p>

      {/* 케이스 3: 객체 속성 접근 */}
      <p>
        {t("이름: {{USER_INFO_name}}, 나이: {{USER_INFO_age}}세", {
          USER_INFO_name: USER_INFO.name,
          USER_INFO_age: USER_INFO.age,
        })}
      </p>

      {/* 케이스 4: 여러 변수 */}
      <p>
        {t("{{userName}}님, {{count}}개의 메시지가 있습니다", {
          userName: userName,
          count: count,
        })}
      </p>

      {/* 케이스 5: 표현식 없는 템플릿 리터럴 */}
      <p>{t("단순 문자열")}</p>

      {/* 케이스 6: 복잡한 표현식 */}
      <p>{t("결과: {{expr0}}개", { expr0: count * 2 })}</p>
    </div>
  );
}
