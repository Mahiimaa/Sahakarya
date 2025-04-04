import React, {useState} from 'react'
import Navbar from "../components/AdminNav";
import Topbar from "../components/AdminTop";
import { Save, AlertCircle, Bell, Shield, Database, Users, Clock, Mail } from 'lucide-react';

function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [siteName, setSiteName] = useState('Time Banking Platform');
  const [siteDescription, setSiteDescription] = useState('A platform for exchanging services using time credits');
  const [adminEmail, setAdminEmail] = useState('admin@timebanking.com');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [defaultTimeCredits, setDefaultTimeCredits] = useState(5);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  
  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className ="flex gap-4 font-poppins">
       <Navbar/>
       <div className="flex flex-col gap-4">
       <Topbar/>
       <div className="bg-screen p-4  border-none rounded-2xl">
       <h1 className="font-semi-bold text-h1 mb-6">Platform Settings</h1>
       <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
          {/* Settings Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            <button 
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'general' ? 'bg-p text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'notifications' ? 'bg-p text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button 
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'users' ? 'bg-p text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('users')}
            >
              User Settings
            </button>
            <button 
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'security' ? 'bg-p text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button 
              className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'system' ? 'bg-p text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('system')}
            >
              System
            </button>
          </div>
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-h2 font-semibold mb-4 flex items-center">
                  <Database className="mr-2 h-5 w-5" /> General Platform Settings
                </h2>
                <p className="text-gray-500 mb-6">Configure the basic information for your time banking platform.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border rounded-md" 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform Description</label>
                    <textarea 
                      className="w-full p-2 border rounded-md" 
                      rows="3"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Administrator Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 border rounded-md" 
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Platform Logo</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500">Logo</span>
                      </div>
                      <button className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-h2 font-semibold mb-4 flex items-center">
                  <Bell className="mr-2 h-5 w-5" /> Notification Settings
                </h2>
                <p className="text-gray-500 mb-6">Configure how notifications are sent to users and administrators.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Send email notifications for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={emailNotifications}
                        onChange={() => setEmailNotifications(!emailNotifications)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-p"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h3 className="font-medium">In-App Notifications</h3>
                      <p className="text-sm text-gray-500">Show notifications within the platform</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={systemNotifications}
                        onChange={() => setSystemNotifications(!systemNotifications)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-p"></div>
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Notification Templates</h3>
                    <select className="w-full p-2 border rounded-md">
                      <option>Welcome Email</option>
                      <option>Password Reset</option>
                      <option>Service Request</option>
                      <option>Service Completion</option>
                      <option>Dispute Notification</option>
                    </select>
                    <button className="mt-2 px-3 py-1 text-p border border-p rounded-md hover:bg-p hover:text-white">
                      Edit Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* User Settings */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-h2 font-semibold mb-4 flex items-center">
                  <Users className="mr-2 h-5 w-5" /> User Settings
                </h2>
                <p className="text-gray-500 mb-6">Configure the default settings for new and existing users.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Time Credits for New Users</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-md" 
                      value={defaultTimeCredits}
                      onChange={(e) => setDefaultTimeCredits(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      New users will receive this amount of time credits upon registration
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h3 className="font-medium">Require Email Verification</h3>
                      <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={requireEmailVerification}
                        onChange={() => setRequireEmailVerification(!requireEmailVerification)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-p"></div>
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">User Approval Process</h3>
                    <select className="w-full p-2 border rounded-md mb-2">
                      <option>Automatic Approval</option>
                      <option>Admin Approval Required</option>
                      <option>Email Verification Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Registration Fields</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked readOnly />
                        <span>Email (Required)</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked readOnly />
                        <span>Username (Required)</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Phone Number</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Address</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Biography</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-h2 font-semibold mb-4 flex items-center">
                  <Shield className="mr-2 h-5 w-5" /> Security Settings
                </h2>
                <p className="text-gray-500 mb-6">Configure the security settings for your platform.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Session Timeout (minutes)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-md" 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Users will be automatically logged out after this period of inactivity
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Login Attempts</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border rounded-md" 
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Account will be temporarily locked after this many failed login attempts
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-p"></div>
                    </label>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Password Policy</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Minimum 8 characters</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Require uppercase letters</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Require numbers</span>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Require special characters</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <h2 className="text-h2 font-semibold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5" /> System Settings
                </h2>
                <p className="text-gray-500 mb-6">Configure system-level settings for your platform.</p>
                
                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium mb-2">Maintenance Mode</h3>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">Enable Maintenance Mode</p>
                        <p className="text-sm text-gray-500">Site will be unavailable to regular users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-p"></div>
                      </label>
                    </div>
                    <textarea 
                      className="w-full p-2 border rounded-md mt-2" 
                      rows="2"
                      placeholder="Maintenance message to display to users"
                    ></textarea>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">System Logs</h3>
                    <div className="flex items-center gap-2">
                      <select className="flex-grow p-2 border rounded-md">
                        <option>All Logs</option>
                        <option>Error Logs</option>
                        <option>User Activity</option>
                        <option>Admin Activity</option>
                      </select>
                      <button className="px-3 py-2 bg-p text-white rounded-md hover:bg-p/90 flex items-center">
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Database Backup</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-2 bg-p text-white rounded-md hover:bg-p/90">
                        Backup Now
                      </button>
                      <button className="px-3 py-2 border border-p text-p rounded-md hover:bg-p hover:text-white">
                        Schedule Backups
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-6">
                    <h3 className="font-medium mb-2 text-error">Danger Zone</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-2 bg-white border border-error text-error rounded-md hover:bg-error hover:text-white">
                        Reset Platform
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This will reset all platform data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Save Button - Always visible */}
          <div className="mt-8 border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <p className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> Changes are saved automatically
                </p>
              </div>
              <button 
                className="px-4 py-2 bg-p text-white rounded-md hover:bg-p/90 flex items-center"
                onClick={handleSaveSettings}
              >
                <Save className="mr-2 h-4 w-4" /> Save All Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
       </div>
  )
}

export default AdminSettings