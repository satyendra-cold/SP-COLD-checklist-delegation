// "use client"
// import { useEffect, useState, useCallback } from "react";
// import { format } from 'date-fns';
// import { Search, ChevronDown, Filter } from "lucide-react";
// import AdminLayout from "../components/layout/AdminLayout";
// import DelegationPage from "./delegation-data";

// export default function QuickTask() {
//     const [tasks, setTasks] = useState([]);
//     const [delegationTasks, setDelegationTasks] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [delegationLoading, setDelegationLoading] = useState(false);
//     const [userLoading, setUserLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [searchTerm, setSearchTerm] = useState("");
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//     const [activeTab, setActiveTab] = useState('checklist');
//     const [nameFilter, setNameFilter] = useState('');
//     const [freqFilter, setFreqFilter] = useState('');
//     const [currentUser, setCurrentUser] = useState(null);
//     const [userRole, setUserRole] = useState(null);
//     const [dropdownOpen, setDropdownOpen] = useState({
//         name: false,
//         frequency: false
//     });

//     const CONFIG = {
//         SHEET_ID: "1iBYzalMyBk5ZaUv7U_2OxY2iZsPh7cMGXVwhPeC_-Fg",
//         WHATSAPP_SHEET: "Whatsapp", // For login credentials and user roles
//         CHECKLIST_SHEET: "Checklist", // For unique checklist tasks
//         DELEGATION_SHEET: "Delegation", // For delegation tasks
//         PAGE_CONFIG: {
//             title: "Task Management",
//             description: "Showing your tasks"
//         }
//     };

//     // Auto-detect current user from login session and get role from Whatsapp sheet
//     const fetchCurrentUser = useCallback(async () => {
//         try {
//             setUserLoading(true);
//             setError(null);

//             // Get user data from your login system (sessionStorage)
//             const loggedInUsername = sessionStorage.getItem('username');

//             console.log("Session data found:");
//             console.log("Username from session:", loggedInUsername);

//             if (!loggedInUsername) {
//                 throw new Error("No user logged in. Please log in to access tasks.");
//             }

//             // Fetch user role from Whatsapp sheet
//             const whatsappSheetUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.WHATSAPP_SHEET}`;
//             const response = await fetch(whatsappSheetUrl);
//             const text = await response.text();

//             const jsonStart = text.indexOf('{');
//             const jsonEnd = text.lastIndexOf('}') + 1;
//             const jsonData = text.substring(jsonStart, jsonEnd);
//             const data = JSON.parse(jsonData);

//             if (data?.table?.rows) {
//                 let foundUser = null;

//                 // Skip header row and search for user
//                 data.table.rows.slice(1).forEach((row) => {
//                     if (row.c) {
//                         const doerName = row.c[2]?.v || ""; // Column C - Doer's Name
//                         const role = row.c[4]?.v || "user"; // Column E - Role

//                         // Match by username (case-insensitive)
//                         if (doerName.toLowerCase().trim() === loggedInUsername.toLowerCase().trim()) {
//                             foundUser = {
//                                 name: doerName,
//                                 role: role.toLowerCase().trim(),
//                                 department: row.c[0]?.v || "", // Column A - Department
//                                 givenBy: row.c[1]?.v || "", // Column B - Given By
//                                 email: row.c[5]?.v || "" // Column F - ID/Email
//                             };
//                         }
//                     }
//                 });

//                 if (foundUser) {
//                     setCurrentUser(foundUser.name);
//                     setUserRole(foundUser.role);
//                     console.log("User found in Whatsapp sheet:", foundUser);
//                 } else {
//                     throw new Error(`User "${loggedInUsername}" not found in Whatsapp sheet. Please contact administrator.`);
//                 }
//             } else {
//                 throw new Error("Could not fetch user data from Whatsapp sheet");
//             }
//         } catch (err) {
//             console.error("Error fetching user:", err);
//             setError(err.message);
//         } finally {
//             setUserLoading(false);
//         }
//     }, []);

//     const fetchChecklistData = useCallback(async () => {
//         if (!currentUser || userLoading) return;

//         try {
//             setLoading(true);

//             // Fetch from Checklist sheet
//             const checklistUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.CHECKLIST_SHEET}`;
//             const response = await fetch(checklistUrl);
//             const text = await response.text();

//             const jsonStart = text.indexOf('{');
//             const jsonEnd = text.lastIndexOf('}') + 1;
//             const jsonData = text.substring(jsonStart, jsonEnd);
//             const data = JSON.parse(jsonData);

//             if (data?.table?.rows) {
//                 const rows = data.table.rows.slice(1); // Skip header

//                 // Map columns according to your specification (C-J from Checklist sheet)
//                 const transformedData = rows.map((row, rowIndex) => {
//                     const baseData = {
//                         _id: `checklist_${rowIndex}_${Math.random().toString(36).substring(2, 15)}`,
//                         _rowIndex: rowIndex + 2,
//                         // Mapping columns C-J from Checklist sheet
//                         Department: row.c[2]?.v || "",          // Column C - Department
//                         'Given By': row.c[3]?.v || "",          // Column D - Given By
//                         Name: row.c[4]?.v || "",                // Column E - Name
//                         'Task Description': row.c[5]?.v || "",  // Column F - Task Description
//                         'Start Date': formatDate(row.c[6]?.v), // Column G - Start Date
//                         Frequency: row.c[7]?.v || "",           // Column H - Frequency
//                         Reminders: row.c[8]?.v || "",           // Column I - Reminders
//                         Attachment: row.c[9]?.v || "",          // Column J - Attachment
//                         Task: 'Checklist'
//                     };
//                     return baseData;
//                 }).filter(item => {
//                     // Filter out rows where both Name and Task Description are empty
//                     return item.Name && item['Task Description'];
//                 });

