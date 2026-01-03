import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';

interface DashboardData {
    customers: number;
    ventures: number;
    availablePlots: number;
    soldPlots: number;
    totalPlots: number;
}

const DashboardStats = () => {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch(ENDPOINTS.DASHBOARD, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const text = await response.text();
                    let result;
                    try {
                        result = JSON.parse(text);
                    } catch (e) {
                        // Handle malformed JSON (e.g. prefixed with [])
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try {
                                result = JSON.parse(fixedText);
                            } catch (e2) {
                                console.error('Failed to parse corrected JSON:', e2);
                                throw new Error('Invalid server response');
                            }
                        } else {
                            console.error('Failed to parse JSON:', e);
                            throw new Error('Invalid server response');
                        }
                    }

                    // Handle array-wrapped response same as login
                    const actualData = Array.isArray(result) ? result[0] : result;
                    console.log('Dashboard Data Received:', actualData);

                    // Check if status is truthy (handles boolean true or string "true")
                    if (actualData.status && actualData.data) {
                        console.log('Setting data:', actualData.data);
                        setData(actualData.data);
                    } else {
                        console.warn('Dashboard data status check failed or data missing', actualData);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    const stats = [
        {
            title: 'Total Clients',
            count: loading ? '...' : data?.customers || 0,
            icon: 'solar:users-group-rounded-bold',
            color: 'text-primary',
            bgcolor: 'bg-primary',
            percent: 75,
        },
        {
            title: 'Total Ventures',
            count: loading ? '...' : data?.ventures || 0,
            icon: 'solar:map-point-bold',
            color: 'text-error',
            bgcolor: 'bg-error',
            percent: 30,
        },
        {
            title: 'Total Receipts',
            count: loading ? '...' : data?.soldPlots || 0,
            icon: 'solar:calculator-minimalistic-bold',
            color: 'text-warning',
            bgcolor: 'bg-warning',
            percent: 60,
        },
        {
            title: 'Total Properties',
            count: loading ? '...' : data?.totalPlots || 0,
            icon: 'solar:signpost-2-bold',
            color: 'text-secondary',
            bgcolor: 'bg-secondary',
            percent: 85,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {stats.map((stat, index) => (
                <div key={index} className="card bg-white dark:bg-darkgray p-6 relative overflow-hidden shadow-md rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-2xl font-bold mb-1 text-dark dark:text-white">{stat.count}</h4>
                            <p className="text-sm text-bodytext dark:text-darklink">{stat.title}</p>
                        </div>

                        <div className="relative flex items-center justify-center w-12 h-12">
                            {/* Background Circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-gray-200 dark:text-gray-700"
                                />

                                {/* Progress Circle */}
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 20}
                                    strokeDashoffset={2 * Math.PI * 20 * (1 - stat.percent / 100)}
                                    className={`${stat.color}`}
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Icon in Center */}
                            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl ${stat.color} opacity-80`}>
                                <Icon icon={stat.icon} />
                            </div>

                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
