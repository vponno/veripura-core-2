
import { OrganicComplianceSkill } from '../services/agent/skills/standards/OrganicComplianceSkill';
import { SkillContext } from '../services/agent/types';

async function main() {
    console.log('🌱  Organic Sentinel Verification 🌱\n');

    const skill = new OrganicComplianceSkill();

    const testCases: { name: string, context: SkillContext, expectedVerdict: string }[] = [
        {
            name: 'US Import with USDA NOP Cert (Direct Match)',
            context: {
                consignmentId: 'TEST-ORG-1',
                files: [],
                metadata: {
                    product: 'Organic Apples',
                    destination: 'USA',
                    certificationType: 'USDA_NOP'
                }
            },
            expectedVerdict: 'COMPLIANT'
        },
        {
            name: 'US Import with EU Organic Cert (Equivalence)',
            context: {
                consignmentId: 'TEST-ORG-2',
                files: [],
                metadata: {
                    product: 'Organic Wine',
                    destination: 'USA',
                    certificationType: 'EU_ORGANIC'
                }
            },
            expectedVerdict: 'COMPLIANT'
        },
        {
            name: 'US Import with China Organic Cert (No Equivalence)',
            context: {
                consignmentId: 'TEST-ORG-3',
                files: [],
                metadata: {
                    product: 'Organic Tea',
                    destination: 'USA',
                    certificationType: 'CHINA_ORGANIC'
                }
            },
            expectedVerdict: 'NON_COMPLIANT'
        },
        {
            name: 'EU Import with Korea Organic Cert (Equivalence)',
            context: {
                consignmentId: 'TEST-ORG-4',
                files: [],
                metadata: {
                    product: 'Organic Kimchi',
                    destination: 'Germany',
                    certificationType: 'KOREA_ORGANIC'
                }
            },
            expectedVerdict: 'COMPLIANT'
        },
        {
            name: 'UK Import with COR Cert (Equivalence)',
            context: {
                consignmentId: 'TEST-ORG-5',
                files: [],
                metadata: {
                    product: 'Organic Maple Syrup',
                    destination: 'UK',
                    certificationType: 'COR'
                }
            },
            expectedVerdict: 'COMPLIANT'
        },
        {
            name: 'Japan Import with ACO Cert (Equivalence)',
            context: {
                consignmentId: 'TEST-ORG-6',
                files: [],
                metadata: {
                    product: 'Organic Beef',
                    destination: 'Japan',
                    certificationType: 'ACO'
                }
            },
            expectedVerdict: 'COMPLIANT'
        }
    ];

    for (const test of testCases) {
        process.stdout.write(`Testing: ${test.name.padEnd(50)} ... `);
        try {
            const result = await skill.execute(test.context);
            if (result.verdict === test.expectedVerdict) {
                console.log('✅ PASS');
            } else {
                console.log(`❌ FAIL (Expected: ${test.expectedVerdict}, Got: ${result.verdict})`);
                if (result.data) console.log('   Data:', JSON.stringify(result.data));
                if (result.errors) console.log('   Errors:', result.errors);
            }
        } catch (error) {
            console.log('💥 ERROR');
            console.error(error);
        }
    }
}

main().catch(console.error);
