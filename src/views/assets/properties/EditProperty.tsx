import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import PropertyForm from './PropertyForm';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Loader2 } from 'lucide-react';

const EditProperty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const parseResponse = async (res: Response) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            }
            throw e;
        }
    };

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const result = await parseResponse(response);

                if (result.status && result.data && result.data.property) {
                    setInitialData(result.data.property);
                } else {
                    setError('Property not found');
                }
            } catch (err) {
                setError('Failed to fetch property details');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProperty();
    }, [id, token]);

    const handleSuccess = async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await parseResponse(response);

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update property');
        }

        navigate('/assets/properties');
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="w-full">
            <BreadcrumbComp title="Edit Property" />
            <div className="mt-4">
                <PropertyForm
                    initialData={initialData}
                    onSuccess={handleSuccess}
                    onCancel={() => navigate('/assets/properties')}
                    title={`Edit Property: ${initialData?.code || ''}`}
                />
            </div>
        </div>
    );
};

export default EditProperty;
