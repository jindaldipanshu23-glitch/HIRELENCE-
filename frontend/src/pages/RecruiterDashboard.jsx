import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import toast from "react-hot-toast";
import { Brain, Plus, Briefcase, Users, LogOut, ChevronRight, Trash2, Repeat } from "lucide-react";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const [jobs, setJobs] = useState([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: "", company: "", description: "",
    required_skills: "", experience_required: "", education_required: "B.Tech"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await API.get("/jobs/");
      setJobs(res.data);
    } catch { toast.error("Failed to load jobs"); }
  };

  const handleSwitchRole = async () => {
    try {
      const res = await API.post("/auth/switch-role", {});
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      toast.success(`Switched to ${res.data.role} Mode! 🚀`);
      window.location.href = res.data.role === "recruiter" ? "/dashboard" : "/candidate";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to switch role");
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/jobs/", jobForm);
      toast.success("Job created! 🎉");
      setShowCreateJob(false);
      setJobForm({ title: "", company: "", description: "", required_skills: "", experience_required: "", education_required: "B.Tech" });
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create job");
    } finally { setLoading(false); }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    try {
      await API.delete(`/jobs/${id}`);
      toast.success("Job deleted");
      fetchJobs();
    } catch { toast.error("Failed to delete"); }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-400 w-7 h-7" />
          <span className="text-xl font-bold">HireLens <span className="text-blue-400">AI</span></span>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-2">Recruiter Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👋 {name}</span>
          <button onClick={handleSwitchRole}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 transition">
            <Repeat className="w-3.5 h-3.5" /> Switch to Candidate
          </button>
          <button onClick={logout} className="flex items-center gap-1 text-gray-400 hover:text-red-400 text-sm transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">{jobs.length} active job posting{jobs.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreateJob(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg">
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Jobs Posted", value: jobs.length, icon: Briefcase, color: "blue" },
            { label: "Total Applicants", value: jobs.reduce((a, _) => a, 0), icon: Users, color: "green" },
            { label: "Active Screenings", value: jobs.length, icon: Brain, color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Job List */}
        <h2 className="text-lg font-semibold mb-4">Your Job Postings</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No jobs posted yet.</p>
            <p className="text-gray-500 text-sm mt-1">Click "Post New Job" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center justify-between hover:border-blue-500/50 transition">
                <div>
                  <h3 className="font-semibold text-white">{job.title}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{job.company} • Exp: {job.experience_required} • Edu: {job.education_required}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(job.required_skills || "").split(",").filter(Boolean).slice(0, 4).map((skill) => (
                      <span key={skill} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{skill.trim()}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate(`/job/${job.id}`)}
                    className="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                    View Candidates <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteJob(job.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">📋 Post a New Job</h2>
            <form onSubmit={createJob} className="space-y-4">
              <input placeholder="Job Title *" required value={jobForm.title}
                onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Company Name" value={jobForm.company}
                onChange={e => setJobForm({ ...jobForm, company: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Job Description *" required rows={4} value={jobForm.description}
                onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <input placeholder="Required Skills (comma separated, e.g. Python, React, SQL)" value={jobForm.required_skills}
                onChange={e => setJobForm({ ...jobForm, required_skills: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Experience (e.g. 2 years)" value={jobForm.experience_required}
                  onChange={e => setJobForm({ ...jobForm, experience_required: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={jobForm.education_required}
                  onChange={e => setJobForm({ ...jobForm, education_required: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["10th","12th","B.Sc","BCA","B.Tech","MBA","M.Tech","M.Sc","PhD"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateJob(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
                  {loading ? "Posting..." : "Post Job 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
