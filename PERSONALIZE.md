# 🌸 Guia de Personalização — Studio Bella

## Busca rápida: pesquise `PERSONALIZE:` em qualquer arquivo para encontrar todos os pontos de customização.

---

## 1. Nome do Salão
Troque **"Studio Bella"** pelo nome real em:
- `index.html` → `<title>`, `<h1 class="splash-logo">`, `.header-logo`, `.footer-logo`
- `manifest.json` → `"name"` e `"short_name"`

---

## 2. Número do WhatsApp
Arquivo: `js/agendamento.js`, linha 9:
```js
const WPP_NUMBER = '5511986075848';
```
Troque pelo número real (somente dígitos, com DDI: `55` + DDD + número).

Também troque nos links do `index.html`:
- `href="https://wa.me/5511986075848"` (FAB, botão contato, social links)

---

## 3. Preços dos Serviços
Em `index.html`, procure `card-price` nos 6 cards de serviços e troque os valores.
Os mesmos preços aparecem no modal — edite também `SERVICE_DATA` em `js/main.js`.

---

## 4. Fotos do Portfólio
Em `js/portfolio.js`, substitua os gradientes por fotos reais:
```js
// Antes:
{ id: 1, cat: 'cilios', label: 'Extensão Volume Russo', gradient: '...', tall: true },

// Depois:
{ id: 1, cat: 'cilios', label: 'Extensão Volume Russo', src: 'assets/portfolio/cilios-1.jpg', tall: true },
```
Crie a pasta `assets/portfolio/` e coloque as fotos lá.

---

## 5. Foto da Profissional
Em `index.html`, seção `#sobre`:
```html
<!-- Troque o div por: -->
<img src="assets/profissional.jpg" alt="Nome da Profissional" />
```

---

## 6. Bio e Dados da Profissional
Em `index.html`, seção `#sobre`:
- Nome da profissional em `<strong>Sabrina Bella</strong>`
- Texto da bio no `<p class="about-bio">`
- Números em `data-target="500"`, `data-target="3"`, `data-target="98"`
- Certificações nos itens `.cert-item`

---

## 7. Endereço e Horários
Em `index.html`, seção `#contato`:
- Endereço no card com ícone 📍
- Link do Google Maps: troque pela URL real do seu endereço
- Horários no card com ícone 🕐

---

## 8. Redes Sociais
Em `index.html`, troque os links:
- Instagram: `https://instagram.com/studiobella`
- TikTok: `https://tiktok.com/@studiobella`

---

## 9. Ícones PWA
Crie arquivos `assets/icon-192.png` e `assets/icon-512.png` com o logo do salão.
Use o `assets/icon.svg` como base — converta para PNG com qualquer editor.

---

## 10. Tagline do Salão
Em `index.html`:
- Splash: `<p class="splash-tagline">Realçando sua beleza natural</p>`
- Hero: `<p class="hero-tagline">Realçando sua beleza natural<br />com arte, carinho e precisão</p>`

---

## Como usar o site

1. Abra `index.html` diretamente no navegador (duplo clique)  
   **OU**  
   Suba os arquivos para qualquer hospedagem gratuita (Netlify, Vercel, GitHub Pages)

2. Para hospedagem gratuita no Netlify:
   - Acesse netlify.com → "Add new site" → "Deploy manually"
   - Arraste a pasta completa do projeto
   - Pronto! Você terá um link público gratuito

---

## Atualizar o cache PWA (após editar o site)
Ao modificar arquivos, incremente o número em `sw.js`:
```js
const CACHE_VERSION = 'bella-v1.1'; // mude este número
```

---

*Feito com 💗 — Nenhum custo, nenhuma dependência externa.*
