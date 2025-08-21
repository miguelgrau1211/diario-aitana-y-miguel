'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface PasswordProtectProps {
  onAuthenticated: () => void;
}

const CORRECT_PASSWORD = 'Aitanaymiguel';

export function PasswordProtect({ onAuthenticated }: PasswordProtectProps) {
  const [password, setPassword] = useState('');
  const [isTrying, setIsTrying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTrying(true);

    if (password === CORRECT_PASSWORD) {
      toast({
        title: '¡Bienvenid@s!',
        description: 'Acceso concedido a vuestro diario.',
      });
      onAuthenticated();
    } else {
      toast({
        variant: 'destructive',
        title: 'Contraseña incorrecta',
        description: 'La contraseña que has introducido no es correcta. Inténtalo de nuevo.',
      });
      setPassword('');
    }
    setIsTrying(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Acceso Privado</CardTitle>
            <CardDescription>
              Este diario está protegido. Por favor, introduce la contraseña para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Vuestra contraseña secreta..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isTrying}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isTrying}>
              {isTrying ? 'Verificando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
