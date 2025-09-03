# 📸 Plataforma de Fotos

Uma plataforma web simples para capturar fotos usando a câmera do dispositivo e postá-las em um painel, sem necessidade de login ou cadastro.

## ✨ Funcionalidades

- 📷 **Captura de Fotos**: Use a câmera do seu dispositivo para tirar fotos
- 📤 **Postagem Instantânea**: Poste suas fotos com legendas personalizadas
- 📋 **Painel de Posts**: Visualize todas as fotos postadas em um painel organizado
- ❤️ **Sistema de Curtidas**: Curta suas fotos favoritas
- 🗑️ **Gerenciamento**: Exclua fotos individuais ou limpe todo o painel
- 💾 **Armazenamento Local**: Suas fotos são salvas localmente no navegador
- 📱 **Responsivo**: Funciona perfeitamente em desktop e mobile

## 🚀 Como Usar

### Opção 1: Abrir Diretamente
1. Abra o arquivo `index.html` diretamente no seu navegador
2. Clique em "Iniciar Câmera" e permita o acesso à câmera
3. Capture suas fotos e poste no painel!

### Opção 2: Servidor Local (Recomendado)
1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   ou
   ```bash
   npm start
   ```

3. Acesse `http://localhost:3000` no seu navegador

## 🎮 Controles

### Teclas de Atalho
- **Espaço**: Capturar foto (quando a câmera estiver ativa)
- **Enter**: Postar foto (quando o preview estiver visível)
- **Escape**: Descartar foto

### Botões
- **📷 Iniciar Câmera**: Ativa a câmera do dispositivo
- **📸 Capturar Foto**: Tira uma foto do que está sendo exibido
- **⏹️ Parar Câmera**: Desativa a câmera
- **📤 Postar Foto**: Adiciona a foto ao painel
- **🗑️ Descartar**: Remove a foto sem postar
- **❤️ Curtir**: Adiciona uma curtida à foto
- **🗑️ Excluir**: Remove uma foto específica
- **🗑️ Limpar Todas**: Remove todas as fotos do painel

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura da página
- **CSS3**: Estilização moderna com gradientes e animações
- **JavaScript ES6+**: Funcionalidades interativas
- **MediaDevices API**: Acesso à câmera
- **Canvas API**: Processamento de imagens
- **LocalStorage**: Armazenamento local das fotos

## 📱 Compatibilidade

- ✅ Chrome/Chromium (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móveis (iOS/Android)

## 🔒 Privacidade

- **Sem Login**: Não é necessário criar conta ou fazer login
- **Dados Locais**: Todas as fotos ficam armazenadas apenas no seu navegador
- **Sem Servidor**: A aplicação roda completamente no cliente
- **Sem Rastreamento**: Nenhum dado é enviado para servidores externos

## 🎨 Características da Interface

- Design moderno com gradientes e sombras
- Interface responsiva que se adapta a diferentes tamanhos de tela
- Animações suaves e feedback visual
- Notificações informativas para ações do usuário
- Layout em duas colunas (câmera e painel)

## 📝 Notas Importantes

- **Permissões**: O navegador solicitará permissão para acessar a câmera
- **HTTPS**: Para funcionar em produção, a aplicação deve ser servida via HTTPS
- **Armazenamento**: As fotos são salvas no localStorage do navegador
- **Limite**: O localStorage tem limite de armazenamento (geralmente 5-10MB)

## 🐛 Solução de Problemas

### Câmera não funciona
- Verifique se o navegador tem permissão para acessar a câmera
- Tente usar HTTPS em vez de HTTP
- Teste em um navegador diferente

### Fotos não aparecem
- Verifique se o localStorage está habilitado
- Limpe o cache do navegador
- Verifique se há espaço suficiente no dispositivo

### Interface não carrega
- Verifique se todos os arquivos estão na mesma pasta
- Abra o console do navegador para ver erros
- Teste com um servidor local

## 📄 Licença

MIT License - Sinta-se livre para usar, modificar e distribuir este projeto.
