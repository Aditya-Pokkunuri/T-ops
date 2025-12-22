import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee: any;
}

interface Team {
    id: string;
    name: string;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, onSuccess, employee }) => {
    const [loading, setLoading] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'employee',
        team_id: '',
        newTeamName: '',
        monthly_leave_quota: 3,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && employee) {
            fetchTeams();
            // Populate form with employee data
            setFormData({
                full_name: employee.name || '',
                email: employee.email || '',
                role: employee.role || 'employee',
                team_id: employee.team_id || '',
                newTeamName: '',
                monthly_leave_quota: employee.monthly_leave_quota || 3,
            });
        }
    }, [isOpen, employee]);

    const fetchTeams = async () => {
        console.log('Fetching teams for edit modal...');
        const { data, error } = await supabase
            .from('teams')
            .select('id, team_name');

        if (error) {
            console.error('Error fetching teams:', error);
        } else {
            console.log('Teams fetched:', data);
            // Map team_name to name for consistency
            const mappedTeams = data?.map(team => ({
                id: team.id,
                name: team.team_name
            })) || [];
            setTeams(mappedTeams);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let teamId = formData.team_id;

            // If creating a new team, create it first
            if (formData.team_id === 'new' && formData.newTeamName) {
                const { data: newTeam, error: teamError } = await supabase
                    .from('teams')
                    .insert([{ team_name: formData.newTeamName }])
                    .select()
                    .single();

                if (teamError) {
                    throw new Error(`Failed to create team: ${teamError.message}`);
                }

                teamId = newTeam.id;
            } else if (formData.team_id === 'new') {
                throw new Error('Please enter a team name');
            }

            // Update employee profile
            console.log('Updating employee with data:', {
                full_name: formData.full_name,
                role: formData.role,
                team_id: teamId || null,
                monthly_leave_quota: formData.monthly_leave_quota,
            });

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    role: formData.role,
                    team_id: teamId || null,
                    monthly_leave_quota: formData.monthly_leave_quota,
                })
                .eq('id', employee.id);

            if (updateError) {
                console.error('Update error details:', updateError);
                throw new Error(updateError.message || 'Failed to update employee');
            }

            console.log('Employee updated successfully');

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while updating the employee');
            console.error('Error updating employee:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !employee) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: '16px',
                    width: '600px',
                    maxWidth: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Employee</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {/* Full Name */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                Email (Read-only)
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                readOnly
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    cursor: 'not-allowed',
                                }}
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                Role *
                            </label>
                            <select
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <option value="employee">Employee</option>
                                <option value="team_lead">Team Lead</option>
                                <option value="manager">Manager</option>
                                <option value="executive">Executive</option>
                            </select>
                        </div>

                        {/* Team */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                Team
                            </label>
                            <select
                                value={formData.team_id}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({ ...formData, team_id: value });
                                    if (value !== 'new') {
                                        setFormData(prev => ({ ...prev, newTeamName: '' }));
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <option value="">No Team</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                                <option value="new">+ Create New Team</option>
                            </select>
                        </div>

                        {/* New Team Name */}
                        {formData.team_id === 'new' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                    New Team Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.newTeamName || ''}
                                    onChange={(e) => setFormData({ ...formData, newTeamName: e.target.value })}
                                    placeholder="Enter team name..."
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                        )}

                        {/* Monthly Leave Quota */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                                Monthly Leave Quota
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={formData.monthly_leave_quota}
                                onChange={(e) => setFormData({ ...formData, monthly_leave_quota: parseInt(e.target.value) })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                fontSize: '0.875rem',
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    backgroundColor: loading ? 'var(--border)' : 'var(--primary)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Employee'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
