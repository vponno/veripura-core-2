import { KnowledgeFact } from '../../types';

export interface ConsistencyConflict {
    field: string;
    previousValue: string;
    currentValue: string;
    previousSource: string;
    currentSource: string;
    severity: 'critical' | 'warning';
}

export interface ConsistencyGap {
    field: string;
    expected: string;
    reason: string;
    severity: 'critical' | 'warning';
}

export interface ChainValidationResult {
    timestamp: string;
    documentType: string;
    eventType: 'upload' | 'scheduled' | 'manual';
    backwardValid: boolean;
    forwardValid: boolean;
    conflicts: ConsistencyConflict[];
    gaps: ConsistencyGap[];
    status: 'valid' | 'flagged';
    checkedFields: string[];
}

export interface ValidationHistoryEntry {
    id: string;
    timestamp: string;
    documentType?: string;
    eventType: 'upload' | 'scheduled' | 'manual';
    backwardValid: boolean;
    forwardValid: boolean;
    conflictCount: number;
    gapCount: number;
    status: 'valid' | 'flagged';
    summary: string;
}

export class ConsistencyValidator {
    private readonly TRACKED_FIELDS = [
        'product_name',
        'hs_code',
        'origin_country',
        'destination_country',
        'seller_name',
        'seller_address',
        'buyer_name',
        'buyer_address',
        'quantity',
        'unit',
        'price',
        'currency'
    ];

    validateOneStepBackward(
        newFacts: KnowledgeFact[],
        existingFacts: KnowledgeFact[]
    ): { conflicts: ConsistencyConflict[]; valid: boolean } {
        const conflicts: ConsistencyConflict[] = [];
        
        for (const newFact of newFacts) {
            if (!this.TRACKED_FIELDS.includes(newFact.predicate)) continue;
            
            const existing = existingFacts.find(f => 
                f.predicate === newFact.predicate && 
                f.object !== newFact.object
            );

            if (existing) {
                const severity = this.determineSeverity(newFact.predicate, existing.object, newFact.object);
                conflicts.push({
                    field: newFact.predicate,
                    previousValue: existing.object,
                    currentValue: newFact.object,
                    previousSource: existing.source,
                    currentSource: newFact.source,
                    severity
                });
            }
        }

        return {
            conflicts,
            valid: conflicts.length === 0
        };
    }

    validateOneStepForward(
        currentFacts: KnowledgeFact[],
        uploadedDocuments: string[]
    ): { gaps: ConsistencyGap[]; valid: boolean } {
        const gaps: ConsistencyGap[] = [];
        
        const productFact = currentFacts.find(f => f.predicate === 'product_name')?.object;
        const originFact = currentFacts.find(f => f.predicate === 'origin_country')?.object;
        const destFact = currentFacts.find(f => f.predicate === 'destination_country')?.object;
        const sellerFact = currentFacts.find(f => f.predicate === 'seller_name')?.object;
        const buyerFact = currentFacts.find(f => f.predicate === 'buyer_name')?.object;
        const hsCodeFact = currentFacts.find(f => f.predicate === 'hs_code')?.object;

        const hasInvoice = uploadedDocuments.some(d => d.toLowerCase().includes('invoice'));
        const hasPackingList = uploadedDocuments.some(d => d.toLowerCase().includes('packing'));
        const hasBL = uploadedDocuments.some(d => d.toLowerCase().includes('lading') || d.toLowerCase().includes('bill'));
        const hasCertificate = uploadedDocuments.some(d => d.toLowerCase().includes('certificate'));
        const hasOrigin = uploadedDocuments.some(d => d.toLowerCase().includes('origin'));

        if (hasInvoice && !hasPackingList) {
            gaps.push({
                field: 'packing_list',
                expected: 'Packing List',
                reason: 'Invoice uploaded but no Packing List found - required for customs',
                severity: 'critical'
            });
        }

        if (hasInvoice && !hasBL) {
            gaps.push({
                field: 'bill_of_lading',
                expected: 'Bill of Lading',
                reason: 'Invoice uploaded but no B/L found - required for shipment',
                severity: 'critical'
            });
        }

        if (productFact && !hasCertificate && uploadedDocuments.length > 2) {
            gaps.push({
                field: 'certificate',
                expected: 'Product Certificate',
                reason: 'Multiple documents uploaded but no certificate found - may be required for this product',
                severity: 'warning'
            });
        }

        if (originFact && !hasOrigin) {
            gaps.push({
                field: 'certificate_of_origin',
                expected: 'Certificate of Origin',
                reason: 'Origin specified but no CO found - may be required for duty benefits',
                severity: 'warning'
            });
        }

        if (hsCodeFact && hsCodeFact.startsWith('03') && !hasCertificate) {
            gaps.push({
                field: 'health_certificate',
                expected: 'Health Certificate (IUU)',
                reason: 'Seafood product (HS 03) requires catch/health certificate',
                severity: 'critical'
            });
        }

        return {
            gaps,
            valid: gaps.filter(g => g.severity === 'critical').length === 0
        };
    }

