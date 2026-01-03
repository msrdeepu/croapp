import { useNavigate } from 'react-router-dom';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import VentureForm from './VentureForm';

const CreateVenture = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full">
            <BreadcrumbComp title="Add New Venture" />
            <div className="max-w-7xl mx-auto">
                <VentureForm
                    onSuccess={() => navigate('/assets/ventures')}
                    onCancel={() => navigate('/assets/ventures')}
                />
            </div>
        </div>
    );
};

export default CreateVenture;
