import { useNavigate } from 'react-router';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent } from 'src/components/ui/card';
import VehicleOwnerForm from './VehicleOwnerForm';

const CreateVehicleOwner = () => {
    const navigate = useNavigate();

    const BCrumb = [
        {
            to: '/crm/vehicle-owners',
            title: 'Vehicle Owners',
        },
        {
            title: 'Create Vehicle Owner',
        },
    ];

    const handleSuccess = () => {
        navigate('/crm/vehicle-owners');
    };

    const handleCancel = () => {
        navigate('/crm/vehicle-owners');
    };

    return (
        <div className="p-6 space-y-6">
            <Breadcrumb title="Create Vehicle Owner" items={BCrumb} />
            <Card>
                <CardContent className="p-6">
                    <VehicleOwnerForm
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateVehicleOwner;
