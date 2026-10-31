import { Station } from './station.model';
import { testAndInspectStream } from '../player/stream-tester';

export interface StationHealthResult {
    stationId: string;
    ok: boolean;
    latencyMs: number;
    errorReason?: string;
}

export async function checkAllStationsHealth(
    stations: Station[],
    concurrency = 5,
    timeoutMs = 7000
): Promise<StationHealthResult[]> {
    const results: StationHealthResult[] = new Array(stations.length);
    let nextIndex = 0;

    const worker = async () => {
        while (nextIndex < stations.length) {
            const currentIdx = nextIndex;
            nextIndex += 1;
            const station = stations[currentIdx];
            const check = await testAndInspectStream(
                station.streamUrl,
                timeoutMs
            );
            results[currentIdx] = {
                stationId: station.id,
                ok: check.ok,
                latencyMs: check.latencyMs,
                errorReason: check.errorReason
            };
        }
    };

    const workersCount = Math.min(Math.max(1, concurrency), stations.length);
    await Promise.all(Array.from({ length: workersCount }, () => worker()));
    return results;
}
