# 🤹 Skill: Exportação de Dados para CSV

Sempre que for requisitada a exportação de dados para CSV/Excel:

1. **Serviço Centralizado:** Utilize a lógica do arquivo `services/exportService.ts`.
2. **UTF-8 BOM Obrigatório:** É estritamente necessário injetar o caractere `\uFEFF` no início do blob gerado. Isso garante que o Excel abra o arquivo imediatamente com os acentos em português corretos.
3. **Feedback UI:** Envolva a função da UI em `try/catch` e dispare `toast.promise()` (react-hot-toast) para informar visualmente o progresso ao usuário.