    validateFullChain(
        allFacts: KnowledgeFact[]
    ): { valid: boolean; issues: string[] } {
        const issues: string[] = [];
        
        const originValues = allFacts
            .filter(f => f.predicate === 'origin_country')
            .map(f => f.object);
        
        const uniqueOrigins = [...new Set(originValues)];
        if (uniqueOrigins.length > 1) {
            issues.push(`Inconsistent origins detected: ${uniqueOrigins.join(', ')}`);
        }

        const destValues = allFacts
            .filter(f => f.predicate === 'destination_country')
            .map(f => f.object);
        
        const uniqueDests = [...new Set(destValues)];
        if (uniqueDests.length > 1) {
            issues.push(`Inconsistent destinations detected: ${uniqueDests.join(', ')}`);
        }

        const productValues = allFacts
            .filter(f => f.predicate === 'product_name')
            .map(f => f.object.toLowerCase());
        
        if (productValues.length > 1) {
            const uniqueProducts = [...new Set(productValues)];
            if (uniqueProducts.length > 1) {
                issues.push(`Inconsistent products detected: ${uniqueProducts.join(', ')}`);
            }
        }

        const sellerValues = allFacts
            .filter(f => f.predicate === 'seller_name')
            .map(f => f.object.toLowerCase());
        
        if (sellerValues.length > 1) {
            const uniqueSellers = [...new Set(sellerValues)];
            if (uniqueSellers.length > 1) {
                issues.push(`Inconsistent sellers detected: ${uniqueSellers.join(', ')}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    generateValidationResult(
        documentType: string,
        eventType: 'upload' | 'scheduled' | 'manual',
        backwardResult: { conflicts: ConsistencyConflict[]; valid: boolean },
        forwardResult: { gaps: ConsistencyGap[]; valid: boolean }
    ): ChainValidationResult {
        const hasCriticalConflicts = backwardResult.conflicts.some(c => c.severity === 'critical');
        const hasCriticalGaps = forwardResult.gaps.filter(g => g.severity === 'critical').length > 0;

        return {
            timestamp: new Date().toISOString(),
            documentType,
            eventType,
            backwardValid: backwardResult.valid,
            forwardValid: forwardResult.valid,
            conflicts: backwardResult.conflicts,
            gaps: forwardResult.gaps,
            status: hasCriticalConflicts || hasCriticalGaps ? 'flagged' : 'valid',
            checkedFields: this.TRACKED_FIELDS
        };
    }

    private determineSeverity(
        field: string,
        previousValue: string,
        currentValue: string
    ): 'critical' | 'warning' {
        const criticalFields = ['hs_code', 'origin_country', 'destination_country'];
        
        if (criticalFields.includes(field)) return 'critical';
        
        if (previousValue.toLowerCase() !== currentValue.toLowerCase()) {
            return 'warning';
        }
        
        return 'warning';
    }

    normalizeFieldValue(value: string, field: string): string {
        if (field === 'hs_code') {
            return value.replace(/[^0-9.]/g, '').substring(0, 6);
        }
        return value.toLowerCase().trim();
    }
}

export const consistencyValidator = new ConsistencyValidator();
