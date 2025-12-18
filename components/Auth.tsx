import React, { useState } from 'react';
import { saveUserAuth, verifyUser } from '../services/storageService';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !pin) {
      setError('请填写所有字段');
      return;
    }

    if (isRegistering) {
      const success = saveUserAuth(username, pin);
      if (success) {
        onLogin(username);
      } else {
        setError('用户名已存在');
      }
    } else {
      const isValid = verifyUser(username, pin);
      if (isValid) {
        onLogin(username);
      } else {
        setError('用户名或密码错误');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md border border-white/50">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3">
             <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CaloFlow</h1>
          <p className="text-gray-400 font-medium mt-2">您的身体能量流</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-50 p-1 rounded-2xl border border-gray-200">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="w-full bg-transparent px-4 py-3 outline-none text-gray-800 placeholder-gray-400 font-medium"
              placeholder="用户名 (例如: alex)"
            />
            <div className="h-px bg-gray-200 mx-4"></div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-transparent px-4 py-3 outline-none text-gray-800 placeholder-gray-400 font-medium"
              placeholder="密码 / PIN码"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 rounded-xl text-white font-bold text-lg bg-black hover:bg-gray-800 transition-all shadow-lg active:scale-95"
          >
            {isRegistering ? '开启旅程' : '进入应用'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-500 font-medium hover:text-black transition"
          >
            {isRegistering ? '已有账号？去登录' : '新用户？创建账号'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;