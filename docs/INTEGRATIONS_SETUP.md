# Integrations Setup — Conectar Claude Code a HubSpot, Supabase, GitHub e VPS

## ⚠️ Verdade técnica antes de começar

Eu (Claude Code) **NÃO posso me autenticar sozinho** em nenhum serviço. Não existe um botão mágico de "conectar HubSpot". O que existe são **3 caminhos reais**:

1. **MCP servers** (Model Context Protocol) — instalados na sua máquina, configurados em `.claude/settings.json`. Quando eu inicio uma sessão, o servidor MCP vira uma extensão de tools que eu posso chamar.
2. **CLI/SDK locais** — eu uso `Bash` e `PowerShell` para chamar ferramentas que JÁ rodam na sua máquina (git, ssh, supabase CLI, curl).
3. **Edge Functions / scripts customizados** — vocês já têm 13 Edge Functions integrando com HubSpot. Eu posso invocá-las via `supabase.functions.invoke()` ou `curl` direto.

## 🚨 Regra absoluta de segurança

**NUNCA cole credenciais (API keys, tokens, senhas, service-role keys) no chat comigo.** Tudo o que aparece no chat fica em logs e potencialmente em transcript.

Onde guardar credenciais:
- **Variáveis de ambiente** do sistema operacional (`$env:HUBSPOT_API_KEY` no PowerShell)
- **Arquivo `.env`** local (já tem `.env`, `.env.local` no projeto e estão no `.gitignore`)
- **OS keyring** (Windows Credential Manager, macOS Keychain)
- **`~/.ssh/config` e `~/.ssh/id_*`** para SSH (NUNCA chaves privadas em outro lugar)

Se você precisar me dar acesso, me indica o NOME da variável ("usa `HUBSPOT_PRIVATE_TOKEN` do `.env`") e eu uso pelo nome — **não o valor**.

## Status atual das integrações no projeto

| Serviço | Como já está integrado hoje | Posso usar agora? |
|---------|----------------------------|-------------------|
| **GitHub** | `git` CLI funcionando localmente; remote configurado (com PAT na URL — **rotear**) | ✅ via Bash |
| **Supabase** | `lib/supabase.ts` com anon key (client-side); 13 Edge Functions deployadas; `supabase` CLI provavelmente instalado | ✅ via Bash + Edge Functions |
| **HubSpot** | Apenas indireto: via Edge Functions (`sync-hubspot`, `hubspot-webhook`, etc.) que têm API key no Supabase Vault | ⚠️ apenas via invoke das Edge Functions |
| **VPS** | Não há integração visível no repo — depende do seu setup local | ⚠️ depende de SSH config |

---

## 1. GitHub

### Já funciona hoje (sem nada a fazer)

A gente já fez 4 commits + push nesta sessão usando `git` CLI. O remote `origin` está em `https://github.com/devsalesprime/prosperus-club-app.git`.

### Pendência crítica

O remote tem um **PAT exposto** na URL (`ghp_tFLQ...sP5`). **Rote agora:**
1. Vá em https://github.com/settings/tokens
2. Revogue `ghp_tFLQ...sP5`
3. Gere novo PAT (escopo mínimo: `repo`)
4. Configure git credential helper (mais seguro que PAT na URL):

```powershell
# No PowerShell (Windows)
git config --global credential.helper manager
git remote set-url origin https://github.com/devsalesprime/prosperus-club-app.git
# Da próxima vez que fizer push, ele pede credenciais e salva no Windows Credential Manager
```

Ou usar **SSH** (recomendado a longo prazo):
```powershell
ssh-keygen -t ed25519 -C "tech@prosperusclub.com.br"
# Adicione o conteúdo de ~/.ssh/id_ed25519.pub em https://github.com/settings/keys
git remote set-url origin git@github.com:devsalesprime/prosperus-club-app.git
```

### Opcional: GitHub MCP server

Para operações além de git (PRs, issues, code review, CI status), instalar o MCP oficial:

```jsonc
// ~/.claude/settings.json (ou .claude/settings.json no projeto)
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      }
    }
  }
}
```

