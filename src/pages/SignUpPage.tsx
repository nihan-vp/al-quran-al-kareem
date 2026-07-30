/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthForm } from '../components/AuthForm';
import { useNavigate } from 'react-router-dom';

export default function SignUpPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white py-12">
      <AuthForm onAuthSuccess={() => navigate('/')} />
    </div>
  );
}
