import { useTranslation } from "i18nexus";import React from "react";

// 케이스 1: ALL_CAPS 상수 (기본 처리)
const NAV_ITEMS = [
{ path: "/home", label: "홈" },
{ path: "/about", label: "소개" }];


// 케이스 2: users (소문자, 처리되면 안됨)
const users = [
{ id: 1, name: "사용자1" },
{ id: 2, name: "사용자2" }];


// 케이스 3: API_CONFIG (패턴에 따라 제어 가능)
const API_CONFIG = {
  title: "API 설정",
  apiKey: "한글키"
};

export default function WrapperDebugTest() {const { t } = useTranslation();
  return (
    <div>
      <h1>{t("래퍼 디버그 테스트")}</h1>
      
      {/* NAV_ITEMS - 처리되어야 함 */}
      {NAV_ITEMS.map((item) =>
      <button key={item.path}>{t(item.label)}</button>
      )}

      {/* users - 처리되면 안됨 (소문자) */}
      {users.map((user) =>
      <div key={user.id}>{t(user.name)}</div>
      )}

      {/* API_CONFIG - 패턴 설정에 따라 */}
      <h2>{t(API_CONFIG.title)}</h2>
      <p>{API_CONFIG.apiKey}</p>
    </div>);

}