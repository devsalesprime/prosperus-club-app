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

## Quando criar novos padrões aqui

- Padrão emergiu em ≥2 commits diferentes resolvendo o mesmo tipo de problema
- Solução foge do óbvio (alguém pode escrever errado se não tiver referência)
- Tem referência de commit/arquivo para validar comportamento real

Histórico:
- 2026-05-13 — Padrões 1, 2, 3 criados a partir da Fase 2 da auditoria R6 (commit `5bddae8`)
- 2026-05-14 — Padrão 4 criado a partir da Sessão 2 do ADR-017 (commits `e57a4d1`, `675dd31`, `1166a76`)
