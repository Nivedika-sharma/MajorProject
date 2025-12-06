import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  Scale,
  Briefcase,
  ShoppingCart
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Compliance Calendar', path: '/calendar' },
    { icon: FileText, label: 'Recent Documents', path: '/dashboard' },
  ];

  const departmentItems = [
    { icon: Users, label: 'HR', path: '/department/hr', color: '#10B981' },
    { icon: DollarSign, label: 'Finance', path: '/department/finance', color: '#3B82F6' },
    { icon: Scale, label: 'Legal', path: '/department/legal', color: '#8B5CF6' },
    { icon: Briefcase, label: 'Admin', path: '/department/admin', color: '#F59E0B' },
    { icon: ShoppingCart, label: 'Procurement', path: '/department/procurement', color: '#EF4444' },
  ];

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } flex flex-col h-[calc(100vh-73px)] sticky top-[73px]`}
    >
      <div className="p-4 border-b border-gray-200">
        {!collapsed && profile && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{profile.designation || 'User'}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {!collapsed && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Departments
            </h3>
          </div>
        )}

        <div className="space-y-1">
          {departmentItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
