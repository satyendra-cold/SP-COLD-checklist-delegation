

"use client"
import { useCallback, useEffect, useState, useMemo } from "react";
import { format } from 'date-fns';
import { Search, ChevronDown, Filter, Edit2, Trash2, Save, X } from "lucide-react";


export default function DelegationPage({
    searchTerm,
    nameFilter,
    freqFilter,
    setNameFilter,
    setFreqFilter,
    currentUser,
    userRole
}) {
    const [delegationTasks, setDelegationTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [dropdownOpen, setDropdownOpen] = useState({
        name: false,
        frequency: false
    });
    const [editingRow, setEditingRow] = useState(null);
    const [editFormData, setEditFormData] = useState({});


    // Config should be memoized to prevent unnecessary re-renders
    const CONFIG = useMemo(() => ({
        APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx426p_teOMVFcMG22RngcroTClA1vB2Z4M1CN9AjAhChiyjVPCO-5wIPM7m6cQHMgx/exec",
        DELEGATION_SHEET: "Delegation"
    }), []);


    // Format date helper function
    const formatDate = useCallback((dateValue) => {
        if (!dateValue) return "";
        try {
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? dateValue : format(date, 'dd/MM/yyyy HH:mm');
        } catch {
            return dateValue;
        }
    }, []);


    // Fetch data with role-based filtering
    const fetchData = useCallback(async () => {
        if (!currentUser || !userRole) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.DELEGATION_SHEET}&action=fetch`,
                { redirect: 'follow' }
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data?.table?.rows) {
                const transformedData = data.table.rows.slice(1).map((row, rowIndex) => ({
                    _id: `row_${rowIndex}_${Date.now()}`,
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
                }));

                // Apply role-based filtering
                let filteredData;
                if (userRole === 'admin') {
                    filteredData = transformedData;
                } else {
                    filteredData = transformedData.filter(task => {
                        const taskName = (task.Name || '').toString().toLowerCase().trim();
                        const taskGivenBy = (task['Given By'] || '').toString().toLowerCase().trim();
                        const currentUserLower = currentUser.toLowerCase().trim();

                        return taskName === currentUserLower || taskGivenBy === currentUserLower;
                    });
                }

                setDelegationTasks(filteredData);
            } else {
                throw new Error("Invalid data format");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message || "Failed to load delegation data");
        } finally {
            setLoading(false);
        }
    }, [CONFIG, currentUser, userRole, formatDate]);


    // Edit functionality
    const handleEditClick = useCallback((task) => {
        setEditingRow(task._id);
        setEditFormData({ ...task });
    }, []);


    const handleCancelEdit = useCallback(() => {
        setEditingRow(null);
        setEditFormData({});
    }, []);


    const handleEditInputChange = useCallback((field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);


    const handleSaveEdit = async (task) => {
        try {
            if (!editFormData['Task ID']) {
                alert('Error: Task ID is missing');
                return;
            }

            setLoading(true);

            const formData = new URLSearchParams();
            formData.append('action', 'updateTask');
            formData.append('sheetName', CONFIG.DELEGATION_SHEET);
            formData.append('taskId', editFormData['Task ID']);
            formData.append('rowData', JSON.stringify({
                Department: editFormData.Department || '',
                'Given By': editFormData['Given By'] || '',
                Name: editFormData.Name || '',
                'Task Description': editFormData['Task Description'] || '',
                'Task Start Date': editFormData['Task Start Date'] || '',
                Freq: editFormData.Freq || '',
                'Enable Reminders': editFormData['Enable Reminders'] || '',
                'Require Attachment': editFormData['Require Attachment'] || ''
            }));

            console.log("Sending update:", formData.toString());

            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
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
                setDelegationTasks(prevTasks => 
                    prevTasks.map(t => 
                        t._id === task._id ? { ...t, ...editFormData } : t
                    )
                );
                setEditingRow(null);
                setEditFormData({});
                alert('Task updated successfully!');
                setTimeout(() => fetchData(), 500);
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


    // Delete functionality
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

            const formData = new URLSearchParams();
            formData.append('action', 'deleteTaskByID');
            formData.append('sheetName', CONFIG.DELEGATION_SHEET);
            formData.append('taskId', task['Task ID']);

            console.log("Sending delete:", formData.toString());

            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
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
                setDelegationTasks(prevTasks => prevTasks.filter(t => t._id !== task._id));
                alert('Task deleted successfully!');
                setTimeout(() => fetchData(), 500);
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


    // Sort function
    const requestSort = useCallback((key) => {
        if (loading) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, [loading]);


    // Dropdown toggle
    const toggleDropdown = useCallback((dropdown) => {
        setDropdownOpen(prev => ({
            ...prev,
            [dropdown]: !prev[dropdown]
        }));
    }, []);


    // Filter handlers
    const handleNameFilterSelect = useCallback((name) => {
        setNameFilter(name);
        setDropdownOpen(prev => ({ ...prev, name: false }));
    }, [setNameFilter]);


    const handleFrequencyFilterSelect = useCallback((freq) => {
        setFreqFilter(freq);
        setDropdownOpen(prev => ({ ...prev, frequency: false }));
    }, [setFreqFilter]);


    const clearNameFilter = useCallback(() => {
        setNameFilter('');
        setDropdownOpen(prev => ({ ...prev, name: false }));
    }, [setNameFilter]);


    const clearFrequencyFilter = useCallback(() => {
        setFreqFilter('');
        setDropdownOpen(prev => ({ ...prev, frequency: false }));
    }, [setFreqFilter]);


    // Memoized derived data
    const { allNames, allFrequencies, filteredTasks } = useMemo(() => {
        const names = [...new Set(delegationTasks.map(task => task.Name))]
            .filter(name => name?.trim());

        const freqs = [...new Set(delegationTasks.map(task => task.Freq))]
            .filter(freq => freq?.trim());

        const filtered = delegationTasks
            .filter(task => {
                const nameMatch = !nameFilter || task.Name === nameFilter;
                const freqMatch = !freqFilter || task.Freq === freqFilter;
                const searchMatch = !searchTerm || Object.values(task).some(
                    value => value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
                );
                return nameMatch && freqMatch && searchMatch;
            })
            .sort((a, b) => {
                if (!sortConfig.key) return 0;
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                return sortConfig.direction === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            });

        return { allNames: names, allFrequencies: freqs, filteredTasks: filtered };
    }, [delegationTasks, nameFilter, freqFilter, searchTerm, sortConfig]);


    // Table columns config
    const columns = useMemo(() => [
         { key: null, label: 'Actions', minWidth: 'min-w-[120px]' },
        { key: 'Timestamp', label: 'Timestamp' },
        { key: 'Task ID', label: 'Task ID' },
        { key: 'Department', label: 'Department' },
        { key: 'Given By', label: 'Given By' },
        { key: 'Name', label: 'Name' },
        { key: 'Task Description', label: 'Task Description', minWidth: 'min-w-[300px]' },
        { key: 'Task Start Date', label: 'Start Date', bg: 'bg-yellow-50' },
        { key: 'Freq', label: 'Frequency' },
        { key: 'Enable Reminders', label: 'Reminders' },
        { key: 'Require Attachment', label: 'Attachment' },
        
    ], []);


    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);


    if (!currentUser || !userRole) {
        return (
            <div className="mt-4 bg-yellow-50 p-4 rounded-md text-yellow-800 text-center">
                Loading delegation tasks...
            </div>
        );
    }


    return (
        <div className="mt-4 rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                <h2 className="text-purple-700 font-medium">
                    {userRole === 'admin' ? 'All Delegation Tasks' : 'My Delegation Tasks'}
                </h2>
                <p className="text-purple-600 text-sm">
                    {userRole === 'admin'
                        ? `Showing ${filteredTasks.length} delegation tasks from all users`
                        : `Showing ${filteredTasks.length} delegation tasks for ${currentUser}`
                    }
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-800 text-center">
                    {error}{" "}
                    <button
                        onClick={fetchData}
                        className="underline ml-2 hover:text-red-600"
                    >
                        Try again
                    </button>
                </div>
            )}

            <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                            {columns.map((column) => (
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
                                <td colSpan={columns.length} className="px-6 py-8 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                                        <p className="text-purple-600">Loading delegation data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingRow === task._id ? (
                                            <input
                                                type="text"
                                                value={editFormData.Timestamp || ''}
                                                onChange={(e) => handleEditInputChange('Timestamp', e.target.value)}
                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                disabled
                                            />
                                        ) : (
                                            task.Timestamp || "—"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {task['Task ID'] || "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                                value={editFormData['Task Start Date'] || ''}
                                                onChange={(e) => handleEditInputChange('Task Start Date', e.target.value)}
                                                placeholder="DD/MM/YYYY"
                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            task['Task Start Date'] || "—"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingRow === task._id ? (
                                            <select
                                                value={editFormData.Freq || ''}
                                                onChange={(e) => handleEditInputChange('Freq', e.target.value)}
                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value="">Select</option>
                                                <option value="Daily">Daily</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Yearly">Yearly</option>
                                                <option value="One Time">One Time</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs ${task.Freq === 'Daily' ? 'bg-blue-100 text-blue-800' :
                                                task.Freq === 'Weekly' ? 'bg-green-100 text-green-800' :
                                                    task.Freq === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {task.Freq || "—"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingRow === task._id ? (
                                            <input
                                                type="text"
                                                value={editFormData['Enable Reminders'] || ''}
                                                onChange={(e) => handleEditInputChange('Enable Reminders', e.target.value)}
                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            task['Enable Reminders'] || "—"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {editingRow === task._id ? (
                                            <input
                                                type="text"
                                                value={editFormData['Require Attachment'] || ''}
                                                onChange={(e) => handleEditInputChange('Require Attachment', e.target.value)}
                                                className="w-full px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        ) : (
                                            task['Require Attachment'] || "—"
                                        )}
                                    </td>
                                   
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                                    {searchTerm || nameFilter || freqFilter
                                        ? "No delegation tasks matching your filters"
                                        : userRole === 'admin' ? "No delegation tasks available" : "No delegation tasks assigned to you"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
