export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">이용약관</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">제1조 (목적)</h2>
          <p className="text-muted-foreground leading-relaxed">
            본 약관은 겜프파이어(이하 "회사")가 제공하는 게임 평가 및 리뷰 서비스(이하 "서비스")의 이용과 관련하여
            회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제2조 (정의)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. "서비스"란 회사가 제공하는 게임 평가, 리뷰 작성, 추천 등의 모든 서비스를 의미합니다.</p>
            <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
            <p>3. "회원"이란 회사와 서비스 이용계약을 체결하고 회원 아이디(ID)를 부여받은 자를 말합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제3조 (약관의 명시와 개정)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
            <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
            <p>3. 약관이 개정되는 경우 회사는 개정사항을 시행일자 7일 전부터 공지합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제4조 (서비스의 제공)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>게임 정보 제공</li>
              <li>게임 평가 및 리뷰 작성</li>
              <li>개인 맞춤형 게임 추천</li>
              <li>게임 리스트 관리</li>
              <li>기타 회사가 정하는 서비스</li>
            </ul>
            <p>2. 서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제5조 (회원가입)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
            <p>2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
              <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제6조 (회원 탈퇴 및 자격 상실)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</p>
            <p>2. 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>가입 신청 시에 허위 내용을 등록한 경우</li>
              <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
              <li>서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제7조 (개인정보보호)</h2>
          <p className="text-muted-foreground leading-relaxed">
            회사는 이용자의 개인정보 수집 시 서비스 제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.
            자세한 사항은 개인정보처리방침을 참고하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">제8조 (면책조항)</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
            <p>2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</p>
            <p>3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">부칙</h2>
          <p className="text-muted-foreground leading-relaxed">
            본 약관은 2024년 11월 1일부터 시행합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
