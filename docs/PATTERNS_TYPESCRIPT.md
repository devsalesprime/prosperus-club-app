# Padrões TypeScript — Prosperus Club App

**Última atualização:** 2026-05-13
**Escopo:** padrões consolidados em sessões reais, com referência ao commit de origem.

---

## Padrão 1: Narrowing honest para erros pseudo-estruturados

**Origem:** Fase 2 da auditoria R6 (commit `5bddae8`, 2026-05-13).

### Quando usar

Ao tratar erros de bibliotecas que estendem `Error` com propriedades não-tipadas:
- `PostgrestError` do Supabase (`.code`, `.details`, `.hint`)
- `WebPushError` da lib `web-push` (`.statusCode`, `.endpoint`)
- Erros do `fetch` com response status estruturado
- DOM events customizados ou globals injetados

### O que NÃO fazer

```ts
// ❌ Equivalente a `as any` — derrota o type checker
} catch (error: any) {
    const code = (error as Error).code;
}

// ❌ Mesma coisa, só "parece" tipado
} catch (error) {
    const code = (error as { code: string }).code;
}

// ❌ `as Error` é igualmente cego: Error nem tem `.code`
const status = (error as Error & { statusCode: number }).statusCode;
```

### O que fazer

**Caso simples — só precisa de `.message`:**
```ts
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Operation failed:', message);
}
```

**Caso pseudo-estruturado — precisa de `.code`, `.statusCode`, etc:**
```ts
} catch (error: unknown) {
    const errObj: Record<string, unknown> =
        (typeof error === 'object' && error !== null)
            ? error as Record<string, unknown>
            : {};

    const message = typeof errObj.message === 'string' ? errObj.message : String(error);
    const code = typeof errObj.code === 'string' ? errObj.code : undefined;
    const statusCode = typeof errObj.statusCode === 'number' ? errObj.statusCode : undefined;

    // Lógica que dependia das propriedades pseudo-estruturadas
    if (statusCode === 410 || statusCode === 404) {
        await markAsExpired(...);
    }
}
```

### Por que funciona

`Record<string, unknown>` é o **tipo mais amplo seguro**:
- TS ainda obriga a verificar cada propriedade antes de usar
- Sem `any` em lugar nenhum
- Sem `as Error` (que mente sobre a forma)
- Comportamento idêntico em runtime
- Sobrevive a `"strict": true` sem warnings

### Referência de implementação

- `contexts/AuthContext.tsx:72-86` (PostgrestError com `.code`)
- `supabase/functions/send-push/index.ts:95-115` (WebPushError com `.statusCode`)
- `components/admin/GalleryModule.tsx:43-52` (AbortError check com `.message`/`.code`)

---

## Padrão 2: Acumuladores tipados em loops

**Origem:** Fase 2 (mesmo commit).

### Caso

Loop que constrói objeto dinâmico filtrando propriedades:

```ts
// ❌
const cleanProps: any = {};
for (const k in properties) {
    if (properties[k]) cleanProps[k] = properties[k];
}
```

### Correção

```ts
// ✅ se todas as atribuições são strings
const cleanProps: Record<string, string> = {};
for (const k in properties) {
    if (properties[k]) cleanProps[k] = properties[k];
}

// ✅ se heterogêneo (boolean/string/number mistos)
const payload: Record<string, unknown> = { is_active: true, count: 0 };
```

**Validar antes** de escolher entre `Record<string, string>` e `Record<string, unknown>`: leia o código adjacente para confirmar o tipo real das atribuições. Se houver `parseFloat`, `Number()`, booleanos — usar `unknown`.

### Referência

- `supabase/functions/sync-hubspot/index.ts:191,216` (Record<string, string>)
- `supabase/functions/hubspot-webhook/index.ts:579` (Record<string, unknown>)

---

## Padrão 3: catch de erro com fallback de string

**Origem:** Fase 2.

```ts
// ✅ shorthand quando só precisa logar/mostrar
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    toast.error(`Erro: ${message}`);
}
```

### Quando NÃO basta

Se o caller diferencia comportamento por **tipo** de erro (ex: AbortError vs network vs business error), o shorthand não basta — usar o **Padrão 1** (narrowing honest).

---

## Padrão 4: Null/undefined explícito no tipo

**Origem:** ADR-017 Sessão 2 (commits `e57a4d1`, `675dd31`, `1166a76`, 2026-05-14).

