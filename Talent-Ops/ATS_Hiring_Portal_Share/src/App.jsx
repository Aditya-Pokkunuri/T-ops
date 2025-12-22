import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { ToastProvider } from './components/Common/Toast';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Pipeline from './pages/Pipeline';
import Candidates from './pages/Candidates';
import Interviews from './pages/Interviews';
import Feedback from './pages/Feedback';
import Offers from './pages/Offers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
    return (
        <ToastProvider>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/candidates/:id" element={<Candidates />} />
                    <Route path="/interviews" element={<Interviews />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </ToastProvider>
    );
}

export default App;
