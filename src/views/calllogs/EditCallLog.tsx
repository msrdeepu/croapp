import { useNavigate, useParams } from 'react-router';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CallLogForm from './CallLogForm';
import { Card, CardContent } from 'src/components/ui/card';

const EditCallLog = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const BCrumb = [
        { to: '/dashboard', title: 'Dashboard' },
        { to: '/call-logs', title: 'Call Logs' },
        { title: 'Edit' },
    ];

    return (
        <div className="p-4">
            <BreadcrumbComp title="Edit Call Log" items={BCrumb} />
            <Card>
                <CardContent className="p-0">
                    {id ? (
                        <CallLogForm
                            logId={parseInt(id)}
                            onSuccess={() => navigate('/call-logs')}
                            onCancel={() => navigate('/call-logs')}
                        />
                    ) : (
                        <div className="p-4 text-center text-red-500">Invalid Log ID</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditCallLog;