E definir `GITHUB_PAT` no Windows Credential Manager ou variável de ambiente. Após salvar settings, **reiniciar Claude Code**.

### O que eu consigo fazer com cada caminho

| Operação | Bash + git | GitHub MCP |
|----------|------------|-----------|
| Commit / push / pull | ✅ | ✅ |
| Criar branch | ✅ | ✅ |
| Listar PRs | ❌ (precisa `gh` CLI) | ✅ |
| Criar PR | ❌ | ✅ |
| Comentar em PR/issue | ❌ | ✅ |
| Ver status de CI | ❌ | ✅ |
| Search code em repos | ❌ | ✅ |

Recomendação: **manter Bash + git** como base. Adicionar GitHub MCP só se for criar PRs/issues com frequência.

---

## 2. Supabase

### Caminho 1 — supabase CLI (já deve estar instalado)

```powershell
supabase --version  # confere se está instalado
supabase login      # autentica via browser (token salvo localmente)
supabase projects list
supabase db dump --project-ref ptvsctwwonvirdwprugv  # dump de schema
```

Eu posso rodar tudo isso via Bash/PowerShell se você logou.

### Caminho 2 — Supabase MCP server (oficial)

Mais ergonômico para queries SQL e gestão de dados. Documentação: https://supabase.com/docs/guides/getting-started/mcp

```jsonc
// ~/.claude/settings.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    }
  }
}
```

Onde `SUPABASE_ACCESS_TOKEN` é um Personal Access Token criado em https://supabase.com/dashboard/account/tokens

Tools disponíveis no MCP:
- `list_projects`, `list_tables`, `list_columns`
- `execute_sql` (read-only por default; passar `--mode=rw` para writes)
- `apply_migration`
- `get_logs` (Edge Functions, postgres, auth)
- `generate_typescript_types`

### Caminho 3 — service role key direto (perigoso)

Para casos específicos de admin scripts. Use APENAS em scripts node/python locais, **nunca em código frontend**:

```powershell
# .env.local (já gitignored)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

```ts
// scripts/admin-task.ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // bypassa RLS — cuidado!
);
```

### Recomendação

**Instale o Supabase MCP** (caminho 2). Ele é o sweet spot para queries ad-hoc e debug de dados sem expor service role key.

---

## 3. HubSpot

### Caminho 1 — via Edge Functions existentes (já funciona)

O projeto já tem 5 Edge Functions com HubSpot:
- `sync-hubspot` — atualiza contato a partir do profile
- `update-hubspot-contact` — update granular
- `sync-hubspot-amounts` — sync de deal amounts
- `sync-hubspot-birthdays` — sync de aniversários
- `sync-shadow-profiles` — backfill
- `hubspot-webhook` — recebe webhooks externos

Eu posso invocar qualquer uma via:
```ts
supabase.functions.invoke('sync-hubspot', { body: { contactId: '...' } })
```

A API key do HubSpot está no Supabase Vault (não no código). **Não preciso ver a key.**

### Caminho 2 — HubSpot API direto via curl/MCP

Se você quer que eu faça operações que NÃO existem nas Edge Functions (ex: listar todas as propriedades, criar nova property, query GraphQL custom), tem duas opções:

**Opção A — via Bash com curl + variável de ambiente:**

```powershell
# Salvar token como variável persistente (NÃO no chat!)
[Environment]::SetEnvironmentVariable("HUBSPOT_PRIVATE_TOKEN", "pat-na1-xxxxx", "User")
# Reabrir Claude Code para a variável estar disponível
```

Depois eu uso:
```bash
curl -H "Authorization: Bearer $HUBSPOT_PRIVATE_TOKEN" \
     https://api.hubapi.com/crm/v3/properties/contacts
