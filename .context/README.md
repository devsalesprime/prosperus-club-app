# DotContext

**Template de contexto portátil para projetos assistidos por IA.**

[![Spec: Open](https://img.shields.io/badge/spec-open-2ea44f)](https://github.com/gmasson/dotcontext)
[![Format: Markdown + TOML](https://img.shields.io/badge/format-Markdown%20%2B%20TOML-0366d6)](https://www.markdownguide.org/)
[![Approach: Tool-agnostic](https://img.shields.io/badge/approach-tool--agnostic-6f42c1)](https://github.com/gmasson/dotcontext)
[![License: MIT](https://img.shields.io/badge/license-MIT-f1c40f)](https://opensource.org/licenses/MIT)

Inglês | [Português (Brasil)](README-br.md)

DotContext é uma especificação aberta que fornece um template de pasta de contexto (`.context/`) e um template de arquivo de agente (`AGENT.md`).

A pasta e o arquivo são intencionalmente genéricos neste repositório. Em projetos reais, você deve renomear ambos manualmente para corresponder à convenção da IDE/assistente que utiliza (por exemplo: `.github` para GitHub Copilot, `.claude` para Claude).

## Navegação Rápida

- [Por que DotContext](#por-que-dotcontext)
- [O Problema](#o-problema)
- [Estrutura do Template](#estrutura-do-template)
- [Como Usar](#como-usar)
- [Referência de Arquivos](#referência-de-arquivos)
- [Checklist de Consistência](#checklist-de-consistência)
- [Princípios](#princípios)
- [Licença](#licença)

## Por que DotContext

DotContext é uma forma leve e portátil de dar aos projetos assistidos por IA um contexto operacional confiável. Em vez de recomeçar do zero a cada conversa, ele organiza identidade do projeto, restrições técnicas e decisões anteriores em uma estrutura clara que os agentes podem reutilizar entre sessões. Isso reduz repetição de prompts, diminui desperdício de tokens e melhora a consistência das respostas.

Ele evita o problema comum do “arquivo único gigante de contexto” (por exemplo, configurações no estilo `CLAUDE.md`) ao dividir as informações em arquivos focados por tarefa e carregar apenas o que é relevante para cada trabalho.

## Estrutura do Template

Um pacote de contexto compacto + arquivo de instruções de agente:

```text
.context/ (renomeie manualmente para sua IDE)
├── README.md          → Governança: permissões e estrutura
├── index.toml         → Roteador: o que a IA lê/escreve por tarefa
├── project.toml       → Identidade: nome, stack, URLs, design tokens
├── rules.md           → Padrões: regras técnicas inegociáveis
├── soul.md            → Persona: comportamento e restrições da IA
├── .contextignore     → Filtro: arquivos que a IA não deve ler
├── memory/
│   ├── progress.md    → Estado: o que já foi construído e status atual
│   ├── issues.md      → Problemas: bugs, contornos e áreas frágeis
│   └── decisions.md   → ADR: registros de decisões arquiteturais
├── specs/
│   └── *.md           → Especificações de funcionalidades
└── skills/
    └── *.md           → Guias reutilizáveis de tarefas

AGENT.md (renomeie manualmente para sua IDE)
```

`index.toml` é o contrato de roteamento e permissões para os agentes.
`AGENT.md` é o ponto de entrada de compatibilidade para IDEs que exigem um arquivo explícito de instruções.

Em vez de um único arquivo gigante de contexto, o DotContext divide o contexto em arquivos focados (identidade, regras, memória, specs, skills) e os roteia por tarefa.
Isso dá aos agentes uma memória persistente e auditável, mantendo o contexto ativo enxuto.

**Base estimada: ~300 linhas** (compacto o suficiente para a maioria das janelas de contexto).

## Como Usar

### Início Rápido (caminho mínimo)

1. Copie `.context/` + `AGENT.md` para a raiz do seu projeto.
2. Renomeie ambos manualmente para a convenção da sua IDE/assistente.
3. Atualize os prefixos de caminho no `index.toml`.
4. Preencha `project.toml`, `rules.md` e `soul.md`.
5. Comece a trabalhar com os arquivos de `specs/` + `memory/`.

### 1. Copie os arquivos do template para a raiz do projeto

```bash
# Clone o template
git clone https://github.com/gmasson/dotcontext.git
cp -r dotcontext/.context/ your-project/
cp dotcontext/AGENT.md your-project/
```

### 2. Renomeie a pasta e o `AGENT.md` manualmente (obrigatório)

Use a convenção nativa de nomenclatura da sua ferramenta.

| IDE / Assistente | Renomear pasta para | Renomear `AGENT.md` para | Exemplo de localização final |
|-----------------|------------------|-----------------------|------------------------|
| GitHub Copilot | `.github` | `copilot-instructions.md` | `.github/copilot-instructions.md` |
| Claude | `.claude` | `CLAUDE.md` | `.claude/CLAUDE.md` |
| Outras ferramentas | pasta específica da ferramenta | arquivo de instruções específico da ferramenta | caminho específico da ferramenta |

> Sempre confirme a nomenclatura oficial exigida pela versão da sua IDE/assistente.

Após renomear a pasta, atualize os prefixos de caminho no `index.toml` (substitua `.context/` pela pasta escolhida).

Comandos opcionais de renomeação rápida:

```bash
# Estilo Unix
mv .context .github
mv AGENT.md .github/copilot-instructions.md
```

```powershell
# Windows PowerShell
Rename-Item .context .github
Rename-Item AGENT.md copilot-instructions.md
Move-Item copilot-instructions.md .github/
```

### 3. Preencha os arquivos essenciais

Comece por estes três (carregados em toda interação):

| Arquivo | O que preencher |
|------|-----------------|
| `project.toml` | Nome, versão, stack, URLs, design tokens |
| `rules.md` | Padrões de código, arquitetura, nomenclatura, segurança |
| `soul.md` | Como a IA deve se comportar no seu projeto |

### 4. Use sob demanda

Os arquivos restantes são carregados conforme necessidade:

| Quando | Arquivos relevantes |
|------|----------------|
| Codar / Implementar | `memory/progress.md` + `specs/` + `skills/` |
| Debugar / Corrigir | `memory/issues.md` + `memory/progress.md` |
| Planejar / Arquitetar | `memory/decisions.md` + `memory/progress.md` + `specs/` |
| Revisar / Auditar | `memory/issues.md` + `rules.md` + `specs/` |

## Referência de Arquivos

| Arquivo | Finalidade | Alterar quando |
|------|---------|-------------|
| `index.toml` | Contrato de roteamento (`[always]` + seções de tarefa com `read`/`write`) | Você adiciona/reorganiza arquivos ou categorias de tarefa |
| `AGENT.md` | Ponto de entrada de compatibilidade da IDE (sem duplicar rotas) | Mudanças de nomenclatura/compatibilidade de ferramenta |
| `project.toml` | Identidade do projeto (nome, stack, URLs, tokens) | Mudanças de infra, branding ou stack |
| `rules.md` | Padrões técnicos inegociáveis | Convenções da equipe ou arquitetura evoluem |
| `soul.md` | Comportamento/persona da IA para este projeto | Você precisa de outra postura de assistente |
| `.contextignore` | Filtro de exclusão de arquivos (como `.gitignore`) | Novos caminhos de build/cache/segredos aparecem |
| `memory/progress.md` | Status atual do projeto | Status do trabalho muda |
| `memory/issues.md` | Bugs conhecidos + contornos | Problemas são encontrados/corrigidos |
| `memory/decisions.md` | Log ADR append-only | Novas decisões arquiteturais |
| `specs/*.md` | Contratos de funcionalidades + critérios de aceitação | Escopo de funcionalidade novo/atualizado |
| `skills/*.md` | Procedimentos reutilizáveis específicos do projeto | Processo recorrente é padronizado |

Se houver conflito entre instruções, priorize o roteamento do `index.toml` e as restrições de `rules.md`.

## Checklist de Consistência

Antes de usar em produção, confirme:

- A pasta e o arquivo de instruções foram renomeados para a convenção da sua IDE
- Os prefixos de caminho em `index.toml` correspondem à pasta renomeada
- `project.toml`, `rules.md` e `soul.md` estão preenchidos
- As instruções de `AGENT` não conflitam com `rules.md`

## Princípios

1. **Token-first** — Toda linha deve justificar seu custo em tokens
2. **Modular** — Carregue apenas o necessário para cada tarefa
3. **Portátil** — Mesmo template, renomeado manualmente para cada convenção de IDE
4. **Agnóstico de ferramenta** — Qualquer IA que leia arquivos pode usar DotContext
5. **Legível por humanos** — Markdown e TOML são legíveis por pessoas e máquinas

## Licença

MIT — Use, modifique e distribua livremente.
