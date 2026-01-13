// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import ProtectedRoute from '../components/ProtectedRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

// authentication

const Login2 = Loadable(lazy(() => import('../views/authentication/auth2/Login')));

const Register2 = Loadable(lazy(() => import('../views/authentication/auth2/Register')));

const Maintainance = Loadable(lazy(() => import('../views/authentication/Maintainance')));

// Dashboards
const Modern = Loadable(lazy(() => import('../views/dashboards/Modern')));

//pages
const UserProfile = Loadable(lazy(() => import('../views/pages/user-profile')));

// Revenues
const Receipts = Loadable(lazy(() => import('../views/revenues/Receipts')));
// Reports
const ProjectBusinessReport = Loadable(lazy(() => import('../views/reports/ProjectBusinessReport')));
const CreateSiteVisitBill = Loadable(lazy(() => import('../views/expenses/sitevisit/CreateSiteVisitBill')));
const EditSiteVisitBill = Loadable(lazy(() => import('../views/expenses/sitevisit/EditSiteVisitBill')));
const SiteVisitBills = Loadable(lazy(() => import('../views/expenses/sitevisit/SiteVisitBills')));
const ViewSiteVisitBill = Loadable(lazy(() => import('../views/expenses/sitevisit/ViewSiteVisitBill')));
const CreateTransportBill = Loadable(lazy(() => import('../views/expenses/transport/CreateTransportBill')));
const EditTransportBill = Loadable(lazy(() => import('../views/expenses/transport/EditTransportBill')));

// Settings
const VenturesList = Loadable(lazy(() => import('../views/assets/ventures/VenturesList')));
const CreateVenture = Loadable(lazy(() => import('../views/assets/ventures/CreateVenture')));
const EditVenture = Loadable(lazy(() => import('../views/assets/ventures/EditVenture')));
const DipsOverview = Loadable(lazy(() => import('../views/assets/ventures/DipsOverview')));
const VentureLogReport = Loadable(lazy(() => import('../views/assets/venture-logs/VentureLogReport')));
const PropertiesList = Loadable(lazy(() => import('../views/assets/properties/PropertiesList')));
const CreateProperty = Loadable(lazy(() => import('../views/assets/properties/CreateProperty')));
const EditProperty = Loadable(lazy(() => import('../views/assets/properties/EditProperty')));
const ViewProperty = Loadable(lazy(() => import('../views/assets/properties/ViewProperty')));

const ViewTransportBill = Loadable(lazy(() => import('../views/expenses/transport/ViewTransportBill')));

const TransportBills = Loadable(lazy(() => import('../views/expenses/transport/TransportBills')));
const AvailablePropertiesReport = Loadable(lazy(() => import('../views/reports/AvailablePropertiesReport')));
const PropertySizeReport = Loadable(lazy(() => import('../views/reports/PropertySizeReport')));
const VentureLevelOutstandingReport = Loadable(lazy(() => import('../views/reports/VentureLevelOutstandingReport')));
const MLMGenerationReport = Loadable(lazy(() => import('../views/reports/MLMGenerationReport')));
const FreeRegistrationMonitor = Loadable(lazy(() => import('../views/reports/FreeRegistrationMonitor')));
const ManageCustomers = Loadable(lazy(() => import('../views/customers/ManageCustomers')));
const CreateCustomer = Loadable(lazy(() => import('../views/customers/CreateCustomer')));
const ViewCustomer = Loadable(lazy(() => import('../views/customers/ViewCustomer')));
const EditCustomer = Loadable(lazy(() => import('src/views/customers/EditCustomer')));
const ManageLeads = Loadable(lazy(() => import('../views/crm/leads/ManageLeads')));
const ManageVehicles = Loadable(lazy(() => import('../views/crm/vehicles/ManageVehicles')));
const ManageVehicleOwners = Loadable(lazy(() => import('../views/crm/owner/ManageVehicleOwners')));
const CreateVehicleOwner = Loadable(lazy(() => import('../views/crm/owner/CreateVehicleOwner')));
const EditVehicleOwner = Loadable(lazy(() => import('../views/crm/owner/EditVehicleOwner')));
const ManageVisitorLogs = Loadable(lazy(() => import('../views/visitorlogs/ManageVisitorLogs')));
const CreateVisitorLog = Loadable(lazy(() => import('../views/visitorlogs/CreateVisitorLog')));
const EditVisitorLog = Loadable(lazy(() => import('../views/visitorlogs/EditVisitorLog')));
const ManageCallLogs = Loadable(lazy(() => import('../views/calllogs/ManageCallLogs')));
const CreateCallLog = Loadable(lazy(() => import('../views/calllogs/CreateCallLog')));
const EditCallLog = Loadable(lazy(() => import('../views/calllogs/EditCallLog')));
const ManageDocuments = Loadable(lazy(() => import('../views/documents/ManageDocuments')));
const CreateDocument = Loadable(lazy(() => import('../views/documents/CreateDocument')));
const EditDocument = Loadable(lazy(() => import('../views/documents/EditDocument')));

