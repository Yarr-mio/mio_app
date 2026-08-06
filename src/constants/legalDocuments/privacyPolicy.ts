import type { LegalDocument } from '@/types/legal';
import { LEGAL_DOCUMENT_IDS } from '@/types/legal';

export const PRIVACY_POLICY_DOCUMENT: LegalDocument = {
  id: LEGAL_DOCUMENT_IDS.privacyPolicy,
  title: '개인정보 처리방침',
  blocks: [
    { type: 'heading', text: '개인정보 처리 목적' },
    {
      type: 'paragraph',
      text: '1. 회원 식별, 로그인 및 계정 관리',
    },
    {
      type: 'paragraph',
      text: '2. AI 대화, 체크인, Todo, 기억, 리포트 및 알림 제공',
    },
    {
      type: 'paragraph',
      text: '3. 이용자가 선택한 설정과 기억 범위에 따른 개인화',
    },
    {
      type: 'paragraph',
      text: '4. 위험·유해 발화 탐지와 안전 안내',
    },
    {
      type: 'paragraph',
      text: '5. 보안, 오류 분석, 성능·품질·비용 모니터링 및 고객지원',
    },
    {
      type: 'paragraph',
      text: '6. 별도 동의를 받은 연구·품질 평가·고객 경험 분석',
    },
    {
      type: 'paragraph',
      text: '7. 법령상 의무 이행과 분쟁 대응',
    },

    { type: 'heading', text: '처리하는 개인정보' },
    { type: 'heading', text: '1. 계정·가입 정보' },
    {
      type: 'paragraph',
      text: '소셜 로그인 식별자, 제공되는 경우 이메일 또는 계정 정보, 닉네임, 만 14세 이상 확인, 동의 여부·버전·시각',
    },
    { type: 'heading', text: '2. 프로필·설정 정보' },
    {
      type: 'paragraph',
      text: '선택 캐릭터, 대화·알림 설정, 서비스 내 공개 이름',
    },
    { type: 'heading', text: '3. 서비스 이용 정보' },
    {
      type: 'paragraph',
      text: '체크인, 감정·상황 입력, 대화 원문과 AI 응답, Todo, 세션 요약, 기억, 리포트, 피드백',
    },
    { type: 'heading', text: '4. 안전 처리 정보' },
    {
      type: 'paragraph',
      text: '위기·자해·타해 관련 발화, 위험 신호 분류 결과, 안전 안내·중단·검토 이력',
    },
    { type: 'heading', text: '5. 자동 생성 정보' },
    {
      type: 'paragraph',
      text: '세션 ID, 접속 일시, IP 주소, 기기·운영체제·앱 버전, 이벤트·오류·크래시·API 호출·토큰·지연·비용 로그',
    },
    { type: 'heading', text: '6. 고객지원 정보' },
    {
      type: 'paragraph',
      text: '이름 또는 닉네임, 이메일, 문의 내용, 첨부파일 및 처리 이력',
    },

    { type: 'heading', text: '민감정보 처리' },
    {
      type: 'paragraph',
      text: '감정·심리 상태, 정신건강에 관한 대화, 위험 신호 및 이로부터 추론된 정보는 일반 개인정보와 구분된 별도 동의를 받은 뒤 처리합니다. 민감정보는 광고 타기팅, 제3자 마케팅 또는 별도 선택 동의 없는 범용 AI 모델 학습에 사용하지 않습니다.',
    },

    { type: 'heading', text: '보유 및 이용 기간' },
    {
      type: 'paragraph',
      text: '1. 계정·프로필: 회원 탈퇴 또는 이용계약 종료 시까지. 탈퇴 즉시 접근을 차단하고 운영 데이터베이스에서 7일 이내 삭제',
    },
    {
      type: 'paragraph',
      text: '2. 동의·철회 이력: 동의 사실과 버전, 처리 일시만 탈퇴 후 3년간 분리 보관',
    },
    {
      type: 'paragraph',
      text: '3. 체크인·대화·Todo·기억·리포트: 회원 탈퇴, 이용자 삭제 또는 민감정보 동의 철회 시까지. 삭제 요청 후 운영 데이터베이스에서 7일, 백업에서 30일 이내 삭제',
    },
    {
      type: 'paragraph',
      text: '4. 접속·이벤트·오류·성능·비용 로그: 생성일로부터 30일',
    },
    {
      type: 'paragraph',
      text: '5. Safety 사건 검토 이력: 사건 종료일부터 90일. 원문은 필요한 구간으로 최소화',
    },
    {
      type: 'paragraph',
      text: '6. 별도 연구·인터뷰 녹음: 인터뷰일부터 90일. 별도 동의한 전사·요약본: 연구 종료 후 1년',
    },
    {
      type: 'paragraph',
      text: '7. 고객 문의: 답변 완료일부터 3년. 민감한 대화 원문은 문의 해결 후 30일 이내 삭제 또는 마스킹',
    },

    { type: 'heading', text: '제3자 제공 및 처리위탁' },
    {
      type: 'paragraph',
      text: '회사는 원칙적으로 이용자의 개인정보를 판매하거나 제3자에게 제공하지 않습니다. 제3자 제공이 필요한 경우 제공받는 자, 목적, 항목, 보유기간 및 거부권을 알리고 필요한 동의를 받습니다.',
    },
    {
      type: 'paragraph',
      text: '서비스 제공을 위해 아래 사업자에게 개인정보 처리 업무를 위탁합니다.',
    },

    { type: 'heading', text: 'Amazon Web Services Korea LLC 및 Amazon Web Services, Inc.' },
    {
      type: 'paragraph',
      text: '처리 지역: 대한민국 AWS Asia Pacific (Seoul)',
    },
    {
      type: 'paragraph',
      text: '보유기간: 회사가 정한 항목별 보유기간 또는 위탁계약 종료 시까지',
    },

    { type: 'heading', text: 'OpenAI OpCo, LLC' },
    {
      type: 'paragraph',
      text: '위탁 업무: 생성형 인공지능을 통한 대화·요약·행동 제안 생성과 안전 처리 보조',
    },
    {
      type: 'paragraph',
      text: '처리 정보: 이용자 입력, 필요한 최소 대화 문맥, 정책·분류 결과. 이메일과 직접 식별자는 제외',
    },
    {
      type: 'paragraph',
      text: '보유기간: 기본 Abuse Monitoring 로그 기준 최대 30일. 범용 모델 학습에는 사용하지 않음',
    },

    { type: 'heading', text: 'Apple Inc.' },
    {
      type: 'paragraph',
      text: '위탁 업무: iOS 앱 배포, 푸시 전달 및 앱 안정성 정보 처리',
    },
    {
      type: 'paragraph',
      text: '보유기간: Apple 정책에 따름',
    },

    { type: 'heading', text: 'Kakao Corp.' },
    {
      type: 'paragraph',
      text: '위탁 업무: 카카오 소셜 로그인과 계정 인증',
    },
    {
      type: 'paragraph',
      text: '처리 정보: 카카오가 제공하는 식별자와 이용자가 허용한 계정 정보',
    },
    {
      type: 'paragraph',
      text: '보유기간: 회원 탈퇴 또는 소셜 연결 해제 시까지',
    },
    {
      type: 'paragraph',
      text: '수탁자 또는 위탁 내용이 변경되는 경우 개인정보 처리방침을 통해 공개하고, 법령상 별도 동의가 필요한 변경은 사전에 동의를 받습니다.',
    },

    { type: 'heading', text: '국외 이전' },
    {
      type: 'paragraph',
      text: 'Mio는 AI 응답 생성과 iOS 앱·푸시 운영 과정에서 개인정보가 국외에서 처리될 수 있습니다.',
    },

    { type: 'heading', text: 'OpenAI OpCo, LLC' },
    {
      type: 'paragraph',
      text: '이전 국가: 미국 및 OpenAI가 공개한 하위처리자 소재 국가',
    },
    {
      type: 'paragraph',
      text: '이전 일시·방법: 이용자가 AI 대화를 요청할 때 암호화된 네트워크를 통한 자동 전송',
    },
    {
      type: 'paragraph',
      text: '이전 항목: 이용자 입력, 필요한 최소 대화 문맥, 안전·정책 분류 결과. 직접 식별정보는 제외',
    },
    {
      type: 'paragraph',
      text: '이전 목적: AI 대화, 요약, 행동 제안 및 안전 처리 보조',
    },
    {
      type: 'paragraph',
      text: '보유기간: 기본 Abuse Monitoring 로그 기준 최대 30일',
    },
    {
      type: 'paragraph',
      text: '거부 방법과 영향: 민감정보 동의를 거부하거나 철회할 수 있으나, 거부 시 AI 대화 등 핵심 기능을 이용할 수 없음',
    },

    { type: 'heading', text: 'Apple Inc.' },
    {
      type: 'paragraph',
      text: '이전 국가: 미국 등 Apple의 글로벌 처리 시설 소재 국가',
    },
    {
      type: 'paragraph',
      text: '이전 일시·방법: iOS 앱 설치·실행 또는 푸시 전송 시 암호화된 네트워크를 통해 전송',
    },
    {
      type: 'paragraph',
      text: '이전 항목: 기기·운영체제, 설치·세션·크래시 정보 및 푸시 토큰',
    },
    {
      type: 'paragraph',
      text: '이전 목적: 앱 배포, 안정성 확인 및 푸시 전달',
    },
    {
      type: 'paragraph',
      text: '보유기간: Apple 정책에 따름',
    },
    {
      type: 'paragraph',
      text: '거부 방법과 영향: 알림 이용을 중단할 수 있으며, 거부 시 푸시 기능 이용이 제한됨',
    },

    { type: 'heading', text: '자동화 처리' },
    {
      type: 'paragraph',
      text: '1. Mio는 감정·상황 분류, 답변 생성, 행동 제안, 기억 검색, 요약 및 위험 신호 감지를 수행할 수 있습니다.',
    },
    {
      type: 'paragraph',
      text: '2. Mio는 이용자의 법적 권리나 고용·신용·보험·의료 자격에 중대한 영향을 미치는 결정을 자동으로 내리지 않습니다.',
    },
    {
      type: 'paragraph',
      text: '3. 위험 분류로 대화가 중단되거나 기능이 제한된 경우 이용자는 사유 설명과 가능한 범위의 사람에 의한 재검토를 요청할 수 있습니다.',
    },
    {
      type: 'paragraph',
      text: '4. 이용자는 AI 응답 오류 신고, 기억·대화의 수정·삭제 및 개인화 중단을 요청할 수 있습니다.',
    },

    { type: 'heading', text: '이용자의 권리' },
    {
      type: 'paragraph',
      text: '이용자는 개인정보 열람, 정정·삭제, 처리정지, 동의 철회, 회원 탈퇴, AI 개인화·기억 활용 중단 및 법령상 자동화 처리 관련 권리를 행사할 수 있습니다.',
    },

    { type: 'heading', text: '아동·청소년' },
    {
      type: 'paragraph',
      text: '회사는 만 14세 미만 아동의 회원가입을 허용하지 않습니다. 가입 시 만 14세 이상 여부를 확인하며 허위 연령 정보가 확인되면 이용을 제한할 수 있습니다.',
    },

    { type: 'heading', text: '모바일 접근권한' },
    {
      type: 'paragraph',
      text: '카메라, 사진, 마이크, 알림 등 접근권한이 필요한 경우 필수 권한과 선택 권한을 구분하고 접근 항목과 이유를 사전에 알립니다. 선택 권한을 거부하면 해당 권한이 직접 필요한 기능만 제한됩니다.',
    },

    { type: 'heading', text: '안전성 확보 조치' },
    {
      type: 'paragraph',
      text: '회사는 접근통제, 전송 구간 암호화, 관리자·세션 기록, 직접 식별정보와 대화 데이터 분리, 개발·테스트·운영 환경 분리, 민감 원문 접근 제한, 수탁자 감독, 삭제·철회·위기 대응 기록 등의 조치를 적용합니다.',
    },

    { type: 'heading', text: '개인정보 보호책임자 및 문의처' },
    {
      type: 'paragraph',
      text: '개인정보처리자: 폴라리스',
    },
    {
      type: 'paragraph',
      text: '대표자·개인정보 보호책임자: 김종혁',
    },
    {
      type: 'paragraph',
      text: '사업자등록번호: 563-75-00585',
    },
    {
      type: 'paragraph',
      text: '사업자 주소: 사업자등록증상 소재지를 공개용 주소로 확정한 뒤 게시',
    },
    {
      type: 'paragraph',
      text: '개인정보 문의 이메일: mio.official402@gmail.com',
    },
    {
      type: 'paragraph',
      text: '전화 상담: 운영하지 않음',
    },
    {
      type: 'paragraph',
      text: '이메일 운영시간: 평일 10:00~18:00, 토요일·일요일·공휴일 제외',
    },
    {
      type: 'paragraph',
      text: '권리 행사 처리기한: 접수일부터 10일 이내 회신을 원칙으로 하며, 법령상 다른 기한이 적용되는 경우 해당 기한을 따름',
    },

    { type: 'heading', text: '권익침해 구제' },
    {
      type: 'paragraph',
      text: '개인정보침해신고센터: 국번 없이 118',
    },
    {
      type: 'paragraph',
      text: '개인정보분쟁조정위원회: 1833-6972',
    },
    {
      type: 'paragraph',
      text: '경찰청: 국번 없이 182',
    },
  ],
};
