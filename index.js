const express = require('express');
const mongoose = require('mongoose');
const fileupload = require('express-fileupload');
const bodyParser = require('body-parser');
const fs = require('fs');

const path = require('path');
const app = express();
const Posts = require('./Posts.js');
const session = require('express-session');

mongoose
  .connect(
    'mongodb+srv://root:leandro@noticias.olqp8.mongodb.net/noticias?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(function () {
    console.log('Conectado com sucesso!');
  })
  .catch(function (err) {
    console.log(err.message);
  });

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp'),
  })
);

app.use(
  session({
    secret: 'keyboard cat',
    cookie: { maxAge: 60000 },
  })
);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));

app.get('/', (req, res) => {
  if (req.query.busca == null) {
    Posts.find({})
      .sort({ _id: -1 })
      .exec(function (err, posts) {
        // console.log(posts[0]);
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 180),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
          };
        });
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);
            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 200),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });
            res.render('home', { posts: posts, postsTop: postsTop });
          });
      });
  } else {
    Posts.find(
      { titulo: { $regex: req.query.busca, $options: 'i' } },
      function (err, posts) {
        //console.log(posts);
        posts = posts.map(function (val) {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 100),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
            views: val.views,
          };
        });
        res.render('busca', { posts: posts, contagem: posts.length });
      }
    );
  }
});

app.get('/:slug', (req, res) => {
  //res.send(req.params.slug);
  Posts.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true },
    function (err, resposta) {
      // console.log(resposta);
      if (resposta != null) {
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec(function (err, postsTop) {
            // console.log(posts[0]);
            postsTop = postsTop.map(function (val) {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substr(0, 100),
                imagem: val.imagem,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });
            res.render('single', { noticia: resposta, postsTop: postsTop });
          });
      } else {
        res.redirect('/');
      }
    }
  );
});

const usuarios = [
  {
    login: 'leandro',
    senha: '123456',
  },
];

app.post('/admin/login', (req, res) => {
  usuarios.map(function (val) {
    if (val.login == req.body.login && val.senha == req.body.senha) {
      req.session.login = 'leandro';
    }
  });
  res.redirect('/admin/login');
});

app.post('/admin/cadastro', (req, res) => {
  let formato = req.files.arquivo.name.split('.');
  var imagem = '';
  if (formato[formato.length - 1] == 'jpg') {
    imagem = new Date().getTime() + '.jpg';
    req.files.arquivo.mv(__dirname + '/public/images/' + imagem);
  } else {
    fs.unlinkSync(req.files.arquivo.tempFilePath);
  }
  Posts.create({
    titulo: req.body.titulo_noticia,
    imagem: 'http://localhost:5000/public/images/' + imagem,
    categoria: 'Nenhuma',
    conteudo: req.body.noticia,
    slug: req.body.slug,
    autor: 'Admin',
    views: 0,
  });
  res.redirect('/admin/login');
});

app.get('/admin/deletar/:id', (req, res) => {
  Posts.deleteOne({ _id: req.params.id }).then(function () {
    res.redirect('/admin/login');
  });
});

app.get('/admin/login', (req, res) => {
  if (req.session.login == null) {
    res.render('admin-login');
  } else {
    Posts.find({})
      .sort({ _id: -1 })
      .exec(function (err, posts) {
        // console.log(posts[0]);
        posts = posts.map(function (val) {
          return {
            id: val._id,
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substr(0, 180),
            imagem: val.imagem,
            slug: val.slug,
            categoria: val.categoria,
          };
        });
        res.render('admin-panel', { posts: posts });
      });
  }
});

app.listen(5000, () => {
  console.log('server rodando!');
});
