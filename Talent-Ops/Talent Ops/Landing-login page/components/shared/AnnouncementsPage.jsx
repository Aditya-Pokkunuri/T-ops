import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Calendar, MapPin, Clock, Users, User, X, Plus } from 'lucide-react';

const AnnouncementsPage = ({ userRole, userId }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventParticipants, setEventParticipants] = useState({ loading: false, names: [], type: '' });

    // Add Event State
    const [showAddModal, setShowAddModal] = useState(false);
    const [eventScope, setEventScope] = useState('all'); // 'all', 'team', 'employee'
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [allTeams, setAllTeams] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Form Data
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        message: ''
    });

    const isAuthorized = ['executive', 'manager', 'team_lead', 'employee'].includes(userRole);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch User Profile to get team_id
                let userTeamId = null;
                if (userRole !== 'executive' && userRole !== 'manager') {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('team_id')
                        .eq('id', userId)
                        .single();
                    if (profile) userTeamId = profile.team_id;
                }

                // 2. Fetch Announcements
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .order('event_date', { ascending: true });

                if (error) throw error;

                if (data) {
                    const filtered = data.filter(a => {
                        // All Logic - Visible to Everyone
                        if (a.event_for === 'all') return true;

                        // Executives and Managers see all
                        if (userRole === 'executive' || userRole === 'manager') return true;

                        let targetTeams = [];
                        let targetEmployees = [];
                        try {
                            targetTeams = typeof a.teams === 'string' ? JSON.parse(a.teams) : (a.teams || []);
                            targetEmployees = typeof a.employees === 'string' ? JSON.parse(a.employees) : (a.employees || []);
                        } catch (e) {
                            console.error("Error parsing targets", e);
                        }

                        if (a.event_for === 'team') {
                            return targetTeams.includes(userTeamId);
                        } else if (a.event_for === 'specific' || a.event_for === 'employee') {
                            return targetEmployees.includes(userId);
                        }
                        return false;
                    });

                    // Sort Logic: Upcoming (Ascending) -> Past (Descending)
                    const now = new Date(); // Full current timestamp

                    const upcoming = [];
                    const past = [];

                    filtered.forEach(event => {
                        // Construct full date object from date + time
                        const dateTimeString = `${event.event_date}T${event.event_time}`;
                        const eventDateTime = new Date(dateTimeString);

                        if (eventDateTime >= now) {
                            upcoming.push(event);
                        } else {
                            past.push(event);
                        }
                    });

                    // Sort Upcoming: Nearest first (Ascending)
                    upcoming.sort((a, b) => {
                        const dateA = new Date(`${a.event_date}T${a.event_time}`);
                        const dateB = new Date(`${b.event_date}T${b.event_time}`);
                        return dateA - dateB;
                    });

                    // Sort Past: Most recent past first (Descending)
                    past.sort((a, b) => {
                        const dateA = new Date(`${a.event_date}T${a.event_time}`);
                        const dateB = new Date(`${b.event_date}T${b.event_time}`);
                        return dateB - dateA;
                    });

                    setAnnouncements([...upcoming, ...past]);
                }
            } catch (err) {
                console.error('Error loading announcements:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userRole, userId, showAddModal]); // Reload when modal closes (after add)

    // Fetch Participants for Selected Event
    useEffect(() => {
        const fetchParticipants = async () => {
            if (!selectedEvent) return;

            setEventParticipants({ loading: true, names: [], type: selectedEvent.event_for });

            try {
                if (selectedEvent.event_for === 'all') {
                    setEventParticipants({ loading: false, names: ['All Employees'], type: 'all' });
                    return;
                }

                if (selectedEvent.event_for === 'team') {
                    let teamIds = [];
                    try {
                        teamIds = typeof selectedEvent.teams === 'string' ? JSON.parse(selectedEvent.teams) : (selectedEvent.teams || []);
                    } catch (e) { console.error("Error parsing teams", e); }

                    if (teamIds.length > 0) {
                        const { data: teams } = await supabase
                            .from('teams')
                            .select('team_name')
                            .in('id', teamIds);

                        if (teams) {
                            setEventParticipants({
                                loading: false,
                                names: teams.map(t => t.team_name),
                                type: 'team'
                            });
                        }
                    } else {
                        setEventParticipants({ loading: false, names: [], type: 'team' });
                    }
                } else if (selectedEvent.event_for === 'employee' || selectedEvent.event_for === 'specific') { // Handle both just in case
                    let empIds = [];
                    try {
                        empIds = typeof selectedEvent.employees === 'string' ? JSON.parse(selectedEvent.employees) : (selectedEvent.employees || []);
                    } catch (e) { console.error("Error parsing employees", e); }

                    if (empIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('full_name')
                            .in('id', empIds);

                        if (profiles) {
                            setEventParticipants({
                                loading: false,
                                names: profiles.map(p => p.full_name),
                                type: 'employee'
                            });
                        }
                    } else {
                        setEventParticipants({ loading: false, names: [], type: 'employee' });
                    }
                }

            } catch (err) {
                console.error("Error fetching participants", err);
                setEventParticipants({ loading: false, names: ['Error loading participants'], type: 'error' });
            }
        };

        fetchParticipants();
    }, [selectedEvent]);


    // Fetch Options (Teams/Employees) for Add Modal
    useEffect(() => {
        const fetchOptions = async () => {
            if (!isAuthorized) return;
            setLoadingOptions(true);
            try {
                // Fetch Teams
                const { data: teams } = await supabase.from('teams').select('id, team_name');
                if (teams) setAllTeams(teams.map(t => ({ id: t.id, name: t.team_name })));

                // Fetch Employees
                const { data: emps } = await supabase.from('profiles').select('id, full_name, team_id');
                if (emps) setAllEmployees(emps.map(e => ({ id: e.id, name: e.full_name, teamId: e.team_id })));

            } catch (e) {
                console.error("Error fetching options", e);
            } finally {
                setLoadingOptions(false);
            }
        };

        if (showAddModal) {
            fetchOptions();
        }
    }, [showAddModal, isAuthorized]);


    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newEvent.title,
                event_date: newEvent.date,
                event_time: newEvent.time,
                location: newEvent.location,
                message: newEvent.message,
                event_for: eventScope === 'my_team' ? 'employee' : eventScope, // 'all', 'team', 'employee'
                teams: eventScope === 'team' ? selectedTeams : [],
                employees: (eventScope === 'employee' || eventScope === 'my_team') ? selectedEmployees : [],
            };

            const { error } = await supabase
                .from('announcements')
                .insert(payload);

            if (error) throw error;

            alert('Event added successfully!');
            setShowAddModal(false);
            setNewEvent({ title: '', date: '', time: '', location: '', message: '' });
            setEventScope('all');
            setSelectedTeams([]);
            setSelectedEmployees([]);

        } catch (err) {
            console.error("Error adding event:", err);
            alert("Failed to add event: " + err.message);
        }
    };

    if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading announcements...</div>;

    return (
        <div style={{ position: 'relative' }}>
            {/* Header / Actions Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>
                        Dashboard / Announcements
                    </p>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', lineHeight: 1.2 }}>
                        Announcements
                    </h1>
                </div>

                {isAuthorized && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#0f172a',
                            color: 'white',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.2s',
                            height: 'fit-content' // visual alignment
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                    >
                        <Plus size={18} />
                        Add Event
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {announcements.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No announcements found</p>
                        <p style={{ fontSize: '0.9rem' }}>You're all caught up!</p>
                    </div>
                ) : (
                    announcements.map(event => (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', lineHeight: 1.4, wordBreak: 'break-word' }}>{event.title}</h3>
                                <span style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    whiteSpace: 'nowrap',
                                    marginLeft: '12px'
                                }}>
                                    {event.event_for === 'all'
                                        ? 'All Employees'
                                        : (event.event_for === 'team' ? 'Team Event' : 'Employee Event')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <Calendar size={16} color="#3b82f6" />
                                    <span style={{ fontWeight: 500, color: '#334155' }}>{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <Clock size={16} color="#f59e0b" />
                                    <span>{event.event_time}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <MapPin size={16} color="#ef4444" />
                                    <span>{event.location}</span>
                                </div>

                                {/* Scope/Audience Indicator */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f8fafc', color: '#94a3b8', fontSize: '0.8rem' }}>
                                    {event.event_for === 'all' ? <Users size={14} /> : (event.event_for === 'team' ? <Users size={14} /> : <User size={14} />)}
                                    <span>
                                        {event.event_for === 'all'
                                            ? 'Visible to everyone'
                                            : (event.event_for === 'team'
                                                ? 'Visible to selected teams'
                                                : 'Visible to selected employees')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setSelectedEvent(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            width: '500px',
                            maxWidth: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative',
                            overflow: 'hidden',
                            animation: 'slideUp 0.3s ease-out',
                            maxHeight: '90vh', // Prevent overflow on small screens
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Modal Header with Color Band */}
                        <div style={{
                            height: '16px',
                            background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                            width: '100%',
                            flexShrink: 0
                        }}></div>

                        <div style={{ padding: '32px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>{selectedEvent.title}</h2>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        flexShrink: 0,
                                        marginLeft: '16px'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Date and Time Block */}
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                                            <Calendar size={18} color="#3b82f6" />
                                            {new Date(selectedEvent.event_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                                            <Clock size={18} color="#f59e0b" />
                                            {selectedEvent.event_time}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                                        <MapPin size={18} color="#ef4444" />
                                        {selectedEvent.location}
                                    </div>
                                </div>

                                {/* Audience & Participants */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 500 }}>
                                        {selectedEvent.event_for === 'all' ? <Users size={18} color="#64748b" /> : <User size={18} color="#64748b" />}
                                        {selectedEvent.event_for === 'all'
                                            ? 'Visible to everyone'
                                            : (selectedEvent.event_for === 'team' ? 'Visible to specific teams' : 'Visible to specific employees')}
                                    </div>

                                    {/* Members List */}
                                    {eventParticipants.loading ? (
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Loading participants...</p>
                                    ) : (
                                        eventParticipants.names.length > 0 && selectedEvent.event_for !== 'all' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                                {eventParticipants.names.map((name, idx) => (
                                                    <span key={idx} style={{
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#f1f5f9',
                                                        color: '#475569',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontWeight: 500
                                                    }}>
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Description / Message */}
                                {selectedEvent.message && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</span>
                                        <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {selectedEvent.message}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#1e293b',
                                        color: 'white',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Event Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowAddModal(false)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#fff',
                            padding: '32px',
                            borderRadius: '24px',
                            width: '450px',
                            maxWidth: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Add Event</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input
                                type="text"
                                placeholder="Event Title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', width: "100%", background: '#f8fafc' }}
                            />

                            {/* Scope Selection */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>Who is this event for?</label>

                                {['executive', 'manager'].includes(userRole) ? (
                                    /* Exec/Manager Options */
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                value="all"
                                                checked={eventScope === 'all'}
                                                onChange={() => setEventScope('all')}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            All Employees (Broadcast)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                value="team"
                                                checked={eventScope === 'team'}
                                                onChange={() => setEventScope('team')}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            Specific Team(s)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                value="employee"
                                                checked={eventScope === 'employee'}
                                                onChange={() => setEventScope('employee')}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            Specific Employee(s)
                                        </label>
                                    </div>
                                ) : (
                                    /* Team Lead / Employee Options */
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                value="my_team"
                                                checked={eventScope === 'my_team'}
                                                onChange={() => { setEventScope('my_team'); setSelectedEmployees([]); }}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            My Team
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="radio"
                                                name="scope"
                                                value="employee"
                                                checked={eventScope === 'employee'}
                                                onChange={() => { setEventScope('employee'); setSelectedEmployees([]); }}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            All Employees
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Lists for Exec/Manager */}
                            {['executive', 'manager'].includes(userRole) && !loadingOptions && eventScope === 'team' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' }}>
                                    {allTeams.length > 0 ? allTeams.map(team => (
                                        <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTeams.includes(team.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedTeams([...selectedTeams, team.id]);
                                                    else setSelectedTeams(selectedTeams.filter(id => id !== team.id));
                                                }}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            {team.name}
                                        </label>
                                    )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No teams found</p>}
                                </div>
                            )}

                            {['executive', 'manager'].includes(userRole) && !loadingOptions && eventScope === 'employee' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' }}>
                                    {allEmployees.length > 0 ? allEmployees.map(emp => (
                                        <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(emp.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                                                    else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                                                }}
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                            {emp.name}
                                        </label>
                                    )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No employees found</p>}
                                </div>
                            )}

                            {/* Lists for Team Lead / Employee */}
                            {!['executive', 'manager'].includes(userRole) && !loadingOptions && (
                                <>
                                    {eventScope === 'my_team' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' }}>
                                            {/* Select All for My Team */}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        allEmployees.filter(e => e.teamId === userTeamId).length > 0 &&
                                                        selectedEmployees.length === allEmployees.filter(e => e.teamId === userTeamId).length
                                                    }
                                                    onChange={(e) => {
                                                        const myMembers = allEmployees.filter(e => e.teamId === userTeamId);
                                                        if (e.target.checked) setSelectedEmployees(myMembers.map(m => m.id));
                                                        else setSelectedEmployees([]);
                                                    }}
                                                    style={{ accentColor: '#3b82f6' }}
                                                />
                                                Select All
                                            </label>

                                            {allEmployees.filter(e => e.teamId === userTeamId).map(emp => (
                                                <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                                                            else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                                                        }}
                                                        style={{ accentColor: '#3b82f6' }}
                                                    />
                                                    {emp.name}
                                                </label>
                                            ))}
                                            {allEmployees.filter(e => e.teamId === userTeamId).length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No team members found</p>}
                                        </div>
                                    )}

                                    {eventScope === 'employee' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#f8fafc' }}>
                                            {allEmployees.length > 0 ? allEmployees.map(emp => (
                                                <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.includes(emp.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                                                            else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                                                        }}
                                                        style={{ accentColor: '#3b82f6' }}
                                                    />
                                                    {emp.name}
                                                </label>
                                            )) : <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No employees found</p>}
                                        </div>
                                    )}
                                </>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="date"
                                    required
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', width: "100%" }}
                                />
                                <input
                                    type="time"
                                    required
                                    value={newEvent.time}
                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', width: "100%" }}
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Location"
                                required
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', width: "100%" }}
                            />

                            <textarea
                                placeholder="Event Details / Message (Optional)"
                                rows="3"
                                value={newEvent.message}
                                onChange={(e) => setNewEvent({ ...newEvent, message: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', width: "100%", resize: 'vertical', fontFamily: 'inherit' }}
                            />

                            <button type="submit" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>Save Event</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;
