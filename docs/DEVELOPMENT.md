# Spotify Customizer Pro

Aplicativo desktop para Windows 10 22H2 / Windows 11 x64 com Electron, React, TypeScript, Tailwind, Lucide e CodeMirror. A distribuição portátil inclui o Spicetify CLI oficial; um CLI já instalado é reutilizado quando disponível. O programa não contém Spotify, não faz login e não acessa pagamentos, DRM ou dados de conta.

## Arquitetura e etapas implementadas

1. **Modelo e geração de tema** — `electron/theme.cjs`: validação estrita Zod, geração de `color.ini` e `user.css`.
2. **Integração local** — `electron/service.cjs`: detecção, execução sem shell, backups, aplicação, restauração e histórico.
3. **Desktop** — `electron/main.cjs` e `preload.cjs`: janela isolada, IPC com operações permitidas, diálogos nativos, importação/exportação e inicialização com Windows.
4. **Editor** — `src/main.tsx`, `src/model.ts` e `src/style.css`: temas, controles, prévia, perfis, editor CSS, extensões e diagnóstico.
5. **Entrega** — configuração NSIS no `package.json` e workflow Windows opcional.

Fluxo: React → preload isolado → IPC validado → serviço Node → Spicetify CLI → Spotify desktop.
O renderer não tem Node, shell nem acesso direto ao sistema de arquivos. Navegação e janelas externas são bloqueadas. Apenas o link fixo para a documentação oficial abre no navegador externo.

## Compartilhar sem instalar (versão portátil)

Distribua **Spotify-Customizer-Pro-1.0.0-portable-x64.exe**. Seus amigos não precisam instalar Node.js, npm, Electron ou Spicetify. Basta salvar o `.exe` em uma pasta gravável e abri-lo com dois cliques; na primeira abertura ele extrai recursos temporários automaticamente. Mantenha-o aberto enquanto a operação estiver em andamento.

O Spotify desktop convencional precisa estar instalado e ter sido aberto ao menos uma vez. No app, selecione um tema e clique em **Aplicar no Spotify**. Backups são criados antes da aplicação. Se a combinação Spotify/Spicetify for incompatível, a operação para com erro; não força a modificação.

Portátil significa **sem assistente de instalação**, não sem gravar dados: perfis/backups do app ficam no diretório de dados do usuário, e o motor usa `%APPDATA%\spicetify` para configuração e backup oficial. Dados, autenticação e backups não são incluídos no `.exe` compartilhado. Não compartilhe sua pasta `%APPDATA%`.

O executável inclui o motor oficial Spicetify **2.46.4 Windows x64**, com SHA-256 fixado no script de build, seus recursos, licença e fonte correspondente. O programa não baixa motores ou extensões em tempo de execução. O usuário não precisa executar comandos no terminal na instalação padrão do Spotify.

Não execute como administrador por padrão. Se o motor não detectar uma instalação fora do padrão, use o diagnóstico/guia oficial para configurar os caminhos locais. Não há suporte à edição Microsoft Store neste projeto.

## Requisitos para desenvolvimento / recompilação

- Windows 10 22H2 ou Windows 11 x64.
- Node.js 24 LTS e npm, instalados de https://nodejs.org/.
- Spotify desktop convencional, instalado pelo site oficial. A edição Microsoft Store é deliberadamente bloqueada neste aplicativo.
- O motor vem no pacote compilado. Para desenvolvimento, use `npm run vendor:spicetify` ou um CLI instalado conforme https://spicetify.app/docs/getting-started/.
- Uma versão de Spotify suportada pelo Spicetify instalado. Não existe garantia universal para todas as versões.

Instale e abra o Spotify pelo menos uma vez. Em desenvolvimento, instale o Spicetify seguindo o guia oficial ou prepare o motor incluído; revise qualquer comando de instalação antes de executá-lo. O aplicativo não instala executáveis ou extensões pela internet.

Em um novo PowerShell, execute:

```powershell
spicetify -v
spicetify -c
```

A segunda linha deve informar o caminho absoluto de um `config-xpui.ini` existente. Se necessário, configure os caminhos pelo CLI oficial:

```powershell
spicetify config spotify_path "$env:APPDATA\Spotify"
spicetify config prefs_path "$env:APPDATA\Spotify\prefs"
```

Esses caminhos são exemplos da instalação desktop padrão, não caminhos universais. Use os caminhos reais da sua instalação. Não execute como administrador por padrão; se houver erro de permissão, consulte o guia oficial e não altere permissões de pastas críticas.

## Instalar as dependências e executar

Extraia o projeto, abra o PowerShell na pasta que contém `package.json`:

