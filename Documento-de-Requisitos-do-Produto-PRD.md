# Documento de Requisitos do Produto (PRD)
## Complemento: Funcionalidades de Networking Inteligente
### Aplicativo Móvel Prosperus Club v2.1

**Versão:** 2.1  
**Última Atualização:** 30 de Janeiro de 2026  
**Status:** Rascunho para Revisão  
**Referência:** [PRD Principal v2.0]

---

## 1. Resumo Executivo

### 1.1 Propósito deste Documento
Este documento complementa o PRD Principal v2.0 do Prosperus Club App, detalhando três novas funcionalidades focadas em inteligência relacional e gamificação de negócios entre membros.

### 1.2 Funcionalidades Contempladas

| # | Funcionalidade | Objetivo | Prioridade |
|---|---|---|---|
| 1 | Integração HubSpot + Onboarding | Facilitar preenchimento de perfil e centralizar dados de membros | **ALTA** |
| 2 | ROI entre Sócios | Medir e gamificar negócios fechados entre membros | **ALTA** |
| 3 | Ranking de Indicações | Incentivar indicações de terceiros entre membros | **MÉDIA** |

### 1.3 Visão Estratégica
Estas funcionalidades transformam o app de um diretório passivo em uma plataforma ativa de geração de negócios. O objetivo é criar um ciclo virtuoso onde membros são incentivados a: preencher dados completos, realizar negócios entre si, e indicar oportunidades uns aos outros.

---

## 2. Integração HubSpot + Formulário de Onboarding

### 2.1 Propósito
Reduzir atrito no preenchimento de perfil e centralizar dados do membro em uma única fonte de verdade (HubSpot), aproveitando dados já coletados no processo comercial e no onboarding.

### 2.2 Componentes

#### 2.2.1 Sincronização Automática com HubSpot
*   **Fonte de Dados:** Objetos do HubSpot (Contact, Deal, Company)
*   **Direção:** HubSpot → App (one-way sync inicial, bidirecional futuro)

| ID Requisito | Descrição | Objeto HubSpot | Campo App |
|---|---|---|---|
| HUB-SYNC-001 | Puxar nome completo do contato | Contact.firstname + lastname | Member.name |
| HUB-SYNC-002 | Puxar email do contato | Contact.email | Member.email |
| HUB-SYNC-003 | Puxar empresa associada | Company.name | Member.company |
| HUB-SYNC-004 | Puxar cargo/título | Contact.jobtitle | Member.role |
| HUB-SYNC-005 | Puxar WhatsApp | Contact.phone ou custom | Member.socials.whatsapp |
| HUB-SYNC-006 | Puxar LinkedIn | Contact.linkedin ou custom | Member.socials.linkedin |
| HUB-SYNC-007 | Puxar Instagram | Contact custom property | Member.socials.instagram |
| HUB-SYNC-008 | Puxar data de entrada no clube | Deal.closedate | Member.memberSince |

#### 2.2.2 Formulário de Onboarding (Migração do Google Forms)
O formulário de boas-vindas atual será migrado para o HubSpot Forms e integrado ao app. Campos existentes serão mantidos e três novos campos estratégicos serão adicionados.

**Novos Campos para Conexões Estratégicas:**

| ID Requisito | Campo | Finalidade |
|---|---|---|
| ONB-FLD-001 | O que você vende/faz? (já existe) | Identificar oferta do membro para matching de compradores |
| ONB-FLD-002 | O que você precisa/compraria agora? (novo) | Identificar demandas para matching de vendedores |
| ONB-FLD-003 | Setores de interesse para sociedade/parcerias (novo) | Facilitar conexões para M&A, JVs e parcerias estratégicas |

#### 2.2.3 Exibição no Perfil do Membro

| ID Requisito | Descrição | Visibilidade |
|---|---|---|
| PRF-STR-001 | Exibir seção 'O que ofereço' no perfil do membro | Todos os membros |
| PRF-STR-002 | Exibir seção 'O que procuro' no perfil do membro | Todos os membros |
| PRF-STR-003 | Exibir seção 'Interesse em parcerias' no perfil | Todos os membros |
| PRF-STR-004 | Conexões estratégicas são sugeridas pela equipe | N/A (não automático) |

