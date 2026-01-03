import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { Button } from 'src/components/ui/button';
import { API_BASE_URL } from 'src/config';
import Spinner from 'src/views/spinner/Spinner';
import { useAuth } from 'src/context/AuthContext';
import { ArrowLeft, Edit } from 'lucide-react';

const ViewMember = () => {
    const { token } = useAuth();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [member, setMember] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch member details
                const memberRes = await fetch(`${API_BASE_URL}/members/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });

                // Fetch form data for branches
                const formRes = await fetch(`${API_BASE_URL}/members/form-data`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });

                if (memberRes.ok) {
                    const text = await memberRes.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            data = JSON.parse(text.trim().substring(2));
                        } else { throw e; }
                    }
                    setMember(data.data);
                }

                if (formRes.ok) {
                    const text = await formRes.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            data = JSON.parse(text.trim().substring(2));
                        } else { throw e; }
                    }
                    setBranches(data.branches || []);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id && token) fetchData();
    }, [id, token]);

    if (loading) return <Spinner />;

    if (!member) {
        return (
            <div className="p-4 text-center">
                <h3 className="text-lg font-medium text-red-600">Member Not Found</h3>
                <Button asChild className="mt-4" variant="outline">
                    <Link to="/members">Go Back</Link>
                </Button>
            </div>
        );
    }

    const DetailRow = ({ label, value }: { label: string, value: any }) => (
        <div className="grid grid-cols-1 md:grid-cols-3 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-500 md:col-span-1">{label}</div>
            <div className="text-gray-900 md:col-span-2 font-medium">{value || '-'}</div>
        </div>
    );

    return (
        <div className="md:px-4">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/members">Members</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>View Member</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link to="/members">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <CardTitle>Member Details: {member.name}</CardTitle>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link to={`/members/edit/${member.id}`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Member
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Personal Information */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-4 text-primary">Personal Information</h3>
                            <DetailRow label="Full Name" value={member.name} />
                            <DetailRow label="Surname" value={member.surname} />
                            <DetailRow label="Email" value={member.email} />
                            <DetailRow label="Phone" value={member.phone} />
                            <DetailRow label="Mobile" value={member.mobile} />
                            <DetailRow
                                label="WhatsApp"
                                value={
                                    member.whatsapp === 1 || member.whatsapp === true
                                        ? <span className="text-green-600 font-bold">Yes</span>
                                        : <span className="text-gray-500">No</span>
                                }
                            />
                        </div>

                        {/* Role & Access Information */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-4 text-primary">Role & Access</h3>
                            <DetailRow label="Role" value={<span className="capitalize px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{member.type}</span>} />
                            {member.type === 'agent' && (
                                <DetailRow label="Level" value={member.level} />
                            )}
                            <DetailRow
                                label="Branch"
                                value={
                                    branches.find(b => String(b.id) === String(member.branch_id))
                                        ? `${branches.find(b => String(b.id) === String(member.branch_id)).location} (${branches.find(b => String(b.id) === String(member.branch_id)).code})`
                                        : member.branch_id
                                }
                            />
                            <DetailRow label="Manager Access" value={member.is_manager ? "Yes" : "No"} />
                            <DetailRow label="Joined On" value={new Date(member.created_at).toLocaleDateString()} />
                            <DetailRow label="Passkey / Password" value={member.passkey} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ViewMember;
