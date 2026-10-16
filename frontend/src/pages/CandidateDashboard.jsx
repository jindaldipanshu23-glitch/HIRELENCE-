import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import API from "../api";
import toast from "react-hot-toast";
import { Brain, Upload, LogOut, CheckCircle, XCircle, Lightbulb, Repeat } from "lucide-react";

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-semibold text-${color}-400`}>{Math.round(score)}%</span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobsLoaded, setJobsLoaded] = useState(false);

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

  const loadJobs = async () => {
    if (jobsLoaded) return;
    try {
      const r = await API.get("/jobs/");
      setJobs(r.data);
      setJobsLoaded(true);
    } catch { toast.error("Failed to load jobs"); }
  };

  const onDrop = useCallback(async (files) => {
    if (!selectedJob) { toast.error("Please select a job first!"); return; }
    const file = files[0];
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    setResult(null);
    try {
      const r = await API.post(`/resumes/upload/${selectedJob.id}`, fd);
      setResult(r.data);
      toast.success("Resume analyzed! 🤖");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed");
    } finally { setUploading(false); }
  }, [selectedJob]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple: false,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }
  });

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const overallColor = result?.match_score >= 70 ? "green" : result?.match_score >= 40 ? "yellow" : "red";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-400 w-7 h-7" />
          <span className="text-xl font-bold">HireLens <span className="text-blue-400">AI</span></span>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full ml-2">Candidate Mode</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👋 {name}</span>
          <button onClick={handleSwitchRole}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 hover:text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 transition">
            <Repeat className="w-3.5 h-3.5" /> Switch to Recruiter
          </button>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-1 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Check Resume Match</h1>
        <p className="text-gray-400 text-sm mb-8">Upload your resume against a job to get AI-powered feedback & score</p>

        {/* Step 1: Select Job */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
          <h2 className="font-semibold mb-3">Step 1: Select a Job</h2>
          {!jobsLoaded ? (
            <button onClick={loadJobs}
              className="w-full border border-dashed border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400 py-3 rounded-xl transition text-sm">
              Click to load available jobs →
            </button>
          ) : jobs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No jobs available yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map(job => (
                <button key={job.id} onClick={() => { setSelectedJob(job); setResult(null); }}
                  className={`w-full text-left p-3 rounded-xl border transition ${selectedJob?.id === job.id ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"}`}>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-gray-500 text-xs">{job.company}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Upload Resume */}
        {selectedJob && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4">
            <h2 className="font-semibold mb-3">Step 2: Upload Your Resume</h2>
            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                ${isDragActive ? "border-blue-400 bg-blue-500/10" : "border-gray-700 hover:border-blue-500/50"}`}>
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              {uploading ? (
                <p className="text-blue-400 animate-pulse font-medium">🤖 AI analyzing your resume...</p>
              ) : (
                <>
                  <p className="text-white font-medium text-sm">Drop your resume here or click to upload</p>
                  <p className="text-gray-500 text-xs mt-1">PDF or DOCX</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {result && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Step 3: Your AI Analysis</h2>
              <div className={`text-3xl font-bold text-${overallColor}-400`}>
                {Math.round(result.match_score)}% Match
              </div>
            </div>

            {/* Score Bars */}
            <div className="space-y-3">
              <ScoreBar label="Skill Match" score={result.skill_score} color="blue" />
              <ScoreBar label="Experience Match" score={result.experience_score} color="purple" />
              <ScoreBar label="Keyword Match" score={result.keyword_score} color="green" />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400">Detected Education</p>
                <p className="font-medium text-sm mt-0.5">{result.extracted_education}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400">Detected Skills</p>
                <p className="font-medium text-sm mt-0.5">{result.extracted_skills?.length || 0} found</p>
              </div>
            </div>

            {/* Missing Skills */}
            {result.missing_skills?.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-medium flex items-center gap-1 mb-2">
                  <XCircle className="w-3.5 h-3.5" /> Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_skills.map(s => (
                    <span key={s} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Skills */}
            {result.matched_skills?.length > 0 && (
              <div>
                <p className="text-xs text-green-400 font-medium flex items-center gap-1 mb-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Matched Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_skills.map(s => (
                    <span key={s} className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {result.improvement_suggestions?.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-xs text-yellow-400 font-medium flex items-center gap-1 mb-2">
                  <Lightbulb className="w-3.5 h-3.5" /> AI Improvement Suggestions
                </p>
                <ul className="space-y-1.5">
                  {result.improvement_suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