const ManageMembers = Loadable(lazy(() => import('../views/members/ManageMembers')));
const ManageAgents = Loadable(lazy(() => import('../views/members/ManageAgents')));
const CreateMember = Loadable(lazy(() => import('../views/members/CreateMember')));
const EditMember = Loadable(lazy(() => import('../views/members/EditMember')));
const ViewMember = Loadable(lazy(() => import('../views/members/ViewMember')));
const CreateEmployeeCreds = Loadable(lazy(() => import('../views/members/CreateEmployeeCreds')));

const ManageAgentApprovals = Loadable(lazy(() => import('../views/agent-approvals/ManageAgentApprovals')));
const CreateAgentApproval = Loadable(lazy(() => import('../views/agent-approvals/CreateAgentApproval')));
const EditAgentChain = Loadable(lazy(() => import('../views/agent-approvals/EditAgentChain')));

const SiteVisits = Loadable(lazy(() => import('../views/crm/sitevisits/SiteVisits')));
const CreateSiteVisit = Loadable(lazy(() => import('../views/crm/sitevisits/CreateSiteVisit')));
const EditSiteVisit = Loadable(lazy(() => import('../views/crm/sitevisits/EditSiteVisit')));

const VentureWiseAgentOutstandingReport = Loadable(lazy(() => import('../views/reports/VentureWiseAgentOutstandingReport')));
const BranchWiseVentureOutstandingReport = Loadable(lazy(() => import('../views/reports/BranchWiseVentureOutstandingReport')));
const AgentTeamViewReport = Loadable(lazy(() => import('../views/reports/AgentTeamViewReport')));
const MLMHierarchyView = Loadable(lazy(() => import('../views/reports/MLMHierarchyView')));
const RecentAgentsReport = Loadable(lazy(() => import('../views/reports/RecentAgentsReport')));
const SalesReport = Loadable(lazy(() => import('../views/reports/SalesReport')));




/* ****Apps***** */
const Notes = Loadable(lazy(() => import('../views/apps/notes/Notes')));
const Form = Loadable(lazy(() => import('../views/utilities/form/Form')));
const Table = Loadable(lazy(() => import('../views/utilities/table/Table')));
const Tickets = Loadable(lazy(() => import('../views/apps/tickets/Tickets')));
const CreateTickets = Loadable(lazy(() => import('../views/apps/tickets/CreateTickets')));
const Blog = Loadable(lazy(() => import('../views/apps/blog/Blog')));
const BlogDetail = Loadable(lazy(() => import('../views/apps/blog/BlogDetail')));

const Error = Loadable(lazy(() => import('../views/authentication/Error')));

// // icons
const SolarIcon = Loadable(lazy(() => import('../views/icons/SolarIcon')));

// const SamplePage = lazy(() => import('../views/sample-page/SamplePage'));

