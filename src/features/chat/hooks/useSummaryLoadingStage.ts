import {
  SUMMARY_LOADING_EXIT_AFTER_MS,
  SUMMARY_LOADING_FIRST_STAGE_MIN_MS,
  SUMMARY_LOADING_REASSURE_AFTER_MS,
  SUMMARY_LOADING_STAGE_INTERVAL_MS,
} from '@/constants/config';
import {
  SUMMARY_LOADING_REASSURE_MESSAGE,
  SUMMARY_LOADING_STAGE_MESSAGES,
} from '@/constants/chatSummaryLoading';
import { useEffect, useState } from 'react';

interface SummaryLoadingStage {
  /** 지금 화면에 보여줄 문구 (안심 모드면 안심 문구) */
  message: string;
  /** 예상보다 오래 걸려 안심 문구로 전환된 상태 */
  isReassuring: boolean;
  /** 나가기 버튼을 노출해도 되는 시점을 지났는지 */
  canExit: boolean;
}

/**
 * 마운트 시점부터의 경과 시간만으로 대기 화면의 문구·상태를 계산한다.
 *
 * 서버가 요약 진행 단계를 주지 않으므로 여기서 만드는 값은 전부 연출이다. 임계 시간은 모두
 * `constants/config.ts` 상수라 튜닝 시 이 파일을 고칠 필요가 없다.
 */
export function useSummaryLoadingStage(characterName: string): SummaryLoadingStage {
  const [stageIndex, setStageIndex] = useState(0);
  const [isReassuring, setIsReassuring] = useState(false);
  const [canExit, setCanExit] = useState(false);

  useEffect(() => {
    const lastStageIndex = SUMMARY_LOADING_STAGE_MESSAGES.length - 1;
    // 첫 문구에만 최소 표시 시간 하한을 둔다 — 전환 주기를 짧게 낮춰 튜닝해도 진입 직후
    // 문구가 깜빡이지 않도록
    const firstStageDurationMs = Math.max(
      SUMMARY_LOADING_FIRST_STAGE_MIN_MS,
      SUMMARY_LOADING_STAGE_INTERVAL_MS
    );

    let currentIndex = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    function advanceStage() {
      currentIndex += 1;
      setStageIndex(currentIndex);
      // 마지막 문구에 도달하면 더 진행시키지 않는다 (순환 금지)
      if (currentIndex >= lastStageIndex && intervalId !== undefined) {
        clearInterval(intervalId);
      }
    }

    const firstStageTimeoutId = setTimeout(() => {
      if (lastStageIndex < 1) return;

      advanceStage();
      if (currentIndex >= lastStageIndex) return;

      intervalId = setInterval(advanceStage, SUMMARY_LOADING_STAGE_INTERVAL_MS);
    }, firstStageDurationMs);

    const reassureTimeoutId = setTimeout(
      () => setIsReassuring(true),
      SUMMARY_LOADING_REASSURE_AFTER_MS
    );
    const exitTimeoutId = setTimeout(() => setCanExit(true), SUMMARY_LOADING_EXIT_AFTER_MS);

    return () => {
      clearTimeout(firstStageTimeoutId);
      clearTimeout(reassureTimeoutId);
      clearTimeout(exitTimeoutId);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const message = isReassuring
    ? SUMMARY_LOADING_REASSURE_MESSAGE(characterName)
    : SUMMARY_LOADING_STAGE_MESSAGES[stageIndex](characterName);

  return { message, isReassuring, canExit };
}
