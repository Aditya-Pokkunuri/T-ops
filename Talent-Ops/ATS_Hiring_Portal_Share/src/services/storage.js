import { STORAGE_KEYS } from '../utils/constants';
import { generateId } from '../utils/helpers';

// Initialize storage with default data if empty
export const initializeStorage = () => {
    // Initialize users
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        const defaultUsers = [
            {
                id: 'user_admin',
                name: 'Admin User',
                email: 'admin@company.com',
                role: 'admin',
                avatar: null,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_hr',
                name: 'Sarah Johnson',
                email: 'sarah@company.com',
                role: 'hr',
                avatar: null,
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_interviewer',
                name: 'Michael Chen',
                email: 'michael@company.com',
                role: 'interviewer',
                avatar: null,
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }

    // Set default current user
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'user_admin');
    }

    // Initialize other storage if empty
    const keysToInit = [STORAGE_KEYS.JOBS, STORAGE_KEYS.CANDIDATES, STORAGE_KEYS.INTERVIEWS, STORAGE_KEYS.FEEDBACK, STORAGE_KEYS.OFFERS, STORAGE_KEYS.AUDIT_LOG];

    keysToInit.forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify([]));
        }
    });

    // Add sample data for demo
    if (getItems(STORAGE_KEYS.JOBS).length === 0) {
        initializeSampleData();
    }
};

// Initialize sample data for demo
const initializeSampleData = () => {
    const sampleJobs = [
        {
            id: generateId(),
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            location: 'Remote',
            experience: 'senior',
            skills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
            description: 'We are looking for a Senior Frontend Developer to join our team and help build amazing user experiences.',
            status: 'published',
            applicants: 12,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            title: 'Product Manager',
            department: 'Product',
            location: 'New York, NY',
            experience: 'mid',
            skills: ['Product Management', 'Agile', 'Data Analysis'],
            description: 'Join our product team to drive innovation and deliver exceptional products to our customers.',
            status: 'published',
            applicants: 8,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            title: 'UX Designer',
            department: 'Design',
            location: 'San Francisco, CA',
            experience: 'mid',
            skills: ['UI/UX Design', 'Figma', 'User Research'],
            description: 'Create beautiful and intuitive designs that delight our users.',
            status: 'draft',
            applicants: 0,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    const sampleCandidates = [
        {
            id: generateId(),
            name: 'Emily Rodriguez',
            email: 'emily@email.com',
            phone: '+1 555-0101',
            jobId: sampleJobs[0].id,
            jobTitle: sampleJobs[0].title,
            stage: 'interview',
            resumeUrl: null,
            skills: ['React', 'JavaScript', 'Node.js'],
            experience: '6 years',
            notes: 'Strong technical background, good communication skills.',
            appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'James Wilson',
            email: 'james@email.com',
            phone: '+1 555-0102',
            jobId: sampleJobs[0].id,
            jobTitle: sampleJobs[0].title,
            stage: 'shortlisted',
            resumeUrl: null,
            skills: ['React', 'TypeScript', 'AWS'],
            experience: '4 years',
            notes: 'Promising candidate, schedule technical round.',
            appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'Lisa Chen',
            email: 'lisa@email.com',
            phone: '+1 555-0103',
            jobId: sampleJobs[0].id,
            jobTitle: sampleJobs[0].title,
            stage: 'applied',
            resumeUrl: null,
            skills: ['Vue', 'JavaScript', 'CSS'],
            experience: '3 years',
            notes: '',
            appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: generateId(),
            name: 'David Park',
            email: 'david@email.com',
            phone: '+1 555-0104',
            jobId: sampleJobs[1].id,
            jobTitle: sampleJobs[1].title,
            stage: 'offer',
            resumeUrl: null,
            skills: ['Product Management', 'Scrum', 'SQL'],
            experience: '5 years',
            notes: 'Excellent candidate, proceed with offer.',
            appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    const sampleInterviews = [
        {
            id: generateId(),
            candidateId: sampleCandidates[0].id,
            candidateName: sampleCandidates[0].name,
            jobId: sampleJobs[0].id,
            jobTitle: sampleJobs[0].title,
            panelType: 'technical',
            interviewers: ['user_interviewer'],
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            mode: 'online',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            status: 'scheduled',
            notes: '',
            createdAt: new Date().toISOString()
        }
    ];

    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(sampleJobs));
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(sampleCandidates));
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(sampleInterviews));
};

// Get items from storage
export const getItems = (key) => {
    try {
        const items = localStorage.getItem(key);
        return items ? JSON.parse(items) : [];
    } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return [];
    }
};

// Get single item by id
export const getItemById = (key, id) => {
    const items = getItems(key);
    return items.find(item => item.id === id) || null;
};

// Save items to storage
export const saveItems = (key, items) => {
    try {
        localStorage.setItem(key, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        return false;
    }
};

// Add item with audit log
export const addItem = (key, item, userId) => {
    const items = getItems(key);
    const newItem = {
        ...item,
        id: item.id || generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    saveItems(key, items);

    // Add audit log
    addAuditEntry({
        action: 'CREATE',
        entity: key,
        entityId: newItem.id,
        userId,
        details: `Created ${key.replace('ats_', '')}: ${newItem.title || newItem.name || newItem.id}`
    });

    return newItem;
};

// Update item with audit log
export const updateItem = (key, id, updates, userId) => {
    const items = getItems(key);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    const updatedItem = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    items[index] = updatedItem;
    saveItems(key, items);

    // Add audit log
    addAuditEntry({
        action: 'UPDATE',
        entity: key,
        entityId: id,
        userId,
        details: `Updated ${key.replace('ats_', '')}: ${updatedItem.title || updatedItem.name || updatedItem.id}`,
        changes: updates
    });

    return updatedItem;
};

// Delete item with audit log
export const deleteItem = (key, id, userId) => {
    const items = getItems(key);
    const item = items.find(i => i.id === id);
    const filtered = items.filter(item => item.id !== id);
    saveItems(key, filtered);

    // Add audit log
    if (item) {
        addAuditEntry({
            action: 'DELETE',
            entity: key,
            entityId: id,
            userId,
            details: `Deleted ${key.replace('ats_', '')}: ${item.title || item.name || id}`
        });
    }

    return true;
};

// Add audit log entry
export const addAuditEntry = (entry) => {
    const auditLog = getItems(STORAGE_KEYS.AUDIT_LOG);
    auditLog.unshift({
        id: generateId(),
        ...entry,
        timestamp: new Date().toISOString()
    });

    // Keep only last 1000 entries
    if (auditLog.length > 1000) {
        auditLog.splice(1000);
    }

    saveItems(STORAGE_KEYS.AUDIT_LOG, auditLog);
};

// Get audit log
export const getAuditLog = (filters = {}) => {
    let log = getItems(STORAGE_KEYS.AUDIT_LOG);

    if (filters.entity) {
        log = log.filter(entry => entry.entity === filters.entity);
    }

    if (filters.entityId) {
        log = log.filter(entry => entry.entityId === filters.entityId);
    }

    if (filters.userId) {
        log = log.filter(entry => entry.userId === filters.userId);
    }

    if (filters.action) {
        log = log.filter(entry => entry.action === filters.action);
    }

    return log;
};

// Get current user
export const getCurrentUser = () => {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const users = getItems(STORAGE_KEYS.USERS);
    return users.find(u => u.id === userId) || users[0];
};

// Set current user
export const setCurrentUser = (userId) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
};

// Clear all data (for testing)
export const clearAllData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};