Com `strictNullChecks` ligado, declare `null`/`undefined` no tipo **quando é parte real do valor possível**. Não esconda via cast ou anotação otimista.

### Errado

```ts
// ❌ Anotação otimista que mente sobre o conteúdo
const items: Item[] = response.data;  // response.data pode ser null

// ❌ Cast cego que perde o narrowing
const safeList = response.data as Item[];

// ❌ Ignorar com !
const id = profile.id!;  // se profile for null, runtime explode silencioso
```

### Certo

```ts
// ✅ Anotação honest + guard explícito
const items: Item[] | null = response.data;
if (!items) return;
// Daqui pra frente TS sabe que items é Item[]

// ✅ Default explícito com ??
const count = conv.unreadCount ?? 0;

// ✅ Partial<Record> quando mapa tem chaves parciais
const CONFIG: Partial<Record<EnumType, ConfigEntry>> = {
    A: { ... },
    B: { ... },
    // C ausente — typings refletem
};
const entry = CONFIG[key]; // entry: ConfigEntry | undefined
```

### Quando o tipo HONEST revela um bug latente

Se ao tipar honestly você descobre que o código depende de string mágica (`'NONE'`) ou null implícito que talvez não devesse, **NÃO corrija a lógica junto com a tipagem.** Em vez disso:
1. Tipar refletindo o que o código FAZ hoje (incluindo o estranho)
2. Adicionar comentário `// TODO(Issue-XXX): descrição do estranho`
3. Abrir Issue em `.context/memory/issues.md`
4. Sessão futura: decisão de produto/arquitetura

### Referências

- `components/MemberBook.tsx:39` — `Partial<Record<MatchType, MatchConfigEntry>>` (Issue-015)
- `services/adminChatService.ts:136` — `Array<ConversationWithParticipants | null>` (Issue-016)
- `components/chat/ConversationList.tsx:137` — `(conv.unreadCount ?? 0) > 0`
- `components/notifications/AdminNotifications.tsx:651` — `new Date(... || Date.now())`

---

## Padrão 5: Investigar antes de `as any` — drift Database↔TS

**Origem:** Fase β SUSPEITOS (commits `1b1bbd2`, `229fd81`, `3cc691c`, 2026-05-15).

### Regra

Encontrou `(obj as any).campo` ou `(data as any)` no codebase? **NÃO tipar cegamente.** Primeiro investigar:

1. **Validar via MCP / SQL que o campo existe no schema do banco:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = '<tabela>' AND column_name = '<campo>';
   ```

2. **Decisão:**
   - **NÃO existe no banco:** código residual (feature descontinuada) OU flag UI client-side.
     - Se feature descontinuada: remover código residual + fallback (verificar com tech lead)
     - Se flag UI: criar tipo local `EnrichedX = X & { flag?: boolean }`
   - **EXISTE no banco:** `types.ts` está desatualizado. Gerar `Database` type via `supabase gen types typescript` e atualizar.
   - **EXISTE mas vem com shape diferente** (ex: JOIN do Supabase JS retorna array em vez de objeto): tipar honest refletindo a realidade do retorno, ajustar use sites.

### O que NÃO fazer

```ts
// ❌ Cast cego — esconde bug em runtime
const items = (data as any) || [];

