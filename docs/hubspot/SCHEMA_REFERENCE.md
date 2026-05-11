# HubSpot Schema Reference — Prosperus Club

Referência consolidada dos schemas HubSpot extraídos em **2026-05-07**.
Fonte das listas: `docs/hubspot/full/<object>/properties.yaml`.
Dados detalhados (CSVs, ndjson, transcripts) ficam em subpastas mas **não são lidos automaticamente** por agentes — são dataset, não schema.

## Visão geral

| Objeto | Records | Properties | Date field | Local schema |
|--------|---------|-----------|------------|--------------|
| `contacts` | 4.084 | **388** | `createdate` | `full/contacts/properties.yaml` |
| `companies` | 3.344 | **159** | `createdate` | `full/companies/properties.yaml` |
| `deals` | 757 | **296** | `createdate` | `full/deals/properties.yaml` |
| `leads` | 2.317 | **217** | `hs_createdate` | `full/leads/properties.yaml` |
| `tickets` | 348 | **155** | `createdate` | `full/tickets/properties.yaml` |
| `calls` | 16.421 | **65** | `hs_timestamp` | `full/calls/properties.yaml` |
| `meetings` | 918 | **67** | `hs_meeting_start_time` | `full/meetings/properties.yaml` |

**Filtro temporal:** todos extraídos com `filter_since: 2026-01-01`. Records criados antes de 2026 não estão neste snapshot.

## Estrutura de pastas

```
docs/hubspot/
├── full/                    # Schema + dados completos do snapshot
│   ├── contacts/
│   │   ├── properties.yaml  # ← schema (lista de propriedades)
│   │   ├── data.csv         # ← dados em CSV (todos records)
│   │   └── data.ndjson      # ← dados em NDJSON (1 linha por record)
│   ├── companies/, deals/, leads/, tickets/, calls/, meetings/
├── relevant/                # Subset filtrado dos mesmos objetos
│   └── calls/transcripts/   # Transcrições raw das chamadas (JSON por chamada)
└── archive/                 # Exports antigos (CSVs sem properties.yaml)
```

## Tabela Supabase auxiliar (ADR-015)

| Tabela Supabase | Propósito | Acesso |
|------------------|-----------|--------|
| `public.hubspot_failed_calls` | Fila persistente de chamadas HubSpot que falharam após 4 attempts do wrapper `hubspotFetch`. Reprocessada pelo cron `hubspot-retry-failures` a cada 6h. | SELECT: ADMIN/TEAM via RLS. INSERT/UPDATE/DELETE: service_role apenas. |

Esquema (migration `supabase/migrations/20260511_hubspot_failed_calls.sql`):
- `id uuid PK`, `function_name text`, `payload jsonb`
- `request_method text`, `request_url text`
- `error_status int`, `error_message text`, `attempts int default 4`
- `status text CHECK ('pending'|'reprocessed'|'failed_permanent')`
- `reprocess_attempts int default 0`, `last_reprocessed_at timestamptz`
- `created_at`, `updated_at` (trigger BEFORE UPDATE)

Indexes: `(status, created_at) WHERE status='pending'`, `(function_name)`.

## Propriedades CUSTOM Prosperus (não-`hs_*`)

As propriedades começando com `hs_` são padrão do HubSpot. Abaixo, apenas as **customizadas pelo time Prosperus** agrupadas por domínio.

### Contacts — perfil pessoal e profissional

**Identificação:**
`cpf`, `cpf2026`, `rg2`, `cnpj`, `nome`, `nome_do_ceo`, `email`, `phone`, `mobilephone`, `telefonewhatsapp`, `whatsapp`, `nacionalidade`, `genero`, `estado_civil`, `data_de_nascimento_`, `data_de_aniversario`, `nascimento_filho_1`, `nascimento_filho_2`, `voce_tem_filhos`

**Empresa do contato:**
`company`, `cargo_na_empresa_2_`, `jobtitle`, `qual__o_seu_cargo`, `profissao`, `nicho`, `qual_o_segmento_da_empresa`, `qual_o_segmento_da_sua_empresa`, `natureza_da_atuacao`, `produtoservico_oferta_da_mentoria`, `faturamento`, `faturamento_anual___empresa`, `quanto_em_mdia_a_empresa_que_voc_trabalha_fatura_por_ano`, `quanto_em_mdia_sua_empresa_fatura_por_ano`