### 2.3 Critérios de Aceite
*   Ao criar conta no app, dados do HubSpot são pré-preenchidos automaticamente.
*   Membro pode editar qualquer campo pré-preenchido.
*   Formulário de onboarding aparece no primeiro acesso ou até ser completado.
*   Campos estratégicos são obrigatórios no onboarding.
*   Dados do formulário são salvos no HubSpot e sincronizados com o app.
*   Seções estratégicas visíveis no perfil para todos os membros.

---

## 3. ROI entre Sócios (Ranking de Negócios)

### 3.1 Propósito
Criar visibilidade e gamificação sobre negócios fechados entre membros do clube, incentivando tanto a realização de negócios quanto o registro dos mesmos para comprovação do valor da comunidade.

### 3.2 Fluxo Principal

#### 3.2.1 Registro de Negócio
| ID Requisito | Descrição |
|---|---|
| ROI-REG-001 | Vendedor acessa tela de 'Registrar Negócio' no app |
| ROI-REG-002 | Vendedor seleciona o comprador (membro do clube) de uma lista |
| ROI-REG-003 | Vendedor informa valor do negócio (R$) |
| ROI-REG-004 | Vendedor pode adicionar descrição opcional do negócio |
| ROI-REG-005 | Sistema envia notificação ao comprador solicitando confirmação |

#### 3.2.2 Confirmação do Comprador
| ID Requisito | Descrição |
|---|---|
| ROI-CNF-001 | Comprador recebe notificação push e in-app sobre negócio pendente |
| ROI-CNF-002 | Comprador visualiza detalhes: vendedor, valor, descrição |
| ROI-CNF-003 | Comprador pode Confirmar ou Contestar o negócio |
| ROI-CNF-004 | Contestação abre campo para comentário e notifica equipe |
| ROI-CNF-005 | Após confirmação, negócio entra no ranking automaticamente |

#### 3.2.3 Ranking e Premiação
| ID Requisito | Descrição |
|---|---|
| ROI-RNK-001 | Exibir ranking de membros por volume de vendas (R$) entre sócios |
| ROI-RNK-002 | Exibir ranking de membros por quantidade de negócios fechados |
| ROI-RNK-003 | Filtro por período: Mensal, Trimestral, Anual, All-time |
| ROI-RNK-004 | Exibir total consolidado de negócios entre sócios (visível para todos) |
| ROI-RNK-005 | Sistema de premiação com data de corte pré-definida |
| ROI-RNK-006 | Auditoria manual pela equipe antes de anunciar premiados |
| ROI-RNK-007 | Se dados não comprovados, prêmio passa ao próximo no ranking |

### 3.3 Estados do Negócio

| Estado | Descrição | Ação Necessária |
|---|---|---|
| **PENDENTE** | Aguardando confirmação do comprador | Comprador precisa confirmar ou contestar |
| **CONFIRMADO** | Comprador confirmou o negócio | Contabilizado no ranking automaticamente |
| **CONTESTADO** | Comprador contestou os dados | Equipe analisa e resolve disputa |
| **AUDITADO** | Equipe validou para premiação | Elegível para premiação |
| **INVALIDADO** | Equipe não conseguiu comprovar | Removido do ranking de premiação |

### 3.4 Critérios de Aceite
*   Apenas negócios confirmados por ambas as partes entram no ranking.
*   Notificação enviada em até 1 minuto após registro do negócio.
*   Ranking atualiza em tempo real após confirmação.
*   Histórico de negócios visível no perfil do membro (para ele mesmo).
*   Equipe tem acesso a painel administrativo para auditoria.

---

## 4. Ranking de Indicações de Terceiros

### 4.1 Propósito
Incentivar que membros indiquem potenciais compradores uns para os outros, criando uma rede ativa de geração de negócios. Premiação tanto para quem indica quanto para quem converte.

### 4.2 Fluxo Principal

