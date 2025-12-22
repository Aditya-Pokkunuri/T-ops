import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import {
    getItems,
    addItem,
    updateItem,
    deleteItem,
    getAuditLog,
    checkConnection,
    uploadResume
} from '../services/supabaseService';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within DataProvider');
    }
    return context;
};

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(true); // Default true, verify on load

    // Refresh all data from Supabase
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedJobs, fetchedCandidates, fetchedInterviews, fetchedFeedback, fetchedOffers] = await Promise.all([
                getItems('jobs'),
                getItems('candidates'),
                getItems('interviews'),
                getItems('feedback'),
                getItems('offers')
            ]);

            setJobs(fetchedJobs);
            setCandidates(fetchedCandidates);
            setInterviews(fetchedInterviews);
            setFeedback(fetchedFeedback);
            setOffers(fetchedOffers);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Jobs CRUD
    const createJob = useCallback(async (jobData) => {
        const newJob = await addItem('jobs', { ...jobData, applicants: 0 }, user?.id);
        setJobs(prev => [newJob, ...prev]);
        return newJob;
    }, [user]);

    const updateJob = useCallback(async (jobId, updates) => {
        const updated = await updateItem('jobs', jobId, updates, user?.id);
        setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
        return updated;
    }, [user]);

    const deleteJob = useCallback(async (jobId) => {
        await deleteItem('jobs', jobId, user?.id);
        setJobs(prev => prev.filter(j => j.id !== jobId));
    }, [user]);

    const getJobById = useCallback((jobId) => {
        return jobs.find(j => j.id === jobId);
    }, [jobs]);

    // Candidates CRUD
    const createCandidate = useCallback(async (candidateData) => {
        const newCandidate = await addItem('candidates', candidateData, user?.id);
        setCandidates(prev => [newCandidate, ...prev]);

        // Update job applicant count
        if (candidateData.jobId) {
            const job = jobs.find(j => j.id === candidateData.jobId);
            if (job) {
                // Determine new count carefully or just increment optimistically?
                // Ideally we should recalculate or let backend trigger it, but here we invoke updateJob
                await updateJob(job.id, { applicants: (job.applicants || 0) + 1 });
            }
        }

        return newCandidate;
    }, [user, jobs, updateJob]);

    const updateCandidate = useCallback(async (candidateId, updates) => {
        const updated = await updateItem('candidates', candidateId, updates, user?.id);
        setCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
        return updated;
    }, [user]);

    const deleteCandidate = useCallback(async (candidateId) => {
        const candidate = candidates.find(c => c.id === candidateId);
        await deleteItem('candidates', candidateId, user?.id);
        setCandidates(prev => prev.filter(c => c.id !== candidateId));

        // Update job applicant count
        if (candidate?.jobId) {
            const job = jobs.find(j => j.id === candidate.jobId);
            if (job && job.applicants > 0) {
                await updateJob(job.id, { applicants: job.applicants - 1 });
            }
        }
    }, [user, candidates, jobs, updateJob]);

    const getCandidateById = useCallback((candidateId) => {
        return candidates.find(c => c.id === candidateId);
    }, [candidates]);

    const getCandidatesByJob = useCallback((jobId) => {
        return candidates.filter(c => c.jobId === jobId);
    }, [candidates]);

    const getCandidatesByStage = useCallback((stage) => {
        return candidates.filter(c => c.stage === stage);
    }, [candidates]);

    const moveCandidateToStage = useCallback(async (candidateId, newStage) => {
        return await updateCandidate(candidateId, { stage: newStage });
    }, [updateCandidate]);

    // Interviews CRUD
    const createInterview = useCallback(async (interviewData) => {
        console.log("Creating interview with:", interviewData);
        // Pack Metadata: mode, interviewers go into notes.
        // candidateName, jobTitle MUST be sent to DB as they are proper columns (mapped to candidate_name, job_title by service).
        const { mode, interviewers, notes, ...rest } = interviewData;

        // Pack missing fields into notes
        const metadata = { mode, interviewers };
        const packedNotes = (notes || '') + '\n\n__METADATA__\n' + JSON.stringify(metadata);

        // Pass everything else to DB
        // 'rest' contains candidateName, jobTitle, candidateId, jobId, panelType, scheduledAt, etc.
        const dbData = { ...rest, notes: packedNotes };
        console.log("DB Payload:", dbData);

        const newInterview = await addItem('interviews', dbData, user?.id);
        console.log("DB Response:", newInterview);

        // Enrich with unpacked metadata for local state
        // toCamel in supabaseService SHOULD have already unpacked the notes if logic matches!

        const enrichedInterview = {
            ...newInterview,
            mode: newInterview.mode || mode,
            interviewers: newInterview.interviewers || interviewers,
            // Ensure names are present even if DB response didn't have them (though they should)
            candidateName: newInterview.candidateName || interviewData.candidateName,
            jobTitle: newInterview.jobTitle || interviewData.jobTitle
        };

        setInterviews(prev => [enrichedInterview, ...prev]);
        return enrichedInterview;
    }, [user]);

    const updateInterview = useCallback(async (interviewId, updates) => {
        console.log("Updating interview:", interviewId, updates);
        const { mode, interviewers, notes, ...rest } = updates;

        // Pack metadata
        const metadata = { mode, interviewers };
        const packedNotes = (notes || '') + '\n\n__METADATA__\n' + JSON.stringify(metadata);

        const dbUpdates = { ...rest, notes: packedNotes };

        const updated = await updateItem('interviews', interviewId, dbUpdates, user?.id);

        const enrichedUpdated = {
            ...updated,
            mode: updated.mode || mode,
            interviewers: updated.interviewers || interviewers,
            // Ensure names are preserved if not returned/updated
            candidateName: updated.candidateName || updates.candidateName || interviews.find(i => i.id === interviewId)?.candidateName,
            jobTitle: updated.jobTitle || updates.jobTitle || interviews.find(i => i.id === interviewId)?.jobTitle
        };

        setInterviews(prev => prev.map(i => i.id === interviewId ? enrichedUpdated : i));
        return enrichedUpdated;
    }, [user, interviews]);

    const deleteInterview = useCallback(async (interviewId) => {
        await deleteItem('interviews', interviewId, user?.id);
        setInterviews(prev => prev.filter(i => i.id !== interviewId));
    }, [user]);

    const getInterviewById = useCallback((interviewId) => {
        return interviews.find(i => i.id === interviewId);
    }, [interviews]);

    const getInterviewsByCandidate = useCallback((candidateId) => {
        return interviews.filter(i => i.candidateId === candidateId);
    }, [interviews]);

    const getInterviewsByInterviewer = useCallback((interviewerId) => {
        return interviews.filter(i => i.interviewers?.includes(interviewerId));
    }, [interviews]);

    const getUpcomingInterviews = useCallback(() => {
        const now = new Date();
        return interviews
            .filter(i => i.status === 'scheduled' && new Date(i.scheduledAt) > now)
            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    }, [interviews]);

    // Feedback CRUD
    const createFeedback = useCallback(async (feedbackData) => {
        const newFeedback = await addItem('feedback', feedbackData, user?.id);
        setFeedback(prev => [newFeedback, ...prev]);
        return newFeedback;
    }, [user]);

    const updateFeedback = useCallback(async (feedbackId, updates) => {
        const updated = await updateItem('feedback', feedbackId, updates, user?.id);
        setFeedback(prev => prev.map(f => f.id === feedbackId ? updated : f));
        return updated;
    }, [user]);

    const getFeedbackByCandidate = useCallback((candidateId) => {
        return feedback.filter(f => f.candidateId === candidateId);
    }, [feedback]);

    const getFeedbackByInterview = useCallback((interviewId) => {
        return feedback.filter(f => f.interviewId === interviewId);
    }, [feedback]);

    const getAggregateFeedback = useCallback((candidateId) => {
        const candidateFeedback = getFeedbackByCandidate(candidateId);
        if (candidateFeedback.length === 0) return null;

        const totalRatings = candidateFeedback.reduce((acc, f) => {
            Object.entries(f.ratings || {}).forEach(([key, value]) => {
                acc[key] = (acc[key] || 0) + value;
            });
            return acc;
        }, {});

        const avgRatings = Object.entries(totalRatings).reduce((acc, [key, value]) => {
            acc[key] = (value / candidateFeedback.length).toFixed(1);
            return acc;
        }, {});

        const recommendations = candidateFeedback.map(f => f.recommendation);
        const hireCount = recommendations.filter(r => r === 'hire').length;
        const holdCount = recommendations.filter(r => r === 'hold').length;
        const rejectCount = recommendations.filter(r => r === 'reject').length;

        return {
            averageRatings: avgRatings,
            totalFeedback: candidateFeedback.length,
            recommendations: { hire: hireCount, hold: holdCount, reject: rejectCount },
            overallRecommendation: hireCount >= holdCount && hireCount >= rejectCount ? 'hire' :
                holdCount >= rejectCount ? 'hold' : 'reject'
        };
    }, [getFeedbackByCandidate]);

    // Offers CRUD
    const createOffer = useCallback(async (offerData) => {
        const newOffer = await addItem('offers', offerData, user?.id);
        setOffers(prev => [newOffer, ...prev]);
        return newOffer;
    }, [user]);

    const updateOffer = useCallback(async (offerId, updates) => {
        const updated = await updateItem('offers', offerId, updates, user?.id);
        setOffers(prev => prev.map(o => o.id === offerId ? updated : o));
        return updated;
    }, [user]);

    const deleteOffer = useCallback(async (offerId) => {
        await deleteItem('offers', offerId, user?.id);
        setOffers(prev => prev.filter(o => o.id !== offerId));
    }, [user]);

    const getOfferById = useCallback((offerId) => {
        return offers.find(o => o.id === offerId);
    }, [offers]);

    const getOfferByCandidate = useCallback((candidateId) => {
        return offers.find(o => o.candidateId === candidateId);
    }, [offers]);

    // Analytics (Computed locally)
    const getAnalytics = useCallback(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        return {
            totalJobs: jobs.length,
            activeJobs: jobs.filter(j => j.status === 'published').length,
            totalCandidates: candidates.length,
            candidatesByStage: {
                applied: candidates.filter(c => c.stage === 'applied').length,
                shortlisted: candidates.filter(c => c.stage === 'shortlisted').length,
                interview: candidates.filter(c => c.stage === 'interview').length,
                offer: candidates.filter(c => c.stage === 'offer').length,
                hired: candidates.filter(c => c.stage === 'hired').length,
                rejected: candidates.filter(c => c.stage === 'rejected').length
            },
            upcomingInterviews: interviews.filter(i =>
                i.status === 'scheduled' && new Date(i.scheduledAt) > now
            ).length,
            completedInterviews: interviews.filter(i => i.status === 'completed').length,
            pendingOffers: offers.filter(o => o.status === 'sent').length,
            acceptedOffers: offers.filter(o => o.status === 'accepted').length,
            recentCandidates: candidates.filter(c =>
                new Date(c.appliedAt) > thirtyDaysAgo
            ).length
        };
    }, [jobs, candidates, interviews, offers]);

    // Audit Log
    const fetchAuditLog = useCallback(async (filters) => {
        return await getAuditLog(filters);
    }, []);

    const value = {
        jobs,
        candidates,
        interviews,
        feedback,
        offers,
        loading,
        refreshData,
        createJob,
        updateJob,
        deleteJob,
        getJobById,
        createCandidate,
        updateCandidate,
        deleteCandidate,
        getCandidateById,
        getCandidatesByJob,
        getCandidatesByStage,
        moveCandidateToStage,
        createInterview,
        updateInterview,
        deleteInterview,
        getInterviewById,
        getInterviewsByCandidate,
        getInterviewsByInterviewer,
        getUpcomingInterviews,
        createFeedback,
        updateFeedback,
        getFeedbackByCandidate,
        getFeedbackByInterview,
        getAggregateFeedback,
        createOffer,
        updateOffer,
        deleteOffer,
        getOfferById,
        getOfferByCandidate,
        getAnalytics,
        fetchAuditLog,
        isConnected,
        uploadResume
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
