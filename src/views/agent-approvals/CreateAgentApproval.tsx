
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { useNavigate } from 'react-router-dom';
import AgentApprovalForm from './AgentApprovalForm';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from 'src/components/ui/breadcrumb';

const CreateAgentApproval = () => {
    const navigate = useNavigate();

    return (
        <div className="md:px-4">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink href="/agent-approvals">Agent Approvals</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage>Create</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Create Agent Approval</CardTitle>
                </CardHeader>
                <CardContent>
                    <AgentApprovalForm
                        mode="create"
                        onSuccess={() => navigate('/agent-approvals')}
                        onCancel={() => navigate('/agent-approvals')}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateAgentApproval;