#### 4.2.1 Registro da Indicação
| ID Requisito | Descrição |
|---|---|
| IND-REG-001 | Membro A (indicador) acessa tela de 'Fazer Indicação' |
| IND-REG-002 | Indicador seleciona Membro B (quem vai receber o lead) |
| IND-REG-003 | Indicador preenche dados do indicado: Nome completo, Email, Telefone (opcional) |
| IND-REG-004 | Indicador adiciona contexto: motivo da indicação, necessidade identificada |
| IND-REG-005 | Sistema notifica Membro B sobre nova indicação recebida |

#### 4.2.2 Acompanhamento pelo Receptor
| ID Requisito | Descrição |
|---|---|
| IND-RCP-001 | Membro B visualiza indicação com dados do lead e contexto |
| IND-RCP-002 | Membro B marca indicação como 'Em contato' ao iniciar abordagem |
| IND-RCP-003 | Membro B pode adicionar notas de acompanhamento |
| IND-RCP-004 | Membro B atualiza resultado: Fechou, Não fechou, Em negociação |

#### 4.2.3 Registro de Conversão
| ID Requisito | Descrição |
|---|---|
| IND-CNV-001 | Ao marcar como 'Fechou', Membro B informa valor do negócio |
| IND-CNV-002 | Sistema notifica Membro A (indicador) sobre conversão |
| IND-CNV-003 | Indicação contabilizada no ranking de indicações convertidas |

#### 4.2.4 Rankings de Indicação
| ID Requisito | Descrição |
|---|---|
| IND-RNK-001 | Ranking por número de indicações feitas (independente de conversão) |
| IND-RNK-002 | Ranking por número de indicações que resultaram em venda |
| IND-RNK-003 | Ranking por volume (R$) gerado através de indicações |
| IND-RNK-004 | Filtro por período: Mensal, Trimestral, Anual, All-time |
| IND-RNK-005 | Premiação dupla: melhor indicador + maior taxa de conversão |

### 4.3 Estados da Indicação

| Estado | Descrição | Contabilização |
|---|---|---|
| **NOVA** | Indicação registrada, aguardando ação | Conta para ranking de indicações feitas |
| **EM_CONTATO** | Receptor iniciou abordagem ao lead | Conta para ranking de indicações feitas |
| **EM_NEGOCIACAO** | Lead em processo de negociação | Conta para ranking de indicações feitas |
| **CONVERTIDA** | Negócio fechado com sucesso | Conta para ambos os rankings |
| **NAO_CONVERTIDA** | Lead não avançou para compra | Conta apenas para indicações feitas |

### 4.4 Critérios de Aceite
*   Indicador não pode indicar para si mesmo.
*   Email do indicado é obrigatório para validação.
*   Sistema previne duplicidade de indicação (mesmo lead para mesmo receptor).
*   Notificações enviadas em cada mudança de status.
*   Indicador pode ver status de suas indicações (sem ver detalhes de negociação).
*   Histórico de indicações visível no perfil do membro (para ele mesmo).

---

## 5. Entidades de Dados

### 5.1 Extensão da Entidade Member
Adicionar os seguintes campos à interface `Member` existente:

```typescript
// Extensão para campos estratégicos
strategicProfile?: {
  whatISell: string;            // O que vende/faz
  whatINeed: string;            // O que precisa/compraria
  partnershipInterests: string[]; // Setores de interesse para parcerias
};

// Estatísticas de networking
networkingStats?: {
  totalSalesVolume: number;     // Volume total vendido para sócios
  totalPurchaseVolume: number;  // Volume total comprado de sócios
  dealsAsSeller: number;        // Qtd negócios como vendedor
  dealsAsBuyer: number;         // Qtd negócios como comprador
  referralsMade: number;        // Indicações feitas
  referralsConverted: number;   // Indicações que converteram
};

// Metadados HubSpot
hubspotContactId?: string;      // ID do contato no HubSpot
hubspotSyncedAt?: string;       // Última sincronização
memberSince?: string;           // Data de entrada no clube
```

