import { useTranslation } from "i18nexus";import React, { useState, useEffect } from "react";

// 정적 상수 - 처리되어야 함
const STATIC_ITEMS = [
{ id: 1, label: "정적 항목 1" },
{ id: 2, label: "정적 항목 2" }];


export default function TestApiComponent() {const { t } = useTranslation();
  // API 데이터 - 처리되면 안됨 (useState)
  const [apiItems, setApiItems] = useState([]);

  // API 데이터 - 처리되면 안됨 (useEffect 내부)
  useEffect(() => {
    const fetchedData = [
    { id: 1, label: t("API 항목 1") },
    { id: 2, label: t("API 항목 2") }];

    setApiItems(fetchedData);
  }, []);

  // let 변수 - 처리되면 안됨 (동적)
  let dynamicItems = [
  { id: 1, label: t("동적 항목 1") },
  { id: 2, label: t("동적 항목 2") }];


  // fetch로 가져온 데이터 - 처리되면 안됨
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users").
    then((res) => res.json()).
    then((data) => setUsers(data));
  }, []);

  return (
    <div>
      <h1>{t("API 데이터 테스트")}</h1>

      {/* 정적 상수 - t()로 래핑되어야 함 */}
      <section>
        <h2>{t("정적 상수")}</h2>
        {STATIC_ITEMS.map((item) =>
        <div key={item.id}>{t(item.label)}</div>
        )}
      </section>

      {/* API 데이터 - t()로 래핑되면 안됨 */}
      <section>
        <h2>{t("API 데이터 (useState)")}</h2>
        {apiItems.map((item: any) =>
        <div key={item.id}>{item.label}</div>
        )}
      </section>

      {/* 동적 데이터 - t()로 래핑되면 안됨 */}
      <section>
        <h2>{t("동적 데이터 (let)")}</h2>
        {dynamicItems.map((item) =>
        <div key={item.id}>{item.label}</div>
        )}
      </section>

      {/* fetch 데이터 - t()로 래핑되면 안됨 */}
      <section>
        <h2>{t("Fetch 데이터")}</h2>
        {users.map((user: any) =>
        <div key={user.id}>{user.label}</div>
        )}
      </section>
    </div>);

}