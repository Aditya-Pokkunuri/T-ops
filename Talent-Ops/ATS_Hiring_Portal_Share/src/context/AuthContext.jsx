import { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES, ROLE_PERMISSIONS, STORAGE_KEYS } from '../utils/constants';
import { getItems, addItem, updateItem, deleteItem, addAuditEntry } from '../services/supabaseService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load users and current user
        const loadUsers = async () => {
            try {
                const fetchedUsers = await getItems('users');
                setUsers(fetchedUsers);

                const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
                if (currentUserId) {
                    const currentUser = fetchedUsers.find(u => u.id === currentUserId);
                    if (currentUser) {
                        setUser(currentUser);
                    }
                }
            } catch (err) {
                console.error("Failed to load users:", err);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    // Switch user (for demo purposes)
    const switchUser = async (userId) => {
        const newUser = users.find(u => u.id === userId);
        if (newUser) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
            const prevUser = user;
            setUser(newUser);

            // Log Login Action
            // Note: Since this is a demo switch, we log it as 'LOGIN' performed by the new user
            await addAuditEntry({
                action: 'LOGIN',
                entity: 'users', // mapped to entity_type in service
                entityId: userId,
                userId: userId,
                details: `User switch: ${prevUser?.name || 'Unknown'} -> ${newUser.name}`
            });
        }
    };

    // Check if user has permission
    const hasPermission = (permission) => {
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role];
        return permissions ? permissions[permission] : false;
    };

    // Check if user is admin
    const isAdmin = () => {
        return user?.role === USER_ROLES.ADMIN;
    };

    // Check if user is HR
    const isHR = () => {
        return user?.role === USER_ROLES.HR || user?.role === USER_ROLES.ADMIN;
    };

    // Check if user is interviewer
    const isInterviewer = () => {
        return user?.role === USER_ROLES.INTERVIEWER;
    };

    // Get all users (for admin/HR)
    const getAllUsers = () => {
        return users;
    };

    // Add new user (admin only)
    const addUser = async (userData) => {
        try {
            const newUser = await addItem('users', userData, user?.id);
            setUsers(prev => [newUser, ...prev]);
            return newUser;
        } catch (err) {
            console.error("Failed to add user:", err);
            throw err;
        }
    };

    // Update user (admin only)
    const updateUser = async (userId, updates) => {
        try {
            const updatedUser = await updateItem('users', userId, updates, user?.id);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

            // Update current user if it's the same user
            if (user?.id === userId) {
                setUser(updatedUser);
            }
            return updatedUser;
        } catch (err) {
            console.error("Failed to update user:", err);
            throw err;
        }
    };

    // Delete user (admin only)
    const deleteUser = async (userId) => {
        // Can't delete current user
        if (user?.id === userId) return false;

        try {
            await deleteItem('users', userId, user?.id);
            setUsers(prev => prev.filter(u => u.id !== userId));
            return true;
        } catch (err) {
            console.error("Failed to delete user:", err);
            throw err;
        }
    };

    const value = {
        user,
        users,
        loading,
        switchUser,
        hasPermission,
        isAdmin,
        isHR,
        isInterviewer,
        getAllUsers,
        addUser,
        updateUser,
        deleteUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
