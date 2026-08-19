import type { LegalDocument } from '@/types/legal';
import { LEGAL_DOCUMENT_IDS } from '@/types/legal';

export const SENSITIVE_INFO_DOCUMENT: LegalDocument = {
  id: LEGAL_DOCUMENT_IDS.sensitive,
  title: '민감정보 수집 및 이용',
  blocks: [
    {
      type: 'paragraph',
      text: 'Mio는 이용자의 감정과 상황을 반영한 AI 대화, 기억, 작은 행동 제안 및 안전 안내를 제공하기 위해 다음 민감정보를 처리할 수 있습니다.',
    },

    { type: 'heading', text: '수집·이용 목적' },
    {
      type: 'paragraph',
      text: '1. 이용자가 입력한 감정·상황을 반영한 AI 대화 제공',
    },
    {
      type: 'paragraph',
      text: '2. 체크인, 사고 재구성, Todo 및 작은 행동 제안',
    },
    {
      type: 'paragraph',
      text: '3. 이용자가 허용한 범위의 기억, 세션 요약 및 리포트 제공',
    },
    {
      type: 'paragraph',
      text: '4. 자해·자살·타해 등 위험 신호 감지와 일반 대화 중단 및 안전 안내',
    },
    {
      type: 'paragraph',
      text: '5. 오류·유해 응답 신고 처리와 서비스 품질·안전 점검',
    },

    { type: 'heading', text: '수집·이용 항목' },
    { type: 'heading', text: '1. 직접 입력 정보' },
    {
      type: 'paragraph',
      text: '감정·심리 상태, 스트레스·불안·소진·외로움·두려움·비교 경험, 정신건강 또는 건강 상태가 포함될 수 있는 대화·체크인·피드백',
    },
    { type: 'heading', text: '2. 위험 관련 정보' },
    {
      type: 'paragraph',
      text: '자해·자살·타해·폭력 또는 즉각적인 위험과 관련된 발화와 이용자가 제공한 맥락',
    },
    { type: 'heading', text: '3. 추론·분류 정보' },
    {
      type: 'paragraph',
      text: '입력 내용으로부터 생성된 감정·문제 유형, 인지 패턴, 위험 수준, 응답 정책 또는 개입 강도 분류 결과',
    },
    { type: 'heading', text: '4. 파생 정보' },
    {
      type: 'paragraph',
      text: '민감한 대화를 바탕으로 생성된 세션 요약, 기억, Todo, 리포트 및 품질·Safety 평가 결과',
    },

    { type: 'heading', text: '보유 및 이용 기간' },
    {
      type: 'paragraph',
      text: '1. 원칙적으로 회원 탈퇴, 해당 정보의 삭제 요청 또는 민감정보 동의 철회 시까지 보유·이용합니다.',
    },
    {
      type: 'paragraph',
      text: '2. 개별 대화·기억을 삭제한 경우 서비스 화면과 운영 데이터베이스에서는 7일 이내, 백업과 파생 저장소에서는 30일 이내 삭제합니다.',
    },
    {
      type: 'paragraph',
      text: '3. 실제 Safety 사건으로 분류되어 사람의 검토가 이루어진 경우 사건 ID, 처리 시각, 적용 정책, 조치 결과 등 최소 기록만 90일간 분리 보관합니다. 대화 원문은 필요한 구간으로 최소화하고 접근자를 개인정보 보호책임자와 지정된 Safety 담당자로 제한합니다.',
    },
    {
      type: 'paragraph',
      text: '4. 별도 연구·인터뷰를 진행하는 경우 녹음 파일은 인터뷰일로부터 90일, 전사·요약본은 별도 동의가 있는 경우 연구 종료 후 1년까지 보유한 뒤 삭제합니다. 외부 자료에 사용하는 인용문은 익명 또는 가명 처리합니다.',
    },

    { type: 'heading', text: 'AI 처리와 외부 사업자' },
    {
      type: 'paragraph',
      text: '1. Mio는 AI 응답 생성을 위해 대화 내용의 일부와 필요한 문맥을 OpenAI, L.L.C.(미국)의 API로 전송하며, 회사가 자체 구성한 안전·보안 정책 시스템과 함께 대화와 행동 제안을 생성합니다.',
    },
    {
      type: 'paragraph',
      text: '2. OpenAI에 전송하는 항목은 이용자가 입력한 대화 메시지, 감정 체크인 기록, 온보딩 응답 중 응답 생성에 필요한 현재 입력과 최소 문맥입니다. 계정 식별자, 이메일, 연락처와 같은 직접 식별정보는 전송 내용에서 제거합니다.',
    },
    {
      type: 'paragraph',
      text: '3. 전송 정보는 미국 및 OpenAI가 공개한 하위처리자 소재 국가에서 처리되며, 오남용 방지를 위해 최대 30일간 보관된 뒤 삭제됩니다. OpenAI는 회사와의 데이터 처리 조건에 따라 회사가 적용하는 것과 동등한 수준의 개인정보 보호 조치를 제공합니다.',
    },
    {
      type: 'paragraph',
      text: '4. 전송 정보는 회사가 별도로 데이터 공유에 동의하지 않는 한 범용 인공지능 모델 학습에 사용되지 않습니다. 회사는 데이터 공유 또는 외부 모델 개선 참여 옵션을 활성화하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '5. 회사는 외부 인공지능 서비스의 장기 저장 기능을 사용하지 않으며 사용자의 대화 원문과 민감정보를 외부 업체의 파일·지식저장소·대화 보존 기능에 저장하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '6. 필요한 고지나 국외 이전 요건이 충족되지 않은 외부 처리 경로에는 개인정보나 민감정보를 전송하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '7. AI가 생성한 응답·요약·제안에는 이용자가 명확히 인식할 수 있도록 AI 생성 결과임을 표시합니다.',
    },

    { type: 'heading', text: '동의 거부권과 거부 시 영향' },
    {
      type: 'paragraph',
      text: '1. 이용자는 민감정보 수집·이용에 동의하지 않을 권리가 있습니다.',
    },
    {
      type: 'paragraph',
      text: '2. 다만 Mio의 핵심 기능은 감정·상황 입력을 바탕으로 AI 대화, 기억, 행동 제안 및 안전 처리를 제공하므로 동의하지 않으면 AI 대화·체크인·기억·리포트 등 핵심 기능을 이용할 수 없습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 동의 후에도 앱 설정 또는 고객센터를 통해 동의를 철회하거나 열람·정정·삭제·처리정지를 요청할 수 있습니다.',
    },
    {
      type: 'paragraph',
      text: '4. 별도 연구·인터뷰, 외부 자료 인용 및 자체 학습 데이터 활용에 동의하지 않더라도 일반적인 Mio 핵심 기능 이용에는 불이익을 주지 않습니다.',
    },

    { type: 'heading', text: '서비스 범위와 Safety 안내' },
    {
      type: 'paragraph',
      text: '1. Mio는 의료적 진단·치료·처방 또는 전문 심리상담을 제공하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '2. AI가 생성한 답변과 위험 분류는 오류가 있을 수 있으며 전문 의료인의 판단을 대신하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 즉각적인 위험이 있는 경우 112·119 또는 자살예방 상담전화 109에 연락해야 합니다.',
    },
    {
      type: 'paragraph',
      text: '4. 위험 신호가 감지되면 일반 대화를 중단하고 안전 안내를 제공할 수 있습니다.',
    },

    { type: 'heading', text: '목적 외 이용 제한' },
    {
      type: 'paragraph',
      text: '1. 민감정보를 맞춤형 광고, 제3자 마케팅 또는 이용자에게 불리한 고용·신용·보험 판단에 사용하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '2. 원문 대화·인터뷰를 범용 AI 모델 학습이나 공개 연구자료로 사용하는 것은 이 필수 동의에 포함되지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 서비스 개선 연구나 자체 모델 학습에 민감정보가 필요한 경우 별도의 선택 동의를 받거나 법령상 적법한 절차를 적용합니다.',
    },

    { type: 'heading', text: '필수 동의 문구' },
    {
      type: 'paragraph',
      text: '본인은 위 내용을 확인했으며 Mio의 핵심 기능 제공과 Safety 운영을 위해 폴라리스가 위 민감정보를 수집·이용하는 것에 동의합니다.',
    },
  ],
};
