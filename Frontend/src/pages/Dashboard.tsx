import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  RefreshCw,
  Eye,
  Share2,
  Bookmark,
  Clock,
  AlertCircle,
  Users,
  DollarSign,
  Scale,
  Briefcase,
  ShoppingCart,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";

interface Department {
  id: string;
  name: string;
  color: string;
}

interface DocumentWithDetails {
  id: string;
  title: string;
  summary: string;
  urgency: "high" | "medium" | "low";
  department_id: string;
  department?: Department;
  uploaded_by?: { full_name: string };
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: any = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const [docsRes, deptRes] = await Promise.all([
        authFetch(`${API_URL}/documents`),
        authFetch(`${API_URL}/departments`),
      ]);

      const docs = await docsRes.json();
      const depts = await deptRes.json();

      if (docsRes.ok) setDocuments(docs);
      if (deptRes.ok) setDepartments(depts);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }

    setLoading(false);
  };

  const getDepartmentIcon = (name: string) => {
    const icons: Record<string, typeof Users> = {
      HR: Users,
      Finance: DollarSign,
      Legal: Scale,
      Admin: Briefcase,
      Procurement: ShoppingCart,
    };
    return icons[name] || Briefcase;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[urgency as keyof typeof colors] || colors.medium;
  };

  const filteredDocuments = selectedDepartment
    ? documents.filter((doc) => doc.department_id === selectedDepartment)
    : documents;

  const recentDocuments = filteredDocuments.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name}!</p>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
            <div className="flex space-x-2">
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => navigate("/upload")}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-4 min-w-max">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="relative bg-white border border-gray-200 rounded-lg p-5 w-80 cursor-pointer hover:shadow-lg transition-all flex-shrink-0"
                    onMouseEnter={() => setHoveredDoc(doc.id)}
                    onMouseLeave={() => setHoveredDoc(null)}
                    onClick={() => navigate(`/document/${doc.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
                        {doc.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(
                          doc.urgency
                        )}`}
                      >
                        {doc.urgency}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {doc.summary || "No summary available"}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>

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

                    {/* Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/document/${doc.id}`);
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hover popup */}
                    {hoveredDoc === doc.id && (
                      <div className="absolute -top-2 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-10 transform -translate-y-full">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">{doc.summary}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Uploaded by: {doc.uploaded_by?.full_name || "Unknown"}
                          </span>
                          <span
                            className={`px-2 py-1 rounded border ${getUrgencyColor(
                              doc.urgency
                            )}`}
                          >
                            {doc.urgency}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Department-wise circle layout */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Department-wise Documents
          </h2>

          <div className="flex items-center justify-center mb-8">
            <div className="relative w-full max-w-2xl aspect-square">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Select a department</p>
                  {selectedDepartment && (
                    <button
                      onClick={() => setSelectedDepartment(null)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                {departments.map((dept, index) => {
                  const Icon = getDepartmentIcon(dept.name);
                  const angle = (index / departments.length) * 2 * Math.PI - Math.PI / 2;
                  const radius = 180;

                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <button
                      key={dept.id}
                      onClick={() =>
                        setSelectedDepartment(
                          selectedDepartment === dept.id ? null : dept.id
                        )
                      }
                      className={`absolute w-28 h-28 rounded-full shadow-lg transition-all hover:scale-110 flex flex-col items-center justify-center space-y-2 ${
                        selectedDepartment === dept.id
                          ? "ring-4 ring-offset-2 scale-110"
                          : ""
                      }`}
                      style={{
                        backgroundColor: dept.color,
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                      <span className="text-white text-sm font-medium">{dept.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedDepartment && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {departments.find((d) => d.id === selectedDepartment)?.name} Documents
              </h3>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No documents found for this department</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/document/${doc.id}`)}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {doc.summary}
                      </p>

                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(
                            doc.urgency
                          )}`}
                        >
                          {doc.urgency}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
