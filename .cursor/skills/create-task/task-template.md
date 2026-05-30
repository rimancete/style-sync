# Task Template (Portuguese body, English heading)

Raw template used by the [create-task](SKILL.md) skill. The agent fills it based on codebase analysis and developer input. Heading stays in English to match the GitHub Issue title; body is in Portuguese.

---

```markdown
### {PREFIX-NNN}: {Title}

## 🧩 Descrição

Descreva claramente o problema, solicitação ou comportamento observado.
Inclua contexto suficiente para entendimento completo da situação,
ancorado no que foi encontrado na análise do código (cite arquivos / módulos relevantes).

## 🎯 Objetivos

- Objetivo 1
- Objetivo 2

## 📐 Regras de Negócio

- Regra 1 (ex: pacientes inativos não devem aparecer nas listas)
- Regra 2 (ex: total deve bater com a soma das parcelas)
- Regra 3 (ex: status Y só pode ser atribuído após Z)

## ✅ Requisitos Funcionais

### Front-end
- Requisito 1
- Requisito 2

### Back-end
- Requisito 1
- Requisito 2

### Outros
- Requisito 1

## ✅ Requisitos Não Funcionais

- Performance: ex. manter tempo de resposta abaixo de X ms
- Segurança: ex. validar permissões antes de executar a ação
- Manutenibilidade: ex. não impactar a geração de relatórios
- Usabilidade: ex. feedback visual claro para o usuário
- Observabilidade: ex. logar eventos críticos com correlação

## 🧪 Critérios de Aceitação

- [ ] Dado que <contexto>, quando <ação>, então <resultado esperado>.
- [ ] Dado que <contexto>, quando <ação>, então <resultado esperado>.
- [ ] Dado que <contexto>, quando <ação>, então <resultado esperado>.
```

---

## Section Guidelines

| Section                   | When required          | Notes                                                                         |
| ------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| Descrição                 | Always                 | Anchored in current codebase behavior. Reference files / functions.           |
| Objetivos                 | Always                 | Derived from the developer's request. Specific, not generic.                  |
| Regras de Negócio         | Feature / Bug          | Extracted from existing validations, logic, business constraints.             |
| Requisitos Funcionais     | Feature / Bug          | Split by `Front-end` / `Back-end` / `Outros`. Omit empty subsections.         |
| Requisitos Não Funcionais | Feature / Refactor     | Performance, segurança, compatibilidade, observabilidade, manutenibilidade.   |
| Critérios de Aceitação    | Always                 | Checklist format (`- [ ]`) using `Dado / Quando / Então`. Cover edge cases.   |

The acceptance-criteria checklist doubles as the test-tracking list during implementation — items get checked off as the corresponding tests pass.
