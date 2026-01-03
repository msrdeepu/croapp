import { useNavigate } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import PropertyForm from './PropertyForm';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const CreateProperty = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const handleSuccess = async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/properties`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Robust parsing for garbage prefix/suffix
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                result = JSON.parse(text.substring(firstBrace, lastBrace + 1));
            } else {
                throw e;
            }
        }

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create property');
        }

        navigate('/assets/properties');
    };

    return (
        <div className="w-full">
            <BreadcrumbComp title="Add New Property" />
            <div className="mt-4">
                <PropertyForm
                    onSuccess={handleSuccess}
                    onCancel={() => navigate('/assets/properties')}
                    title="New Property Details"
                />
            </div>
        </div>
    );
};

export default CreateProperty;
