'use client';

import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

export function SignInForm() {
  const [error, setError] = useState<string>('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const accessCode = String(formData.get('accessCode') ?? '').trim();

    const result = await signIn('credentials', {
      email,
      accessCode,
      redirect: true,
      callbackUrl: '/topics',
    });

    if (result?.error) {
      setError('Sign-in failed. Check your email domain and access code.');
    }
  }

  return (
    <form className="create-form" onSubmit={onSubmit}>
      <input name="email" type="email" placeholder="you@company.com" required />
      <input name="accessCode" type="password" placeholder="Access code" required />
      <button className="button" type="submit">
        Sign in
      </button>
      {error ? <p className="topic-meta">{error}</p> : null}
    </form>
  );
}
