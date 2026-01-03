import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import DocumentForm from './DocumentForm';

const CreateDocument = () => {
    const BCrumb = [
        { to: '/', title: 'Home' },
        { to: '/documents', title: 'Manage Documents' },
        { title: 'New Document' },
    ];

    return (
        <div>
            <BreadcrumbComp title="New Document" items={BCrumb} />
            <DocumentForm />
        </div>
    );
};

export default CreateDocument;
