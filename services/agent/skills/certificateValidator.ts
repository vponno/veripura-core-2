import { Skill, SkillResult } from './skillRegistry';

export interface CertValidationInput {
    certName: string;
    expiryDate: string;
    scope?: string[];
}

export interface CertValidationResult {
    isValid: boolean;
    daysToExpiry: number;
    status: 'Valid' | 'Expiring Soon' | 'Expired';
    message: string;
}

export class CertificateValidatorSkill implements Skill {
    id = 'certificate_validator';
    name = 'Certificate Validator';
    description = 'Standardized validation for GFSI and industry certifications (HACCP, ISO, BRC).';

    async execute(input: CertValidationInput): Promise<SkillResult> {
        const { certName, expiryDate } = input;

        try {
            const expiry = new Date(expiryDate);
            const now = new Date();
            const isValid = expiry > now;

            const diffMs = expiry.getTime() - now.getTime();
            const daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            let status: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
            if (!isValid) status = 'Expired';
            else if (daysToExpiry < 30) status = 'Expiring Soon';

            let message = "";
            if (status === 'Expired') {
                message = `❌ ${certName} expired on ${expiry.toLocaleDateString()}.`;
            } else if (status === 'Expiring Soon') {
                message = `⚠️ ${certName} expires in ${daysToExpiry} days.`;
            } else {
                message = `✅ ${certName} is valid.`;
            }

            return {
                success: isValid,
                status: status,
                message: message,
                score: isValid ? 1.0 : 0,
                data: { isValid, daysToExpiry, status }
            };
        } catch (error) {
            return {
                success: false,
                status: 'Error',
                message: `Failed to parse expiry date for ${certName}.`,
                score: 0,
                data: {
                    isValid: false,
                    daysToExpiry: 0,
                    status: 'Expired'
                }
            };
        }
    }
}
