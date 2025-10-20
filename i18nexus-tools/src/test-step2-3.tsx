import { useTranslation } from "i18nexus";import React from "react";
import { users, products, MENU_ITEMS } from "./external-constants";

export default function Step23Test() {const { t } = useTranslation();
  return (
    <div>
      <h1>{t("Step 2&3 테스트 - 외부 파일 Import")}</h1>
      
      {users.map((user) =>
      <div key={user.id}>{t(user.name)}</div>
      )}

      {products.map((product) =>
      <div key={product.id}>{product.title}</div>
      )}

      {MENU_ITEMS.map((menu) =>
      <button key={menu.path}>{t(menu.label)}</button>
      )}
    </div>);

}