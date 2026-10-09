import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { AuthProvider } from "@/shared/auth/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ height: "100vh", overflow: "hidden", fontFamily: "var(--font-inter)" }}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
