import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { ComplianceRule, ExtractedPOData } from '../../types';

interface ComplianceRequest {
    origin: string;
    destination: string;
    product: string;
    hsCode?: string;
    attributes?: string[];
}

interface ComplianceResponse {
    status: string;
    rules: ComplianceRule[];
}

export const checkComplianceRules = async (data: ExtractedPOData): Promise<ComplianceRule[]> => {
    try {
        const getComplianceRules = httpsCallable<ComplianceRequest, ComplianceResponse>(functions, 'getComplianceRules');

        // We iterate through products to check compliance for each
        // For the MVP/POC, we might just check the first one or aggregate them.
        // Let's assume we check the first product for now or map all of them.

        if (!data.products || data.products.length === 0) {
            return [];
        }

        // For this version, we will check the first primary product to get the main rules.
        // In a full version, we'd batch check all items.
        const mainProduct = data.products[0];

        const requestPayload: ComplianceRequest = {
            origin: data.originCountry,
            destination: data.destinationCountry,
            product: mainProduct.name,
            hsCode: mainProduct.hsCode,
            attributes: mainProduct.isOrganic ? ['Organic'] : []
        };

        const result = await getComplianceRules(requestPayload);
        return result.data.rules;

    } catch (error) {
        console.error("Compliance Engine Error:", error);
        // Fallback? Or rethrow?
        // For now, rethrow so UI handles it.
        throw error;
    }
};
