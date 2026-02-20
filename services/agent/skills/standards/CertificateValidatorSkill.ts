import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class CertificateValidatorSkill implements ISkill {
  public id = 'certificate_validator_skill';
  public name = 'Certificate Validator';
  public category = SkillCategory.STANDARDS;
  public description = 'Validates BRCGS, GlobalGAP, and other certificates via Third-Party Scraping Provider or Date Logic.';

  async execute(context: SkillContext): Promise<SkillResult> {
    const { metadata } = context;
    // Support both old input structure (direct fields) and new metadata structure
    const certName = metadata.certName || metadata.certificate?.name;
    const expiryDate = metadata.expiryDate || metadata.certificate?.expiryDate;

    if (!certName || !expiryDate) {
      return {
        success: false,
        confidence: 0,
        data: null,
        requiresHumanReview: true,
        verdict: 'UNKNOWN',
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'EXECUTION_SKIPPED',
          details: 'Missing certName or expiryDate'
        }]
      };
    }

    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const isValid = expiry > now;

      const diffMs = expiry.getTime() - now.getTime();
      const daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'Valid' | 'Expiring Soon' | 'Expired' = 'Valid';
      let verdict: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';

      if (!isValid) {
        status = 'Expired';
        verdict = 'NON_COMPLIANT';
      } else if (daysToExpiry < 30) {
        status = 'Expiring Soon';
        verdict = 'WARNING';
      }

      let message = "";
      if (status === 'Expired') {
        message = `❌ ${certName} expired on ${expiry.toLocaleDateString()}.`;
      } else if (status === 'Expiring Soon') {
        message = `⚠️ ${certName} expires in ${daysToExpiry} days.`;
      } else {
        message = `✅ ${certName} is valid.`;
      }

      // TODO: In the future, augment this with the Scraping Provider check (BRCGS/GlobalGAP) 
      // if the date check passes but we need to verify authenticity.

      return {
        success: isValid,
        confidence: 1.0,
        data: {
          isValid,
          daysToExpiry,
          status
        },
        requiresHumanReview: status === 'Expiring Soon',
        verdict: verdict,
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'VALIDATION_COMPLETE',
          details: message
        }]
      };

    } catch (error: any) {
      return {
        success: false,
        confidence: 0,
        data: null,
        requiresHumanReview: true,
        verdict: 'UNKNOWN',
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'EXECUTION_ERROR',
          details: `Date parsing failed: ${error.message}`
        }],
        errors: [error.message]
      };
    }
  }

  async validateContext(context: SkillContext): Promise<boolean> {
    return !!(context.metadata.certName || context.metadata.certificate?.name);
  }
}
