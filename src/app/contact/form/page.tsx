"use client";
import Link from 'next/link';
import { useState } from 'react';

const typeOptions = [
  '회원가입/로그인', '오늘의 식사일기', '레시피 검색', '마이페이지', '기타 문의'
];
export default function ContactFormPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState(typeOptions[0]);
  const [content, setContent] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div style={{maxWidth:480,margin:'60px auto',padding:'42px 22px',borderRadius:12,background:'#fff',boxShadow:'0 2px 8px rgba(44,50,55,0.07)'}}>
        <div style={{fontSize:'2em',textAlign:'center',marginBottom:22}}>🎉</div>
        <h2 style={{fontWeight:800,fontSize:'1.5rem',marginBottom:18}}>문의가 제출되었습니다</h2>
        <p style={{color:'#22af77',marginBottom:24}}>빠른 시일 내에 이메일로 답변드립니다.</p>
        <Link href="/contact" style={{display:'block',margin:'0 auto',maxWidth:170,padding:'12px 0',background:'#21bb77',borderRadius:8,color:'#fff',fontWeight:700,fontSize:'1.1rem',textAlign:'center',textDecoration:'none'}}>문의센터로 돌아가기</Link>
      </div>
    );
  }
  return (
    <div style={{maxWidth:500,margin:'60px auto',padding:'42px 22px',borderRadius:16,background:'#fff',boxShadow:'0 2px 12px #1bb57113',overflow:'hidden'}}>
      <Link href="/contact" style={{display:'inline-block',marginBottom:24,color:'#21bb77',fontWeight:700,fontSize:'1.06rem',textDecoration:'none'}}>← 문의센터로 돌아가기</Link>
      <h2 style={{fontWeight:900,fontSize:'1.59rem',marginBottom:21,color:'#13b674'}}>문의하기</h2>
      <form style={{display:'flex',flexDirection:'column',gap:18}} onSubmit={e=>{e.preventDefault();setDone(true);}}>
        <label style={{fontWeight:700,fontSize:'1.08rem',marginBottom:1}}>닉네임
          <input style={{display:'block',width:'100%',marginTop:5,marginBottom:3,padding:'12px',borderRadius:8,border:'1.5px solid #b8e3d5',background:'#F9FAFB',fontSize:'1.03rem',outline:'none'}}
              type="text" required placeholder="닉네임을 입력해주세요" value={nickname} onChange={e=>setNickname(e.target.value)} />
        </label>
        <label style={{fontWeight:700,fontSize:'1.08rem',marginBottom:1}}>이메일
          <input style={{display:'block',width:'100%',marginTop:5,marginBottom:3,padding:'12px',borderRadius:8,border:'1.5px solid #b8e3d5',background:'#F9FAFB',fontSize:'1.03rem',outline:'none'}}
              type="email" required placeholder="이메일을 입력해주세요" value={email} onChange={e=>setEmail(e.target.value)} />
        </label>
        <label style={{fontWeight:700,fontSize:'1.08rem'}}>문의 유형
          <select style={{width:'100%',marginTop:6,marginBottom:3,padding:'12px',borderRadius:8,border:'1.5px solid #c8eadc',background:'#f8fbfa',fontSize:'1.02rem',outline:'none'}}
              value={type} onChange={e=>setType(e.target.value)}>
            {typeOptions.map(t=> <option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{fontWeight:700,fontSize:'1.08rem'}}>문의 내용
          <textarea style={{width:'100%',marginTop:6,resize:'vertical',minHeight:96,padding:'13px',borderRadius:8,border:'1.5px solid #b8e3d5',background:'#F9FAFB',fontSize:'1.05rem',outline:'none'}}
              required placeholder="내용을 상세히 입력해 주세요 :)" value={content} onChange={e=>setContent(e.target.value)} />
        </label>
        <button type="submit" style={{marginTop:18,padding:'16px',border:'none',borderRadius:9,background:'linear-gradient(89deg,#21bb77 74%, #1faaff 150%)',color:'#fff',fontSize:'1.16rem',fontWeight:900,letterSpacing:'-1px',boxShadow:'0 3px 16px #3eedef09',cursor:'pointer',transition:'background 0.17s'}}>문의 제출 하기</button>
      </form>
    </div>
  );
}
