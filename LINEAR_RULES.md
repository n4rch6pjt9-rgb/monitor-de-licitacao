# Boas práticas para agentes de IDE no Linear

Este guia define como agentes de IDE devem criar, atualizar e encerrar issues no Linear. A meta é manter o trabalho rastreável, acionável e fácil de revisar.

## Princípios

* Trate cada issue como uma unidade de trabalho com um resultado claro.
* Não crie issues duplicadas. Antes de abrir uma nova, procure por trabalho relacionado ou já existente.
* Não invente contexto, responsável, prioridade, prazo, estimativa, projeto, ciclo ou rótulos. Preencha apenas informações confirmadas.
* Respeite o fluxo e os status configurados para o time da issue.
* Prefira atualizar a issue existente a abrir outra para o mesmo problema.

## Criação de issues

Toda issue deve pertencer a um time e ter **título** e **status**. Use o template do time quando houver um adequado.

### Título

* Escreva um título curto, específico e orientado à ação ou ao resultado.
* Comece com um verbo quando fizer sentido: `Corrigir`, `Adicionar`, `Investigar`, `Atualizar`, `Remover`.
* Evite títulos genéricos como `Bug`, `Ajustes`, `Melhorias` ou `Resolver problema`.
* Não coloque detalhes de implementação, histórico ou múltiplos objetivos no título.

### Descrição

Inclua somente o contexto necessário para que outra pessoa consiga entender e executar o trabalho:

* **Contexto / problema:** o que acontece e por que importa.
* **Resultado esperado:** comportamento, entrega ou decisão desejada.
* **Escopo:** o que está incluído e, quando útil, o que não está.
* **Critérios de aceite:** condições verificáveis para considerar o trabalho concluído.
* **Referências:** links, evidências, issues relacionadas, pull requests, decisões ou reproduções relevantes.

Para bugs, registre passos de reprodução, comportamento atual, comportamento esperado e ambiente/versão quando conhecidos.

### Campos e organização

* Defina a prioridade apenas quando ela estiver explicitamente indicada ou puder ser determinada por uma convenção conhecida do time.
* Atribua uma pessoa apenas quando houver uma responsável definida. Não assuma que o criador ou o agente é o responsável.
* Vincule a issue a um projeto, ciclo ou marco somente quando houver relação confirmada.
* Aplique rótulos existentes de forma consistente; não use rótulos para substituir uma boa descrição.
* Use sub-issues quando o trabalho puder ser dividido em entregas independentes e acompanháveis.
* Use uma estimativa somente quando o time a utilizar e houver informação suficiente.

## Atualizações durante a execução

* Mude para um status de trabalho ativo ao iniciar a implementação, conforme o fluxo do time.
* Publique uma nota quando houver mudança relevante de escopo, decisão técnica, risco, bloqueio, descoberta ou entrega parcial.
* Mantenha as notas objetivas: **o que mudou**, **impacto**, **próximo passo** e **bloqueio**, se existir.
* Não registre atualizações triviais, repetitivas ou sem impacto.
* Quando houver bloqueio por outra issue, registre a dependência como relação de bloqueio; não deixe o bloqueio apenas no texto.
* Quando a dependência for resolvida, confirme se a relação continua necessária e atualize o status conforme o fluxo.

### Modelo de nota de progresso

```md
**Progresso:** <o que foi concluído ou descoberto>

**Impacto:** <efeito no escopo, qualidade ou prazo, se houver>

**Próximo passo:** <ação objetiva seguinte>

**Bloqueio:** <issue, decisão ou informação necessária — omitir se não houver>
```

## Encerramento

Feche uma issue somente quando os critérios de aceite estiverem atendidos ou quando houver um motivo explícito para não prosseguir.

Antes de marcar como concluída:

* Confirme que a implementação ou a decisão final foi entregue.
* Verifique que os testes, validações ou evidências aplicáveis foram executados.
* Atualize ou vincule referências relevantes, como pull request, documentação e issues dependentes.
* Adicione uma nota final curta que permita entender o resultado sem reabrir todo o histórico.
* Mova a issue para o status de conclusão configurado pelo time.

### Modelo de nota de encerramento

```md
**Resultado:** <o que foi entregue, corrigido ou decidido>

**Validação:** <testes, revisão, evidência ou verificação realizada>

**Referências:** <links relevantes, se houver>

**Pendências:** <trabalho restante em issues separadas — omitir se não houver>
```

## Casos especiais

* **Duplicada:** marque como duplicada da issue canônica em vez de encerrar manualmente como concluída. O Linear move a duplicada para o status reservado de duplicidade.
* **Cancelada / não será feita:** use o status de cancelamento configurado e deixe uma nota com o motivo e a decisão tomada.
* **Não reproduzível:** registre o que foi tentado, ambiente e evidências antes de usar o status correspondente, quando existir.
* **Em revisão ou aguardando merge:** não trate como concluída até que o fluxo do time determine o encerramento.
* **Novo trabalho descoberto:** crie uma nova issue relacionada em vez de ampliar silenciosamente o escopo da issue atual.

## Checklist operacional

### Antes de criar

- [ ] Não há issue existente ou duplicada.
- [ ] O time correto foi identificado.
- [ ] O título descreve um único resultado.
- [ ] A descrição contém contexto e critério de aceite suficientes.
- [ ] Campos, rótulos e relações foram preenchidos apenas quando confirmados.

### Antes de encerrar

- [ ] Os critérios de aceite foram cumpridos ou o motivo de cancelamento foi documentado.
- [ ] As dependências e referências estão atualizadas.
- [ ] Uma nota final registra resultado e validação.
- [ ] O status final corresponde ao fluxo do time.

## Referências oficiais

* [Criar issues](https://linear.app/docs/creating-issues)
* [Status de issues](https://linear.app/docs/configuring-workflows)
* [Relações entre issues](https://linear.app/docs/issue-relations)
* [Templates de issues](https://linear.app/docs/issue-templates)
