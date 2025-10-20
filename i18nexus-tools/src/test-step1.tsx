import { useTranslation } from "i18nexus";import React from "react";

// 케이스 1: 소문자 변수 + 한국어 (처리되어야 함)
const users = [
{ id: 1, name: "사용자1" },
{ id: 2, name: "사용자2" }];


// 케이스 2: 소문자 변수 + 영어 (처리되면 안됨)
const items = [
{ id: 1, title: "Item 1" },
{ id: 2, title: "Item 2" }];


// 케이스 3: ALL_CAPS + 한국어 (처리되어야 함)
const NAV_ITEMS = [
{ path: "/home", label: "홈" }];


export default function Step1Test() {const { t } = useTranslation();
  return (
    <div>
      <h1>{t("Step 1 테스트")}</h1>
      
      {/* 한국어 있는 소문자 변수 - 처리되어야 함 */}
      {users.map((user) =>
      <div key={user.id}>{t(user.name)}</div>
      )}

      {/* 영어만 있는 소문자 변수 - 처리되면 안됨 */}
      {items.map((item) =>
      <div key={item.id}>{item.title}</div>
      )}

      {/* ALL_CAPS 한국어 - 처리되어야 함 */}
      {NAV_ITEMS.map((nav) =>
      <button key={nav.path}>{t(nav.label)}</button>
      )}
    </div>);

}