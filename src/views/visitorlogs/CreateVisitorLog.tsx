import { useNavigate } from 'react-router';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import VisitorLogForm from './VisitorLogForm';
import { Card, CardContent } from 'src/components/ui/card';

const CreateVisitorLog = () => {
    const navigate = useNavigate();
    const BCrumb = [
        { to: '/dashboard', title: 'Dashboard' },
        { to: '/visitor-logs', title: 'Visitor Logs' },
        { title: 'Create' },
    ];

    return (
        <div className="p-4">
            <BreadcrumbComp title="Create Visitor Log" items={BCrumb} />
            <Card>
                <CardContent className="p-0">
                    <VisitorLogForm
                        onSuccess={() => navigate('/visitor-logs')}
                        onCancel={() => navigate('/visitor-logs')}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateVisitorLog;
