import { Skill, SkillResult } from './skillRegistry';

export class IoTSensorAnalysisSkill implements Skill {
    id = 'iot_sensor_analysis';
    name = 'IoT Sensor Analysis';
    description = 'Analyzes IoT sensor logs for temperature excursions and MKT.';

    async execute(payload: any): Promise<SkillResult> {
        const { readings, metric, target } = payload;

        if (!readings || !Array.isArray(readings) || readings.length === 0) {
            return { success: false, status: 'Error', message: 'No readings provided.', score: 0 };
        }

        if (metric === 'MKT') {
            // Mean Kinetic Temperature Calculation logic
            // Simplified for this extraction
            const sum = readings.reduce((acc, r) => acc + Math.exp(-83.144 / (8.314 * (r + 273.15))), 0);
            const mkt = -83.144 / (8.314 * Math.log(sum / readings.length)) - 273.15;

            const limit = target || 4.0;
            const diff = mkt - limit;

            if (diff > 2) {
                return {
                    success: true,
                    status: 'Fail',
                    message: `Critical MKT Breach: ${mkt.toFixed(2)}°C`,
                    data: { value: mkt },
                    score: 0
                };
            }
            return { success: true, status: 'Pass', message: `MKT Safe: ${mkt.toFixed(2)}°C`, data: { value: mkt }, score: 1.0 };
        }

        return { success: false, status: 'Error', message: 'Unknown metric', score: 0 };
    }
}
