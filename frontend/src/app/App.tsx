import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { AuthProvider } from "@/shared/auth/AuthContext";
import { I18nProvider } from "@/shared/i18n/I18nContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <div style={{ height: "100vh", overflow: "hidden", fontFamily: "var(--font-inter)" }}>
            <AppRoutes />
          </div>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
