
import { AuthForm } from '../components/AuthForm';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <AuthForm onAuthSuccess={() => navigate('/')} />
    </div>
  );
}
