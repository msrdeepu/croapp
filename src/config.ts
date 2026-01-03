export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cro.slnmpl.group/api';

export const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/login`,
    LOGOUT: `${API_BASE_URL}/logout`,
    DASHBOARD: `${API_BASE_URL}/dashboard`,
    RECEIPTS_SELECT: `${API_BASE_URL}/receipts/select`,
    RECEIPTS_VENTURES: `${API_BASE_URL}/receipts/ventures`,
    REPORTS_CURRENT_BUSINESS: `${API_BASE_URL}/reports/current-business`,
    AVAILABLE_PROPERTIES: `${API_BASE_URL}/properties/available`,
    REPORTS_PROPERTY_SIZE: `${API_BASE_URL}/reports/property-size`,
    REPORTS_FREE_REGISTRATION: `${API_BASE_URL}/reports/freeregistration`,
    PROPERTY_BASE: `${API_BASE_URL}/property`,
    VENTURE_OUTSTANDING_REPORT: `${API_BASE_URL}/reports/venture-outstanding`,
    MLM_GENERATION_REPORT: `${API_BASE_URL}/reports/mlm-generation`,
    SALES_REPORT: `${API_BASE_URL}/reports/salesreport`,
    // List Items (Dropdowns)
    LIST_ITEMS: {
        CUSTOMER_FORM: `${API_BASE_URL}/list-items/customer-form`,
        STATES: `${API_BASE_URL}/list-items/states`,
        DISTRICTS: `${API_BASE_URL}/list-items/districts`,
        CUSTOMER_CODE: `${API_BASE_URL}/list-items/customer-code`,
    },
    // Customer Endpoints
    CUSTOMERS: {
        CREATE: `${API_BASE_URL}/customers/store`, // POST
        GET_CODE: `${API_BASE_URL}/customers/create`, // GET
        LIST: `${API_BASE_URL}/customers`, // GET
        EDIT: (id: string | number) => `${API_BASE_URL}/customers/${id}/edit`, // Method for edit url // GET
        UPDATE: (id: string | number) => `${API_BASE_URL}/customers/${id}`, // POST with _method=PUT
        DELETE: (id: string | number) => `${API_BASE_URL}/customers/${id}`, // DELETE method
    },
    SITEVISIT_BILLS: {
        BASE: `${API_BASE_URL}/sitevisit-bills`,
        FORM_DATA: `${API_BASE_URL}/sitevisit-bills/form-data`,
        PRINT: (id: string | number) => `${API_BASE_URL}/sitevisit-bills/${id}/print`
    },
    TRANSPORT_BILLS: {
        BASE: `${API_BASE_URL}/transport-bills`,
        FORM_DATA: `${API_BASE_URL}/transport-bills/form-data`,
        PRINT: (id: string | number) => `${API_BASE_URL}/transport-bills/${id}/print`
    },
    SITE_VISITS: {
        BASE: `${API_BASE_URL}/sitevisits`,
        STATUS_PENDING: `${API_BASE_URL}/sitevisits/status/pending`,
        STATUS_RESCHEDULED: `${API_BASE_URL}/sitevisits/status/rescheduled`,
        STATUS_COMPLETED: `${API_BASE_URL}/sitevisits/status/completed`,
        STATUS_CANCELED: `${API_BASE_URL}/sitevisits/status/canceled`,
        CREATE_FORM_DATA: `${API_BASE_URL}/sitevisits/create`, // Note: Backend uses create() to return form options
        RESCHEDULE: (id: string | number) => `${API_BASE_URL}/sitevisits/${id}/reschedule`,
        FINAL_STATUS: (id: string | number) => `${API_BASE_URL}/sitevisits/${id}/final-status`,
        RESTORE: (id: string | number) => `${API_BASE_URL}/sitevisits/${id}/restore`,
    }
};