**Mentoria / qualificação:**
`adequacao_de_lead_scoring_2025_v1`, `alunos_ativos`, `autonomia_operacional`, `canais_de_aquisicao_mentoria`, `carga_horaria_semanal`, `consciencia_de_preco`, `decisao_estrategica`, `dedicacao_semanal_mentoria`, `desafio_em_vendas__multipla_selecao_`, `desafio_na_lideranca`, `desafio_na_mentoria`, `diferencial_de_expertise`, `disponibilidade_financeira`, `experiencia_com_mentoria`, `engajamento_de_lead_scoring_2025_v1`, `lacuna_de_competencia`, `lead_scoring_2025_v1`, `limite_de_lead_scoring_2025_v1`, `maior_objetivo_em_2025`, `medoobjecao_de_escala`, `meta_de_faturamento_mensal_mentoria`, `motivo_entrar_prosperus`, `motivo_participacao`, `nivel_de_energia_do_lider`, `nivel_de_estruturacao_do_metodo`, `nivel_de_preparo_mentoria`, `o_que_precisa`, `objetivo`, `obstaculo_para_crescimento_mentoria`, `perfil_comportamental`, `perfil_de_delegacao`, `possui_mentoria`, `postura_operacional`, `presencaaudiencia_digital`, `principal_desafio_em_vendas`, `setor_de_interesse`, `setores_de_interesse`, `sobre_voce`, `suporte_a_lideranca`, `tempo_de_lideranca`, `ticket_medio_mentoria`, `tracao_comercial`, `visao_estrategica`, `valor_potencialize`, `valor_start`, `valor_start_num`

**Eventos / Prime Experience:**
`data__prime_experience`, `data_do_evento`, `nome_do_evento`, `e_possivel_incluir_o_ceo_na_reuniao_`, `lista_de_espera_prosperus_experience`, `n_tipo_de_convite`, `para_quem_e_a_palestra_`, `qual_a_data_do_evento_`, `sera_um_evento_aberto_ou_fechado_`, `sera_um_evento_para_quantas_pessoas_em_media_`, `voc_ainda_no_atende_aos_critrios_do_prosperus_club_nossa_imerso_presencial_a_prime_experience__uma_`

**Personalização (gifts/eventos):**
`tamanho_calcado`, `tamanho_de_roupa`, `restricao_alimentar`, `qual_o_seu_hobby`, `numero_emergencia`, `redes_sociais`, `empresarios_que_te_inspiram`, `h_quanto_tempo_voc_acompanha_a_dani_martins_eou_joel_jota`, `h_quanto_tempo_voc_acompanha_a_dani_martins_ou_joel_jota`, `foto_pessoal`, `foto_familia`, `avatar_url`, `banner_de_aniversario`, `deixar_mensagem_outdoor`

**Sales / Closer / SDR:**
`closer`, `sdr`, `sdr_horario_de_interacao`, `feedback_da_qualificacao`, `recomendador`, `socio`, `origem`, `pag_conversao`

**WhatsApp via Eazybe:**
`eazybe_avg_response_time`, `eazybe_last_wa_date`, `eazybe_sentiment`, `eazybe_total_messages`, `hs_whatsapp_phone_number`, `disparo__mensagem`

**Pagamento via Guru (62 props):**
`guru__cupom____valor`, `guru__pagamento____qtd_parcelas`, `guru__pix____url_qrcode`, `guru__status`, `guru_boleto_linha_digitavel`, `guru_boleto_url`, `guru_checkout_url`, `guru_contato_*` (10 props), `guru_cupom_codigo`, `guru_data_*` (5 props), `guru_fatura_url`, `guru_marketplace_*` (3 props), `guru_oferta_nome`, `guru_pagamento_*` (4 props), `guru_pix_codigo_de_pagamento`, `guru_produto_*` (4 props), `guru_tipo`, `guru_utm_*` (4 props), `guru_valor_liquido`, `guru_valor_manual_final`, `produto_no_guru`, `nome_do_produto_guru`

**Outros:**
`address`, `city`, `state`, `country`, `zip`, `dia_da_semana`, `horario_de_entrada`, `etapa_hubspot_callsys`, `estagio_da_mentoria`, `lead_ad_prop_possvel_incluir_o_ceo_na_reunio`, `link_de_contrato`, `nome_do_cliente`, `produto_servico`, `qual_o_seu_email`, `qual__o_seu_primeiro_nome`, `tags_de_interesse`, `tempo_acumulado_novo`, `plataforma`, `data_em_que_entrou_em_novo`, `feedback_da_qualificacao`, `numero_emergencia`

### Companies — empresa cliente

**Identificação:**
`name`, `domain`, `cnpj`, `razao_social`, `description`, `industry`, `segmento_da_empresa__aberto_`, `founded_year`, `is_public`, `numberofemployees`

**Contato CEO:**
`ceo_da_empresa`, `e_mail_do_ceo`, `numero_do_ceo`

