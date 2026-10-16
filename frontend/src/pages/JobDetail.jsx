import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import API from "../api";
import toast from "react-hot-toast";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { Brain, Upload, ArrowLeft, Star, StarOff, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

function ScoreRing({ score, label, color }) {
  const data = [{ value: score, fill: color }, { value: 100 - score, fill: "transparent" }];
  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
            startAngle={90} endAngle={-270} data={data} barSize={8}>
            <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#1f2937" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{Math.round(score)}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function CandidateCard({ candidate, rank, onShortlist }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = candidate.match_score >= 70 ? "text-green-400" : candidate.match_score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg = candidate.match_score >= 70 ? "bg-green-500" : candidate.match_score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`bg-gray-900 rounded-2xl border transition-all ${candidate.is_shortlisted ? "border-green-500/50" : "border-gray-800"}`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${scoreBg}`}>
              #{rank}
            </div>
            <div>
              <h3 className="font-semibold text-white">{candidate.candidate_name}</h3>
              <p className="text-gray-400 text-xs">{candidate.candidate_email || candidate.original_filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${scoreColor}`}>{Math.round(candidate.match_score)}%</div>
            <button onClick={() => onShortlist(candidate.id)}
              className={`p-2 rounded-lg transition ${candidate.is_shortlisted ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-500 hover:text-yellow-400"}`}>
              {candidate.is_shortlisted ? <CheckCircle2 className="w-5 h-5" /> : <Star className="w-5 h-5" />}
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-2 text-gray-400 hover:text-white">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Score Rings */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <ScoreRing score={candidate.skill_score} label="Skills" color="#3b82f6" />
          <ScoreRing score={candidate.experience_score} label="Experience" color="#8b5cf6" />
          <ScoreRing score={candidate.keyword_score} label="Keywords" color="#10b981" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(candidate.extracted_skills || []).slice(0, 6).map(s => (
            <span key={s} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-800 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Education</p>
              <p className="text-white text-sm font-medium">{candidate.extracted_education}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Experience</p>
              <p className="text-white text-sm font-medium">{candidate.extracted_experience} years</p>
            </div>
          </div>

          {candidate.missing_skills?.length > 0 && (
            <div>
              <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Missing Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.missing_skills.map(s => (
                  <span key={s} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {candidate.improvement_suggestions?.length > 0 && (
            <div>
              <p className="text-xs text-yellow-400 font-medium mb-2">💡 AI Suggestions</p>
              <ul className="space-y-1.5">
                {candidate.improvement_suggestions.map((s, i) => (
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
  );
}

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchJob();
    fetchCandidates();
  }, [jobId]);

  const fetchJob = async () => {
    try { const r = await API.get(`/jobs/${jobId}`); setJob(r.data); } catch {}
  };

  const fetchCandidates = async () => {
    try { const r = await API.get(`/resumes/job/${jobId}`); setCandidates(r.data); } catch {}
  };

  const onDrop = useCallback(async (files) => {
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        await API.post(`/resumes/upload/${jobId}`, fd);
        toast.success(`${file.name} analyzed! ✅`);
      } catch (err) {
        toast.error(`${file.name}: ${err.response?.data?.detail || "Failed"}`);
      }
    }
    fetchCandidates();
    setUploading(false);
  }, [jobId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    multiple: true
  });

  const toggleShortlist = async (id) => {
    await API.patch(`/resumes/${id}/shortlist`);
    fetchCandidates();
  };

  const shortlisted = candidates.filter(c => c.is_shortlisted);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Brain className="text-blue-400 w-6 h-6" />
        <span className="font-bold">HireLens <span className="text-blue-400">AI</span></span>
        {job && <span className="text-gray-400">/ {job.title}</span>}
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {job && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
            <h1 className="text-xl font-bold">{job.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{job.company} • {job.experience_required} exp • {job.education_required}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(job.required_skills || "").split(",").filter(Boolean).map(s => (
                <span key={s} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition mb-6
            ${isDragActive ? "border-blue-400 bg-blue-500/10" : "border-gray-700 hover:border-blue-500/50"}`}>
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          {uploading ? (
            <p className="text-blue-400 font-medium animate-pulse">🤖 AI is analyzing resumes...</p>
          ) : (
            <>
              <p className="text-white font-medium">Drop resumes here or click to upload</p>
              <p className="text-gray-500 text-sm mt-1">Supports PDF & DOCX • Multiple files allowed</p>
            </>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Applied", value: candidates.length, color: "blue" },
            { label: "Shortlisted", value: shortlisted.length, color: "green" },
            { label: "Avg. Match", value: candidates.length ? Math.round(candidates.reduce((a, c) => a + c.match_score, 0) / candidates.length) + "%" : "—", color: "purple" },
          ].map(s => (
            <div key={s.label} className={`bg-gray-900 rounded-xl border border-gray-800 p-4 text-center`}>
              <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Candidate List */}
        <h2 className="text-lg font-semibold mb-4">
          Candidates <span className="text-gray-500 text-base font-normal">(ranked by AI score)</span>
        </h2>
        {candidates.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800 border-dashed">
            <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No resumes uploaded yet.</p>
            <p className="text-gray-500 text-sm">Upload resumes above to start AI screening</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} rank={i + 1} onShortlist={toggleShortlist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
