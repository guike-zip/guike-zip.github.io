# Feature Specification: Formulário único de beta no hub

**Feature Branch**: `001-formulario-beta-unico`

**Created**: 2026-10-17

**Status**: Implementada

**Handoff**: Fase 1 implementada em `index.html` (D1 a D6 aprovadas em 2026-10-17); Forms central criado e `REAL` preenchido no script do `#beta` (conferido em 2026-10-23)

**Input**: pedido do dono em 2026-10-17: centralizar num único formulário do site a captação de leads para os testes beta dos apps, aproveitando o que já existe nos projetos. Levantamento feito com o graphify nos grafos de `lashflow`, `movase`, `blindado` e `iaura`, confirmado lendo os arquivos citados.

## O que já existe hoje (achados do levantamento)

| Projeto | Como capta beta hoje | Onde está | Destino do lead |
|---|---|---|---|
| LashFlow | Google Forms "LashFlow — Beta" enviado pelo próprio site (`POST` no `formResponse`), com e-mail, plataforma e consentimento; depois mostra o link do TestFlight | `lashflow/site/src/config/beta.ts`, `site/src/app/baixar/page.tsx`, componente `BetaForm` | Planilha do Forms no Drive do dono, guarda por 90 dias |
| Movase | Android: "Entrar com o Google" na página, que cadastra o e-mail num Google Group da lista de testadores da Play (`POST /api/android/testers`). Mecanismo temporário, só enquanto o Android estiver em teste fechado | `movase/specs/187-site-landing-blog/contracts/android-tester-enrollment.md` | Google Group; nada no Supabase |
| Blindado | Pessoa comenta "BETA" num post do Instagram; o dono lista os comentários (`listar_interessados.py`) e manda o link do TestFlight por DM manual | `blindado/scripts/instagram/README.md` | `marketing/leads.csv` local, fora do git |
| IAURA | Nenhum formulário de beta: os dois apps estão em produção | — | — |
| Estacione Fácil | Nenhum formulário: iOS build 3 e Android em teste interno na Play, sem link público | — | — |

No hub (`index.html`) os links de beta apontam direto para o TestFlight do Blindado e do LashFlow, sem captar nada. Quem entra não deixa contato.

## Decisão de arquitetura (proposta)

O hub é estático (GitHub Pages), sem servidor. Então o formulário único **reaproveita o padrão que já funciona no LashFlow**: um Google Forms novo e central, enviado por `fetch` com `mode: "no-cors"` para a URL `formResponse`, com link de reserva para `viewform` quando o JavaScript falhar. Todas as respostas caem numa planilha só, com a coluna **app**. Não entra servidor, banco nem chave de API.

Motivos: custo zero, o dono já opera esse fluxo, e o LashFlow já passou pela revisão de texto de privacidade com o advogado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pedir acesso ao beta de um app (Priority: P1)

A pessoa chega ao hub, toca em "Entrar no beta" no cartão de um app (ou na seção do formulário), escolhe o app, a plataforma, informa o e-mail, aceita o uso do e-mail e envia.

**Why this priority**: sem isso não existe lead nem lista de testadores. É o motivo da feature.

**Independent Test**: abrir o hub, enviar o formulário com um e-mail de teste e ver a linha nova na planilha com app, plataforma, e-mail, consentimento e data.

**Acceptance Scenarios**:

1. **Given** o hub aberto, **When** a pessoa toca "Entrar no beta" no cartão do Blindado, **Then** a página rola até o formulário com o app Blindado já marcado.
2. **Given** o formulário preenchido e válido, **When** ela envia, **Then** vê a confirmação na própria página e a linha chega na planilha.
3. **Given** iPhone escolhido num app com TestFlight público, **When** o envio termina, **Then** a confirmação mostra o botão do TestFlight daquele app.
4. **Given** Android escolhido, **When** o envio termina, **Then** a confirmação diz que o convite chega por e-mail em até alguns dias e não mostra link que ainda não existe.
5. **Given** o consentimento desmarcado ou e-mail inválido, **When** ela tenta enviar, **Then** o envio é bloqueado com a mensagem no campo, sem chamar o Forms.

---

### User Story 2 - Escolher mais de um app de uma vez (Priority: P2)

A pessoa marca dois ou mais apps no mesmo envio.

**Why this priority**: evita repetir o formulário, mas o beta funciona sem isso.

