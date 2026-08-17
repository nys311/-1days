import React from "react";
import { useTheme } from "./ThemeProvider";
import "./ThemeSwitcher.css";

export const ThemeSwitcher: React.FC = () => {
  const { themeId, setThemeId, available } = useTheme();
  return (
    <div className="theme-switcher">
      <label htmlFor="theme-select" className="theme-switcher__label">
        Giao diện
      </label>
      <select
        id="theme-select"
        className="theme-switcher__select"
        value={themeId}
        onChange={(e) => setThemeId(e.target.value)}
      >
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
};