**Financeiro:**
`faturamento_anual`, `faturamento_anual_dolar`, `faturamento_mentoria`, `nivel_de_lucratividade`, `ticket_medio`, `total_money_raised`, `total_revenue`

**Operação comercial:**
`canal_de_aquisicao`, `desafio_de_crescimento`, `desafio_de_preco`, `descricao_da_jornada_de_aquisicao`, `gargalo_de_marketing`, `modelo_de_negocio`, `perfil_do_cliente_icp`, `prioridade_estrategica`, `produto_servico_que_oferece`, `qualidade_das_oportunidades`, `quantos_colaboradores_seu_time_comercial_possui_menu`, `taxa_de_comparecimento`, `taxa_de_contato`, `taxa_de_conversao`, `volume_de_mqlssqls`

**Social:**
`facebook_company_page`, `linkedin_company_page`, `instagram_empresa`, `twitterhandle`, `web_technologies`, `website`

### Deals — negócios

**Identificação:**
`dealname`, `pipeline`, `dealstage`, `amount`, `closedate`, `nome_da_empresa`, `nome_do_contato`, `cargo_do_contato`, `e_mail_do_contato`, `e_endereco`, `e_modelo_de_negocio`, `e_razao_social`, `e_setor`, `cnpj`

**Sócio principal e participantes vinculados (até 2):**
`c_cpf___socio_principal`, `c_e_mail`, `c_endereco_pessoal`, `c_estado_civil`, `c_nacionalidade`, `c_profissao`, `data_de_nascimento__socio_principal`, `cpf___participante_vinculado__01`, `cpf___participante_vinculado__02`, `data_de_nascimento__participante_vinculado_01`, `e_mail___participante_vinculado__01_`, `e_mail___participante_vinculado__02_`, `endereco_pessoal___participante_vinculado__01_`, `endereco_pessoal___participante_vinculado__02_`, `estado_civil___participante_vinculado__01_`, `estado_civil___participante_vinculado__02_`, `nacionalidade___participante_vinculado__01_`, `nacionalidade___participante_vinculado__02_`, `nome_completo___participante_vinculado__01_`, `nome_completo___participante_vinculado__02_`, `numero_de_telefone___participante_vinculado__01_`, `numero_de_telefone___participante_vinculado__02_`, `profissao___participante_vinculado__01_`, `profissao___participante_vinculado__02_`, `rg___participante_vinculado__01`, `rg___participante_vinculado__02`

**Pagamentos (até 2 ciclos):**
`forma_de_pagamento`, `forma_de_pagamento_pg02_`, `forma_de_pagamento_texto_livre`, `tipo_de_pagamento`, `tipo_de_pagamento__pg02_`, `data_de_pagamento__01_`, `data_de_pagamento__02_`, `data_primeiro_pagamento`, `parcelas__pg01_`, `parcelas__pg02_`, `valor_total__parcelas__01`, `valor_total__pg01_`, `valor_total__pg02_`, `valor_total_das_parcelas__02_`, `vencimento_do_cheque`, `vencimento_do_cheque__02_`, `status_de_pagamento`, `status_de_pagamento__02_`, `comprovante_de_pagamento_arq`, `comprovante_de_pagamento__02_`, `tipo_de_contratacao`

**Contrato:**
`contrato_assinado___arquivo`, `data_assinatura_contrato`, `status_do_contrato`

**Evento (Prime Experience / palestras):**
`data__prime_experience`, `data_do_evento_presencial`, `evento`, `evento_palestra`, `tema`, `tipo_de_palestra`, `localizacao`, `dia_`, `participacao_do_ceo`, `qunatidade_de_socios`, `socios`, `treinamento`

**Bonus / Mentoria:**
`bonus_texto_livre`, `bonus_totais`, `complementar`, `lista_de_bonus`, `objetivo_principal`, `produto`, `produto_servico`, `consciencia_de_preco`, `quantidade`, `desafio2`, `tamanho_do_time_comercial`, `qualidade_da_reuniao`, `resultado_da_reuniao`, `temperatura_do_negocio`, `situacao_do_negocio`, `nova_venda`, `lancado_marvee`, `joint`, `ingresso`, `bdr`, `recomendador`, `origem_do_negocio`, `closed_lost_reason`, `closed_won_reason`, `motivo_do_cancelamento`, `justificativa_da_perda`

**Eazybe (WhatsApp):**
`eazybe_deal_status`, `eazybe_last_wa_date`, `eazybe_wa_unreplied`

**Guru (pagamento):**
`guru__contato____nome`, `guru__marketplace____id_da_venda`, `guru_oferta_nome`, `guru_produto_nome`, `guru_valor_manual_final`, `guru_valor_produto_2`, `guru_valor_total`