**Independent Test**: marcar Blindado e LashFlow, enviar e ver **uma linha por app** na planilha.

**Acceptance Scenarios**:

1. **Given** dois apps marcados, **When** envia, **Then** o site faz um envio por app e a confirmação lista os dois, cada um com o seu passo seguinte.

---

### User Story 3 - O dono lê os leads sem tratar nada à mão (Priority: P2)

O dono abre a planilha, filtra por app e plataforma e vê quem pediu, quando e com qual consentimento. Pode apagar tudo depois do prazo de guarda.

**Why this priority**: o dono não quer conversar com ninguém (restrição de 2026-10-09). O fluxo tem que ser só planilha e convite.

**Independent Test**: filtrar a planilha por "Android + Estacione Fácil" e obter a lista de e-mails para colar na lista de testadores da Play.

**Acceptance Scenarios**:

1. **Given** respostas de vários apps, **When** o dono filtra por app, **Then** vê só os leads daquele app, com carimbo de data.
2. **Given** uma pessoa pedindo exclusão por e-mail, **When** o dono apaga a linha, **Then** nenhum outro lugar do site guarda o dado.

---

### User Story 4 - Link direto de outros canais (Priority: P3)

Posts do Instagram e os sites dos apps apontam para `…github.io/?app=blindado#beta` e o formulário abre já no app certo.

**Why this priority**: troca o "comente BETA" do Blindado por um link que capta o e-mail sozinho, mas é um ganho depois do formulário existir.

**Independent Test**: abrir `?app=lashflow#beta` e ver LashFlow marcado.

**Acceptance Scenarios**:

1. **Given** `?app=` com um app válido e aberto, **When** a página carrega, **Then** só esse app vem marcado.
2. **Given** `?app=` desconhecido ou fechado, **When** a página carrega, **Then** nenhum app vem marcado e não aparece erro.

### Edge Cases

- App com beta **fechado** (por exemplo Movase hoje): aparece na lista como "beta fechado" e não dá para marcar.
- O Forms fora do ar ou bloqueado por extensão: o `fetch` em `no-cors` não devolve erro útil. A confirmação sempre mostra também o link `viewform` como "se não chegou, envie por aqui".
- Envio duplicado do mesmo e-mail e app: aceito (o Forms não deduplica); o dono deduplica na planilha. Botão desativa depois do toque para evitar clique duplo.
- Navegador embutido do Instagram: o hub já tira o visitante de lá; o formulário não pode depender disso.
- `prefers-reduced-motion` e teclado: o formulário não depende de animação nem de mouse.
- Robôs: Google Forms não tem captcha. Defesa mínima por campo isca (honeypot) e tempo mínimo de preenchimento; limite real é o do próprio Google.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O hub MUST ter uma seção `#beta` com **um único** formulário para todos os apps em teste.
- **FR-002**: O formulário MUST pedir: app (um ou mais), plataforma (iPhone ou Android), e-mail e consentimento. Nenhum outro dado pessoal (sem nome, sem telefone).
- **FR-003**: Para Android o e-mail MUST ser o da conta Google usada na Play, e o campo MUST dizer isso.
- **FR-004**: A lista de apps e o estado de cada um (aberto ou fechado, link do TestFlight, link de opt-in da Play) MUST ficar num único objeto de configuração, no padrão de `beta.ts` do LashFlow. Adicionar ou fechar um app é editar só esse objeto.
- **FR-005**: O envio MUST ir para o Google Forms central por `POST` em `formResponse` (um por app marcado) e MUST ter o link `viewform` como alternativa sem JavaScript.
- **FR-006**: A configuração MUST impedir publicar com valor faltando: se o beta estiver aberto e algum campo obrigatório da configuração for nulo, o formulário não é exibido (e um teste local acusa), como o `assertBetaConfig` do LashFlow.
- **FR-007**: Os cartões do hub que hoje têm "Beta iPhone" direto no TestFlight (Blindado, LashFlow) MUST passar a ter "Entrar no beta", que leva ao formulário já com o app marcado. O link do TestFlight só aparece depois do envio.
- **FR-008**: O formulário MUST aceitar `?app=<id>` para pré-seleção (User Story 4).
- **FR-009**: A seção MUST trazer o aviso de privacidade em linguagem simples: o que é guardado (e-mail, app, plataforma, data), para quê (convite ao beta), por quanto tempo (90 dias após o fim do beta daquele app), quem é o controlador e o e-mail do titular (`guilherme.avieiras@gmail.com`).
- **FR-010**: O consentimento MUST ser uma caixa não marcada por padrão, com o texto exato repetido como opção no Forms.
- **FR-011**: O formulário MUST funcionar a 375 px, ter rótulos ligados aos campos, foco visível e mensagens de erro lidas por leitor de tela, com contraste AA.
- **FR-012**: Os formulários e canais que já existem MUST continuar funcionando até a migração de cada um (ver Fases). Nada do LashFlow, Movase ou Blindado é desligado por esta spec.

