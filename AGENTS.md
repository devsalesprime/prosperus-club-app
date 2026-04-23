# AGENTS.md — Padrões de Engenharia

Regras para agentes de IA. Seja literal. Siga os passos numerados. Na dúvida, pergunte.

## 1. Princípios Essenciais de Engenharia
- **Clareza acima de complexidade** — Escreva código fácil de manter, não para impressionar.
- **Explícito em vez de implícito** — Sem mágicas. Torne o comportamento óbvio.
- **Composição em vez de herança** — Construa unidades pequenas que se combinam.
- **Falhe rápido, falhe alto** — Exponha os erros na origem.
- **Delete código** — Menos código = menos bugs. Questione cada nova adição.
- **Verifique, não presuma** — Rode o código. Teste. Prove que funciona.
- **Nunca modifique arquivos que você não criou**, a menos que a tarefa exija isso explicitamente.

## 2. Fluxo de Desenvolvimento de Funcionalidades
### Antes de Escrever o Código
- **Esclareça os requisitos** — Reafirme o objetivo. Faça perguntas se houver ambiguidade.
- **Identifique os pontos de falha** — Liste o que pode dar errado:
  - Inputs inválidos
  - Dependências ausentes
  - Falhas de rede/IO
  - Problemas de concorrência
  - Vazamento de memória / Esgotamento de recursos
- **Classifique o trabalho por prioridade:**
  - A. Fluxo Principal: Caminho feliz + tratamento direto de erros.
  - B. Casos Extremos (Edge Cases): Cenários incomuns, mas válidos.
  - C. Fora de Escopo: Documente, não implemente.
- **Verifique o código existente** — Isso já foi resolvido antes? É possível estender algo em vez de criar do zero?

### Ordem de Implementação
1. Escreva um teste que falha para o caminho feliz principal.
2. Implemente o código mínimo necessário para o teste passar.
3. Escreva testes que falham para os casos de erro.
4. Implemente o tratamento de erros.
5. Refatore se necessário (os testes devem continuar passando).
6. Adicione testes de casos extremos apenas depois que o fluxo principal estiver sólido.

### Antes de Submeter (Checklist)
- [ ] Todos os testes estão passando.
- [ ] Não há código comentado (código morto).
- [ ] Não há TODO sem contexto (`// TODO: [motivo] descrição`).
- [ ] As mensagens de erro são acionáveis e claras.
- [ ] Nenhuma credencial, segredo ou variável de ambiente está fixada no código (hardcoded).
- [ ] A formatação e o linter passaram sem alertas.

## 3. Processo de Debugging
### Quando Algo Falha
1. **Reproduza consistentemente** — Você consegue acionar o erro sempre?
2. **Isole o escopo** — Qual é o menor input possível que causa a falha?
3. **Leia o erro** — Leia de verdade. Olhe a stack trace inteira.
4. **Formule uma hipótese** — Dê um palpite específico sobre a causa raiz.
5. **Teste a hipótese** — Adicione logs, escreva um teste ou inspecione o estado.
6. **Corrija e verifique** — Mude apenas uma coisa. Confirme se foi resolvido.
7. **Adicione um teste de regressão** — Garanta que esse erro nunca volte a acontecer silenciosamente.

### O Que NÃO Fazer
- Mudar várias coisas ao mesmo tempo.
- Presumir que sabe a causa sem evidências.
- Deletar o tratamento de erro só para "simplificar" o fluxo.
- Consertar o sintoma em vez da causa raiz.

## 4. Organização do Código
### Estrutura de Arquivos
- Apenas um tipo/classe/interface principal por arquivo.
- O nome do arquivo deve corresponder exatamente ao nome do tipo.
- Agrupe por funcionalidade/domínio, não por camada técnica.
- Utilitários compartilhados ficam em `Core/` ou `Common/` — com zero dependência do domínio do negócio.

### Direção das Dependências
```text
PlaintextFeatures → Services → Core
   ↓          ↓         ↓
  UI    Lógica de    Utilitários
         Negócio
```
- `Core/` não depende de nada interno.
- `Services/` depende apenas de `Core/`.
- `Features/` depende de `Services/` e `Core/`.
- **Proibido dependências circulares.**
- Funcionalidades (Features) devem poder ser deletadas sem quebrar códigos não relacionados.