### Calls — chamadas

Praticamente todas `hs_*` (default). Custom: nenhuma significativa identificada.
Atenção: `relevant/calls/transcripts/raw/*.json` tem **transcrições completas** — são dados sensíveis e dinâmicos.

### Meetings, Tickets, Leads

Maioria `hs_*`. Customs notáveis:
- **Tickets:** `comprovante_de_pagamento__01_/02_`, `contrato`, `data_pagamento_vencimento__01_/02_/03_`, `forma_de_pagamento__01_/02/03_`, `fonte_do_ticket___origem_do_negocio`
- **Leads:** `c_closer`, `c_desafio`, `cargo_do_contato`, `classificacao_do_lead`, `data_retorno_futuro`, `descricao_da_dordesafio`, `e_empresa`, `e_faturamento`, `e_modelo_de_negocio`, `e_produto_servico`, `e_setor`, `e_site`

## Convenções observadas

1. **Snake_case com tracinhos artificiais:** muitas props têm `__` ou trailing `_` (ex: `cargo_na_empresa_2_`, `data_de_pagamento__01_`). Isso vem do HubSpot — não corrigir, é o ID interno.
2. **Numeração de versões:** props como `cpf2026` indicam ciclos anuais — provável que `cpf` (sem ano) seja legado.
3. **Sufixos `__01_`, `__02_`:** indicam até 2 instâncias do mesmo dado (pagamento 01/02, participante 01/02).
4. **`e_*` em deals/leads:** prefixo "e_" significa "Empresa" (ex: `e_setor`, `e_modelo_de_negocio`).
5. **`c_*` em deals:** prefixo "c_" para "Cliente/Sócio principal" (ex: `c_cpf___socio_principal`).
6. **Integrações externas com prefixo:** `guru_*` (gateway de pagamento Guru), `eazybe_*` (WhatsApp via Eazybe).

## Validação ALLOWED_* (R10)

Per ADR-008 e R10: **toda propriedade dropdown do HubSpot exige validação contra arrays `ALLOWED_JOBS`, `ALLOWED_HUBSPOT_OPTIONS`** antes do envio. Texto livre causa `INVALID_OPTION` e aborta o pacote inteiro.

Propriedades dropdown identificáveis pelo nome (suspeitas — confirmar no HubSpot Dashboard antes de enviar):
- `cargo_na_empresa_2_`
- `dealstage`, `pipeline`
- `lifecyclestage`
- `forma_de_pagamento`, `forma_de_pagamento_pg02_`, `tipo_de_pagamento`, `tipo_de_pagamento__pg02_`
- `status_de_pagamento`, `status_de_pagamento__02_`
- `industry`, `hs_industry_group`
- `qual_o_segmento_da_empresa`, `qual_o_segmento_da_sua_empresa`, `segmento_da_empresa__aberto_`
- `closer`, `sdr`, `socio`
- `tipo_de_palestra`, `evento_palestra`
- `closed_lost_reason`, `closed_won_reason`, `motivo_do_cancelamento`
- `temperatura_do_negocio`, `situacao_do_negocio`
- `nivel_de_lucratividade`, `prioridade_estrategica`
- `genero`, `estado_civil`, `nacionalidade`
- `tamanho_calcado`, `tamanho_de_roupa`, `restricao_alimentar`

## Onde isto é usado no código

- `services/profileService.ts` — leitura/escrita de contacts via Edge Function `update-hubspot-contact`
- `services/hubspotService.ts` (se existir) — wrapper genérico
- `supabase/functions/sync-hubspot/index.ts` — sync bidirecional contacts + companies
- `supabase/functions/sync-hubspot-birthdays/index.ts` — sync de aniversários
- `supabase/functions/hubspot-webhook/index.ts` — webhook recebendo updates
- ~~`sync-hubspot-amounts`~~ e ~~`sync-shadow-profiles`~~ — removidas 2026-05-11 (zero invocações em 30 dias, ver `docs/EDGE_FUNCTIONS_AUDIT.md`)
- `services/adminBirthdayService.ts:136` — invoke `sync-hubspot-birthdays`
- `hooks/useProfileForm.ts:190,206` — invoke `sync-hubspot` e `update-hubspot-contact`

## Re-extrair os schemas

O snapshot atual é de 2026-05-07. Para atualizar:
- Comando do script de extração não está documentado no repo (verificar pasta `scripts/` ou `Engage + HubSpot/` no nível pai)
- Alternativa: usar a HubSpot API direto com `https://api.hubapi.com/crm/v3/properties/{objectType}` para listar propriedades atualizadas
