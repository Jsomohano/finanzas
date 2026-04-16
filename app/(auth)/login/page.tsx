'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signInWithOtp, signInWithPassword } from './actions';

type Mode = 'password' | 'otp';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setError(null);
    if (mode === 'password') {
      const result = await signInWithPassword(formData);
      if (result?.error) {
        setError(result.error);
        setStatus('error');
      }
    } else {
      const result = await signInWithOtp(formData);
      if (result.error) {
        setError(result.error);
        setStatus('error');
      } else {
        setStatus('sent');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Finanzas</CardTitle>
          <CardDescription>
            {mode === 'password'
              ? 'Inicia sesión con tu email y contraseña.'
              : 'Te enviaremos un link mágico a tu email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'sent' ? (
            <p className="text-sm">Revisa tu bandeja de entrada — te enviamos un link para iniciar sesión.</p>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              {mode === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required autoComplete="current-password" />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading'
                  ? 'Cargando…'
                  : mode === 'password'
                  ? 'Iniciar sesión'
                  : 'Enviar link mágico'}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                onClick={() => { setMode(mode === 'password' ? 'otp' : 'password'); setError(null); }}
              >
                {mode === 'password' ? 'Prefiero usar link mágico' : 'Volver a contraseña'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
