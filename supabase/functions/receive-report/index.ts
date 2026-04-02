// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const REPORT_WEBHOOK_SECRET = Deno.env.get("REPORT_WEBHOOK_SECRET") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${REPORT_WEBHOOK_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const { email, title, html_content } = await req.json();

    if (!email || !title || !html_content) {
      return new Response(JSON.stringify({ error: "Missing required fields (email, title, html_content)" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Encontrar membro pelo email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Member not found for the provided email." }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const userId = profile.id;

    // Converter HTML text para Uint8Array para Raw Upload
    const encoder = new TextEncoder();
    const fileData = encoder.encode(html_content);
    // Usamos um nome de arquivo fixo para o membro para sobreescrever sempre o mesmo arquivo
    const fileName = `${userId}/latest_progress_report.html`;

    // Upload pro Storage com upsert igual a true!
    const { error: storageError } = await supabase.storage
      .from("member_reports")
      .upload(fileName, fileData, {
        contentType: "text/html; charset=utf-8",
        upsert: true
      });

    if (storageError) {
      return new Response(JSON.stringify({ error: "Failed to upload report to storage", details: storageError }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Segurança contra múltiplas instâncias na tabela do sócio.
    // Primeiro removemos radicalmente o que tiver dele pra evitar quebras no painel Admin (Unique row enforcement),
    // ignorando se deu erro de missing row ou apagou 3 rows repetidas.
    await supabase.from("member_reports").delete().eq("user_id", userId);

    // Agora inserimos a via definitiva e única
    const { error: dbError } = await supabase
      .from("member_reports")
      .insert({
        user_id: userId,
        title: title,
        storage_path: fileName
      });

    if (dbError) {
      return new Response(JSON.stringify({ error: "Failed to save record to database", details: dbError }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Report generated successfully!" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
