export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">개인정보처리방침</h1>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground leading-relaxed mb-6">
            겜프파이어(이하 "회사")는 이용자의 개인정보를 중요시하며, "개인정보 보호법" 등 관련 법령을 준수하고 있습니다.
            회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
            개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. 개인정보의 수집 및 이용목적</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공, 본인 확인</li>
              <li>서비스 제공: 게임 추천, 리뷰 작성, 맞춤형 서비스 제공</li>
              <li>마케팅 및 광고: 이벤트 정보 및 참여기회 제공, 맞춤 서비스 제공</li>
              <li>서비스 개선: 서비스 이용 통계, 신규 서비스 개발</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. 수집하는 개인정보 항목</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <div>
              <p className="font-semibold mb-2">필수 수집 항목:</p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>이메일 주소</li>
                <li>아이디(사용자명)</li>
                <li>비밀번호</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">선택 수집 항목:</p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>프로필 사진</li>
                <li>Steam 계정 정보</li>
                <li>선호 플랫폼</li>
                <li>한 줄 소개</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">자동 수집 항목:</p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>IP 주소, 쿠키, 서비스 이용 기록</li>
                <li>접속 로그, 방문 일시</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. 개인정보의 보유 및 이용기간</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>회원 탈퇴 시 개인정보는 지체 없이 파기됩니다. 다만, 다음의 정보는 아래의 이유로 명시한 기간 동안 보존됩니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>부정 이용 방지: 부정 이용 기록 (1년)</li>
              <li>전자상거래법: 계약 또는 청약철회 기록 (5년), 대금결제 기록 (5년)</li>
              <li>통신비밀보호법: 로그인 기록 (3개월)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. 개인정보의 제3자 제공</h2>
          <p className="text-muted-foreground leading-relaxed">
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 이용자가 외부 제휴사의 서비스를 이용하기 위하여 개인정보 제공에 직접 동의를 한 경우,
            그리고 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라
            수사기관의 요구가 있는 경우에는 제공할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. 개인정보의 파기</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
            <p className="font-semibold mt-4 mb-2">파기 절차:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
            </ul>
            <p className="font-semibold mt-4 mb-2">파기 방법:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>전자적 파일 형태: 복구 및 재생되지 않도록 안전하게 삭제</li>
              <li>종이 문서: 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. 이용자의 권리와 행사방법</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>이용자는 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>개인정보 오류 정정 요구</li>
              <li>개인정보 삭제 요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
            <p className="mt-4">
              권리 행사는 설정 페이지를 통해 직접 하거나, 개인정보 보호책임자에게 이메일로 연락하여 하실 수 있습니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. 개인정보의 안전성 확보조치</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
              <li>기술적 조치: 개인정보처리시스템 접근권한 관리, 접속기록 보관 및 위변조 방지, 개인정보 암호화</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. 개인정보 보호책임자</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="mt-4 bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold mb-2">개인정보 보호책임자</p>
              <p>이메일: gampfireoffical@gmail.com</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. 개인정보처리방침의 변경</h2>
          <p className="text-muted-foreground leading-relaxed">
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
            변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">부칙</h2>
          <p className="text-muted-foreground leading-relaxed">
            본 개인정보처리방침은 2024년 11월 1일부터 시행합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
