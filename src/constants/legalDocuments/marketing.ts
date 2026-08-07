import type { LegalDocument } from '@/types/legal';
import { LEGAL_DOCUMENT_IDS } from '@/types/legal';

export const MARKETING_CONSENT_DOCUMENT: LegalDocument = {
  id: LEGAL_DOCUMENT_IDS.marketing,
  title: '마케팅 정보 수신 동의',
  blocks: [
    { type: 'heading', text: '수신 목적' },
    {
      type: 'paragraph',
      text: 'Mio 신규 기능, 이벤트, 프로모션 및 유료 서비스 혜택 안내',
    },

    { type: 'heading', text: '이용 항목' },
    {
      type: 'paragraph',
      text: '이메일, 휴대전화번호, 푸시 토큰 중 이용자가 선택한 채널에 필요한 정보',
    },

    { type: 'heading', text: '발송 채널' },
    {
      type: 'paragraph',
      text: '앱 푸시와 이메일. 문자·카카오톡 등 별도 채널은 추가 동의와 수탁자 공개 전까지 사용하지 않습니다.',
    },

    { type: 'heading', text: '보유 및 이용 기간' },
    {
      type: 'paragraph',
      text: '동의일로부터 2년 또는 동의 철회 시까지 중 먼저 도래하는 때까지. 계속 수신을 원하는 경우 기간 만료 전에 다시 동의를 받습니다.',
    },

    { type: 'heading', text: '선택권과 철회' },
    {
      type: 'paragraph',
      text: '1. 마케팅 정보 수신 동의는 선택 사항이며 동의하지 않아도 회원가입과 핵심 서비스를 이용할 수 있습니다.',
    },
    {
      type: 'paragraph',
      text: '2. 이용자는 앱 설정, 메시지의 수신거부 기능 또는 고객센터 mio.official402@gmail.com을 통해 언제든 채널별 동의를 철회할 수 있습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 회사는 수신 동의·철회 일시와 채널을 기록하고 철회 이후 광고성 정보 발송 대상에서 제외합니다.',
    },
    {
      type: 'paragraph',
      text: '4. 서비스 보안, 약관 변경, 장애, 결제, 계정 등 계약 이행에 필요한 운영 안내는 광고성 정보와 구분합니다.',
    },

    { type: 'heading', text: '야간 광고성 정보' },
    {
      type: 'paragraph',
      text: 'Mio는 오후 9시부터 다음 날 오전 8시까지 광고성 정보를 발송하지 않습니다. 향후 야간 발송이 필요한 경우 일반 마케팅 동의와 별도의 야간 수신 동의를 받은 뒤에만 발송합니다.',
    },

    { type: 'heading', text: '선택 동의 문구' },
    {
      type: 'paragraph',
      text: '마케팅 정보 수신에 동의합니다. [선택]',
    },
    {
      type: 'paragraph',
      text: '현재 가입 화면에는 야간 광고성 정보 수신 항목을 표시하지 않습니다.',
    },
  ],
};
