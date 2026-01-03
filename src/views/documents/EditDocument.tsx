import { useParams } from 'react-router';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import DocumentForm from './DocumentForm';

const EditDocument = () => {
    const { id } = useParams();
    const BCrumb = [
        { to: '/', title: 'Home' },
        { to: '/documents', title: 'Manage Documents' },
        { title: 'Edit Document' },
    ];

    return (
        <div>
            <BreadcrumbComp title="Edit Document" items={BCrumb} />
            {id && <DocumentForm documentId={parseInt(id)} />}
        </div>
    );
};

export default EditDocument;
