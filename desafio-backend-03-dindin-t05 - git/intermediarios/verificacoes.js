const conexao = require('../conexao');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

const verificarLogin = async (req, res, next) => {
    const {authorization} = req.headers;
    if (!authorization) {
        return res.status(401).json({erro: 'Não autorizado'});
    }

    try {
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        
        const query = 'SELECT * FROM usuarios WHERE id = $1';
        const usuario = await conexao.query(query, [id]);
        if(usuario.rowCount === 0) {
           return res.status(401).json({erro: 'Usuário não encontrado'});
        }
                        
        next();
    } catch (error) {
        return res.status(500).json({erro: 'Não autorizado Para acessar este recurso um token de autenticação válido deve ser enviado.'});
    }
}

module.exports = {verificarLogin};