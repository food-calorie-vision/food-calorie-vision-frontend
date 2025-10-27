"use client";
import Link from 'next/link';

const DUMMY = [
  { id: 1, subject: '로그인 오류 문의', date: '2024-10-25', type: '회원가입/로그인', status: '답변완료'},
  { id: 2, subject: '맞춤식단 추천 관련 건의', date: '2024-10-23', type: '마이페이지', status: '답변 처리중' },
  { id: 3, subject: '식단 등록이 안돼요', date: '2024-10-22', type: '오늘의 식사일기', status: '답변완료' },
  { id: 4, subject: '개인정보 변경 관련', date: '2024-10-18', type: '기타 문의', status: '답변완료' },
  { id: 5, subject: '레시피 검색 결과 문의', date: '2024-10-15', type: '레시피 검색', status: '답변 처리중' },
];

export default function ContactListPage() {
  return (
    <div style={{
      maxWidth:900,
      margin:'68px auto',
      padding:'56px 34px 44px 34px',
      borderRadius:28,
      background:'linear-gradient(135deg,#f9fff6 60%,#d6ffe6 120%)',
      boxShadow:'0 4px 36px #17b17922',
      overflow:'hidden',
      border:'2.7px solid #d1f7e6',
    }}>
      <Link href="/contact" style={{
        display:'inline-block', marginBottom:18, color:'#21bb77', fontWeight:700, fontSize:'1.08rem', textDecoration:'none'
      }}>← 고객센터로 돌아가기</Link>
      <div style={{fontWeight:900, fontSize:'2.2rem', marginBottom:36, color:'#13b674', letterSpacing:'-2px',textShadow:'0 4px 17px #9cf7cf69', textAlign:'center'}}>
        <span style={{fontSize:'2.5rem',marginRight:6,lineHeight:0,verticalAlign:'middle'}}>🌱</span>내 문의 이력
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2.7fr 1.2fr 1.45fr 1.3fr',gap:'0',background:'#eafaf0',borderRadius:15,marginBottom:6,fontWeight:800,fontSize:'1.21rem',color:'#15ae74',border:'2px solid #bdebd1',minHeight:58,alignItems:'center',paddingLeft:24}}>
        <span>제목</span>
        <span>작성일</span>
        <span>문의 유형</span>
        <span>답변 상태</span>
      </div>
      <ul style={{margin:0,padding:0,listStyle:'none',marginBottom:36}}>
        {DUMMY.map((row,idx)=>(
          <li key={row.id} style={{
            display:'grid',
            gridTemplateColumns:'2.7fr 1.2fr 1.45fr 1.3fr',
            gap:'0',
            background:'#f8fff7',
            borderLeft:'1.6px solid #e0f6e9',
            borderRight:'1.6px solid #e0f6e9',
            borderBottom:'1.6px solid #e0f6e9',
            borderTop: idx === 0 ? '1.6px solid #e0f6e9' : 'none',
            alignItems:'center',
            borderRadius:'0',
            minHeight:65,
            fontSize:'1.12rem',
            padding:'0 0 0 24px',
            color:'#222',
            textShadow:'0 1px 0 #f7fcf9',
          }}>
            <span style={{fontWeight:700}}>{row.subject}</span>
            <span style={{fontSize:'1.08rem',color:'#1d9b6c'}}>{row.date}</span>
            <span style={{fontSize:'1.12rem',color:'#36967c',fontWeight:600}}>{row.type}</span>
            <span style={{fontWeight:800, color: row.status==='답변완료'? '#13b674':'#fd912a',letterSpacing:'-1px'}}>
              <b style={{padding:'8px 19px',borderRadius:17,background: row.status==='답변완료'? 'linear-gradient(87deg,#e6ffe9 55%,#b7f8cc 130%)' : 'linear-gradient(91deg,#fffbe7 56%,#ffe1ad 132%)',fontSize:'1.09rem',border:`1.4px solid ${row.status==='답변완료' ? '#13b67444' : '#fd912a39'}`, boxShadow: row.status==='답변완료' ? '0 2px 9px #bdffc818' : '0 2px 8px #fff4e37f' }}>{row.status}</b>
            </span>
          </li>
        ))}
      </ul>
      <div style={{textAlign:'center',marginTop:35}}>
        <Link href="/contact/form" style={{
          display:'inline-block',
          padding:'20px 74px',
          borderRadius:16,
          fontSize:'1.28rem',
          fontWeight:900,
          background:'linear-gradient(89deg,#14c184 74%, #41eab0 130%)',
          color:'#fff',
          textDecoration:'none',
          boxShadow:'0 2px 14px #a5fddb1d',
          transition:'background 0.16s, box-shadow 0.10s',
          letterSpacing:'-0.01em',
          textShadow:'0 2.5px 8px #37967744',
        }}>+ 추가 문의 하기</Link>
      </div>
    </div>
  );
}
