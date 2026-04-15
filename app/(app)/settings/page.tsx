import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from './actions';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings as (formData: FormData) => void} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_monthly_goal">Meta mensual de gasto (referencia)</Label>
              <Input
                id="default_monthly_goal"
                name="default_monthly_goal"
                type="number"
                step="100"
                defaultValue={settings?.default_monthly_goal ?? 20000}
              />
            </div>

            <input type="hidden" name="theme" value={settings?.theme ?? 'system'} />

            <Button type="submit">Guardar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
