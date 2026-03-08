'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/topics' });
    if (result?.error || !result?.ok) {
      setError('Sign-in failed. Check your email and password.');
      return;
    }
    router.push(result.url ?? '/topics');
    router.refresh();
  }

  return (
    <form className="create-form" onSubmit={onSubmit}>
      <input name="email" type="email" placeholder="you@company.com" required />
      <input name="password" type="password" placeholder="Password" required />
      <button className="button" type="submit">Sign in</button>
      {error ? <p className="topic-meta">{error}</p> : null}
    </form>
  );
}
