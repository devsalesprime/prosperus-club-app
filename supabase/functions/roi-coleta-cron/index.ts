import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.cron("roi-coleta-trimestral", "0 13 * * *", async () => {
    console.log("Iniciando Deno Cron: roi-coleta-trimestral");

    try {
        // 1. Busque todos os `profiles` onde `role = 'MEMBER'` e `is_active = true`.
        const { data: members, error: membersErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'MEMBER')
            .eq('is_active', true);

        if (membersErr || !members) throw new Error("Erro buscar members: " + JSON.stringify(membersErr));

        let notificationsCreated = 0;

        for (const member of members) {
            // 2. Fetch em `registros_faturamento` pegando a `data_registro` mais recente
            const { data: lastRegistro } = await supabase
                .from('registros_faturamento')
                .select('data_registro')
                .eq('socio_id', member.id)
                .order('data_registro', { ascending: false })
                .limit(1)
                .maybeSingle();

            const now = new Date();
            let diffDays = 999;

            if (lastRegistro?.data_registro) {
                const lastDate = new Date(lastRegistro.data_registro);
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // 3. Calcule a diferença de dias. Se for >= 90 dias:
            if (diffDays >= 90) {
                // 4. Insira um alerta
                const { error: notifErr } = await supabase
                    .from('user_notifications')
                    .insert({
                        user_id: member.id,
                        title: "📊 Atualize seu Múltiplo!",
                        message: "O seu ciclo financeiro de 90 dias foi concluído. Atualize seu faturamento para calibrar seu Crescimento no Clube.",
                        type: "roi",
                        action_url: "/",
                        is_read: false
                    });

                if (!notifErr) {
                    notificationsCreated++;

                    // 5. Acione a service de Push Notification nativa (send-push edge function) asynchonously
                    supabase.functions.invoke('send-push', {
                        body: {
                            user_id: member.id,
                            title: "📊 Atualize seu Múltiplo!",
                            body: "O seu ciclo financeiro de 90 dias foi concluído. Atualize seu faturamento.",
                            url: '/',
                            type: 'notification'
                        }
                    }).catch(e => console.log('Erro trigger push:', e.message));
                }
            }
        }

        console.log(`Cron Finalizado: ${notificationsCreated} alertas de ROI gerados.`);

    } catch (error) {
        console.error("Erro no Cron de ROI:", error);
    }
});