```powershell
npm ci
npm run dev
```

`dev` inicia o Vite em 127.0.0.1:5173 e abre o Electron. A porta precisa estar livre.
Para executar a interface compilada:

```powershell
npm run build
npm start
```

Abrir o endereço do Vite no navegador fornece apenas a prévia. Operações nativas falham com uma mensagem explícita; a aplicação de temas fica desabilitada. Use a janela Electron para aplicar, importar/exportar e salvar perfis.

## Gerar o executável portátil .exe

Apenas quem recompila o projeto precisa de Node.js. No Windows 10/11 x64:

```powershell
npm ci
npm test
npm run dist:portable
```

Resultado: `release/Spotify-Customizer-Pro-1.0.0-portable-x64.exe`. Esse é o arquivo para mandar aos amigos. Não é necessário enviar os fontes ou a pasta node_modules. O script baixa o release oficial fixado do Spicetify e confere seu SHA-256 antes de incorporá-lo; exige acesso à internet durante o build. O executável não exige instalação do CLI no computador destinatário.

Licenças de terceiros e fonte do Spicetify são incluídas nos recursos da distribuição. Não remova esses avisos ao redistribuir. O executável não é assinado digitalmente nesta entrega.

## Gerar o instalador opcional .exe

No Windows 10/11 x64:

```powershell
npm ci
npm test
npm run dist:win
```

O electron-builder gera o instalador NSIS em `release/Spotify Customizer Pro Setup 1.0.0.exe` e a pasta `release/win-unpacked/`. O download das ferramentas de empacotamento exige internet. A opção de iniciar com o Windows usa o caminho do executável permanente, inclusive no portátil. Não mova o `.exe` depois de ativar essa opção; se mover, abra-o novamente e desative/ative a preferência.

O instalador não é assinado por padrão. Para distribuição pública, configure um certificado de assinatura de código no electron-builder. Não desative as proteções do Windows para instalar software desconhecido.

O workflow `.github/workflows/windows.yml` também compila e disponibiliza o portátil e o instalador como artefatos do GitHub Actions quando acionado manualmente. Não publica releases automaticamente.

## Usar

1. Abra **Configurações → Verificar novamente**. A instalação desktop e o CLI devem ser detectados.
2. Selecione um dos oito temas e ajuste cores, fonte, tamanho, peso, bordas, capas, espaço entre faixas, player e transições no editor.
3. Use **Salvar perfil** para guardar o tema localmente. Perfis com o mesmo nome são substituídos. **Exportar** cria um JSON; **Importar** valida e carrega o JSON na prévia.
4. Revise o tema e pressione **Aplicar no Spotify**. A confirmação avisa sobre o possível reinício do Spotify.
5. Consulte **Histórico e backups** para resultados e recuperação.

Os botões da reprodução na prévia são elementos ilustrativos, não controles de uma sessão Spotify. Não há reprodução simulada nem promessa de reprodução: o aplicativo edita aparência, não toca música.

## Backups e aplicação

