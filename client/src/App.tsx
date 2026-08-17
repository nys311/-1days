import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./theme";
import { LobbyPage } from "./pages/Lobby";
import { TablePage } from "./pages/Table";
import { RulesPage } from "./pages/Rules";
import { ErrorToast } from "./components/ErrorToast";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorToast />
        <Routes>
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/table" element={<TablePage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};
