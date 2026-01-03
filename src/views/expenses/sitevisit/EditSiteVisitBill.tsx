import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SiteVisitBillForm from './SiteVisitBillForm';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb"

const EditSiteVisitBill = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${ENDPOINTS.SITEVISIT_BILLS.BASE}/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });
                const text = await response.text();
                let res;
                try {
                    res = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { res = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                    } else {
                        console.error('Error parsing JSON:', e);
                    }
                }

                if (res && res.status) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token && id) fetchData();
    }, [id, token]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/expenses/site-visit">Site Visit Expenses</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Site Visit Expense</CardTitle>
                </CardHeader>
                <CardContent>
                    <SiteVisitBillForm initialData={data} isEdit />
                </CardContent>
            </Card>
        </div>
    );
};

export default EditSiteVisitBill;
