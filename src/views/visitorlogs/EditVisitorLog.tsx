import { useNavigate, useParams } from 'react-router';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import VisitorLogForm from './VisitorLogForm';
import { Card, CardContent } from 'src/components/ui/card';

const EditVisitorLog = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const BCrumb = [
        { to: '/dashboard', title: 'Dashboard' },
        { to: '/visitor-logs', title: 'Visitor Logs' },
        { title: 'Edit' },
    ];

    return (
        <div className="p-4">
            <BreadcrumbComp title="Edit Visitor Log" items={BCrumb} />
            <Card>
                <CardContent className="p-0">
                    {id ? (
                        <VisitorLogForm
                            logId={parseInt(id)}
                            onSuccess={() => navigate('/visitor-logs')}
                            onCancel={() => navigate('/visitor-logs')}
                        />
                    ) : (
                        <div className="p-4 text-center text-red-500">Invalid Log ID</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditVisitorLog;
