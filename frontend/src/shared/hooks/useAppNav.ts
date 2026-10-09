import { useNavigate } from "react-router-dom";
import type { NavKey } from "@/shared/ui";
import { ROUTES } from "@/shared/nav";

export function useAppNav() {
  const navigate = useNavigate();
  return (key: NavKey) => {
    navigate(ROUTES[key] ?? "/dashboard");
  };
}
