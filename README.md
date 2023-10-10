# Requisitos
 - [NODE JS](https://nodejs.org/en)

# Features
 * Registro automático em sorteios (follow, like, retweet)
 * Registro de múltiplas wallets para o mesmo projeto
 * Insere apenas wallets válidas caso sorteio peça requisito de ETH
 * Premium Extra entrie
 * Premium Skip (follow, like, retweet)

# Configurando o ambiente
Vá para o diretório raiz da pasta __alphabot__ e digite `npm i` na linha de comando, desse modo será baixado todos os pacotes necessários para rodar o programa.

Abra o arquivo __discord-roles.js__ e digite dentro das *{}* os servidores e roles que possui(caso deixe vazio ele não irá se registrar em sorteios que possuem requisitos de discord mesmo que você esteja apto a participar).
**Caso você tenha muitas roles em determinado servidor só é necessário colocar a de maior frequência nos sorteios**
*Ex:* TDD tenho várias mas apenas é necessário colocar o id da role de Member ou Pintos(caso eu coloque apenas a de Member na hora de se registrar no sorteio se eu tiver a Pintos msm n colocando no arquivo será levado em consideração a Pintos resultando em uma entrada de 500x).
[Configuracao de cargos](https://prnt.sc/NGrY2JarRs9y)

O arquivo __addresses-hold.js__ serve para adicionar os endereços de contrato que você holda(Isso será necessário apenas para casos muito específicos, como ex: Ape list)


## Arquivo .env
Abra o arquivo __model.env__ e preencha os campos
 - `USERNAME_TWITTER=` Nome twitter sem o @
 - `PASSWORD_TWITTER=` Senha do twitter (conta n pode ter verificação em duas etapas etc)
 - `COOKIE_ALPHABOT=` Vá na página inicial do alphabot `CTRL + SHIFT + I` aba _Network_ recarregue a página e vá para a requisição en.json na aba _Header(ou cabeçalho)_ copie o cookie inteiro, [EXEMPLO](https://prnt.sc/XA_IKlHbDk14)
 - `PATH_ALPHABOT=` Na mesma imagem de exemplo você pode encontrar a path (o programa pega de forma automática, adiciona o path aqui apenas se o programa por algum motivo não conseguir filtrar automaticamente)
 - `TWITTER_ID=` Pode encontrar seu id colando o seu user [aqui](https://tweeterid.com/)
 - `DISCORD_ID=` Copiar o ID do sua conta discord
 - `WALLETS=` Você pode colocar quantos endereços quiser __separados por vírgula__ isso irá fazer com que caso haja um sorteio de um projeto repetido ele escolha a próxima wallet. Caso exista 10 sorteios do mesmo projeto e você tenha 9 wallets registradas o script irá escolher uma wallet de forma aleatória para inserir no 10º sorteio

 ### Atenção
  - `WALLETS` insira apenas endereços que você tenha registrado no alphabot, caso não tenha de uma determinada rede deixe vazia
  - Renomeie esse arquivo para apenas __.env__

# Executando o programa
Na raiz do diretório __alphabot__ abra o prompt de comando e digite uma das opções

**Conta com premium**
- `npm run all-skip` Realiza os sorteios de escopo global pulando os requisitos
- `npm run all-extra` Realiza os sorteios de escopo global com os requisitos(+1 entrie)
- `npm run community-skip` Realiza os sorteios das comunidades que faz parte pulando os requisitos
- `npm run community-extra`Realiza os sorteios das comunidades que faz parte com os requisitos(+1 entrie)

**Conta sem premium**
- `npm run all` Realiza os sorteios de escopo global
- `npm run community` Realiza sorteios das comunidades que faz parte


## Detalhes
Ao executar o programa irá abrir um navegador automatizado, não é preciso mexer nele(Ele tenta fazer o login na conta 2 vezes[geralmente a primeira falha pelo twitter identificar que está sendo feito por um bot], apenas espere 30s para ser feita a segundo tentativa de login). Após isso ele irá pegar e verificar os raffles que você não fez e que é possivel fazer. Os que precisam de um cargo que você não tem ou não cadastrou em _discord-roles.js_ irá constar como inválido e adicionado no arquivo _need-manual.txt_(contendo os links de todos os raffles que não foram possíveis fazer o registro de forma automatizada)


## Problemas
As vezes o puppeteer(browser automatizado), perde a conexao sozinho e acaba não conseguindo voltar para a tarefa em que estava então o raffle em questão é perdido. 

Usar o comando all pode acarretar no alphabot inserir captchas em todos os raffles(caso n tenha premium), dessa forma você terá que fazer alguns raffles manualmente no site e executar o programa novamente
