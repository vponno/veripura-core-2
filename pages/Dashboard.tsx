import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface DashboardProps {
    userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/consignments');
    }, [navigate]);

    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" />
            <span className="ml-2 text-slate-500">Loading Registry...</span>
        </div>
    );
};

export default Dashboard;