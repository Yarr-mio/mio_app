import type { LegalDocument } from '@/types/legal';
import { LEGAL_DOCUMENT_IDS } from '@/types/legal';

export const PRIVACY_COLLECTION_DOCUMENT: LegalDocument = {
  id: LEGAL_DOCUMENT_IDS.privacyCollection,
  title: '개인정보 수집 및 이용',
  blocks: [
    {
      type: 'paragraph',
      text: '폴라리스는 Mio 회원가입과 핵심 서비스 제공을 위해 다음 개인정보를 수집·이용합니다.',
    },

    { type: 'heading', text: '수집·이용 목적' },
    {
      type: 'paragraph',
      text: '1. 회원 식별, 로그인, 계정 관리 및 만 14세 이상 여부 확인',
    },
    {
      type: 'paragraph',
      text: '2. 이용자가 선택한 캐릭터와 설정 적용',
    },
    {
      type: 'paragraph',
      text: '3. 서비스 보안, 장애 대응, 품질·비용 모니터링 및 부정 이용 방지',
    },

    { type: 'heading', text: '수집·이용 항목' },
    { type: 'heading', text: '1. 계정 정보' },
    {
      type: 'paragraph',
      text: '소셜 로그인 제공자 식별자, 제공되는 경우 이메일 또는 계정 정보, 닉네임, 만 14세 이상 여부, 동의 여부·버전·시각',
    },
    { type: 'heading', text: '2. 서비스 설정' },
    {
      type: 'paragraph',
      text: '선택 캐릭터, 대화·알림 설정 및 이용자가 저장을 요청한 설정',
    },
    { type: 'heading', text: '3. 자동 생성 정보' },
    {
      type: 'paragraph',
      text: '세션 ID, 접속 일시, IP 주소, 기기·운영체제·앱 버전, 이벤트·오류·API 호출·토큰·지연·비용 로그',
    },

    { type: 'heading', text: '보유 및 이용 기간' },
    {
      type: 'paragraph',
      text: '1. 계정·프로필·설정 정보는 원칙적으로 회원 탈퇴 또는 이용계약 종료 시까지 보유합니다.',
    },
    {
      type: 'paragraph',
      text: '2. 접속·보안·장애·이벤트·API 비용 로그는 생성일로부터 30일 동안 보유한 뒤 자동 삭제합니다. 대화 원문과 민감정보는 원칙적으로 운영 로그에 기록하지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 회원 탈퇴 또는 삭제 요청이 접수되면 계정 접근을 즉시 차단하고 운영 데이터베이스에서는 7일 이내, 백업과 CloudWatch 등 파생 저장소에서는 30일 이내 삭제합니다.',
    },
    {
      type: 'paragraph',
      text: '4. 동의·철회 이력과 분쟁 대응에 필요한 최소 정보는 해당 목적을 위해 탈퇴 후 3년간 다른 정보와 분리하여 보관한 뒤 삭제합니다.',
    },

    { type: 'heading', text: '동의 거부권과 거부 시 영향' },
    {
      type: 'paragraph',
      text: '이용자는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 다만 위 정보는 계정 생성, 로그인, 서비스 설정, 보안 및 핵심 기능 제공에 필요하므로 동의하지 않으면 Mio에 가입하거나 핵심 서비스를 이용할 수 없습니다.',
    },

    { type: 'heading', text: '이 동의에 포함되지 않는 처리' },
    {
      type: 'bullet',
      text: '감정·심리 상태, 정신건강 관련 대화, 위험 신호 등 민감정보 처리',
    },
    {
      type: 'bullet',
      text: '별도 연구·인터뷰의 녹음·전사 및 외부 자료 인용',
    },
    {
      type: 'bullet',
      text: '범용 AI 모델 학습 또는 공개 연구',
    },
    {
      type: 'bullet',
      text: '마케팅·광고성 정보 수신',
    },
    {
      type: 'bullet',
      text: '제3자 제공 또는 동의를 근거로 하는 국외 이전',
    },

    { type: 'heading', text: '필수 동의 문구' },
    {
      type: 'paragraph',
      text: '본인은 위 내용을 확인했으며 Mio 회원가입과 핵심 서비스 제공을 위해 폴라리스가 위 개인정보를 수집·이용하는 것에 동의합니다.',
    },
  ],
};