const Router = [
  {
    path: '/',
    element: <ProtectedRoute><FullLayout /></ProtectedRoute>,
    children: [
      { path: '/', exact: true, element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Modern /> },
      { path: '/revenues/receipts', element: <Receipts /> },

      // Expenses
      { path: '/expenses/site-visit', element: <SiteVisitBills /> },
      { path: '/expenses/site-visit/create', element: <CreateSiteVisitBill /> },
      { path: '/expenses/site-visit/edit/:id', element: <EditSiteVisitBill /> },
      { path: '/expenses/site-visit/view/:id', element: <ViewSiteVisitBill /> },
      { path: '/expenses/transport', element: <TransportBills /> },
      { path: '/expenses/transport/create', element: <CreateTransportBill /> },
      { path: '/expenses/transport/edit/:id', element: <EditTransportBill /> },
      { path: '/expenses/transport/view/:id', element: <ViewTransportBill /> },
      { path: '/reports/project-business-report', element: <ProjectBusinessReport /> },
      { path: '/reports/available-properties', element: <AvailablePropertiesReport /> },
      { path: '/reports/property-size-report', element: <PropertySizeReport /> },
      { path: '/reports/venture-level-outstanding', element: <VentureLevelOutstandingReport /> },
      { path: '/reports/mlm-generation', element: <MLMGenerationReport /> },
      { path: '/reports/venture-wise-agent-outstanding', element: <VentureWiseAgentOutstandingReport /> },
      { path: '/reports/branch-wise-venture-outstanding', element: <BranchWiseVentureOutstandingReport /> },
      { path: '/reports/agent-team-view', element: <AgentTeamViewReport /> },
      { path: '/reports/mlm-hierarchy-view', element: <MLMHierarchyView /> },
      { path: '/reports/recent-agents', element: <RecentAgentsReport /> },
      { path: '/reports/salesreport', element: <SalesReport /> },


      { path: '/reports/free-registration-monitor', element: <FreeRegistrationMonitor /> },
      { path: '/customers/manage', element: <ManageCustomers /> },
      { path: '/customers/create', element: <CreateCustomer /> },
      { path: '/customers/view/:id', element: <ViewCustomer /> },
      { path: '/customers/edit/:id', element: <EditCustomer /> },
      { path: '/crm/leads', element: <ManageLeads /> },
      { path: '/crm/vehicles', element: <ManageVehicles /> },
      { path: '/crm/vehicle-owners', element: <ManageVehicleOwners /> },
      { path: '/crm/vehicle-owners/create', element: <CreateVehicleOwner /> },
      { path: '/crm/vehicle-owners/edit/:id', element: <EditVehicleOwner /> },
      { path: '/visitor-logs', element: <ManageVisitorLogs /> },
      { path: '/visitor-logs/create', element: <CreateVisitorLog /> },
      { path: '/visitor-logs/edit/:id', element: <EditVisitorLog /> },
      { path: '/call-logs', element: <ManageCallLogs /> },
      { path: '/call-logs/create', element: <CreateCallLog /> },
      { path: '/call-logs/edit/:id', element: <EditCallLog /> },
      { path: '/documents', element: <ManageDocuments /> },
      { path: '/documents/create', element: <CreateDocument /> },
      { path: '/documents/edit/:id', element: <EditDocument /> },
      { path: '/members', element: <ManageMembers /> },
      { path: '/members/agents', element: <ManageAgents /> },
      { path: '/members/create', element: <CreateMember /> },
      { path: '/members/edit/:id', element: <EditMember /> },
      { path: '/members/view/:id', element: <ViewMember /> },
      { path: '/members/employee-creds', element: <CreateEmployeeCreds /> },

      // Agent Approvals
      { path: '/agent-approvals/manage-chain/:id', element: <EditAgentChain /> },
      { path: '/agent-approvals', exact: true, element: <ManageAgentApprovals /> },
      { path: '/agent-approvals/create', element: <CreateAgentApproval /> },

      { path: '/crm/sitevisits', element: <SiteVisits /> },
      { path: '/crm/sitevisits/create', element: <CreateSiteVisit /> },
      { path: '/crm/sitevisits/edit/:id', element: <EditSiteVisit /> },

      // Assets
      { path: '/assets/ventures', element: <VenturesList /> },
      { path: '/assets/ventures/create', element: <CreateVenture /> },
      { path: '/assets/ventures/edit/:id', element: <EditVenture /> },
      { path: '/assets/ventures/dips-overview/:id', element: <DipsOverview /> },
      { path: '/assets/venture-logs/report', element: <VentureLogReport /> },
      { path: '/assets/properties', element: <PropertiesList /> },
      { path: '/assets/properties/create', element: <CreateProperty /> },
      { path: '/assets/properties/edit/:id', element: <EditProperty /> },
      { path: '/assets/properties/view/:id', element: <ViewProperty /> },

      // { path: '/', exact: true, element: <SamplePage /> },
      { path: '*', element: <Navigate to="/auth/404" /> },

      { path: '/apps/notes', element: <Notes /> },
      { path: '/utilities/form', element: <Form /> },
      { path: '/utilities/table', element: <Table /> },
      { path: '/apps/tickets', element: <Tickets /> },
      { path: '/apps/tickets/create', element: <CreateTickets /> },
      { path: '/apps/blog/post', element: <Blog /> },
      { path: '/apps/blog/detail/:id', element: <BlogDetail /> },
      { path: '/user-profile', element: <UserProfile /> },
      { path: '/icons/iconify', element: <SolarIcon /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/login', element: <Login2 /> },

      { path: '/auth/auth2/register', element: <Register2 /> },

      { path: '/auth/maintenance', element: <Maintainance /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
