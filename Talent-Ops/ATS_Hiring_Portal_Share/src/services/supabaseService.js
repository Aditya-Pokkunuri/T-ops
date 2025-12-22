import { supabase } from '../lib/supabase';

// Helper to map Supabase data to app format (if needed, e.g. snake_case to camelCase)
// For now, we assume schema matches or we adjust keys.
// Our schema.sql uses snake_case, but app uses camelCase. We'll map them here.

const toCamel = (o, table) => {
    if (!o) return o;
    const newO = {};
    for (const key in o) {
        let newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

        // Specific Mappings for User's DB Schema
        if (key === 'applied_date') newKey = 'appliedAt';
        if (key === 'requirements' && !o.skills) newKey = 'skills';

        // Context-aware mappings
        if (table === 'jobs' && key === 'type') newKey = 'employmentType';
        if (table === 'interviews' && key === 'type') newKey = 'panelType';
        if (table === 'interviews' && key === 'date') newKey = 'scheduledAt';

        // Audit Log
        if (table === 'audit_log' && key === 'entity_type') newKey = 'entity';

        // Virtual Columns via Notes (Restore)
        if (table === 'interviews' && key === 'notes' && typeof o[key] === 'string' && o[key].includes('__METADATA__')) {
            const parts = o[key].split('__METADATA__\n');
            newO['notes'] = parts[0].trim();
            try {
                const metadata = JSON.parse(parts[1]);
                Object.assign(newO, metadata);
            } catch (e) {
                console.error("Failed to parse metadata from notes", e);
            }
            continue; // Skip default assignment for notes
        }

        newO[newKey] = o[key];
    }
    return newO;
};

const toSnake = (o, table) => {
    if (!o) return o;
    const newO = {};
    for (const key in o) {
        let newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

        if (table === 'interviews' && key === 'scheduledAt') {
            // Map scheduledAt to 'date' AND 'time'
            newO['date'] = o[key];
            // Fix: Extract time part only (e.g. 14:30:00.000)
            // Assumes o[key] is ISO string (2023-10-10T14:30:00.000Z)
            if (o[key] && o[key].includes('T')) {
                newO['time'] = o[key].split('T')[1].replace('Z', '');
            } else {
                newO['time'] = o[key]; // Fallback if already time or other format
            }
            continue;
        }

        // Reverse Mappings (App -> DB)
        if (table === 'jobs' && key === 'employmentType') newKey = 'type';
        if (table === 'interviews' && key === 'panelType') newKey = 'type';
        if (key === 'appliedAt') newKey = 'applied_date';

        // Audit Log
        if (table === 'audit_log' && key === 'entity') newKey = 'entity_type';

        newO[newKey] = o[key];
    }
    return newO;
};

// Generic Fetch
export const getItems = async (table) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return [];
    }
    return data.map(item => toCamel(item, table));
};

// Add Item
export const addItem = async (table, item, userId) => {
    const snakeItem = toSnake(item, table);
    // Remove id if it's auto-generated or explicitly undefined, but Supabase can handle UUIDs if we generate them.
    // However, best to let Supabase generate UUIDs or ensure our generateId is UUID compatible.
    // Our generateId in helpers is `Math.random...`. This is NOT a valid UUID.
    // So we must remove `id` and let Supabase generate it.
    delete snakeItem.id;

    // Add timestamps? Supabase usually handles default, but we can pass them.

    const { data, error } = await supabase.from(table).insert([snakeItem]).select().single();
    if (error) throw error;

    // Audit
    await addAuditEntry({
        action: 'CREATE',
        entity: table,
        entityId: data.id,
        userId,
        details: `Created ${table}: ${item.title || item.name || 'item'}`
    });

    return toCamel(data, table);
};

// Update Item
export const updateItem = async (table, id, updates, userId) => {
    const snakeUpdates = toSnake(updates, table);
    const { data, error } = await supabase.from(table).update(snakeUpdates).eq('id', id).select().single();
    if (error) throw error;

    // Audit
    await addAuditEntry({
        action: 'UPDATE',
        entity: table,
        entityId: id,
        userId,
        details: `Updated ${table}`,
        changes: updates
    });

    return toCamel(data, table);
};

// Delete Item
export const deleteItem = async (table, id, userId) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    await addAuditEntry({
        action: 'DELETE',
        entity: table,
        entityId: id,
        userId,
        details: `Deleted ${table} item ${id}`
    });
    return true;
};

// Audit
// Audit
export const addAuditEntry = async (entry) => {
    const snakeEntry = toSnake(entry, 'audit_log');
    const { error } = await supabase.from('audit_log').insert([snakeEntry]);
    if (error) console.error('Error logging audit:', error);
};

export const getAuditLog = async (filters = {}) => {
    // Supabase returns entity_type, mapped to 'entity' by toCamel
    let query = supabase.from('audit_log').select('*').order('timestamp', { ascending: false });

    if (filters.entity) query = query.eq('entity_type', filters.entity);
    if (filters.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.action) query = query.eq('action', filters.action);

    const { data, error } = await query;
    if (error) return [];
    return data.map(item => toCamel(item, 'audit_log'));
};

// Upload Resume
export const uploadResume = async (file, candidateId) => {
    // 1. Upload to Supabase Storage
    // Assuming a bucket named 'resumes' exists. If not, this will fail until bucket is created.
    // File path: candidates/{candidateId}/{timestamp}_{filename}

    const timestamp = Date.now();
    const filePath = `candidates/${candidateId}/${timestamp}_${file.name.replace(/\s+/g, '_')}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

    // 3. Update Candidate Record with Resume Details
    // We need to store Metadata. Schema has 'resume_url'. 
    // Ideally we'd have columns for name/size, but we can perhaps store a JSON object if 'resume_url' was JSONB?
    // Or we just update 'resume_url' and assume we can't show size/name easily on refresh unless we persist it.
    // The user requested: "Show uploaded resume details (file name, size, upload date)"
    // Let's assume we can add these columns to the DB or abuse `notes`? No, let's ADD columns.

    // BUT I can't easily alter table structure in this turn without user running SQL.
    // I will try to update specific columns if they exist.
    // I will update the `candidates` table definition in schema.sql so the user knows to run it.

    const updates = {
        resume_url: publicUrl,
        // We will try to save these. If columns don't exist, Supabase might ignore or error depend on strictness.
        // It's safer to rely on `resume_url` for now or ask user to run SQL.
        // I will add code to update them, and `toSnake` will handle them.
        resume_name: file.name,
        resume_size: file.size, // in bytes
        resume_uploaded_at: new Date().toISOString()
    };

    const { data: updatedCandidate, error: updateError } = await supabase
        .from('candidates')
        .update(toSnake(updates))
        .eq('id', candidateId)
        .select()
        .single();

    if (updateError) {
        console.error('Update Candidate Error:', updateError);
        throw updateError;
    }

    // Audit
    await addAuditEntry({
        action: 'UPDATE',
        entity: 'candidates',
        entityId: candidateId,
        userId: (await supabase.auth.getUser()).data.user?.id,
        details: `Uploaded resume for candidate`
    });

    return toCamel(updatedCandidate);
};

export const checkConnection = async () => {
    try {
        const { error } = await supabase.from('jobs').select('count', { count: 'exact', head: true });
        return !error;
    } catch (e) {
        return false;
    }
};
