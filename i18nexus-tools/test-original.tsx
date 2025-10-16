import { useTranslation } from "i18nexus";
import React from "react";

// 테스트: 상수 배열
const NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/about", label: "소개" },
];

// 테스트: 상수 객체
const BUTTON_CONFIG = {
  title: "저장하기",
  description: "변경사항을 저장합니다",
};

export default function TestOriginal() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("테스트")}</h1>

      {/* 케이스 1: 배열 맵핑 - item.label */}
      {NAV_ITEMS.map((item) => (
        <button key={item.path}>{t(item.label)}</button>
      ))}

      {/* 케이스 2: 직접 접근 - BUTTON_CONFIG.title */}
      <h2>{t(BUTTON_CONFIG.title)}</h2>
      <p>{t(BUTTON_CONFIG.description)}</p>
    </div>
  );
}
