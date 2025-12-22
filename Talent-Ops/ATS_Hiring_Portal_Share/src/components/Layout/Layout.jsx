import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="app-layout">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <Header collapsed={collapsed} />
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
