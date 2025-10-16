import { useTranslation } from "i18nexus";
import React from "react";
import {
  EXTERNAL_NAV_ITEMS,
  ENGLISH_NAV_ITEMS,
  MIXED_MENU,
  ENGLISH_CONFIG,
  KOREAN_CONFIG } from
"../constants";

// 로컬 케이스: 영어 label (변환되면 안됨)
const LOCAL_ENGLISH_ITEMS = [
{ path: "/dashboard", label: "Dashboard" },
{ path: "/settings", label: "Settings" }];


// 로컬 케이스: 한국어 label (변환되어야 함)
const LOCAL_KOREAN_ITEMS = [
{ path: "/dashboard", label: "대시보드" },
{ path: "/settings", label: "설정" }];


export default function ExceptionTestComponent() {const { t } = useTranslation();
  return (
    <div>
      <h1>{t("예외 케이스 테스트")}</h1>

      {/* 예외 케이스 1: 외부 파일의 한국어 상수 */}
      <section>
        <h2>{t("외부 파일 - 한국어 label")}</h2>
        {EXTERNAL_NAV_ITEMS.map((item) =>
        <button key={item.path}>{t(item.label)}</button>
        )}
      </section>

      {/* 예외 케이스 2: 외부 파일의 영어 상수 */}
      <section>
        <h2>{t("외부 파일 - 영어 label (변환 안됨)")}</h2>
        {ENGLISH_NAV_ITEMS.map((item) =>
        <button key={item.path}>{t(item.label)}</button>
        )}
      </section>

      {/* 예외 케이스 3: 로컬 영어 상수 */}
      <section>
        <h2>{t("로컬 - 영어 label (변환 안됨)")}</h2>
        {LOCAL_ENGLISH_ITEMS.map((item) =>
        <button key={item.path}>{t(item.label)}</button>
        )}
      </section>

      {/* 예외 케이스 4: 로컬 한국어 상수 */}
      <section>
        <h2>{t("로컬 - 한국어 label (변환됨)")}</h2>
        {LOCAL_KOREAN_ITEMS.map((item) =>
        <button key={item.path}>{t(item.label)}</button>
        )}
      </section>

      {/* 예외 케이스 5: 혼합 (한국어 subtitle만) */}
      <section>
        <h2>{t("혼합 케이스")}</h2>
        {MIXED_MENU.map((item) =>
        <div key={item.id}>
            <h3>{t(item.title)}</h3>
            <p>{t(item.subtitle)}</p>
          </div>
        )}
      </section>

      {/* 예외 케이스 6: 영어 객체 */}
      <section>
        <h2>{t(ENGLISH_CONFIG.title)}</h2>
        <p>{t(ENGLISH_CONFIG.description)}</p>
      </section>

      {/* 예외 케이스 7: 한국어 객체 */}
      <section>
        <h2>{t(KOREAN_CONFIG.title)}</h2>
        <p>{t(KOREAN_CONFIG.description)}</p>
      </section>
    </div>);

}