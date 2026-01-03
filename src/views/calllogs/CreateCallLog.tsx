import { useNavigate } from 'react-router';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CallLogForm from './CallLogForm';
import { Card, CardContent } from 'src/components/ui/card';

const CreateCallLog = () => {
    const navigate = useNavigate();
    const BCrumb = [
        { to: '/dashboard', title: 'Dashboard' },
        { to: '/call-logs', title: 'Call Logs' },
        { title: 'Create' },
    ];

    return (
        <div className="p-4">
            <BreadcrumbComp title="Create Call Log" items={BCrumb} />
            <Card>
                <CardContent className="p-0">
                    <CallLogForm
                        onSuccess={() => navigate('/call-logs')}
                        onCancel={() => navigate('/call-logs')}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateCallLog;