//                 console.log(`Total checklist tasks before uniqueness filter:`, transformedData.length);

//                 // Create unique tasks based on Name + Task Description combination
//                 const uniqueTasksMap = new Map();
//                 transformedData.forEach(task => {
//                     const key = `${task.Name?.toLowerCase().trim()}_${task['Task Description']?.toLowerCase().trim()}`;
//                     if (!uniqueTasksMap.has(key)) {
//                         uniqueTasksMap.set(key, task);
//                     }
//                 });

//                 const uniqueTasks = Array.from(uniqueTasksMap.values());
//                 console.log(`Unique tasks after filtering:`, uniqueTasks.length);
//                 console.log("User role:", userRole, "Current user:", currentUser);

//                 // Apply role-based filtering
//                 let filteredData;
//                 if (userRole === 'admin') {
//                     // Admin sees all unique tasks
//                     filteredData = uniqueTasks;
//                     console.log("Admin access: showing all unique checklist tasks");
//                 } else {
//                     // Regular user sees only their tasks (where Name matches current user)
//                     filteredData = uniqueTasks.filter(item => {
//                         const itemName = (item.Name || '').toString().toLowerCase().trim();
//                         const currentUserLower = currentUser.toLowerCase().trim();

//                         return itemName === currentUserLower;
//                     });
//                     console.log(`User access: filtered checklist tasks for ${currentUser}:`, filteredData.length);
//                 }

//                 setTasks(filteredData);
//             } else {
//                 throw new Error("Invalid checklist data format");
//             }
//         } catch (err) {
//             console.error("Checklist fetch error:", err);
//             setError(err.message || "Failed to load checklist data");
//         } finally {
//             setLoading(false);
//         }
//     }, [currentUser, userRole, userLoading]);

//     const fetchDelegationData = useCallback(async () => {
//         if (!currentUser || userLoading) return;

//         try {
//             setDelegationLoading(true);

//             // Fetch from Delegation sheet
//             const delegationUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.DELEGATION_SHEET}`;
//             const response = await fetch(delegationUrl);
//             const text = await response.text();

//             const jsonStart = text.indexOf('{');
//             const jsonEnd = text.lastIndexOf('}') + 1;
//             const jsonData = text.substring(jsonStart, jsonEnd);
//             const data = JSON.parse(jsonData);

//             if (data?.table?.rows) {
//                 const rows = data.table.rows.slice(1); // Skip header
//                 const transformedData = rows.map((row, rowIndex) => {
//                     const baseData = {
//                         _id: `delegation_${rowIndex}_${Math.random().toString(36).substring(2, 15)}`,
//                         _rowIndex: rowIndex + 2,
//                         // Map columns from Delegation sheet (keep existing mapping)
//                         Timestamp: formatDate(row.c[0]?.v),
//                         'Task ID': row.c[1]?.v || "",
//                         Department: row.c[2]?.v || "",
//                         'Given By': row.c[3]?.v || "",
//                         Name: row.c[4]?.v || "",
//                         'Task Description': row.c[5]?.v || "",
//                         'Task Start Date': formatDate(row.c[6]?.v),
//                         Freq: row.c[7]?.v || "",
//                         'Enable Reminders': row.c[8]?.v || "",
//                         'Require Attachment': row.c[9]?.v || "",
//                     };
//                     return baseData;
//                 });

//                 console.log(`Total delegation tasks:`, transformedData.length);

//                 // Apply role-based filtering (unchanged from original)
//                 let filteredData;
//                 if (userRole === 'admin') {
//                     // Admin sees all tasks
//                     filteredData = transformedData;
//                     console.log("Admin access: showing all delegation tasks");
//                 } else {
//                     // Regular user sees only their tasks
//                     filteredData = transformedData.filter(item => {
//                         const itemName = (item.Name || '').toString().toLowerCase().trim();
//                         const itemGivenBy = (item['Given By'] || '').toString().toLowerCase().trim();
//                         const currentUserLower = currentUser.toLowerCase().trim();

//                         const isAssignedToUser = itemName === currentUserLower;
//                         const isGivenByUser = itemGivenBy === currentUserLower;

//                         return isAssignedToUser || isGivenByUser;
//                     });
//                     console.log(`User access: filtered delegation tasks for ${currentUser}:`, filteredData.length);
//                 }

//                 setDelegationTasks(filteredData);
//             } else {
//                 throw new Error("Invalid delegation data format");
//             }
//         } catch (err) {
//             console.error("Delegation fetch error:", err);
//             setError(err.message || "Failed to load delegation data");
//         } finally {
//             setDelegationLoading(false);
//         }
//     }, [currentUser, userRole, userLoading]);

//     const formatDate = (dateValue) => {
//         if (!dateValue) return "";
//         try {
//             // Handle Google Sheets date format like "Date(2025,6,4)"
//             if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
//                 const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
//                 if (match) {
//                     const year = parseInt(match[1]);
//                     const month = parseInt(match[2]); // Note: Google Sheets month is 0-based like JS
//                     const day = parseInt(match[3]);
//                     const date = new Date(year, month, day);
//                     return format(date, 'dd/MM/yyyy');
//                 }
//             }

