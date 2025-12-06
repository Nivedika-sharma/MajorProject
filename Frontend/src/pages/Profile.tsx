import { useState, useEffect } from 'react';
import { User, Mail, Phone, Clock, Briefcase, Building, Shield, Activity, Edit2, Save, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Department } from '../types/database';

export default function Profile() {
  const { profile } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'permissions' | 'activity'>('personal');
  const [formData, setFormData] = useState({
    full_name: '',
    designation: '',
    contact: '',
    working_hours: '',
    responsibilities: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        designation: profile.designation,
        contact: profile.contact,
        working_hours: profile.working_hours,
        responsibilities: profile.responsibilities
      });

      if (profile.department_id) {
        loadDepartment(profile.department_id);
      }
    }
  }, [profile]);

  const loadDepartment = async (deptId: string) => {
    const { data } = await supabase
      .from('departments')
      .select('*')
      .eq('id', deptId)
      .maybeSingle();

    if (data) setDepartment(data);
  };

  const handleSave = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        designation: formData.designation,
        contact: formData.contact,
        working_hours: formData.working_hours,
        responsibilities: formData.responsibilities,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (!error) {
      setIsEditing(false);
      window.location.reload();
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        designation: profile.designation,
        contact: profile.contact,
        working_hours: profile.working_hours,
        responsibilities: profile.responsibilities
      });
    }
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>

            <div className="px-8 pb-8">
              <div className="flex items-end justify-between -mt-16 mb-6">
                <div className="flex items-end space-x-4">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                    <p className="text-gray-600">{profile.designation || 'User'}</p>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  {(['personal', 'permissions', 'activity'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab === 'personal' && 'Personal Info'}
                      {tab === 'permissions' && 'Permissions & Roles'}
                      {tab === 'activity' && 'Activity Log'}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'personal' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Full Name</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                    </label>
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Designation</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.designation || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>Department</span>
                      </div>
                    </label>
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                      {department?.name || 'Not assigned'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Contact Number</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.contact || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Working Hours</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.working_hours}
                        onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.working_hours}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Employee ID</span>
                      </div>
                    </label>
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">{profile.employee_id || 'Not assigned'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>Last Login</span>
                      </div>
                    </label>
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                      {new Date(profile.last_login).toLocaleString()}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Assigned Responsibilities</span>
                      </div>
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.responsibilities}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {profile.responsibilities || 'No responsibilities assigned'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">User Permissions</h3>
                        <p className="text-sm text-blue-800">
                          Your current role grants you access to documents within your department and any documents explicitly shared with you.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">View Documents</p>
                        <p className="text-sm text-gray-600">Access and read documents</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Enabled
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Upload Documents</p>
                        <p className="text-sm text-gray-600">Create and upload new documents</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Enabled
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Share Documents</p>
                        <p className="text-sm text-gray-600">Share documents with other users</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Enabled
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Logged into the system</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(profile.last_login).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Profile created</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(profile.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
