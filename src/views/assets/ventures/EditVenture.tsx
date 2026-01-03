import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from 'src/config';
import { useAuth } from 'src/context/AuthContext';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import VentureForm from './VentureForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';

const EditVenture = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [venture, setVenture] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVenture = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ventures/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const text = await response.text();

                if (!response.ok) {
                    console.error('API Error:', response.status, text);
                    setError('Venture not found');
                    return;
                }

                let data;
                try {
                    // First try standard parse
                    data = JSON.parse(text);
                } catch (e) {
                    // Recover from garbage prefix
                    try {
                        const firstBrace = text.indexOf('{');
                        const lastBrace = text.lastIndexOf('}');

                        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                            const jsonStr = text.substring(firstBrace, lastBrace + 1);
                            data = JSON.parse(jsonStr);
                        } else {
                            throw new Error('No valid JSON object found');
                        }
                    } catch (e2) {
                        console.error('JSON Parsing Failed:', e2);
                        setError('Failed to parse venture details');
                        return;
                    }
                }

                if (data.status) {
                    setVenture(data.data);
                } else {
                    setError('Venture not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to fetch venture details');
            } finally {
                setLoading(false);
            }
        };
        fetchVenture();
    }, [id, token]);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="w-full">
            <BreadcrumbComp title="Edit Venture" />
            <div className="max-w-7xl mx-auto">
                <VentureForm
                    initialData={venture}
                    onSuccess={() => navigate('/assets/ventures')}
                    onCancel={() => navigate('/assets/ventures')}
                />
            </div>
        </div>
    );
};

export default EditVenture;