//             // Handle regular date objects/strings
//             const date = new Date(dateValue);
//             if (!isNaN(date.getTime())) {
//                 return format(date, 'dd/MM/yyyy');
//             }

//             return dateValue;
//         } catch {
//             return dateValue;
//         }
//     };

//     const requestSort = (key) => {
//         if (loading) return;
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//     };

//     const toggleDropdown = (dropdown) => {
//         setDropdownOpen(prev => ({
//             ...prev,
//             [dropdown]: !prev[dropdown]
//         }));
//     };

//     const handleNameFilterSelect = (name) => {
//         setNameFilter(name);
//         setDropdownOpen({ ...dropdownOpen, name: false });
//     };

//     const handleFrequencyFilterSelect = (freq) => {
//         setFreqFilter(freq);
//         setDropdownOpen({ ...dropdownOpen, frequency: false });
//     };

//     const clearNameFilter = () => {
//         setNameFilter('');
//         setDropdownOpen({ ...dropdownOpen, name: false });
//     };

//     const clearFrequencyFilter = () => {
//         setFreqFilter('');
//         setDropdownOpen({ ...dropdownOpen, frequency: false });
//     };

//     // Get filter options based on active tab
//     const getFilterOptions = () => {
//         const currentTasks = activeTab === 'checklist' ? tasks : delegationTasks;

//         const names = [...new Set(currentTasks.map(task => task.Name))]
//             .filter(name => name && typeof name === 'string' && name.trim() !== '');

//         // For checklist, use 'Frequency' field, for delegation use 'Freq'
//         const frequencies = activeTab === 'checklist'
//             ? [...new Set(currentTasks.map(task => task.Frequency))]
//                 .filter(freq => freq && typeof freq === 'string' && freq.trim() !== '')
//             : [...new Set(currentTasks.map(task => task.Freq))]
//                 .filter(freq => freq && typeof freq === 'string' && freq.trim() !== '');

//         return { names, frequencies };
//     };

//     const { names: currentNames, frequencies: currentFrequencies } = getFilterOptions();

//     // Reset filters when changing tabs
//     useEffect(() => {
//         setNameFilter('');
//         setFreqFilter('');
//         setDropdownOpen({ name: false, frequency: false });
//     }, [activeTab]);

//     const filteredChecklistTasks = tasks.filter(task => {
//         const nameFilterPass = !nameFilter || task.Name === nameFilter;
//         const freqFilterPass = !freqFilter || task.Frequency === freqFilter;
//         const searchTermPass = Object.values(task).some(
//             value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
//         );
//         return nameFilterPass && freqFilterPass && searchTermPass;
//     }).sort((a, b) => {
//         if (!sortConfig.key) return 0;
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//             return sortConfig.direction === 'asc' ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//             return sortConfig.direction === 'asc' ? 1 : -1;
//         }
//         return 0;
//     });

//     // Auto-detect user on component mount
//     useEffect(() => {
//         fetchCurrentUser();
//     }, [fetchCurrentUser]);

//     // Fetch task data when user is loaded
//     useEffect(() => {
//         if (currentUser && userRole && !userLoading) {
//             console.log("Fetching data for user:", currentUser, "with role:", userRole);
//             fetchChecklistData();
//             fetchDelegationData();
//         }
//     }, [fetchChecklistData, fetchDelegationData, currentUser, userRole, userLoading]);

//     // Show loading while fetching user data
//     if (userLoading) {
//         return (
//             <AdminLayout>
//                 <div className="flex items-center justify-center min-h-screen">
//                     <div className="text-center">
//                         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
//                         <p className="text-purple-600 text-lg">Loading user session...</p>
//                     </div>
//                 </div>
//             </AdminLayout>
//         );
//     }

//     // Show error if user not found or not logged in
//     if (error) {
//         return (
//             <AdminLayout>
//                 <div className="flex items-center justify-center min-h-screen">
//                     <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-red-200">
//                         <div className="text-center">
//                             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
//                                 <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
//                                 </svg>
//                             </div>
//                             <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
//                             <p className="text-sm text-gray-600 mb-4">{error}</p>
//                             <button
//                                 onClick={() => window.location.href = '/login'}
//                                 className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
//                             >
//                                 Go to Login
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </AdminLayout>
//         );
//     }

//     return (
//         <AdminLayout>
//             <div className="sticky top-0 z-30 bg-white pb-4 border-b border-gray-200">
//                 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
//                     <div>
//                         <h1 className="text-2xl font-bold tracking-tight text-purple-700 pl-3">
//                             {CONFIG.PAGE_CONFIG.title}
//                         </h1>
//                         <p className="text-purple-600 text-sm pl-3">
//                             {currentUser && `Welcome ${currentUser}`}
//                         </p>
//                     </div>

//                     <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
//                         <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
//                             <button
//                                 className={`px-4 py-2 text-sm font-medium ${activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//                                 onClick={() => setActiveTab('checklist')}
//                             >
//                                 Checklist
//                             </button>
//                             <button
//                                 className={`px-4 py-2 text-sm font-medium ${activeTab === 'delegation' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//                                 onClick={() => setActiveTab('delegation')}
//                             >
//                                 Delegation
//                             </button>
//                         </div>