### Key Entities

- **App em beta**: id, nome, plataformas com beta aberto, link público do TestFlight (opcional), link de opt-in da Play (opcional), aberto ou fechado.
- **Pedido de beta**: app, plataforma, e-mail, consentimento, carimbo de data (do Forms). Uma linha por app.

## Fases propostas

1. **Fase 1 (esta spec, P1 a P3)**: Forms central, seção `#beta` no hub, cartões apontando para ela, aviso de privacidade.
2. **Fase 2 (fora desta spec)**: LashFlow `/baixar` passa a levar ao hub com `?app=lashflow` e o Forms antigo é arquivado depois de exportar a planilha. Posts do Blindado trocam "comente BETA" pelo link com `?app=blindado`. É mudança em outros repositórios, com spec própria em cada um.
3. **Fase 3 (opcional)**: automatizar o cadastro de testadores Android num Google Group por Apps Script, no mesmo desenho do Movase (spec 187), para que o convite da Play saia sem trabalho manual.

## Decisões para o dono

- **D1 — Onde guardar**: (a) Google Forms novo e central (recomendado: padrão já usado e aprovado no LashFlow, custo zero); (b) reaproveitar o Forms do LashFlow adicionando a pergunta "app" (mistura os leads e mexe no que já está no ar); (c) serviço de terceiros de formulários (mais um fornecedor e mais uma política de privacidade).
- **D2 — Apps na primeira versão**: recomendado **Blindado, LashFlow e Estacione Fácil** abertos; **Movase** e **IAURA** aparecem como "em produção, baixe nas lojas" e não entram na lista.
- **D3 — Android**: convite manual a partir da planilha (recomendado para começar) ou automação por Google Group na Fase 3.
- **D4 — Prazo de guarda e texto de privacidade**: manter os 90 dias do LashFlow e o mesmo texto aprovado pelo advogado, adaptado a vários apps. Se o texto mudar além disso, pedir nova aprovação.
- **D5 — Criação do Forms**: a conta e o Forms são do dono. O Forms é criado no navegador com a conta dele e o dono confirma antes de eu ligar o envio. Eu não crio conta nem credenciais por ele.
- **D6 — Chamada para ação no hub**: botão "Entrar no beta" em cada cartão elegível, mais um bloco `#beta` entre os projetos e "Eu construo pra você".

## Success Criteria *(mandatory)*

- **SC-001**: Em 100% dos testes, um envio válido gera exatamente uma linha por app marcado na planilha, com os 4 campos preenchidos.
- **SC-002**: Nenhum cartão do hub leva ao TestFlight sem passar pelo formulário.
- **SC-003**: O formulário passa em largura de 375 px sem rolagem horizontal e navega inteiro por teclado.
- **SC-004**: Com a configuração incompleta, a seção não aparece e o teste local acusa o que falta; o hub não quebra.
- **SC-005**: O dono extrai a lista de e-mails Android de um app em até dois cliques de filtro na planilha.
- **SC-006**: Medida depois de 30 dias: leads por app por semana, lidos da planilha. A decisão de manter, mudar ou fechar cada beta usa esse número.

## Assumptions

- O dono topa criar o Forms central (D5) e usar a mesma conta Google do Forms do LashFlow.
- O link público do TestFlight do Estacione Fácil ainda não existe. Sem ele, o iPhone desse app mostra "o convite chega por e-mail" como o Android.
- A Play exige e-mail de conta Google na lista de testadores, por isso FR-003.
- Esta spec não importa leads antigos: o CSV do Blindado fica fora do git porque tem @ de pessoas reais, e continua assim.
- Este repositório é público e o GitHub Pages serve tudo o que está nele. Esta pasta `specs/` só deve ser commitada se o dono aceitar que ela fique pública, ou depois de excluída da publicação.
