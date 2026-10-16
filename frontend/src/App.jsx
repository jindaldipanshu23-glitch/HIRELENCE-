import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobDetail from "./pages/JobDetail";

function PrivateRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" }
      }} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><RecruiterDashboard /></PrivateRoute>} />
        <Route path="/candidate" element={<PrivateRoute><CandidateDashboard /></PrivateRoute>} />
        <Route path="/job/:jobId" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