## 5. Estilo de Código
### Nomenclatura
| Tipo | Convenção |
|------|-----------|
| Tipos/Classes/Interfaces | UpperCamelCase (Substantivo ou Adjetivo) |
| Funções/Variáveis | lowerCamelCase |
| Constantes | lowerCamelCase ou SCREAMING_SNAKE_CASE (siga o padrão da linguagem) |

### Funções
- Devem fazer apenas **UMA** coisa.
- O nome deve descrever o QUE a função faz, não COMO ela faz.
- Máximo de 3 a 4 parâmetros — passou disso, use um objeto de configuração/interface.
- Evite parâmetros booleanos — eles obscurecem a intenção na chamada da função.

### Comentários
- Explique o **POR QUÊ**, não o **O QUÊ**.
- Delete comentários que apenas repetem o que o código já diz.
- Formato do TODO: `// TODO: [contexto] descrição do que falta`.
- Documente comportamentos não óbvios e soluções de contorno (workarounds).

## 6. Tratamento de Erros
### Regras
- Defina tipos de erro específicos para cada domínio/módulo.
- Inclua contexto: o que falhou e com quais inputs.
- Mapeie erros externos nas fronteiras da aplicação — não vaze detalhes de implementação (ex: não jogue um erro cru do Axios/Supabase direto para a UI).
- Falhe na origem — não repasse estados inválidos esperando que outra camada lide com isso.
- Erros são contratos de API — projete-os com o mesmo cuidado que os caminhos de sucesso.

## 7. Testes
### Princípios
- Testes são isolados: sem estado compartilhado, sem dependência de ordem de execução.
- Um comportamento por teste. Nomes descritivos: `test_build_failsWhenSchemeNotFound`.
- Teste comportamento, não detalhes de implementação.
- Testes rápidos são executados; testes lentos acabam ignorados.

## 8. Refatoração
### Quando Refatorar
- Antes de adicionar uma funcionalidade (facilite a mudança, depois faça a mudança fácil).
- Depois que todos os testes passarem (não durante a implementação).
- Quando tocar num código difícil de entender.

### Quando NÃO Refatorar
- Durante um processo de debugging.
- Se não houver cobertura de testes.
- Mudanças "já que estou mexendo aqui" — separe em outro commit ou ticket.

## 9. Dependências Externas
### Regras
- Isole APIs de terceiros atrás de interfaces que você controla (Wrappers).
- Fixe as versões explicitamente no `package.json`.
- Atualize bibliotecas de forma deliberada, não no piloto automático.

## 10. Higiene do Git
- Um mudança lógica por commit.
- Verbos no presente do indicativo: "Adiciona cache" e não "Adicionado cache".
- A branch main deve estar sempre pronta para deploy.
- Padrão de branches: `feature/descricao-da-tarefa` ou `fix/descricao-do-bug`.

## 11. Eficiência de Tokens (Instrução Direta para a IA)
- Nunca releia arquivos que você acabou de escrever ou editar. Você já sabe o que tem lá.
- Nunca rode comandos de "verificação" a menos que o resultado seja realmente incerto.
- Não imprima de volta blocos gigantes de código ou conteúdo de arquivos, a menos que solicitado.
- Agrupe edições relacionadas em uma única operação. Não faça 5 edições se 1 resolve.
- Pule frases de confirmação como "Vou continuar...". Apenas execute.
- Se uma tarefa precisa de 1 chamada de ferramenta, não use 3. Planeje antes de agir.
- Não resuma o que você acabou de fazer, a menos que o resultado seja ambíguo ou você precise de uma decisão do usuário.

## 12. Na Dúvida
- **Cheque padrões existentes** — Como o código atual resolve problemas parecidos?
- **Pergunte** — Ambiguidade custa caro. Esclareça antes de codar.
- **Faça a menor mudança** — Prefira o menor diff que resolva o problema.
- **Reversibilidade** — Prefira mudanças que sejam fáceis de desfazer.
- **Prove** — Rode o código. Passe nos testes. Não adivinhe.
