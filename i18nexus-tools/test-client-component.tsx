"use client";
import { useTranslation } from "i18nexus";
import React from "react";

const CLIENT_NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/about", label: "소개" },
];

// 클라이언트 컴포넌트 - useTranslation 훅이 추가되어야 함
export default function ClientComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("클라이언트 컴포넌트 테스트")}</h1>

      {/* 정적 상수 사용 */}
      <nav>
        {CLIENT_NAV_ITEMS.map((item) => (
          <a key={item.path} href={item.path}>
            {t(item.label)}
          </a>
        ))}
      </nav>

      <p>{t("이것은 클라이언트에서 렌더링됩니다")}</p>
    </div>
  );
}
