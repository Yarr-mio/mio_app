export interface ConstellationChartPoint {
  label: string;
  /** 체크인 condition_score 주/일 평균 (1~5). null이면 해당 구간 데이터 없음 */
  intensity: number | null;
}