//                         <div className="relative flex-1 min-w-[200px]">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
//                             <input
//                                 type="text"
//                                 placeholder="Search tasks..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
//                                 disabled={loading || delegationLoading}
//                             />
//                         </div>

//                         <div className="flex gap-2">
//                             <div className="relative">
//                                 <button
//                                     onClick={() => toggleDropdown('name')}
//                                     className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
//                                 >
//                                     <Filter className="h-4 w-4" />
//                                     {nameFilter || 'Filter by Name'}
//                                     <ChevronDown size={16} className={`transition-transform ${dropdownOpen.name ? 'rotate-180' : ''}`} />
//                                 </button>
//                                 {dropdownOpen.name && (
//                                     <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
//                                         <div className="py-1">
//                                             <button
//                                                 onClick={clearNameFilter}
//                                                 className={`block w-full text-left px-4 py-2 text-sm ${!nameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
//                                             >
//                                                 All Names
//                                             </button>
//                                             {currentNames.map(name => (
//                                                 <button
//                                                     key={name}
//                                                     onClick={() => handleNameFilterSelect(name)}
//                                                     className={`block w-full text-left px-4 py-2 text-sm ${nameFilter === name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
//                                                 >
//                                                     {name}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>

//                             <div className="relative">
//                                 <button
//                                     onClick={() => toggleDropdown('frequency')}
//                                     className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
//                                 >
//                                     <Filter className="h-4 w-4" />
//                                     {freqFilter || 'Filter by Frequency'}
//                                     <ChevronDown size={16} className={`transition-transform ${dropdownOpen.frequency ? 'rotate-180' : ''}`} />
//                                 </button>
//                                 {dropdownOpen.frequency && (
//                                     <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
//                                         <div className="py-1">
//                                             <button
//                                                 onClick={clearFrequencyFilter}
//                                                 className={`block w-full text-left px-4 py-2 text-sm ${!freqFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
//                                             >
//                                                 All Frequencies
//                                             </button>
//                                             {currentFrequencies.map(freq => (
//                                                 <button
//                                                     key={freq}
//                                                     onClick={() => handleFrequencyFilterSelect(freq)}
//                                                     className={`block w-full text-left px-4 py-2 text-sm ${freqFilter === freq ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
//                                                 >
//                                                     {freq}
//                                                 </button>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {currentUser && (
//                 <>
//                     {activeTab === 'checklist' ? (
//                         <div className="mt-4 rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
//                             <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
//                                 <h2 className="text-purple-700 font-medium">
//                                     {userRole === 'admin' ? 'All Unique Tasks' : 'My Unique Tasks'}
//                                 </h2>
//                                 <p className="text-purple-600 text-sm">
//                                     {userRole === 'admin' ? 'Showing all unique tasks from checklist' : CONFIG.PAGE_CONFIG.description}
//                                 </p>
//                             </div>

//                             <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
//                                 <table className="min-w-full divide-y divide-gray-200">
//                                     <thead className="bg-gray-50 sticky top-0 z-20">
//                                         <tr>
//                                             {[
//                                                 { key: 'Department', label: 'Department' },
//                                                 { key: 'Given By', label: 'Given By' },
//                                                 { key: 'Name', label: 'Name' },
//                                                 { key: 'Task Description', label: 'Task Description', minWidth: 'min-w-[300px]' },
//                                                 { key: 'Start Date', label: 'Start Date', bg: 'bg-yellow-50' },
//                                                 { key: 'Frequency', label: 'Frequency' },
//                                                 { key: 'Reminders', label: 'Reminders' },
//                                                 { key: 'Attachment', label: 'Attachment' },
//                                             ].map((column) => (
//                                                 <th
//                                                     key={column.label}
//                                                     className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.bg || ''} ${column.minWidth || ''} ${column.key ? 'cursor-pointer hover:bg-gray-100' : ''}`}
//                                                     onClick={() => column.key && requestSort(column.key)}
//                                                 >
//                                                     <div className="flex items-center">
//                                                         {column.label}
//                                                         {sortConfig.key === column.key && (
//                                                             <span className="ml-1">
//                                                                 {sortConfig.direction === 'asc' ? '↑' : '↓'}
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 </th>
//                                             ))}
//                                         </tr>
//                                     </thead>

