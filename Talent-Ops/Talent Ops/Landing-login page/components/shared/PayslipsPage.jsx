import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Download, FileText, Calendar, DollarSign, Plus, X, Upload } from 'lucide-react';
import DataTable from '../employee/components/UI/DataTable';

const PayslipsPage = ({ userRole, userId, addToast }) => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employeeId: '',
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        amount: '',
        storageUrl: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Safe toast function
    const showToast = (message, type) => {
        if (addToast) {
            addToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, [userId, userRole, refreshTrigger]);

    // Realtime Payslips
    useEffect(() => {
        const channel = supabase
            .channel('payslips-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payslips' }, (payload) => {
                console.log('Realtime Payslip Update:', payload);
                setRefreshTrigger(prev => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPayslips = async () => {
        // Prevent fetching if core user data is missing
        if (!userId || !userRole) {
            console.log('Waiting for user ID and Role...');
            return;
        }

        try {
            setLoading(true);

            // Role-based filtering
            const normalizedRole = userRole ? userRole.toLowerCase().trim() : '';

            // Fetch payslips based on role
            let payslipsQuery = supabase
                .from('payslips')
                .select('*')
                .order('month', { ascending: false });

            // Check if user is Executive or Manager (they see ALL payslips)
            const isExecutive = normalizedRole.includes('executive');
            const isManager = normalizedRole.includes('manager');
            const isTeamLead = normalizedRole === 'team_lead';
            const isEmployee = normalizedRole === 'employee';

            // Only filter for employees and team leads
            if (isEmployee || isTeamLead) {
                payslipsQuery = payslipsQuery.eq('employee_id', userId);
            } else if (isExecutive || isManager) {
                // No filter - fetch all payslips
            } else {
                console.warn('⚠️ Unknown role, defaulting to user-specific payslips');
                payslipsQuery = payslipsQuery.eq('employee_id', userId);
            }

            const { data: payslipsData, error: payslipsError } = await payslipsQuery;

            if (payslipsError) {
                console.error('Error fetching payslips:', payslipsError);
                showToast('Failed to load payslips: ' + payslipsError.message, 'error');
                return;
            }

            if (!payslipsData || payslipsData.length === 0) {
                setPayslips([]);
                setLoading(false);
                return;
            }

            // Get unique employee IDs from payslips to fetch their profiles
            const employeeIds = [...new Set(payslipsData.map(p => p.employee_id))];

            // Fetch profiles for these employees
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .in('id', employeeIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Create a map of employee_id to profile
            const profileMap = {};
            if (profilesData) {
                profilesData.forEach(profile => {
                    profileMap[profile.id] = profile;
                });
            }

            // Transform data for display
            const transformedData = payslipsData.map(payslip => ({
                id: payslip.id,
                employee_id: payslip.employee_id,
                name: profileMap[payslip.employee_id]?.full_name || 'Unknown',
                email: profileMap[payslip.employee_id]?.email || 'N/A',
                role: profileMap[payslip.employee_id]?.role || 'N/A',
                month: payslip.month || 'N/A',
                amount: payslip.amount ? `₹${Number(payslip.amount).toLocaleString()}` : 'N/A',
                status: 'Paid',
                storage_url: payslip.storage_url
            }));

            setPayslips(transformedData);
        } catch (error) {
            console.error('Unexpected error fetching payslips:', error);
            showToast('An unexpected error occurred while loading payslips', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role, email')
                .order('full_name');

            if (error) throw error;
            setAllEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            showToast('Failed to load employee list', 'error');
        }
    };

    const handleOpenAddModal = () => {
        fetchEmployees();
        setShowAddModal(true);
    };

    const handleAddPayslip = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate
            if (!formData.employeeId || !formData.amount || !formData.month) {
                throw new Error('Please fill in all required fields');
            }

            // Format YYYY-MM to Mon-YYYY
            const [year, month] = formData.month.split('-');
            const dateObj = new Date(year, month - 1);
            const formattedMonth = dateObj.toLocaleString('default', { month: 'short' }) + '-' + year;

            const { error } = await supabase
                .from('payslips')
                .insert({
                    employee_id: formData.employeeId,
                    month: formattedMonth,
                    amount: parseFloat(formData.amount),
                    storage_url: formData.storageUrl
                });

            if (error) throw error;

            showToast('Payslip added successfully', 'success');
            setShowAddModal(false);
            setFormData({
                employeeId: '',
                month: new Date().toISOString().slice(0, 7),
                amount: '',
                storageUrl: ''
            });
            fetchPayslips(); // Refresh list

        } catch (error) {
            console.error('Error adding payslip:', error);
            showToast(error.message || 'Failed to add payslip', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (payslip) => {
        if (!payslip.storage_url) {
            showToast('Payslip file not available', 'warning');
            return;
        }

        try {
            showToast('Downloading payslip...', 'info');

            // Extract the simple filename (e.g., "file.pdf")
            const fileName = payslip.storage_url.split('/').pop();
            console.log('Target Filename:', fileName);

            // Define possible paths to check
            const pathsToTry = [
                fileName,                     // 1. Try root (most likely for new uploads)
                `payslips/${fileName}`,       // 2. Try subfolder (likely for old uploads)
                payslip.storage_url           // 3. Try exact DB string as fallback
            ];

            // Remove duplicates
            const uniquePaths = [...new Set(pathsToTry)];

            let blob = null;
            let lastError = null;

            // Try each path one by one
            for (const path of uniquePaths) {
                console.log(`Attempting download from: "${path}"`);
                const { data, error } = await supabase.storage
                    .from('payslips')
                    .download(path);

                if (!error && data) {
                    console.log('Success!');
                    blob = data;
                    break; // Found it!
                } else {
                    console.warn(`Failed (${path}):`, error?.message);
                    lastError = error;
                }
            }

            if (!blob) {
                console.error('All download attempts failed.');
                throw lastError || new Error('File not found in any expected location.');
            }

            // Create blob URL and force download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Payslip_${payslip.month || 'doc'}_${payslip.name || 'employee'}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            showToast('Payslip downloaded successfully', 'success');

        } catch (error) {
            console.error('Download Logic Error:', error);
            showToast(`Could not download: ${error.message || 'File missing'}`, 'error');
        }
    };

    const columns = [
        {
            header: 'Employee',
            accessor: 'name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#075985'
                    }}>
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, marginBottom: '2px' }}>{row.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Month',
            accessor: 'month',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 500 }}>{row.month}</span>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>{row.amount}</span>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                }}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Payslip',
            accessor: 'action',
            render: (row) => (
                <button
                    onClick={() => handleDownload(row)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#6d28d9';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c3aed';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                >
                    <Download size={16} />
                    Download
                </button>
            )
        }
    ];

    const isDebug = false; // Set to true to see debug info

    // Determine if user can add payslips
    const canAddPayslips = userRole && (userRole.toLowerCase().includes('executive') || userRole.toLowerCase().includes('manager'));

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: 'var(--text-secondary)'
            }}>
                <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '1.1rem' }}>Loading payslips...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Debug Banner */}
            {isDebug && (
                <div style={{
                    padding: '10px',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    marginBottom: '10px'
                }}>
                    <strong>Debug Info:</strong> Role="{userRole}" | ID="{userId}"
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        marginBottom: '4px'
                    }}>
                        <span>Dashboard</span>
                        <span>/</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {userRole === 'employee' || userRole === 'team_lead' ? 'Your Payslip' : 'Payslips'}
                        </span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {userRole === 'employee' || userRole === 'team_lead' ? 'Your Payslip' : 'Payslips'}
                    </h2>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Add Payslip Button */}
                    {canAddPayslips && (
                        <button
                            onClick={handleOpenAddModal}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#000',
                                color: '#fff',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <Plus size={20} />
                            Add Payslip
                        </button>
                    )}

                    <div style={{
                        padding: '12px 20px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            Total Payslips
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {payslips.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payslips Table */}
            {payslips.length > 0 ? (
                <DataTable
                    title="Payslip Records"
                    columns={columns}
                    data={payslips}
                />
            ) : (
                <div style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: '16px',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '2px dashed var(--border)'
                }}>
                    <FileText size={64} style={{ margin: '0 auto 20px', opacity: 0.3, color: 'var(--text-secondary)' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        No Payslips Found
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {userRole === 'employee' || userRole === 'team_lead'
                            ? 'You don\'t have any payslips yet.'
                            : 'No payslips have been generated yet.'}
                    </p>
                </div>
            )}

            {/* Add Payslip Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowAddModal(false)}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '32px',
                        borderRadius: '24px',
                        width: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add Payslip</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddPayslip} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Employee Select */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Select Employee</label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem',
                                        backgroundColor: '#f8fafc'
                                    }}
                                >
                                    <option value="">Select an employee...</option>
                                    {allEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Month & Year Select */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Pay Period (Month)</label>
                                <input
                                    type="month"
                                    required
                                    value={formData.month}
                                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            {/* Amount */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Amount (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}>₹</span>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        style={{
                                            padding: '12px 12px 12px 32px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '1rem',
                                            width: '100%'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Payslip Document Upload */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                                    Upload Payslip Document (Optional)
                                </label>

                                <div
                                    onClick={() => !uploading && document.getElementById('payslip-upload').click()}
                                    style={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        backgroundColor: formData.storageUrl ? '#f0fdf4' : '#f8fafc', // Green tint if file present
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!uploading) e.currentTarget.style.borderColor = '#7c3aed';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!uploading) e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    {uploading ? (
                                        <div style={{ color: '#7c3aed', fontWeight: 500 }}>
                                            Uploading...
                                        </div>
                                    ) : formData.storageUrl ? (
                                        <>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: '#dcfce7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <FileText size={20} color="#166534" />
                                            </div>
                                            <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>
                                                Document Attached
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                                                Click to replace
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <Upload size={20} color="#64748b" />
                                            </div>
                                            <span style={{ color: '#1e293b', fontWeight: 500, fontSize: '0.9rem' }}>
                                                Click to upload file
                                            </span>
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
                                                PDF or Image (Max 5MB)
                                            </span>
                                        </>
                                    )}
                                </div>

                                <input
                                    id="payslip-upload"
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        // Validate size (5MB)
                                        if (file.size > 5 * 1024 * 1024) {
                                            showToast('File size must be less than 5MB', 'error');
                                            return;
                                        }

                                        setUploading(true);
                                        try {
                                            const fileExt = file.name.split('.').pop();
                                            const fileName = `${formData.employeeId || 'temp'}_${Date.now()}.${fileExt}`;
                                            const filePath = fileName; // Upload to root of bucket

                                            const { error: uploadError } = await supabase.storage
                                                .from('payslips')
                                                .upload(filePath, file);

                                            if (uploadError) throw uploadError;

                                            // Store the path that matches the download logic (starts with payslips/)
                                            setFormData({ ...formData, storageUrl: filePath });
                                            showToast('File uploaded successfully', 'success');
                                        } catch (error) {
                                            console.error('Upload error:', error);
                                            showToast('Failed to upload file', 'error');
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        marginRight: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#f1f5f9',
                                        color: '#64748b',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#000',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        cursor: submitting ? 'wait' : 'pointer',
                                        opacity: submitting ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? 'Adding...' : 'Add Payslip'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayslipsPage;
