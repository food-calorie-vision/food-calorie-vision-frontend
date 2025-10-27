"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import styles from './contact.module.css';
import Link from 'next/link';

function MailIcon() {
  return (
    <span style={{fontSize:'74px', display: 'block', textAlign: 'center', margin: '18px 0 12px 0', color:'#21bb77'}}>
      <span style={{filter:'drop-shadow(0 3px 6px rgba(30,187,119,0.09))'}}>
        📩
      </span>
    </span>
  );
}

export default function ContactPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expire = sessionStorage.getItem('login_expire');
      const user = sessionStorage.getItem('user_name');
      
      if (expire && Date.now() < Number(expire)) {
        setIsLoggedIn(true);
        setUserName(user || '');
      }
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('login_expire');
      sessionStorage.removeItem('user_name');
      alert('로그아웃되었습니다.');
      router.push('/');
    }
  };
  // 더 많은 공지 샘플
  const notices = [
    { id: 1, date: '10.24', title: '업데이트 안내' },
    { id: 2, date: '10.15', title: '서비스 점검 안내' },
    { id: 3, date: '10.03', title: '이벤트 당첨자 발표' },
    { id: 4, date: '09.27', title: '앱 UI/UX 개편 안내' },
    { id: 5, date: '09.13', title: '추석 연휴 고객지원 안내' },
    { id: 6, date: '09.01', title: '칼로리 데이터 업데이트' },
    { id: 7, date: '08.25', title: '신규 회원 이벤트 시작' },
  ];
  // FAQ 카테고리 및 첫 답변 예시
  const faqItems = [
    { label: '서비스 이용', content: 'Kcalculator는 어떤 서비스 인가요?', detail: '사용자가 섭취한 음식을 기록하고 칼로리와 영양소를 분석해주는 서비스 입니다.' },
    { label: '음식 기록', content: '음식 기록 관련 질문 예시', detail: '음식 기록 방법은 간단히 ...' },
    { label: '식단 추천', content: '식단 추천 관련 질문 예시', detail: '식단은 어떻게 추천되나요?' },
    { label: '데이터 및 개인정보', content: '개인정보 관련', detail: '개인정보 보호를 위해 ...' },
    { label: '기타 문의', content: '기타 문의', detail: '기타 문의에 대한 안내 ...' },
  ];
  return (
    <>
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />
      <div className={styles.pageWrap}>
        {/* 왼쪽: 공지사항  */}
        <section className={styles.noticeSection}>
          <h2 className={styles.noticeTitle}>공지사항</h2>
          <ul className={styles.noticeList}>
            {notices.map((n) => (
              <li key={n.id}>
                <Link className={styles.noticeItem} href="#">
                  <span className={styles.noticeDate}>{n.date}</span>
                  <span className={styles.noticeText}>{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {/* 오른쪽: 고객센터/문의 */}
        <section className={styles.contactSectionCool}>
          <div className={styles.contactCenterHeader}>
            <span className={styles.contactMainIcon}>💬</span>
            <h2 className={styles.sectionTitleBig}>고객센터 / 문의</h2>
            <div className={styles.contactSubBold}>궁금하면 바로 문의!<br />친절하게 답변해드립니다.</div>
          </div>
          <MailIcon />
          <div className={styles.buttonRowBig}>
            <Link href="/contact/form" className={styles.bigButton}>문의하기</Link>
            <Link href="/contact/list" className={styles.bigOutlineButton}>내 문의 이력</Link>
          </div>
          <div className={styles.contactDescription}>
            <span className={styles.contactNotice}>운영시간 <b>09:00~18:00</b> (주말/공휴일 제외)</span>
          </div>
        </section>
        {/* FAQ 영역 */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>자주 묻는 질문(FAQ)</h2>
          <div className={styles.faqCatRow}>
            {faqItems.map((item) => (
              <button className={styles.faqCatBtn} key={item.label}>{item.label}</button>
            ))}
          </div>
          <div className={styles.faqBox}>
            <div className={styles.faqQ}>{faqItems[0].content}</div>
            <div className={styles.faqA}>{faqItems[0].detail}</div>
            <div className={styles.faqIcon}>{'↘️'}</div>
          </div>
        </section>
      </div>
    </>
  );
}
