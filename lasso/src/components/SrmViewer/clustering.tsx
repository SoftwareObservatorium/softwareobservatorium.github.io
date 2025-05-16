import { CodeVersion, RankingCriterion } from "@site/src/services/models";

export function getMetricVectorForImpl(impl: CodeVersion, selectedMetrics: string[], measures: any[]): number[] {
  // find all measures for this impl and return an array of the selected metric values as numbers
  return selectedMetrics.map(metric => {
    const m = measures.find(m =>
      m.id === impl.id &&
      m.VARIANTID === impl.variantId &&
      m.ADAPTERID === impl.adapterId &&
      m.TYPE === metric);
    // parseFloat, fallback (null/undefined) to NaN

    return m ? parseFloat(m.VALUE) : NaN;
  });
}

// Helper: get measures as {metricName: value} from measures[]
export function getMeasureMap(
  impl: CodeVersion,
  selectedMetrics: string[],
  measures: any[],
): Record<string, number> {
  const result: Record<string, number> = {};
  selectedMetrics.forEach(metric => {
    const m = measures.find(
      mm =>
        mm.id === impl.id &&
        mm.VARIANTID === impl.variantId &&
        mm.ADAPTERID === impl.adapterId &&
        mm.TYPE === metric
    );
    result[metric] = m ? parseFloat(m.VALUE) : NaN;
  });
  return result;
}

export type MetricSelection = {
  id: string;                // metric name
  objective: 0 | 1;         // 0=minimize, 1=maximize
  priority: number;
};

// Helper: produce RankingCriterion[]
export const buildCriteria = (metricSelections: MetricSelection[]) =>
  metricSelections.map(m => ({
    id: m.id,
    objective: m.objective, // 0=minimize, 1=maximize
    weight: 1,              //
    priority: m.priority,
  }));