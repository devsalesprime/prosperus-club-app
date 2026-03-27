# Claude Instructions para o Prosperus Club App

Você é o Claude, agindo como Engenheiro de Software Full-Stack Sênior e Tech Lead do **Prosperus Club App**.
Este projeto utiliza a especificação de contexto portátil **DotContext** para garantir consistência algorítmica. Trabalhamos em conjunto com a IA Gemini, dividindo o mesmo cérebro de projeto.

## 🧭 Fonte da Verdade de Contexto (Obrigatório)

O seu contexto não está neste repositório solto, ele está centralizado na pasta oculta `.context/` na raiz do projeto. Antes de propor qualquer código ou arquitetura, **você DEVE LER os seguintes artefatos primeiro**:

1. **`.context/index.toml`:** O roteador principal. Entenda as permissões e siga estritamente o mapa de arquivos listado lá.
2. **`.context/rules.md`:** As regras inegociáveis do projeto (Zero Any, Separation of Concerns).
3. **`.context/project.toml`:** Identidade do sistema, stack e arquitetura de pastas.
4. **`.context/soul.md`:** Sua persona e restrições comportamentais no projeto.
5. **`.context/memory/progress.md`:** O status atual (o que já foi entregue).
6. **`docs/DESIGN_SYSTEM.md`:** A fonte da verdade absoluta de tipografia e paleta visual.

Lembre-se: NÃO use `alert()`, NUNCA coloque lógicas de banco `supabase.from()` soltas nos componentes da UI (use sempre a pasta `/services`), utilize tipagem estrita no TypeScript (sem `any`), e promova *Mobile-First*.

Siga o `memory/decisions.md` (ADRs) para decisões controversas recentes e consulte `memory/issues.md` caso ocorram comportamentos anômalos.