//                                     <tbody className="bg-white divide-y divide-gray-200">
//                                         {loading ? (
//                                             <tr>
//                                                 <td colSpan={8} className="px-6 py-8 text-center">
//                                                     <div className="flex flex-col items-center justify-center">
//                                                         <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
//                                                         <p className="text-purple-600">Loading checklist data...</p>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         ) : filteredChecklistTasks.length > 0 ? (
//                                             filteredChecklistTasks.map((task) => (
//                                                 <tr key={task._id} className="hover:bg-gray-50">
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                                                         {task.Department || "—"}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                                         {task['Given By'] || "—"}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                                         {task.Name || "—"}
//                                                     </td>
//                                                     <td className="px-6 py-4 text-sm text-gray-500 min-w-[300px] max-w-[400px]">
//                                                         <div className="whitespace-normal break-words">
//                                                             {task['Task Description'] || "—"}
//                                                         </div>
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
//                                                         {task['Start Date'] || "—"}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                                         <span className={`px-2 py-1 rounded-full text-xs ${task.Frequency === 'Daily' ? 'bg-blue-100 text-blue-800' :
//                                                             task.Frequency === 'Weekly' ? 'bg-green-100 text-green-800' :
//                                                                 task.Frequency === 'Monthly' ? 'bg-purple-100 text-purple-800' :
//                                                                     'bg-gray-100 text-gray-800'
//                                                             }`}>
//                                                             {task.Frequency || "—"}
//                                                         </span>
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                                         {task.Reminders || "—"}
//                                                     </td>
//                                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                                                         {task.Attachment || "—"}
//                                                     </td>
//                                                 </tr>
//                                             ))
//                                         ) : (
//                                             <tr>
//                                                 <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
//                                                     {searchTerm || nameFilter || freqFilter
//                                                         ? "No tasks matching your filters"
//                                                         : userRole === 'admin' ? "No unique tasks available" : "No unique tasks assigned to you"}
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     ) : (
//                         <DelegationPage
//                             searchTerm={searchTerm}
//                             nameFilter={nameFilter}
//                             freqFilter={freqFilter}
//                             setNameFilter={setNameFilter}
//                             setFreqFilter={setFreqFilter}
//                             currentUser={currentUser}
//                             userRole={userRole}
//                             CONFIG={CONFIG}
//                             delegationTasks={delegationTasks}
//                             delegationLoading={delegationLoading}
//                             loading={delegationLoading}
//                         />
//                     )}
//                 </>
//             )}
//         </AdminLayout>
//     );
// }

"use client"
import { useEffect, useState, useCallback } from "react";
import { format } from 'date-fns';
import { Search, ChevronDown, Filter, Edit2, Trash2, Save, X } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import DelegationPage from "./delegation-data";


export default function QuickTask() {
    const [tasks, setTasks] = useState([]);
    const [delegationTasks, setDelegationTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [delegationLoading, setDelegationLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('checklist');
    const [nameFilter, setNameFilter] = useState('');
    const [freqFilter, setFreqFilter] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState({
        name: false,
        frequency: false
    });
    const [editingRow, setEditingRow] = useState(null);
    const [editFormData, setEditFormData] = useState({});


    const CONFIG = {
        SHEET_ID: "1iBYzalMyBk5ZaUv7U_2OxY2iZsPh7cMGXVwhPeC_-Fg",
        WHATSAPP_SHEET: "Whatsapp", 
        CHECKLIST_SHEET: "Checklist", 
        DELEGATION_SHEET: "Delegation",
        // Google Apps Script Web App URL for backend operations
        SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx426p_teOMVFcMG22RngcroTClA1vB2Z4M1CN9AjAhChiyjVPCO-5wIPM7m6cQHMgx/exec", // You need to deploy this
        PAGE_CONFIG: {
            title: "Task Management",
            description: "Showing your tasks"
        }
    };


    // Auto-detect current user from login session and get role from Whatsapp sheet
    const fetchCurrentUser = useCallback(async () => {
        try {
            setUserLoading(true);
            setError(null);

            const loggedInUsername = sessionStorage.getItem('username');

            console.log("Session data found:");
            console.log("Username from session:", loggedInUsername);

            if (!loggedInUsername) {
                throw new Error("No user logged in. Please log in to access tasks.");
            }

            const whatsappSheetUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.WHATSAPP_SHEET}`;
            const response = await fetch(whatsappSheetUrl);
            const text = await response.text();

            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonData = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonData);

            if (data?.table?.rows) {
                let foundUser = null;

                data.table.rows.slice(1).forEach((row) => {
                    if (row.c) {
                        const doerName = row.c[2]?.v || ""; 
                        const role = row.c[4]?.v || "user"; 

                        if (doerName.toLowerCase().trim() === loggedInUsername.toLowerCase().trim()) {
                            foundUser = {
                                name: doerName,
                                role: role.toLowerCase().trim(),
                                department: row.c[0]?.v || "", 
                                givenBy: row.c[1]?.v || "", 
                                email: row.c[5]?.v || "" 
                            };
                        }
                    }
                });

                if (foundUser) {
                    setCurrentUser(foundUser.name);
                    setUserRole(foundUser.role);
                    console.log("User found in Whatsapp sheet:", foundUser);
                } else {
                    throw new Error(`User "${loggedInUsername}" not found in Whatsapp sheet. Please contact administrator.`);
                }
            } else {
                throw new Error("Could not fetch user data from Whatsapp sheet");
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setError(err.message);
        } finally {
            setUserLoading(false);
        }
    }, []);


    const fetchChecklistData = useCallback(async () => {
        if (!currentUser || userLoading) return;

        try {
            setLoading(true);

            const checklistUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.CHECKLIST_SHEET}`;
            const response = await fetch(checklistUrl);
            const text = await response.text();

            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonData = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonData);

            if (data?.table?.rows) {
                const rows = data.table.rows.slice(1); 

                const transformedData = rows.map((row, rowIndex) => {
                    const baseData = {
                        _id: `checklist_${rowIndex}_${Math.random().toString(36).substring(2, 15)}`,
                        _rowIndex: rowIndex + 2,
                        'Task ID': row.c[1]?.v || "", // Column B - Task ID
                        Department: row.c[2]?.v || "",          
                        'Given By': row.c[3]?.v || "",          
                        Name: row.c[4]?.v || "",                
                        'Task Description': row.c[5]?.v || "",  
                        'Start Date': formatDate(row.c[6]?.v), 
                        Frequency: row.c[7]?.v || "",           
                        Reminders: row.c[8]?.v || "",           
                        Attachment: row.c[9]?.v || "",          
                        Task: 'Checklist'
                    };
                    return baseData;
                }).filter(item => {
                    return item.Name && item['Task Description'];
                });

                console.log(`Total checklist tasks before uniqueness filter:`, transformedData.length);

                const uniqueTasksMap = new Map();
                transformedData.forEach(task => {
                    const key = `${task.Name?.toLowerCase().trim()}_${task['Task Description']?.toLowerCase().trim()}`;
                    if (!uniqueTasksMap.has(key)) {
                        uniqueTasksMap.set(key, task);
                    }
                });

                const uniqueTasks = Array.from(uniqueTasksMap.values());
                console.log(`Unique tasks after filtering:`, uniqueTasks.length);
                console.log("User role:", userRole, "Current user:", currentUser);

                let filteredData;
                if (userRole === 'admin') {
                    filteredData = uniqueTasks;
                    console.log("Admin access: showing all unique checklist tasks");
                } else {
                    filteredData = uniqueTasks.filter(item => {
                        const itemName = (item.Name || '').toString().toLowerCase().trim();
                        const currentUserLower = currentUser.toLowerCase().trim();

                        return itemName === currentUserLower;
                    });
                    console.log(`User access: filtered checklist tasks for ${currentUser}:`, filteredData.length);
                }

                setTasks(filteredData);
            } else {
                throw new Error("Invalid checklist data format");
            }
        } catch (err) {
            console.error("Checklist fetch error:", err);
            setError(err.message || "Failed to load checklist data");
        } finally {
            setLoading(false);
        }
    }, [currentUser, userRole, userLoading]);


    const fetchDelegationData = useCallback(async () => {
        if (!currentUser || userLoading) return;

        try {
            setDelegationLoading(true);

            const delegationUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${CONFIG.DELEGATION_SHEET}`;
            const response = await fetch(delegationUrl);
            const text = await response.text();

            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonData = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonData);

            if (data?.table?.rows) {
                const rows = data.table.rows.slice(1); 
                const transformedData = rows.map((row, rowIndex) => {
                    const baseData = {
                        _id: `delegation_${rowIndex}_${Math.random().toString(36).substring(2, 15)}`,
                        _rowIndex: rowIndex + 2,
                        Timestamp: formatDate(row.c[0]?.v),
                        'Task ID': row.c[1]?.v || "",
                        Department: row.c[2]?.v || "",
                        'Given By': row.c[3]?.v || "",
                        Name: row.c[4]?.v || "",
                        'Task Description': row.c[5]?.v || "",
                        'Task Start Date': formatDate(row.c[6]?.v),
                        Freq: row.c[7]?.v || "",
                        'Enable Reminders': row.c[8]?.v || "",
                        'Require Attachment': row.c[9]?.v || "",
                    };
                    return baseData;
                });

                console.log(`Total delegation tasks:`, transformedData.length);

                let filteredData;
                if (userRole === 'admin') {
                    filteredData = transformedData;
                    console.log("Admin access: showing all delegation tasks");
                } else {
                    filteredData = transformedData.filter(item => {
                        const itemName = (item.Name || '').toString().toLowerCase().trim();
                        const itemGivenBy = (item['Given By'] || '').toString().toLowerCase().trim();
                        const currentUserLower = currentUser.toLowerCase().trim();

                        const isAssignedToUser = itemName === currentUserLower;
                        const isGivenByUser = itemGivenBy === currentUserLower;

                        return isAssignedToUser || isGivenByUser;
                    });
                    console.log(`User access: filtered delegation tasks for ${currentUser}:`, filteredData.length);
                }

                setDelegationTasks(filteredData);
            } else {
                throw new Error("Invalid delegation data format");
            }
        } catch (err) {
            console.error("Delegation fetch error:", err);
            setError(err.message || "Failed to load delegation data");
        } finally {
            setDelegationLoading(false);
        }
    }, [currentUser, userRole, userLoading]);


    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        try {
            if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
                const match = dateValue.match(/Date\((\d+),(\d+),(\d+)\)/);
                if (match) {
                    const year = parseInt(match[1]);
                    const month = parseInt(match[2]); 
                    const day = parseInt(match[3]);
                    const date = new Date(year, month, day);
                    return format(date, 'dd/MM/yyyy');
                }
            }

            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return format(date, 'dd/MM/yyyy');
            }

            return dateValue;
        } catch {
            return dateValue;
        }
    };


    const requestSort = (key) => {
        if (loading) return;
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    const toggleDropdown = (dropdown) => {
        setDropdownOpen(prev => ({
            ...prev,
            [dropdown]: !prev[dropdown]
        }));
    };


    const handleNameFilterSelect = (name) => {
        setNameFilter(name);
        setDropdownOpen({ ...dropdownOpen, name: false });
    };


    const handleFrequencyFilterSelect = (freq) => {
        setFreqFilter(freq);
        setDropdownOpen({ ...dropdownOpen, frequency: false });
    };


    const clearNameFilter = () => {
        setNameFilter('');
        setDropdownOpen({ ...dropdownOpen, name: false });
    };


    const clearFrequencyFilter = () => {
        setFreqFilter('');
        setDropdownOpen({ ...dropdownOpen, frequency: false });
    };


    const getFilterOptions = () => {
        const currentTasks = activeTab === 'checklist' ? tasks : delegationTasks;

        const names = [...new Set(currentTasks.map(task => task.Name))]
            .filter(name => name && typeof name === 'string' && name.trim() !== '');

        const frequencies = activeTab === 'checklist'
            ? [...new Set(currentTasks.map(task => task.Frequency))]
                .filter(freq => freq && typeof freq === 'string' && freq.trim() !== '')
            : [...new Set(currentTasks.map(task => task.Freq))]
                .filter(freq => freq && typeof freq === 'string' && freq.trim() !== '');

        return { names, frequencies };
    };


    const { names: currentNames, frequencies: currentFrequencies } = getFilterOptions();


    useEffect(() => {
        setNameFilter('');
        setFreqFilter('');
        setDropdownOpen({ name: false, frequency: false });
        setEditingRow(null);
    }, [activeTab]);


    // Edit functionality
    const handleEditClick = (task) => {
        setEditingRow(task._id);
        setEditFormData({ ...task });
    };


    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditFormData({});
    };


    const handleEditInputChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };


const handleSaveEdit = async (task) => {
    try {
        if (!editFormData['Task ID']) {
            alert('Error: Task ID is missing');
            return;
        }

        setLoading(true);

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('action', 'updateTask');
        formData.append('sheetName', CONFIG.CHECKLIST_SHEET);
        formData.append('taskId', editFormData['Task ID']);
        formData.append('rowData', JSON.stringify({
            Department: editFormData.Department || '',
            'Given By': editFormData['Given By'] || '',
            Name: editFormData.Name || '',
            'Task Description': editFormData['Task Description'] || '',
            'Start Date': editFormData['Start Date'] || '',
            Frequency: editFormData.Frequency || '',
            Reminders: editFormData.Reminders || '',
            Attachment: editFormData.Attachment || ''
        }));

        console.log("Sending update:", formData.toString());

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log("Response text:", text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("JSON parse error:", e);
            throw new Error("Invalid server response");
        }

        if (result.success) {
            setTasks(prevTasks => 
                prevTasks.map(t => 
                    t._id === task._id ? { ...t, ...editFormData } : t
                )
            );
            setEditingRow(null);
            setEditFormData({});
            alert('Task updated successfully!');
            setTimeout(() => fetchChecklistData(), 500);
        } else {
            throw new Error(result.error || 'Update failed');
        }
    } catch (err) {
        console.error("Error:", err);
        alert(`Error: ${err.message}`);
    } finally {
        setLoading(false);
    }
};

const handleDeleteClick = async (task) => {
    if (!task['Task ID']) {
        alert('Error: Task ID is missing');
        return;
    }

    const confirmDelete = window.confirm(
        `Delete this task?\n\nTask ID: ${task['Task ID']}\nTask: ${task['Task Description']}`
    );

    if (!confirmDelete) return;

    try {
        setLoading(true);

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('action', 'deleteTaskByID');
        formData.append('sheetName', CONFIG.CHECKLIST_SHEET);
        formData.append('taskId', task['Task ID']);

        console.log("Sending delete:", formData.toString());

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const text = await response.text();
        console.log("Response text:", text);

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("JSON parse error:", e);
            throw new Error("Invalid server response");
        }

        if (result.success) {
            setTasks(prevTasks => prevTasks.filter(t => t._id !== task._id));
            alert('Task deleted successfully!');
            setTimeout(() => fetchChecklistData(), 500);
        } else {
            throw new Error(result.error || 'Delete failed');
        }
    } catch (err) {
        console.error("Error:", err);
        alert(`Error: ${err.message}`);
    } finally {
        setLoading(false);
    }
};



    const filteredChecklistTasks = tasks.filter(task => {
        const nameFilterPass = !nameFilter || task.Name === nameFilter;
        const freqFilterPass = !freqFilter || task.Frequency === freqFilter;
        const searchTermPass = Object.values(task).some(
            value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        return nameFilterPass && freqFilterPass && searchTermPass;
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });


    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);


    useEffect(() => {
        if (currentUser && userRole && !userLoading) {
            console.log("Fetching data for user:", currentUser, "with role:", userRole);
            fetchChecklistData();
            fetchDelegationData();
        }
    }, [fetchChecklistData, fetchDelegationData, currentUser, userRole, userLoading]);


    if (userLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                        <p className="text-purple-600 text-lg">Loading user session...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }


    if (error) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-red-200">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                            <p className="text-sm text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }


    return (
        <AdminLayout>
            <div className="sticky top-0 z-30 bg-white pb-4 border-b border-gray-200">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-purple-700 pl-3">
                            {CONFIG.PAGE_CONFIG.title}
                        </h1>
                        <p className="text-purple-600 text-sm pl-3">
                            {currentUser && `Welcome ${currentUser}`}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
                        <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                                onClick={() => setActiveTab('checklist')}
                            >
                                Checklist
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium ${activeTab === 'delegation' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                                onClick={() => setActiveTab('delegation')}
                            >
                                Delegation
                            </button>
                        </div>

                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={loading || delegationLoading}
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('name')}
                                    className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4" />
                                    {nameFilter || 'Filter by Name'}
                                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen.name ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownOpen.name && (
                                    <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                                        <div className="py-1">
                                            <button
                                                onClick={clearNameFilter}
                                                className={`block w-full text-left px-4 py-2 text-sm ${!nameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                All Names
                                            </button>
                                            {currentNames.map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => handleNameFilterSelect(name)}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${nameFilter === name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => toggleDropdown('frequency')}
                                    className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4" />
                                    {freqFilter || 'Filter by Frequency'}
                                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen.frequency ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownOpen.frequency && (
                                    <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                                        <div className="py-1">
                                            <button
                                                onClick={clearFrequencyFilter}
                                                className={`block w-full text-left px-4 py-2 text-sm ${!freqFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                All Frequencies
                                            </button>
                                            {currentFrequencies.map(freq => (
                                                <button
                                                    key={freq}
                                                    onClick={() => handleFrequencyFilterSelect(freq)}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${freqFilter === freq ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    {freq}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {currentUser && (
                <>
                    {activeTab === 'checklist' ? (
                        <div className="mt-4 rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                                <h2 className="text-purple-700 font-medium">
                                    {userRole === 'admin' ? 'All Unique Tasks' : 'My Unique Tasks'}
                                </h2>
                                <p className="text-purple-600 text-sm">
                                    {userRole === 'admin' ? 'Showing all unique tasks from checklist' : CONFIG.PAGE_CONFIG.description}
                                </p>
                            </div>

                            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-20">
                                        <tr>
                                            {[
                                                 { key: null, label: 'Actions', minWidth: 'min-w-[120px]' },
                                                { key: 'Department', label: 'Department' },
                                                { key: 'Given By', label: 'Given By' },
                                                { key: 'Name', label: 'Name' },
                                                { key: 'Task Description', label: 'Task Description', minWidth: 'min-w-[300px]' },
                                                { key: 'Start Date', label: 'Start Date', bg: 'bg-yellow-50' },
                                                { key: 'Frequency', label: 'Frequency' },
                                                { key: 'Reminders', label: 'Reminders' },
                                                { key: 'Attachment', label: 'Attachment' },
                                               
                                            ].map((column) => (
                                                
                                                <th
                                                    key={column.label}
                                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.bg || ''} ${column.minWidth || ''} ${column.key ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                                    onClick={() => column.key && requestSort(column.key)}
                                                >
                                                    <div className="flex items-center">
                                                        {column.label}
                                                        {sortConfig.key === column.key && (
                                                            <span className="ml-1">
                                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-8 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                                                        <p className="text-purple-600">Loading checklist data...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredChecklistTasks.length > 0 ? (
                                            filteredChecklistTasks.map((task) => (
                                                <tr key={task._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleSaveEdit(task)}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                    title="Save"
                                                                >
                                                                    <Save size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                                                    title="Cancel"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleEditClick(task)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Edit"
                                                                    disabled={loading}
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete"
                                                                    disabled={loading}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData.Department || ''}
                                                                onChange={(e) => handleEditInputChange('Department', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task.Department || "—"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData['Given By'] || ''}
                                                                onChange={(e) => handleEditInputChange('Given By', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task['Given By'] || "—"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData.Name || ''}
                                                                onChange={(e) => handleEditInputChange('Name', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task.Name || "—"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 min-w-[300px] max-w-[400px]">
                                                        {editingRow === task._id ? (
                                                            <textarea
                                                                value={editFormData['Task Description'] || ''}
                                                                onChange={(e) => handleEditInputChange('Task Description', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                rows={3}
                                                            />
                                                        ) : (
                                                            <div className="whitespace-normal break-words">
                                                                {task['Task Description'] || "—"}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData['Start Date'] || ''}
                                                                onChange={(e) => handleEditInputChange('Start Date', e.target.value)}
                                                                placeholder="DD/MM/YYYY"
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task['Start Date'] || "—"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <select
                                                                value={editFormData.Frequency || ''}
                                                                onChange={(e) => handleEditInputChange('Frequency', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Daily">Daily</option>
                                                                <option value="Weekly">Weekly</option>
                                                                <option value="Monthly">Monthly</option>
                                                                <option value="Yearly">Yearly</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-2 py-1 rounded-full text-xs ${task.Frequency === 'Daily' ? 'bg-blue-100 text-blue-800' :
                                                                task.Frequency === 'Weekly' ? 'bg-green-100 text-green-800' :
                                                                    task.Frequency === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {task.Frequency || "—"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData.Reminders || ''}
                                                                onChange={(e) => handleEditInputChange('Reminders', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task.Reminders || "—"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {editingRow === task._id ? (
                                                            <input
                                                                type="text"
                                                                value={editFormData.Attachment || ''}
                                                                onChange={(e) => handleEditInputChange('Attachment', e.target.value)}
                                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            task.Attachment || "—"
                                                        )}
                                                    </td>
                                                    
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                                                    {searchTerm || nameFilter || freqFilter
                                                        ? "No tasks matching your filters"
                                                        : userRole === 'admin' ? "No unique tasks available" : "No unique tasks assigned to you"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <DelegationPage
                            searchTerm={searchTerm}
                            nameFilter={nameFilter}
                            freqFilter={freqFilter}
                            setNameFilter={setNameFilter}
                            setFreqFilter={setFreqFilter}
                            currentUser={currentUser}
                            userRole={userRole}
                            CONFIG={CONFIG}
                            delegationTasks={delegationTasks}
                            delegationLoading={delegationLoading}
                            loading={delegationLoading}
                        />
                    )}
                </>
            )}
        </AdminLayout>
    );
}
