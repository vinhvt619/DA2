import { Link, useNavigate } from 'react-router-dom';
import Header from '../Components/Header.jsx';
import PasswordUpdateForm from '../Components/PasswordUpdateForm.jsx';

export default function ForgotPassword() {
  const navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-[var(--page-background)] text-slate-900">
    <Header />
    <main className="flex flex-1 items-center justify-center px-4 py-8">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center"><img src="/RabbitCV.png" alt="RabbitCV" className="mx-auto mb-3 size-16 object-contain" /><h1 className="text-2xl font-bold">Quên mật khẩu</h1></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <PasswordUpdateForm endpoint="/api/forgot-password" label="Đặt lại mật khẩu" submitLabel="Đặt lại mật khẩu" onSuccess={() => navigate('/login', { replace: true })} />
          <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-violet-700"><Link to="/login" className="hover:underline">Về đăng nhập</Link><Link to="/register" className="hover:underline">Đăng ký tài khoản</Link></div>
        </div>
      </section>
    </main>
  </div>;
}