// ❌ Cast otimista — perde validação
const profile = response.data as Profile;
```

### Por que importa

Em runtime, `(obj as any).campoFantasma` retorna `undefined` silenciosamente. UI mostra dados vazios, CSV exporta linhas em branco, lógica condicional sempre cai no branch falso — e ninguém percebe até a feature falhar visivelmente em produção.

Casos reais encontrados na Fase β:
- **Issue-019:** `(profile as any).banner_url` em ProfilePreview e MemberBook — coluna não existia, `<img src>` sempre caía no fallback. Removido.
- **Issue-020:** `(file as any).isAutomated` em AdminMemberProgress — flag UI client-side adicionada no merge `mappedReports`. Tipada honest via type local.
- **Issue-017 (standby):** `(data as any)` em EventList RSVP — query retorna `profiles` como array, tipo declarava objeto. **Bug latente real:** CSV de presença saindo vazio.

### Exceção legítima — limitações de lib externa

Há casos em que `as any` é justificado porque a lib não fornece tipos completos:
- `(navigator as any).setAppBadge(...)` — Badging API experimental ainda não está em `lib.dom.d.ts` padrão. Documentado em `contexts/UnreadCountContext.tsx` (ADR-002 IMUTÁVEL).
- `manifest: ... as any` em `vite.config.ts` — `vite-plugin-pwa` types não cobrem `display_override`, `categories`, `screenshots`, `shortcuts`, `launch_handler`, `share_target`, `edge_side_panel`.

Nestes casos, **documentar como exceção** com comentário explicando a limitação e revisitar quando a lib atualizar.

### Referência

- Commits: `1b1bbd2` (Bucket D), `229fd81` (banner_url), `3cc691c` (isAutomated)
- Issues registradas: 017, 018, 019, 020

---

## Padrão 6: Cast honest para limitação de gerador de tipos

**Origem:** Fase β SUSPEITOS — Issue-017 (commit pós resolução, 2026-05-15).

### Quando usar

Quando o type generator de uma lib (ex: `supabase-js` inferindo JOINs) entrega um **shape incorreto** mas o runtime entrega outro shape **confirmado por inspeção**.

Exemplo concreto:
- `supabase-js` infere o JOIN `profiles:user_id(...)` como `profiles[]` (array)
- Runtime entrega `profiles: {...}` (objeto único) em FK 1-1
- Inspeção via Network confirmou em 100% dos casos

### Errado

```ts
// ❌ Mascara o desvio sem documentar — futuro dev não sabe se é bug
setRsvpList((data as any) || []);

// ❌ Cast direto não compila quando shapes são incompatíveis
//   (TS: "Conversion of type X to Y may be a mistake")
setRsvpList(data as RsvpItem[]);
```

### Certo

```ts
// ✅ as unknown as T — porta dos fundos do TypeScript
//   Compila + sinaliza "sei que parece quebrado mas validei runtime"
// Issue-017 (resolvido): supabase-js type generator infere JOIN como array,
// runtime entrega objeto. Confirmado via Network inspection 2026-05-15.
setRsvpList((data ?? []) as unknown as RsvpItem[]);
```

### Sempre acompanhar de

1. **Comentário** explicando a limitação da lib
2. **Referência** a Issue (ou commit + data) com evidência da validação runtime
3. Tipo `T` deve refletir o **runtime real**, não o que o generator inferiu

### Quando NÃO usar este padrão

- Type generator está **correto** e o código que está errado: investigar e corrigir o código (Padrão 5 — drift Database↔TS)
- Não há validação runtime ainda: marcar como STANDBY/Issue até confirmar
- Cast por preguiça ou por não entender o tipo: usar narrowing honest (Padrão 1) ou ajustar a query
- Field não existe no banco: feature descontinuada (remover) ou flag UI (tipo local Enriched<T>)

### Diferença vs Padrão 1 (Narrowing honest)

| Aspecto | Padrão 1 | Padrão 6 |
|---|---|---|
| Origem do desvio | Erro pseudo-estruturado em runtime (PostgrestError, WebPushError) | Type generator infere shape errado |
| Acesso | Por propriedade via `Record<string, unknown>` + checagem typeof | Cast direto via `as unknown as T` |
| Quando aplicar | Cada acesso a propriedade não-tipada | Uma vez no boundary da query/response |

### Referência de implementação

- `components/admin/events/EventList.tsx:146` — `setRsvpList((data ?? []) as unknown as RsvpItem[])` com comentário e referência à Issue-017

---

## Quando criar novos padrões aqui

- Padrão emergiu em ≥2 commits diferentes resolvendo o mesmo tipo de problema
- Solução foge do óbvio (alguém pode escrever errado se não tiver referência)
- Tem referência de commit/arquivo para validar comportamento real

Histórico:
- 2026-05-13 — Padrões 1, 2, 3 criados a partir da Fase 2 da auditoria R6 (commit `5bddae8`)
- 2026-05-14 — Padrão 4 criado a partir da Sessão 2 do ADR-017 (commits `e57a4d1`, `675dd31`, `1166a76`)
- 2026-05-15 — Padrão 5 criado a partir da Fase β SUSPEITOS (commits `1b1bbd2`, `229fd81`, `3cc691c`)
- 2026-05-15 — Padrão 6 criado a partir da resolução de Issue-017 como falso positivo (limitação supabase-js type generator)