### 5.2 Entidade Deal (Negócio entre Sócios)

```typescript
interface MemberDeal {
  id: string;                   // UUID
  sellerId: string;             // Membro que vendeu
  buyerId: string;              // Membro que comprou
  amount: number;               // Valor em R$
  description?: string;         // Descrição do negócio
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONTESTADO' | 'AUDITADO' | 'INVALIDADO';
  contestReason?: string;       // Motivo da contestação
  auditNotes?: string;          // Notas da auditoria (admin)
  
  // Timestamps
  createdAt: string;            // Quando foi registrado
  confirmedAt?: string;         // Quando foi confirmado
  auditedAt?: string;           // Quando foi auditado
  
  // Período de referência
  periodMonth: number;          // Mês (1-12)
  periodYear: number;           // Ano
}
```

### 5.3 Entidade Referral (Indicação)

```typescript
interface MemberReferral {
  id: string;                   // UUID
  referrerId: string;           // Membro que indicou
  receiverId: string;           // Membro que recebeu o lead
  
  // Dados do lead indicado
  leadName: string;             // Nome do potencial comprador
  leadEmail: string;            // Email (obrigatório)
  leadPhone?: string;           // Telefone (opcional)
  context: string;              // Contexto da indicação
  
  status: 'NOVA' | 'EM_CONTATO' | 'EM_NEGOCIACAO' | 'CONVERTIDA' | 'NAO_CONVERTIDA';
  
  // Dados de conversão (preenchidos se convertida)
  convertedAmount?: number;     // Valor do negócio fechado
  convertedAt?: string;         // Data da conversão
  
  // Notas de acompanhamento
  notes?: ReferralNote[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Período de referência
  periodMonth: number;
  periodYear: number;
}

interface ReferralNote {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;             // receiverId na maioria dos casos
}
```

---

## 6. Considerações Técnicas

### 6.1 Integrações Necessárias

| Sistema | Tipo | Observações |
|---|---|---|
| HubSpot CRM | API REST via OAuth | Leitura de Contacts, Deals, Companies |
| HubSpot Forms | Embedded ou API | Formulário de onboarding |
| Push Notifications | Firebase/Supabase | Notificações de negócios e indicações |

### 6.2 Impacto no Backend (Supabase)
*   **Novas tabelas:** `member_deals`, `member_referrals`, `referral_notes`.
*   **Extensão da tabela members:** com campos `strategic_profile` e `networking_stats`.
*   **Row Level Security (RLS):** para garantir que membros vejam apenas dados permitidos.
*   **Functions:** para cálculo de rankings em tempo real.
*   **Triggers:** para atualizar estatísticas agregadas no perfil do membro.

### 6.3 Novas Telas no App

| Tela | Acesso | Funcionalidade |
|---|---|---|
| Rankings | Menu principal ou Home | Visualização de todos os rankings |
| Registrar Negócio | Rankings ou FAB | Formulário de registro de negócio |
| Fazer Indicação | Rankings ou FAB | Formulário de nova indicação |
| Minhas Indicações | Perfil do membro | Lista de indicações feitas/recebidas |
| Meus Negócios | Perfil do membro | Histórico de negócios com sócios |
| Confirmações Pendentes | Notificações ou Home | Lista de negócios aguardando confirmação |

---

## 7. Roadmap de Implementação

| Fase | Escopo | Entregáveis | Prioridade |
|---|---|---|---|
| 1 | Integração HubSpot + Onboarding | Sync de dados, formulário migrado, campos estratégicos | **ALTA** |
| 2 | ROI entre Sócios - MVP | Registro, confirmação, ranking básico | **ALTA** |
| 3 | ROI entre Sócios - Auditoria | Painel admin, sistema de premiação | **ALTA** |
| 4 | Indicações - MVP | Registro e acompanhamento de indicações | **MÉDIA** |
| 5 | Indicações - Gamificação | Rankings, conversões, premiação dupla | **MÉDIA** |

---
**Status do Documento:** RASCUNHO  
**Referência:** PRD Principal v2.0 - Prosperus Club App
