import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  RefreshCw,
  Clock,
  Users,
  DollarSign,
  Scale,
  Briefcase,
  ShoppingCart,
  Mail,
  Download,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";

interface Department {
  _id: string;
  name: string;
  color: string;
}

interface DocumentWithDetails {
  _id: string;
  title: string;
  summary: string;
  urgency: "high" | "medium" | "low";
  department_id: string;
  department?: Department;
  createdAt: string;
}

interface GmailFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  threadId: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: any = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers, credentials: "include" });
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [gmailFiles, setGmailFiles] = useState<GmailFile[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);

  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, deptRes] = await Promise.all([
        authFetch(`${API_URL}/documents`),
        authFetch(`${API_URL}/departments`),
      ]);

      const docsJson = await docsRes.json();
      const deptsJson = await deptRes.json();

      setDocuments(Array.isArray(docsJson) ? docsJson : docsJson.data || []);
      setDepartments(Array.isArray(deptsJson) ? deptsJson : deptsJson.data || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      setDocuments([]);
      setDepartments([]);
    }
    setLoading(false);
  };

  const loadGmailFiles = async () => {
    setGmailLoading(true);
    try {
      const res = await fetch(`${API_URL}/mail/files`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const files = await res.json();
      setGmailFiles(Array.isArray(files) ? files : files.data || []);
    } catch (e) {
      console.error("Gmail fetch error:", e);
      setGmailFiles([]);
    }
    setGmailLoading(false);
  };

  const getUrgencyColor = (u: string) =>
    ({
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    }[u] || "");

  const getDepartmentIcon = (name: string) => {
    const icons: any = {
      HR: Users,
      Finance: DollarSign,
      Legal: Scale,
      Admin: Briefcase,
      Procurement: ShoppingCart,
    };
    return icons[name] || Briefcase;
  };

  // ✅ Ensure filteredDocuments is always an array
  const filteredDocuments = Array.isArray(documents)
    ? selectedDepartment
      ? documents.filter((d) => d.department_id === selectedDepartment)
      : documents
    : [];

  const recentDocuments = filteredDocuments.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome back, {profile?.full_name}!</p>

        {/* Recent Documents */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Documents</h2>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={() => navigate("/upload")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : recentDocuments.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No documents available</p>
          ) : (
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {recentDocuments.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/document/${doc._id}`)}
                  className="border rounded-lg p-4 w-80 cursor-pointer hover:shadow-lg transition"
                >
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold line-clamp-2">{doc.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs border ${getUrgencyColor(doc.urgency)}`}>
                      {doc.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doc.summary}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {doc.department && (
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${doc.department.color}20`,
                          color: doc.department.color,
                        }}
                      >
                        {doc.department.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gmail Files */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" /> Gmail Attachments
            </h2>
            <button
              onClick={loadGmailFiles}
              className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Load Gmail
            </button>
          </div>

          {gmailLoading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : gmailFiles.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No Gmail files</p>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4">
              {gmailFiles.map((file) => (
                <div key={file.id} className="border p-4 rounded-lg w-80 hover:shadow-md">
                  <h3 className="font-semibold mb-2">{file.filename}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
                  </p>
                  <div className="flex justify-between">
                    <a
                      href={file.url}
                      target="_blank"
                      className="px-3 py-2 bg-blue-100 rounded-lg flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${file.threadId}`}
                      target="_blank"
                      className="p-2 bg-gray-100 rounded-lg"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Wheel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold mb-6">Department-wise Documents</h2>
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-full max-w-2xl aspect-square">
              {departments.map((dept, idx) => {
                const Icon = getDepartmentIcon(dept.name);
                const angle = (idx / departments.length) * 2 * Math.PI;
                const radius = 180;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <button
                    key={dept._id}
                    onClick={() => setSelectedDepartment(selectedDepartment === dept._id ? null : dept._id)}
                    className="absolute w-28 h-28 rounded-full flex flex-col items-center justify-center text-white hover:scale-110 transition-all"
                    style={{
                      backgroundColor: dept.color,
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDepartment && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {departments.find((d) => d._id === selectedDepartment)?.name} Documents
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-4 bg-gray-50 border rounded-lg cursor-pointer hover:shadow-md"
                    onClick={() => navigate(`/document/${doc._id}`)}
                  >
                    <h4 className="font-semibold mb-2 line-clamp-1">{doc.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doc.summary}</p>
                    <div className="flex justify-between text-xs">
                      <span className={`px-2 py-1 rounded border ${getUrgencyColor(doc.urgency)}`}>
                        {doc.urgency}
                      </span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
