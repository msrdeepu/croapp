export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

import { uniqueId } from 'lodash';

const SidebarContent: MenuItem[] = [
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/dashboard',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Management',
    children: [
      {
        name: 'Reports',
        icon: 'solar:chart-square-linear',
        id: uniqueId(),
        children: [
          { name: 'Project Business Report', id: uniqueId(), url: '/reports/project-business-report' },
          { name: 'Available Properties', id: uniqueId(), url: '/reports/available-properties' },
          { name: 'Sales Report', id: uniqueId(), url: '/reports/salesreport' },
          { name: 'Recent Agents', id: uniqueId(), url: '/reports/recent-agents' },
          { name: 'MLM Generation Plan', id: uniqueId(), url: '/reports/mlm-generation' },
          { name: 'MLM Hierarchy View', id: uniqueId(), url: '/reports/mlm-hierarchy-view' },
          { name: 'Agent Team View', id: uniqueId(), url: '/reports/agent-team-view' },
          { name: 'Manage Customers', id: uniqueId(), url: '/customers/manage' },
          { name: 'Free Registration Monitor', id: uniqueId(), url: '/reports/free-registration-monitor' },
          { name: 'Property Size Report', id: uniqueId(), url: '/reports/property-size-report' },

          { name: 'Venture Level Outstanding', id: uniqueId(), url: '/reports/venture-level-outstanding' },
          { name: 'Venture Wise Agent OS', id: uniqueId(), url: '/reports/venture-wise-agent-outstanding' },
          { name: 'Branch Wise Venture OS', id: uniqueId(), url: '/reports/branch-wise-venture-outstanding' },
        ],
      },
      {
        name: 'Revenues',
        icon: 'solar:wallet-money-linear',
        id: uniqueId(),
        children: [
          { name: 'Receipts', id: uniqueId(), url: '/revenues/receipts' },
        ],
      },
      {
        name: 'Expenses',
        icon: 'solar:bill-list-linear',
        id: uniqueId(),
        children: [
          { name: 'Site Visit Expenses', id: uniqueId(), url: '/expenses/site-visit' },
          { name: 'Transport Expenses', id: uniqueId(), url: '/expenses/transport' },
        ],
      },
      {
        name: 'Assets',
        icon: 'solar:buildings-2-linear',
        id: uniqueId(),
        children: [
          { name: 'Ventures', id: uniqueId(), url: '/assets/ventures' },
          { name: 'Properties', id: uniqueId(), url: '/assets/properties' },
          { name: 'Venture Logs', id: uniqueId(), url: '/assets/venture-logs/report' },
        ],
      },
      {
        name: 'CRM',
        icon: 'solar:user-hand-up-linear',
        id: uniqueId(),
        children: [
          { name: 'Document Management', id: uniqueId(), url: '/documents' },
          { name: 'Manage Leads', id: uniqueId(), url: '/crm/leads' },
          { name: 'Site Visits', id: uniqueId(), url: '/crm/sitevisits' },
          { name: 'Manage Vehicles', id: uniqueId(), url: '/crm/vehicles' },
          { name: 'Vehicle Owners', id: uniqueId(), url: '/crm/vehicle-owners' },
          { name: 'Visitor Logs', id: uniqueId(), url: '/visitor-logs' },
          { name: 'Call Logs', id: uniqueId(), url: '/call-logs' },
        ],
      },
      {
        name: 'Users',
        icon: 'solar:users-group-rounded-linear',
        id: uniqueId(),
        children: [
          { name: 'Manage Members', id: uniqueId(), url: '/members' },
          { name: 'Create Employees', id: uniqueId(), url: '/members/employee-creds' },
          { name: 'Joining / Promotion', id: uniqueId(), url: '/agent-approvals' },
        ],
      },
    ],
  },
];

export default SidebarContent;