```

**Opção B — MCP server da comunidade:**

Não existe MCP oficial da HubSpot. Comunidade tem alguns (qualidade variável). Exemplo:

```jsonc
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": ["-y", "@buger/probe-mcp"],
      "env": {
        "HUBSPOT_TOKEN": "${HUBSPOT_PRIVATE_TOKEN}"
      }
    }
  }
}
```

⚠️ Verifique a reputação do package antes de usar — MCP servers da comunidade podem ter qualidade/segurança variável.

### Recomendação

**Manter o caminho 1** (via Edge Functions). Já está testado, tem HMAC validado, escopo controlado. Adicionar curl com token apenas para tarefas pontuais de exploração de schema.

---

## 4. VPS (servidor próprio)

### Caminho 1 — SSH via Bash (recomendado)

Você configura uma vez, depois eu uso indefinidamente:

```ssh
# ~/.ssh/config
Host prosperus-vps
  HostName 123.45.67.89
  User deploy
  Port 22
  IdentityFile ~/.ssh/prosperus_vps_ed25519
  ServerAliveInterval 60
```

Gerar chave (se ainda não tem):
```powershell
ssh-keygen -t ed25519 -f ~/.ssh/prosperus_vps_ed25519 -C "tech@prosperusclub.com.br"
# Copiar a public key e adicionar em ~/.ssh/authorized_keys no VPS
ssh-copy-id -i ~/.ssh/prosperus_vps_ed25519.pub prosperus-vps  # se tiver ssh-copy-id
```

Depois eu posso fazer:
```bash
ssh prosperus-vps "uptime"
ssh prosperus-vps "tail -50 /var/log/nginx/access.log"
ssh prosperus-vps "systemctl status n8n"
scp arquivo.sql prosperus-vps:/tmp/
```

### Caminho 2 — MCP SSH server (arriscado)

Existem MCP servers para SSH (ex: `mcp-server-ssh`). **Não recomendo** porque:
- Aumenta superfície de ataque (servidor MCP vira porta de entrada se vulnerável)
- SSH via Bash já dá controle total
- Você pode auditar cada comando antes de aprovar via permission prompts

### Recomendação

**Caminho 1.** Configura `~/.ssh/config` uma vez, eu uso `ssh prosperus-vps "comando"` via Bash. Você aprova cada comando individual via permission prompts.

---

## Resumo: o que fazer em ordem

| # | Ação | Quem faz | Tempo |
|---|------|---------|-------|
| 1 | **Rotear o GitHub PAT exposto** | Você | 5min |
| 2 | Configurar git credential helper ou SSH | Você | 10min |
| 3 | Instalar Supabase MCP server (opcional, recomendado) | Você | 10min |
| 4 | Configurar `~/.ssh/config` para o VPS | Você | 10min |
| 5 | Decidir se quer HubSpot API direto ou só via Edge Functions | Você decide | — |
| 6 | Reiniciar Claude Code para os MCP servers carregarem | Você | 1min |
| 7 | Testar: pedir pra mim listar tabelas do Supabase, rodar `uptime` no VPS | Eu via Bash | conforme uso |

## Template de `.claude/settings.json` final (recomendado)

```jsonc
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    }
    // GitHub MCP opcional — adicionar se quiser PRs/issues nativos
  },
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(ssh prosperus-vps:*)",
      "Bash(supabase:*)",
      "Bash(curl:https://api.hubapi.com/*)"
    ]
  }
}
```

Variáveis de ambiente necessárias:
- `SUPABASE_ACCESS_TOKEN` (pessoal, criado em supabase.com/dashboard)
- `HUBSPOT_PRIVATE_TOKEN` (se for usar HubSpot direto)
- `GITHUB_PAT` (se for usar GitHub MCP)

## Como me dar credenciais sem expor

Quando precisar que eu use uma credencial, em vez de:
> ❌ "Aqui está minha API key: sk-xxxxx, use ela"

Faça:
> ✅ "Configurei `HUBSPOT_PRIVATE_TOKEN` como variável de ambiente. Use ela pra listar propriedades."

Eu uso `$env:HUBSPOT_PRIVATE_TOKEN` no PowerShell ou `$HUBSPOT_PRIVATE_TOKEN` no Bash sem ver o valor real.

Se eu PRECISAR ver uma credencial pra debug (raríssimo), eu peço explicitamente, você decide se compartilha, e a credencial expirada é trocada depois.

---

## Próximo passo

Posso ajudar a configurar `.claude/settings.json` (uso a skill `update-config` para mexer em settings com segurança). Diga qual caminho você prefere para cada serviço e eu monto a config.
