export interface SensorReading {
    timestamp: string;
    temperature: number;
    humidity?: number;
    shock?: number; // G-force
    location?: { lat: number; lng: number };
}

export interface IoTData {
    containerId: string;
    readings: SensorReading[];
    batteryLevel: number;
    lastSync: string;
}

export const ioTService = {

    /**
     * MKT (Mean Kinetic Temperature) Calculation
     * Standard pharm/food equation for degrading payloads.
     */
    calculateMKT: (readings: SensorReading[]): number => {
        const R = 8.314; // Gas constant
        const deltaH = 83.144; // Activation Energy (standard value for general degradation)

        let sum = 0;
        readings.forEach(r => {
            const tempK = r.temperature + 273.15;
            sum += Math.exp(-deltaH / (R * tempK));
        });

        const avg = sum / readings.length;
        const mktK = -deltaH / (R * Math.log(avg));
        return mktK - 273.15; // Back to Celsius
    },

    /**
     * Fetch IoT Logs (Real Mock)
     * Generates a realistic 24-48h journey log based on scenario.
     */
    getContainerLogs: async (containerId: string, scenario: 'NORMAL' | 'BREACH' | 'SHOCK' = 'NORMAL'): Promise<IoTData> => {
        // Simulate Network Latency
        await new Promise(r => setTimeout(r, 800));

        const readings: SensorReading[] = [];
        const now = new Date();
        const readingCount = 48; // 48 hours

        let currentTemp = 4.0; // Starting temp

        for (let i = readingCount; i > 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000); // i hours ago

            // Random fluctuation
            const noise = (Math.random() - 0.5) * 0.5;
            currentTemp += noise;

            // Scenario Logic
            if (scenario === 'BREACH' && i < 10) {
                // Last 10 hours, compressor failed?
                currentTemp += 0.8; // Fast rise
            } else {
                // Re-stabilize towards setpoint 4.0
                if (currentTemp > 4.5) currentTemp -= 0.2;
                if (currentTemp < 3.5) currentTemp += 0.2;
            }

            readings.push({
                timestamp: time.toISOString(),
                temperature: parseFloat(currentTemp.toFixed(2)),
                humidity: 85 + (Math.random() * 5),
                location: { lat: 0, lng: 0 } // Mock GPS
            });
        }

        return {
            containerId,
            readings,
            batteryLevel: 87,
            lastSync: now.toISOString()
        };
    }
};
