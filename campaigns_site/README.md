# Campanhas (Site Estático)

Site de campanhas simples (SPA) feito com HTML, CSS e JavaScript puro. Persiste os dados no `localStorage` do navegador.

## Recursos
- Listagem com busca e filtro por status
- Criação, edição, visualização e exclusão de campanhas
- KPI de resumo e progresso por campanha
- Persistência local (sem servidor)

## Como rodar
Qualquer servidor estático funciona. Exemplos:

### Python 3
```bash
python3 -m http.server 8080 -d /workspace/campaigns_site
```
Acesse: `http://localhost:8080`

### Node (serve)
```bash
npx --yes serve /workspace/campaigns_site -l 8080
```

Ou simplesmente abra o arquivo `index.html` no navegador (alguns recursos podem ser limitados dependendo do navegador).