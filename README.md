# Spotify Customizer Pro

Aplicativo portátil para personalizar a aparência do Spotify desktop com temas, editor visual, CSS e backups via Spicetify.

## Download

- [Baixar o executável portátil para Windows x64](https://github.com/KXNFLobi/spotify-customizer-pro/releases/download/v1.0.0/Spotify-Customizer-Pro-1.0.0-portable-x64.exe)
- [Notas e arquivos da versão](https://github.com/KXNFLobi/spotify-customizer-pro/releases/tag/v1.0.0)

Salve o `.exe` em uma pasta e abra com dois cliques. Não é necessário instalar Node.js, Electron ou Spicetify. O Spotify desktop convencional precisa estar instalado e ter sido aberto ao menos uma vez. A edição Microsoft Store não é suportada neste projeto.

Escolha um tema e clique em **Aplicar no Spotify**. Um backup será criado antes da aplicação. Para desfazer, use **Restaurar original**. Perfis e backups ficam nos dados locais de cada usuário.

## Estado da versão

Versão inicial para testes, destinada a Windows 10 22H2 / Windows 11 x64. O executável foi compilado e empacotado em Windows pelo GitHub Actions, e 13 testes automatizados passaram nesse ambiente. A execução em Windows e a aplicação em Spotify real ainda precisam de validação. Não possui assinatura digital. Não desative as proteções do Windows para executá-lo.

A compatibilidade depende da versão do Spotify e é verificada pelo Spicetify. O pacote inclui o Spicetify CLI 2.46.4 oficial, recursos, licença LGPL-2.1 e fonte correspondente. O ZIP de fontes do aplicativo e as instruções completas também estão anexados à release.
