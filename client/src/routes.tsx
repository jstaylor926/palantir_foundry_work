import { Routes, Route, Navigate } from "react-router-dom";
import Inbox from "./pages/Inbox";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import Gates from "./pages/Gates";
import Models from "./pages/Models";

export default function RoutesView() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/gates" element={<Gates />} />
            <Route path="/models" element={<Models />} />
        </Routes>
    );
}
