# Roadmap

Estudo de sequenciamento das próximas tarefas do StyleSync, a partir do levantamento frontend vs backend (2026-08-15).

## 1. Como usar

Este documento é a **base de sequenciamento**. Não substitui a GitHub Issue: cada tarefa só entra em implementação depois que [create-task](../.cursor/skills/create-task/SKILL.md) criar a Issue `#N`. A Issue continua sendo a fonte de verdade do escopo, critérios de aceitação e branch.

Ao planejar uma nova tarefa:

1. Ler este roadmap para posição na fila, prefixo (`BUS` / `FFU` / `BFU` / `HOT`) e dependências.
2. Rodar `create-task` com o título em inglês e o corpo em português.
3. Implementar via `implement-client` ou `implement-server` passando `#N`.

Os arquivos em `tasks/client/` e `tasks/server/` são legado e não devem ser usados como referência.

_Última atualização: 2026-08-15._

## 2. Estado atual

O **backend está à frente do frontend**. O layout da tela de Login foi entregue na Issue [#6](https://github.com/rimancete/style-sync/issues/6), mas a autenticação nunca foi exercitada contra a API real: a camada de dados do client foi construída sobre um contrato fictício sustentado por MSW.

Pronto para consumo no NestJS:

- Login (`POST /api/auth/login`) e refresh (`POST /api/auth/refresh`)
- Registro salon-scoped (`POST /api/salon/:customerSlug/auth/register`) com fluxo `428` + `confirmLink`
- Branding público
- Catálogo (branches, services, professionals) protegido por JWT
- Availability pública com slots de 30 min derivados dos schedules, incluindo `isoTimestamp` timezone-aware
- Criação de booking (`PENDING` + `confirmationToken`)
- Confirmação e cancelamento por token (públicos)
- Listagem de "meus agendamentos"

## 3. Restrições do backend que condicionam a ordem

Estas limitações são o motivo do sequenciamento, não detalhes de implementação:

- **Não há envio de e-mail.** O `confirmationToken` só volta no corpo da resposta. Páginas de confirm/cancel por token existem no backend, mas o usuário não recebe o link por e-mail até uma issue `BFU` de notificação.
- **O catálogo exige JWT.** Não existe browse anônimo. O funil de booking vem depois do login, não antes.
- **Não existe endpoint de atualização de perfil.** A tela Profile não pode ser fechada agora.

## 4. Lacunas do frontend

Inventário que justifica cada item da sequência. A fundação de sessão (#11) cobre unwrap do envelope `{ data }`, base URL, `authStore` no contrato real, refresh em `401` e mocks atrás de flag — não se repete aqui.

| Área | Situação | Correto |
| --- | --- | --- |
| Registro | [`useRegister.ts:20`](../client/src/api/auth/useRegister.ts) aponta para `/api/auth/register`; [`:6`](../client/src/api/auth/useRegister.ts) envia `phoneNumber` | `/api/salon/:slug/auth/register`; campo `phone` |
| Registro UI | [`Register.tsx`](../client/src/screens/Register/Register.tsx) é HTML cru, strings hardcoded, sem React Hook Form nem Zod | Mesmo padrão da tela de Login (#6) |
| Branding | [`useGetTheme.ts:9`](../client/src/api/theme/useGetTheme.ts) aponta para `/api/theme`; `themeStore` não está ligado ao branding | `/api/customers/branding/:slug` |
| Catálogo | [`useGetBranches.ts:25`](../client/src/api/branches/useGetBranches.ts) → `/api/branches`; [`useGetServices.ts:20`](../client/src/api/services/useGetServices.ts) → `/api/services`; [`useGetProfessionals.ts:16`](../client/src/api/professionals/useGetProfessionals.ts) → `/api/professionals` | Endpoints salon-scoped `/api/salon/:slug/...` |
| Booking | [`bookingStore`](../client/src/store/bookingStore.ts) e [`useCreateBooking.ts:19`](../client/src/api/bookings/useCreateBooking.ts) (`/api/bookings`) existem | Funil de telas + `POST /api/salon/:slug/bookings` com `isoTimestamp` |

## 5. Sequência de tarefas

Ordem de execução. Cada linha vira uma Issue (ou mais de uma, quando o fatiamento estiver marcado) via `create-task`.

O épico [#10 Login flow](https://github.com/rimancete/style-sync/issues/10) cobre **somente** as duas primeiras partes. Os itens seguintes ficam fora dele.

| # | Prefixo | Título | Escopo | Depende de | GitHub |
| --- | --- | --- | --- | --- | --- |
| 1 | FFU | API and session foundation | Transporte (`request` + `errorTreatment`), sessão no contrato `AuthResponseDto`, refresh single-flight, toast/`notify`, mocks atrás de `VITE_ENABLE_MOCKS`, anonimização de docs/skills | — | [#11](https://github.com/rimancete/style-sync/issues/11) criada |
| 2 | BUS | Login API integration | Mensagens por status, redirect por role, guard de `/admin`, testes de tela, `docs/frontend/login-smooth-tests.md` | #11 | [#12](https://github.com/rimancete/style-sync/issues/12) criada |
| 3 | BUS | Register API integration | RHF + Zod, endpoint salon-scoped, fluxo `428` → diálogo de confirmação → `confirmLink: true` | #11 | ainda não criada |
| 4 | FFU | Tenant context & branding | Resolução do slug, rotas `/salon/:slug`, branding → CSS vars, document title e favicons | #11 | ainda não criada |
| 5 | BUS | Booking funnel | Branch → service → professional → availability → criar booking com `isoTimestamp`. Avaliar fatiar em duas Issues | #11, #12, tenant/branding | ainda não criada |
| 6 | BUS | Confirm/cancel by token | Páginas públicas de confirmação e cancelamento | Booking funnel; e-mail é `BFU` paralelo (o token já volta na resposta) | ainda não criada |
| 7 | BUS | My bookings | Listagem e cancelamento dos agendamentos do usuário | Booking funnel | ainda não criada |
| 8 | FFU | Test structure and docs | Herda `FFU-005`, `FFU-006`, `FFU-008` do backlog legado. Decidir entre Issue própria ou diluir em cada entrega | — | ainda não criada |

## 6. Lacunas de backend (`BFU`)

Sem Issue ainda. Cada uma vira tarefa quando a entrega de frontend que a exige entrar na fila.

| Prefixo | Título | Por que existe | Quando criar |
| --- | --- | --- | --- |
| BFU | Booking confirmation email | O `confirmationToken` só volta no body; o usuário não recebe o link | Antes ou junto de Confirm/cancel by token, se o fluxo depender de e-mail |
| BFU | Public catalog access | Catálogo exige JWT; não há browse anônimo | Só se o produto passar a exigir funil sem login |
| BFU | Profile update endpoint | Não há `PATCH` de nome/telefone/senha | Quando a tela Profile for priorizada |

## 7. Decisões transversais já tomadas

Não rediscutir a menos que o desenvolvedor peça:

- `role` (`CLIENT` \| `STAFF` \| `ADMIN`) é extraída do JWT no client (`jwt-decode`). Decode não valida assinatura e não substitui autorização no servidor.
- MSW e o curto-circuito de `mockData` ficam atrás de `VITE_ENABLE_MOCKS`, **desligados por padrão**. DEV integra com o backend real.
- Camada de dados: `request()` (transporte, `Response` cru) + `errorTreatment()` (envelope `{ data }`, `204` → `null`, erros com `status`/`errors`) + facades `useQuery`/`useMutation` + `notify` (toast). Refresh reativo com single-flight em `401`; logout só quando o refresh falha.
- Login usa `showError: false` — o feedback é o alerta inline (`LoginViewAlert`), não toast.
- Cada entrega de tela ganha um roteiro de validação manual em `docs/frontend/*-smooth-tests.md`, no precedente da Issue #6.
- Nenhum artefato do repositório (código, documentação, skills, regras, issues, PRs) cita projetos, organizações ou ferramentas internas privadas de terceiros usados como referência. A varredura da #11 deve incluir o vestígio em `tasks/client/backlog.md` (bloco de estrutura de pastas com nomes de assets da referência).

## 8. Convenções de execução

- Branch: `{N}-{slug}` a partir de `develop`. PR alvo: `develop`.
- Labels disponíveis: `feat`, `refactor`, `bug`, `documentation`, `backlog`, `inProgress`. Não existem labels `area/*`.
- Em épico, a PR filha usa **somente** `Closes #<parte>` e `Part of #<épico>`. Nunca `Closes` no épico — o bot `close-issue-on-develop-merge` fecha a Issue no merge em `develop` pela união do prefixo `{N}-` da branch e de todo `Closes`/`Fixes`/`Resolves` no corpo.
- Opt-out do bot: label `skip-issue-close-bot`.
- Título da Issue em inglês; corpo em português no [template](../.cursor/skills/create-task/task-template.md).