Dados locais: `%APPDATA%\Spotify Customizer Pro\` na distribuição instalada (o caminho em desenvolvimento pode variar conforme o nome de pacote do Electron).

- `profiles.json`: perfis de temas.
- `history.json`: até 200 eventos, com erros e identificadores de backup.
- `backups/<id>/config-xpui.ini`: configuração anterior.
- `backups/<id>/Themes/SCP/`: versão anterior do tema gerado, quando existente.
- `backups/<id>/Backup/`: cópia do backup original do Spicetify, quando existente.

A aplicação salva o snapshot **antes** de chamar o CLI. Em uma primeira aplicação, executa `spicetify backup`. Se há backup oficial anterior e o cliente já está modificado, usa `spicetify restore backup`, pois o CLI não permite sobrescrever um backup a partir de arquivos já modificados. Se a pasta Apps contém pacotes .spa originais (como após uma atualização oficial), usa apenas `backup`, preservando a versão nova. Só após sucesso são gravados `Themes/SCP/color.ini` e `user.css`, configurado o tema e executado `spicetify apply`.

Se qualquer etapa falhar, a operação para e registra o erro; não tenta avançar nem forçar compatibilidade. As cópias do app são preservadas. Uma falha depois de `apply` pode deixar o Spotify parcialmente modificado: use a restauração abaixo. Não há rollback automático silencioso.

Os backups podem ocupar bastante espaço e não são removidos automaticamente. Faça uma cópia externa antes de remover backups manualmente. A aplicação não copia bibliotecas de música, cache de reprodução ou arquivos de autenticação.

## Restaurar o Spotify original

Pelo aplicativo: **Restaurar original** → confirmar. O serviço cria um snapshot, executa `spicetify restore` e limpa a seleção de tema e a injeção de cores/CSS. Reabra o Spotify.

Se o aplicativo não abrir, use PowerShell:

```powershell
spicetify restore
spicetify config current_theme "" color_scheme "" inject_css 0 replace_colors 0
```

Não execute `apply` depois se deseja manter o Spotify original. As extensões continuam listadas na configuração, mas não são injetadas nos arquivos originais restaurados. Uma aplicação futura pode reativá-las.

**Histórico → Recuperar** restaura os arquivos originais pelo CLI e recupera o `config-xpui.ini` e o tema SCP do snapshot. Mantém os metadados do backup oficial atual, para evitar associar um backup novo à versão antiga. O tema recuperado não é reaplicado automaticamente; revise a configuração e use `spicetify apply` pelo terminal se desejar.

Se o Spotify foi atualizado e o backup oficial não corresponde à instalação, o Spicetify pode recusar a restauração. Não force nem copie pacotes antigos sobre a versão nova. Reinstale o Spotify pelo instalador oficial para recuperar os arquivos originais e refaça a configuração do Spicetify seguindo seu guia. As cópias em `backups/` ficam disponíveis para inspeção manual.

## Plugins e extensões

- **Plugins visuais** são arquivos CSS locais, até 50 KB, incorporados ao CSS do tema. Revise-os em **CSS personalizado** e aplique. Para remover, apague suas regras e reaplique. Não há execução de JavaScript nos plugins CSS.
- **Extensões**: o gerenciador lista `.js` já presentes em `Extensions/` ao lado da configuração do Spicetify e permite ativar/desativar com backup e `apply`. Não instala, baixa, certifica ou atualiza extensões de terceiros. O usuário precisa conhecer e confiar no autor; compatibilidade depende dele e da versão do cliente.
- Temas JSON são limitados a 150 KB e validados com esquema fechado. CSS é limitado a 100 mil caracteres; URLs, importações externas e escapes CSS são bloqueados. O editor não executa CSS arbitrário dentro da própria interface.

## Limitações técnicas reais

- A prévia é uma representação própria; não incorpora a interface privada do Spotify. CSS livre só é aplicado no cliente, não na prévia. Alguns controles têm escala reduzida na representação.
- As cores usam o mecanismo de substituição do Spicetify. Não há garantia de que todas as telas, ícones e componentes usem essas cores.
- Estilos avançados usam classes internas do Spotify. Bordas, capas, espaçamento, navegação, fontes e altura do player podem exigir ajustes após atualizações. O editor CSS é a alternativa funcional para ajustar seletores.
- Glassmorphism controla a opacidade de cards dentro do cliente; não torna a janela do Spotify transparente para o desktop e não ativa Mica/Acrylic no Windows.
- Fontes disponíveis: Segoe UI, Arial, Verdana e Georgia. Não instala fontes externas.
- O tema RGB anima uma borda via CSS, não LEDs ou hardware.
- A verificação local detecta o CLI, a configuração e `Spotify.exe`. A validação final de versões e backup cabe ao próprio Spicetify e uma incompatibilidade interrompe a operação. Não existe catálogo remoto de compatibilidade nem promessa de certificação de extensões.
- Feche outros editores/terminais que alterem Spicetify enquanto usa o aplicativo. O bloqueio impede operações simultâneas nesta instância, não em programas externos.
- Não há instalação automática de Spicetify, atualização automática, sincronização em nuvem, telemetria ou contorno de mecanismos de segurança.

## Verificações e estado da entrega

```powershell
npm test
npm run build
```

Os testes usam diretórios temporários e um executor substituto do CLI. Verificam geração/validação de temas, bloqueio de CSS externo, ordem de backup, falha antes de escrita, preservação do backup original, bloqueio de concorrência, restauração e recuperação sem metadados de versão incorretos. Não modificam Spotify real.

O TypeScript, os testes e o build Vite foram verificados no ambiente Linux de desenvolvimento. **Aplicação em Spotify real, inicialização com Windows e instalador NSIS precisam de validação em Windows 10/11 com Spotify e Spicetify compatíveis.** O executável portátil foi empacotado no Linux; sua execução em Windows ainda precisa de validação real. O código da integração é real; seus resultados no computador do usuário não foram simulados.

A auditoria de dependências de produção terminou sem vulnerabilidades. Dependências de empacotamento podem apresentar avisos transitivos; confira `npm audit` e atualize ferramentas antes de uma distribuição pública.
