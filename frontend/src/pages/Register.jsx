import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { Brain, Mail, Lock, User, Building2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "recruiter" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/register", form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      toast.success(`Welcome, ${res.data.name}! 🎉`);
      navigate(res.data.role === "recruiter" ? "/dashboard" : "/candidate");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="text-blue-400 w-10 h-10" />
            <span className="text-3xl font-bold text-white">HireLens <span className="text-blue-400">AI</span></span>
          </div>
          <p className="text-blue-300 text-sm">Create your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/20">
              {["recruiter", "candidate"].map((r) => (
                <button key={r} type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all
                    ${form.role === r ? "bg-blue-500 text-white" : "text-blue-200 hover:bg-white/10"}`}>
                  {r === "recruiter" ? "👔 Recruiter" : "👤 Candidate"}
                </button>
              ))}
            </div>

            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
              <input type="text" placeholder="Full Name" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3
                  text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
              <input type="email" placeholder="Email Address" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3
                  text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
              <input type="password" placeholder="Password" required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3
                  text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl
                transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {loading ? "Creating Account..." : "Create Account 🚀"}
            </button>
          </form>

          <p className="text-center text-blue-300 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
