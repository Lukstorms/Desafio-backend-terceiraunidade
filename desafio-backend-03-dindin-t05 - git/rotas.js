const usuarios = require('./controladores/usuarios');

const express = require('express');
const { verificarLogin } = require('./intermediarios/verificacoes');
const transacoes = require('./controladores/transacoes');

const rotas = express();

//usuarios
rotas.post('/usuario', usuarios.cadastrarUsuario);
rotas.post('/login', usuarios.login);

rotas.use(verificarLogin);
rotas.get('/usuario/',usuarios.detalharUsuario);
rotas.put('/usuario/',usuarios.atualizarUsuario);

//transacoes
rotas.get('/transacao/filtro',transacoes.filtrarCategoria);
rotas.get('/transacao/extrato',transacoes.extrato);
rotas.get('/categoria/',transacoes.listarCategorias);
rotas.get('/transacao/',transacoes.listarTransacoes);
rotas.get('/transacao/:id',transacoes.detalharTransacao);
rotas.post('/transacao/',transacoes.cadastrarTransacao);
rotas.put('/transacao/:id',transacoes.atualizarTransacao);
rotas.delete('/transacao/:id',transacoes.deletarTransacao);

module.exports = rotas;