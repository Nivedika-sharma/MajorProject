import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Users,
  DollarSign,
  Scale,
  Briefcase,
  ShoppingCart,
  Menu,
  X
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
      className={`bg-blue-200 border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } flex flex-col h-[calc(100vh-73px)] sticky top-[73px]`}
    >
      {/* TOP SECTION WITH PROFILE + HAMBURGER */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">

        {/* Profile Section */}
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{profile?.full_name}</p>
              {/* <p className="text-sm text-gray-500">{profile?.designation || "User"}</p> */}
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
              {profile?.full_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Collapse / Expand Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </button>
      </div>

      {/* NAVIGATION SECTION */}
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

        {/* Departments Heading */}
        {!collapsed && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Departments
            </h3>
          </div>
        )}

        {/* Department Items */}
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

        {/* Settings */}
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
