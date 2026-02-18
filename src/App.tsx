import { Routes, Route } from "react-router-dom";
import Shell from "./components/layout/Shell";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsagePage from "./pages/UsagePage";
import ModelsPage from "./pages/ModelsPage";
import SessionsPage from "./pages/SessionsPage";
import BlocksPage from "./pages/BlocksPage";
import LivePage from "./pages/LivePage";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="usage" element={<UsagePage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="blocks" element={<BlocksPage />} />
        <Route path="live" element={<LivePage />} />
      </Route>
    </Routes>
  );
}
