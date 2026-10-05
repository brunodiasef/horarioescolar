# Criador de Horário Escolar

App web de página única para montar a grade de horário da escola, apontar choques
de professor e redistribuir a semana sem alterar a carga horária de ninguém.

**Abrir e instalar:** https://brunodiasef.github.io/horarioescolar/

Artifact publicado: https://claude.ai/artifact/GiHemdywNJovem3xtBtKQb

## Arquivos

```
index.html            o app inteiro (HTML + CSS + JS, sem dependências externas
                      além da fonte IBM Plex, carregada do Google Fonts)
dados/
  dados.js            os dados iniciais, carregados por <script>. É o que o app lê
                      na primeira abertura; depois passa a usar o localStorage
  professores.json    29 professores: nome, área, disciplina, dia de planejamento
  disciplinas.json    20 disciplinas: nome, área, aulas por semana
  turmas.json         14 turmas, na ordem em que aparecem na grade
  grade.json          a grade: um registro por turma, com as células preenchidas
  conjuntas.json      aulas conjuntas (várias turmas com o mesmo professor, de propósito)
  config.json         regras de área e formato da semana
  tudo.json           tudo acima num arquivo só
manifest.webmanifest  nome, cores e ícones do app instalado (PWA)
sw.js                 service worker: guarda o app em cache para abrir sem internet
icones/               ícones do app (gerados por ferramentas/gerar-icones.js)
ferramentas/
  gerar-icones.js     recria os PNGs de icones/  (node ferramentas/gerar-icones.js)
  servidor.js         servidor local para testar o PWA (node ferramentas/servidor.js)
```

## Como rodar

**Pela internet (recomendado):** abra https://brunodiasef.github.io/horarioescolar/
e instale como aplicativo:

- **Computador (Chrome ou Edge):** botão **Instalar app** na aba Grade, ou o ícone
  de instalar na barra de endereço.
- **Android (Chrome):** menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.
- **iPhone/iPad (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

Depois de aberto uma vez, o app funciona sem internet.

**Direto do arquivo:** dê duplo clique no `index.html`. Funciona igual, só não
pode ser instalado nem tem cache offline (isso exige o endereço http). Para testar
o PWA localmente: `node ferramentas/servidor.js` e abra http://localhost:5173.

## Publicar uma versão nova

O site é servido pelo GitHub Pages a partir da branch `main`. Faça commit e push;
em um ou dois minutos o site atualiza. Ao mudar arquivos do app, aumente `VERSAO`
em `sw.js` para os aparelhos trocarem o cache antigo.

## Como os dados são guardados

Na primeira abertura o app lê `dados/dados.js` e copia tudo para o
**localStorage** do navegador. Dali em diante, cada alteração é gravada ali, e
`dados/dados.js` não é mais lido.

Isso significa que os dados ficam **nesse navegador, nesse aparelho**: o app
instalado no celular e o do computador têm cada um a sua cópia. Não
acompanham o arquivo se você copiar a pasta para outra máquina, e somem se você
limpar os dados do site. Em janela anônima nada é guardado, e o app avisa.

Três botões na aba Grade cuidam disso:

- **Baixar backup** — salva o estado atual num `.json`.
- **Importar backup** — carrega um `.json` baixado, substituindo o que está no
  aparelho. É como se levam os dados de um aparelho para outro.
- **Restaurar originais** — descarta o que está no navegador e volta ao conteúdo
  de `dados/dados.js`.

Para deixar um estado novo como padrão da pasta, baixe o backup e substitua o
conteúdo de `window.DADOS_INICIAIS` em `dados/dados.js` por ele.

Os arquivos `.json` em `dados/` são os mesmos dados, para uso por outras
ferramentas. O app não os lê.

## Diferenças para a versão publicada

Esta é a versão local. A publicada como Artifact
(https://claude.ai/artifact/GiHemdywNJovem3xtBtKQb) guarda os dados no banco do
artifact, via `claude.use('db')`, e por isso é compartilhável e funciona em
qualquer aparelho. As duas têm a mesma tela e as mesmas regras; muda só onde os
dados ficam. Editar uma não altera a outra.

## Formato da grade

Cada registro de `grade.json` é uma turma:

```json
{ "id": "t7a", "celulas": { "0-0": "DARLENE PROT", "1-1": "BRUNO", ... } }
```

A chave é `dia-horário`, ambos começando em zero: `"2-6"` é quarta-feira,
7º horário. Dias: 0 segunda, 1 terça, 2 quarta, 3 quinta, 4 sexta.
Sete horários por dia. Célula ausente quer dizer horário vazio.

O valor é texto livre. `ELETIVA` e `PLANEJAMENTO COLETIVO` são tratados como
fixos. `"Nathan/ Rubens"` e `"Nathan e.o Cleidimar"` significam substituição:
quem conta é o nome **depois** da barra, porque o Nathan está de atestado.
`quemOcupa()` em `index.html` faz essa leitura.

## Regras que o app aplica

- **Choque**: o mesmo professor em duas turmas no mesmo dia e horário.
- **Aula conjunta**: um choque marcado como intencional (o Clube do Protagonismo
  da Carla, quarta, 7º horário, com os três 9º anos). Não conta como erro e fica
  travado no preenchimento automático.
- **Dia bloqueado**: cada área tem um dia sem aula — Linguagens não dá aula na
  quinta, Humanas não dá na terça, Matemática e Ciências da Natureza não dá na
  quarta. Além disso, cada professor pode ter um dia de planejamento próprio
  (campo `planeja`), que bloqueia do mesmo jeito.
- **Preenchimento automático**: lê quantas aulas cada professor tem em cada turma,
  embaralha e reencaixa a semana sem choque e sem cair em dia bloqueado,
  mantendo a carga de cada professor em cada turma idêntica. Células fixas ficam
  onde estão. Roda com orçamento de 2,5 segundos e informa o que não coube.

## Estado dos dados

Áreas preenchidas até agora: Adilson, Adriana, Amanda, Ana Paula, Anselma,
Bruno — e as demais conforme forem sendo cadastradas. Quanto mais áreas
preenchidas, mais completa fica a conferência de dia bloqueado.

Disciplinas do técnico em Administração (3ª I 01 TEC ADM) ainda não foram
cadastradas: na grade elas aparecem só como sigla depois do nome do professor
(P. EMP, D. E.TRIB, C. BRAND., AD. F, E. COM, G.P., P.INV.).
