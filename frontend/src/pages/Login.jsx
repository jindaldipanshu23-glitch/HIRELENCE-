import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { Brain, Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new URLSearchParams();
      data.append("username", form.username);
      data.append("password", form.password);
      const res = await API.post("/auth/login", data,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      toast.success(`Welcome back, ${res.data.name}!`);
      navigate(res.data.role === "recruiter" ? "/dashboard" : "/candidate");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="text-blue-400 w-10 h-10" />
            <span className="text-3xl font-bold text-white">HireLens <span className="text-blue-400">AI</span></span>
          </div>
          <p className="text-blue-300 text-sm">AI-Powered Recruitment Platform</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
          <h2 className="text-white text-xl font-bold mb-6 text-center">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
              <input type="email" placeholder="Email Address" required
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3
                  text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
              <input type="password" placeholder="Password" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3
                  text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl
                transition-all disabled:opacity-50 shadow-lg">
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <p className="text-center text-blue-300 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
