import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TransportBillForm from './TransportBillForm';

const EditTransportBill = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const response = await fetch(`${ENDPOINTS.TRANSPORT_BILLS.BASE}/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const text = await response.text();
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try { data = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                        }
                    }

                    if (data && data.status) {
                        setInitialData(data.data);
                    } else {
                        alert('Failed to load bill details');
                        navigate('/expenses/transport');
                    }
                }
            } catch (error) {
                console.error('Error fetching bill:', error);
                navigate('/expenses/transport');
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchBill();
        }
    }, [token, id, navigate]);

    if (loading) {
        return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/expenses/transport')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Transport Bill</h2>
                    <p className="text-muted-foreground">Update transport expense details.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bill Details</CardTitle>
                    <CardDescription>
                        Modify the details for the transport expense.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {initialData && <TransportBillForm initialData={initialData} isEdit={true} />}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditTransportBill;
