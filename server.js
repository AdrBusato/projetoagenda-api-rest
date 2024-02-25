require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

// const uri = process.env.MONGODB_URI;
// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connect(process.env.CONNECTIONSTRING)
    .then(() => {
        app.emit('pronto');
    })
    .catch(e => console.log(e));

const session = require('express-session'); //salva cookie no navegador do cliente
const MongoStore = require('connect-mongo')(session); //falar que as sessões vão ser salvas dentro da base de dados
const flash = require('connect-flash'); //mensagens auto destrutivas (mandar msg de erro ou feeback pros users) (msgs que são salvas em sessão)
const routes = require('./routes'); //rotas da aplicação ex: /home, /contato /inicial...
const path = require('path'); //trabalhar com caminhos
const helmet = require('helmet'); //recomendação do express, deixar aplicação segura
const csrf = require('csurf'); //correção de falha de segurança
const { middlewareGlobal, checkCsrfError, csrfMiddleware } = require('./src/middlewares/middleware');

//app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'cdn.jsdelivr.net'],
      // Adicione outras diretivas conforme necessário
    },
  }));

app.use(express.urlencoded({ extended: true })); //pode postar formulários para dentro da nossa aplicação
app.use(express.json()); //parse de json pra dentro da aplicação
app.use(express.static(path.resolve(__dirname, 'public'))); //estáticos = arquivos que podem/devem ser acessados diretamente, ex: imagens, css, js...
//app.use('/public', express.static(path.join(__dirname, 'public')));

//-------------------
// ABAIXO - SUGESTÕES DE USO:

// app.use('/public/bundle.js', express.static('public'));

// //Certifique-se de que a rota para o bundle.js está correta
// app.get('/public/bundle.js', (req, res) => {
//     res.type('application/javascript');
//     res.sendFile('/public/bundle.js');
// });
//-------------------------

const sessionOptions = session({ //todas as configurações de sessão
    secret: 'secret',
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
    }
});
app.use(sessionOptions);
app.use(flash()); //flash messages

app.set('views', path.resolve(__dirname, 'src', 'views')); //views são arquivos que a gente renderiza na tela (html)
app.set('view engine', 'ejs'); //engine é a engine que a gente utiliza para renderizar o html

app.use(csrf()); //configurando o csrfToken

// Nossos próprios middlewares
app.use(middlewareGlobal);
app.use(checkCsrfError);
app.use(csrfMiddleware);
app.use(routes); //chamando as rotas

app.on('pronto', () => { //mandando a aplicação escutar as coisas alí
    app.listen(3000, () => {
        console.log('Acessar http://localhost:3000/login/index')
        console.log('Servidor executando na porta 3000');
    });
});
