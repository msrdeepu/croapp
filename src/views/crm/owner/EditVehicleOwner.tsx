import { useParams, useNavigate } from 'react-router';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent } from 'src/components/ui/card';
import VehicleOwnerForm from './VehicleOwnerForm';

const EditVehicleOwner = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const BCrumb = [
        {
            to: '/crm/vehicle-owners',
            title: 'Vehicle Owners',
        },
        {
            title: 'Edit Vehicle Owner',
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
            <Breadcrumb title="Edit Vehicle Owner" items={BCrumb} />
            <Card>
                <CardContent className="p-6">
                    {id ? (
                        <VehicleOwnerForm
                            ownerId={parseInt(id)}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    ) : (
                        <div>Invalid Owner ID</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditVehicleOwner;
