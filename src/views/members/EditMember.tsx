import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import MemberForm from './MemberForm';
import { API_BASE_URL } from 'src/config';
import Spinner from 'src/views/spinner/Spinner';
import { useAuth } from 'src/context/AuthContext';

const EditMember = () => {
    const { token } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/members/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            data = JSON.parse(text.trim().substring(2));
                        } else {
                            throw e;
                        }
                    }

                    setInitialData(data.data);
                } else {
                    console.error("Failed to fetch member details");
                    navigate('/members');
                }
            } catch (error) {
                console.error("Error fetching member:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMember();
        }
    }, [id, navigate]);

    if (loading) {
        return <Spinner />;
    }

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
                            <BreadcrumbPage>Edit Member Details</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Member Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {initialData ? (
                        <MemberForm mode="edit" initialData={initialData} />
                    ) : (
                        <div className="text-center text-red-500">Member not found</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditMember;
