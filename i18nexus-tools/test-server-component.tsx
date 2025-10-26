import React from "react";
import { getServerTranslation } from "i18nexus";

const SERVER_NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/about", label: "소개" },
];

// 서버 컴포넌트 - useTranslation 훅이 추가되면 안됨
export default async function ServerComponent() {
  const { t } = await getServerTranslation();

  return (
    <div>
      <h1>{t("서버 컴포넌트 테스트")}</h1>

      {/* 정적 상수 사용 */}
      <nav>
        {SERVER_NAV_ITEMS.map((item) => (
          <a key={item.path} href={item.path}>
            {t(item.label)}
          </a>
        ))}
      </nav>

      <p>{t("이것은 서버에서 렌더링됩니다")}</p>
    </div>
  );
}
