const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    titulo: String,
    imagem: String,
    categoria: String,
    conteudo: String,
    slug: String,
    autor: String,
    views: Number,
  },
  { collection: 'posts' }
);

const Posts = mongoose.model('Posts', postSchema);

module.exports = Posts;
