import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PatientInfoPage from "@/pages/screening/PatientInfoPage";
import ImageUploadPage from "@/pages/screening/ImageUploadPage";
import WorkflowPage from "@/pages/screening/WorkflowPage";
import QualityPage from "@/pages/screening/QualityPage";
import AIAnalysisPage from "@/pages/screening/AIAnalysisPage";
import ResultsPage from "@/pages/screening/ResultsPage";
import GradCamPage from "@/pages/screening/GradCamPage";
import ModelComparePage from "@/pages/screening/ModelComparePage";
import ReviewPage from "@/pages/screening/ReviewPage";
import ClinicalReportPage from "@/pages/reports/ClinicalReportPage";
import PatientRecordsPage from "@/pages/patients/PatientRecordsPage";
import PatientProfilePage from "@/pages/patients/PatientProfilePage";
import ScreeningHistoryPage from "@/pages/screenings/ScreeningHistoryPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import ModelPerformancePage from "@/pages/analytics/ModelPerformancePage";
import QualityAnalyticsPage from "@/pages/analytics/QualityAnalyticsPage";
import CentersPage from "@/pages/centers/CentersPage";
import DevicesPage from "@/pages/devices/DevicesPage";
import OperationsPage from "@/pages/settings/OperationsPage";
import UsersPage from "@/pages/admin/UsersPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import ErrorStatesPage from "@/pages/system/ErrorStatesPage";
import EmptyStatesPage from "@/pages/system/EmptyStatesPage";
import ReferralPage from "@/pages/screening/ReferralPage";
import { guard } from "@/shared/auth/RequireAuth";
import { getToken } from "@/shared/api/auth";

function LoginRoute() {
  if (getToken()) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

/** Keep old URLs working but skip removed mock-heavy screens. */
function RedirectTo({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />

      <Route path="/dashboard" element={guard(<DashboardPage />)} />
      <Route path="/screening/new" element={guard(<PatientInfoPage />)} />
      <Route path="/screening/upload" element={guard(<ImageUploadPage />)} />
      <Route path="/screening/workflow" element={guard(<WorkflowPage />)} />
      <Route path="/screening/quality" element={guard(<QualityPage />)} />
      {/* Removed from primary flow — redirect */}
      <Route path="/screening/enhancement" element={guard(<RedirectTo to="/screening/ai-analysis" />)} />
      <Route path="/screening/ai" element={guard(<RedirectTo to="/screening/ai-analysis" />)} />
      <Route path="/screening/ai-analysis" element={guard(<AIAnalysisPage />)} />
      <Route path="/screening/structure" element={guard(<RedirectTo to="/screening/results" />)} />
      <Route path="/screening/lesions" element={guard(<RedirectTo to="/screening/results" />)} />
      <Route path="/screening/results" element={guard(<ResultsPage />)} />
      <Route path="/screening/grad-cam" element={guard(<RedirectTo to="/screening/gradcam" />)} />
      <Route path="/screening/gradcam" element={guard(<GradCamPage />)} />
      <Route path="/screening/lesion-evidence" element={guard(<RedirectTo to="/screening/model-compare" />)} />
      <Route path="/screening/model-compare" element={guard(<ModelComparePage />)} />
      <Route path="/screening/evidence-summary" element={guard(<RedirectTo to="/screening/review" />)} />
      <Route path="/screening/review" element={guard(<ReviewPage />)} />
      <Route path="/screening/referral" element={guard(<ReferralPage />)} />
      <Route path="/reports/clinical" element={guard(<ClinicalReportPage />)} />
      <Route path="/reports" element={guard(<ReportsPage />)} />
      <Route path="/patients" element={guard(<PatientRecordsPage />)} />
      <Route path="/patients/profile" element={guard(<PatientProfilePage />)} />
      <Route path="/screenings" element={guard(<ScreeningHistoryPage />)} />
      <Route path="/analytics" element={guard(<AnalyticsPage />)} />
      <Route path="/analytics/models" element={guard(<ModelPerformancePage />)} />
      <Route path="/analytics/quality" element={guard(<QualityAnalyticsPage />)} />
      <Route path="/simulation" element={guard(<RedirectTo to="/dashboard" />)} />
      <Route path="/simulation/resources" element={guard(<RedirectTo to="/dashboard" />)} />
      <Route path="/centers" element={guard(<CentersPage />)} />
      <Route path="/devices" element={guard(<DevicesPage />)} />
      <Route path="/settings/operations" element={guard(<OperationsPage />)} />
      <Route path="/settings" element={guard(<SettingsPage />)} />
      <Route path="/users" element={guard(<UsersPage />)} />
      <Route path="/notifications" element={guard(<NotificationsPage />)} />
      <Route path="/help" element={guard(<HelpPage />)} />
      <Route path="/system/errors" element={guard(<ErrorStatesPage />)} />
      <Route path="/system/empty" element={guard(<EmptyStatesPage />)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
