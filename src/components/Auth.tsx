import React, { useState } from 'react';
import { saveUserAuth, verifyUser } from '../services/storageService';

interface AuthProps { onLogin: (username: string) => void; }

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isReg, setIsReg] = useState(false);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  const sub = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!u || !p) return setErr('请填写完整');
    if (isReg) {
      if (saveUserAuth(u, p)) onLogin(u); else setErr('用户已存在');
    } else {
      if (verifyUser(u, p)) onLogin(u); else setErr('验证失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md border border-white/50">
        <div className="text-center mb-10"><h1 className="text-3xl font-extrabold text-gray-900">CaloFlow</h1></div>
        <form onSubmit={sub} className="space-y-5">
          <div className="bg-gray-50 p-1 rounded-2xl border border-gray-200">
            <input type="text" value={u} onChange={e=>setU(e.target.value.toLowerCase())} className="w-full bg-transparent px-4 py-3 outline-none" placeholder="用户名" />
            <div className="h-px bg-gray-200 mx-4"></div>
            <input type="password" value={p} onChange={e=>setP(e.target.value)} className="w-full bg-transparent px-4 py-3 outline-none" placeholder="密码" />
          </div>
          {err && <p className="text-red-500 text-center">{err}</p>}
          <button type="submit" className="w-full py-4 rounded-xl text-white font-bold bg-black shadow-lg">{isReg?'注册':'登录'}</button>
        </form>
        <button onClick={()=>setIsReg(!isReg)} className="w-full mt-4 text-gray-500 text-sm">{isReg?'去登录':'去注册'}</button>
      </div>
    </div>
  );
};
export default Auth;